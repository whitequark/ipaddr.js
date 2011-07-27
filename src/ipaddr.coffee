# Define the main object
ipaddr = {}

root = this

# Export for both the CommonJS and browser-like environment
if module? && module.exports
  module.exports = ipaddr
else
  root['ipaddr'] = ipaddr

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
tryParseIPv4 = (string) ->
  # parseInt recognizes all that octal & hexadecimal weirdness for us
  if match = string.match(ipv4Regexes.fourOctet)
    return (parseInt(part) for part in match[1..5])
  else if match = string.match(ipv4Regexes.longValue)
    value = parseInt(match[1])
    return ((value >> shift) & 0xff for shift in [0..24] by 8).reverse()
  else
    return null

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
    private: [
      [ new IPv4([10,  0,   0, 0]), 8  ]
      [ new IPv4([172, 16,  0, 0]), 12 ]
      [ new IPv4([192, 168, 0, 0]), 16 ]
    ]
    multicast: [ new IPv4([224, 0,   0,   0]), 4  ]
    linkLocal: [ new IPv4([169, 254, 0,   0]), 16 ]
    loopback:  [ new IPv4([127, 0,   0,   0]), 8  ]
    reserved: [
      [ new IPv4([192,   0,    0,   0]), 24 ]
      [ new IPv4([192,   0,    2,   0]), 24 ]
      [ new IPv4([192,  88,   99,   0]), 24 ]
      [ new IPv4([198,  51,  100,   0]), 24 ]
      [ new IPv4([203,   0,  113,   0]), 24 ]
      [ new IPv4([240,   0,    0,   0]), 4  ]
    ]
    broadcast: [ new IPv4([255, 255,  255, 255]), 32 ]

  # Checks if the address corresponds to one of the private internets (RFC1918).
  isPrivate: ->
    for range in @SpecialRanges.private
      return true if @match.apply(this, range)
    return false

  # Checks if the address belongs to multicast group (RFC3171).
  isMulticast: ->
    return @match.apply(this, @SpecialRanges.multicast)

  # Checks if the address is link-local (RFC3927).
  isLinkLocal: ->
    return @match.apply(this, @SpecialRanges.linkLocal)

  # Checks if the address belongs to loopback interface (RFC5735).
  isLoopback: ->
    return @match.apply(this, @SpecialRanges.loopback)

  # Checks if the address belongs to one of reserved groups (RFCs 5735, 5737, 2544, 1700)
  isReserved: ->
    for range in @SpecialRanges.reserved
      return true if @match.apply(this, range)
    return false

  # Checks if this is a broadcast address.
  isBroadcast: ->
    return @match.apply(this, @SpecialRanges.broadcast)

  # Matches the address against all defined special ranges.
  isSpecial: ->
    return @isPrivate() || @isLoopback() || @isMulticast() ||
              @isLinkLocal() || @isBroadcast() || @isReserved()

# Checks if a given string is formatted like IPv4 address.
ipaddr.IPv4.isIPv4 = (string) ->
  return tryParseIPv4(string) != null

# Checks if a given string is a valid IPv4 address.
ipaddr.IPv4.isValid = (string) ->
  try
    ipaddr.IPv4.parse(string)
    return true
  catch e
    return false

# Tries to parse and validate a string with IPv4 address.
# Throws an error if it fails.
ipaddr.IPv4.parse = (string) ->
  octets = tryParseIPv4(string)
  if octets == null
    throw new Error "ipaddr: string is not formatted like ipv4 address"

  return new ipaddr.IPv4(octets)

class ipaddr.IPv6