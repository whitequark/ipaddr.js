# Define the main object
ipaddr = {}

root = this

# Export for both the CommonJS and browser-like environment
if module? && module.exports
  module.exports = ipaddr
else
  root['ipaddr'] = ipaddr

# A generic CIDR (Classless Inter-Domain Routing) RFC1518 range matcher.
matchCIDR = (first, second, partSize, cidrBits) ->
  if first.length != second.length
    throw new Error "ipaddr: cannot match CIDR for objects with different lengths"

  part = 0
  while cidrBits > 0
    shift = partSize - cidrBits
    shift = 0 if shift < 0

    if first[part] >> shift != second[part] >> shift
      return false

    cidrBits -= partSize
    part     += 1

  return true

# An utility function to ease named range matching. See examples below.
matchSubnet = (address, rangeList, defaultName='unicast') ->
  for rangeName, rangeSubnets of rangeList
    for subnet in rangeSubnets
      return rangeName if address.match.apply(address, subnet)

  return defaultName

# An IPv4 address (RFC791).
class ipaddr.IPv4
  # Constructs a new IPv4 address from an array of four octets.
  # Verifies the input.
  constructor: (octets) ->
    if octets.length != 4
      throw new Error "ipaddr: ipv4 octet count should be 4"

    for octet in octets
      if !(0 <= octet <= 255)
        throw new Error "ipaddr: ipv4 octet is a byte"

    @octets = octets

  # The 'kind' method exists on both IPv4 and IPv6 classes.
  kind: ->
    return 'ipv4'

  # Returns the address in convenient, decimal-dotted format.
  toString: ->
    return @octets.join "."

  # Checks if this address matches other one within given CIDR range.
  match: (other, cidrRange) ->
    if other.kind() != 'ipv4'
      throw new Error "ipaddr: cannot match ipv4 address with non-ipv4 one"

    return matchCIDR(this.octets, other.octets, 8, cidrRange)

  # Special IPv4 address ranges.
  SpecialRanges:
    broadcast: [
      [ new IPv4([255, 255,  255, 255]), 32 ]
    ]
    multicast: [ # RFC3171
      [ new IPv4([224,   0,    0,   0]), 4  ]
    ]
    linkLocal: [ # RFC3927
      [ new IPv4([169,   254,  0,   0]), 16 ]
    ]
    loopback: [ # RFC5735
      [ new IPv4([127,   0,    0,   0]), 8  ]
    ]
    private: [ # RFC1918
      [ new IPv4([10,    0,    0,   0]), 8  ]
      [ new IPv4([172,   16,   0,   0]), 12 ]
      [ new IPv4([192,   168,  0,   0]), 16 ]
    ]
    reserved: [ # Reserved and testing-only ranges; RFCs 5735, 5737, 2544, 1700
      [ new IPv4([192,   0,    0,   0]), 24 ]
      [ new IPv4([192,   0,    2,   0]), 24 ]
      [ new IPv4([192,  88,   99,   0]), 24 ]
      [ new IPv4([198,  51,  100,   0]), 24 ]
      [ new IPv4([203,   0,  113,   0]), 24 ]
      [ new IPv4([240,   0,    0,   0]), 4  ]
    ]

  # Checks if the address corresponds to one of the special ranges.
  range: ->
    return matchSubnet(this, @SpecialRanges)

# A list of regular expressions that match arbitrary IPv4 addresses,
# for which a number of weird notations exist.
# Note that an address like 0010.0xa5.1.1 is considered legal.
ipv4Part = "(0?\\d+|0x[a-f0-9]+)"
ipv4Regexes =
  fourOctet: new RegExp "^#{ipv4Part}\\.#{ipv4Part}\\.#{ipv4Part}\\.#{ipv4Part}$", 'i'
  longValue: new RegExp "^#{ipv4Part}$", 'i'

# Classful variants (like a.b, where a is an octet, and b is a 24-bit
# value representing last three octets; this corresponds to a class C
# address) are omitted due to classless nature of modern Internet.
ipaddr.IPv4.parser = (string) ->
  # parseInt recognizes all that octal & hexadecimal weirdness for us
  if match = string.match(ipv4Regexes.fourOctet)
    return (parseInt(part) for part in match[1..5])
  else if match = string.match(ipv4Regexes.longValue)
    value = parseInt(match[1])
    return ((value >> shift) & 0xff for shift in [0..24] by 8).reverse()
  else
    return null

# Checks if a given string is formatted like IPv4 address.
ipaddr.IPv4.isIPv4 = (string) ->
  return @parser(string) != null

# Checks if a given string is a valid IPv4 address.
ipaddr.IPv4.isValid = (string) ->
  try
    new this(@parser(string))
    return true
  catch e
    return false

# Tries to parse and validate a string with IPv4 address.
# Throws an error if it fails.
ipaddr.IPv4.parse = (string) ->
  parts = @parser(string)
  if parts == null
    throw new Error "ipaddr: string is not formatted like ipv4 address"

  return new this(parts)

class ipaddr.IPv6