ipaddr = require '../lib/ipaddr'

module.exports =
  'should define main classes': (test) ->
    test.ok(ipaddr.IPv4?, 'defines IPv4 class')
    test.ok(ipaddr.IPv6?, 'defines IPv6 class')
    test.done()

  'can construct IPv4 from octets': (test) ->
    test.doesNotThrow ->
      new ipaddr.IPv4([192, 168, 1, 2])
    test.done()

  'refuses to construct invalid IPv4': (test) ->
    test.throws ->
      new ipaddr.IPv4([300, 1, 2, 3])
    test.throws ->
      new ipaddr.IPv4([8, 8, 8])
    test.done()

  'converts IPv4 to string correctly': (test) ->
    addr = new ipaddr.IPv4([192, 168, 1, 1])
    test.equal(addr.toString(), '192.168.1.1')
    test.done()

  'returns correct kind for IPv4': (test) ->
    addr = new ipaddr.IPv4([1, 2, 3, 4])
    test.equal(addr.kind(), 'ipv4')
    test.done()

  'allows to access IPv4 octets': (test) ->
    addr = new ipaddr.IPv4([42, 0, 0, 0])
    test.equal(addr.octets[0], 42)
    test.done()

  'checks IPv4 address format': (test) ->
    test.equal(ipaddr.IPv4.isIPv4('192.168.007.0xa'), true)
    test.equal(ipaddr.IPv4.isIPv4('1024.0.0.1'), true)
    test.equal(ipaddr.IPv4.isIPv4('8.0xa.wtf.6'), false)
    test.done()

  'validates IPv4 addresses': (test) ->
    test.equal(ipaddr.IPv4.isValid('192.168.007.0xa'), true)
    test.equal(ipaddr.IPv4.isValid('1024.0.0.1'), false)
    test.equal(ipaddr.IPv4.isValid('8.0xa.wtf.6'), false)
    test.done()

  'parses IPv4 in several werid formats': (test) ->
    test.deepEqual(ipaddr.IPv4.parse('192.168.1.1').octets,  [192, 168, 1, 1])
    test.deepEqual(ipaddr.IPv4.parse('0xc0.168.1.1').octets, [192, 168, 1, 1])
    test.deepEqual(ipaddr.IPv4.parse('192.0250.1.1').octets, [192, 168, 1, 1])
    test.deepEqual(ipaddr.IPv4.parse('0xc0a80101').octets,   [192, 168, 1, 1])
    test.deepEqual(ipaddr.IPv4.parse('030052000401').octets, [192, 168, 1, 1])
    test.deepEqual(ipaddr.IPv4.parse('3232235777').octets,   [192, 168, 1, 1])
    test.done()

  'barfs at invalid IPv4': (test) ->
    test.throws ->
      ipaddr.IPv4.parse('10.0.0.wtf')
    test.done()

  'matches IPv4 CIDR correctly': (test) ->
    addr = new ipaddr.IPv4([10, 5, 0, 1])
    test.equal(addr.match(ipaddr.IPv4.parse('0.0.0.0'), 0),   true)
    test.equal(addr.match(ipaddr.IPv4.parse('11.0.0.0'), 8),  false)
    test.equal(addr.match(ipaddr.IPv4.parse('10.0.0.0'), 8),  true)
    test.equal(addr.match(ipaddr.IPv4.parse('10.0.0.1'), 8),  true)
    test.equal(addr.match(ipaddr.IPv4.parse('10.0.0.10'), 8), true)
    test.equal(addr.match(ipaddr.IPv4.parse('10.5.5.0'), 16), true)
    test.equal(addr.match(ipaddr.IPv4.parse('10.4.5.0'), 16), false)
    test.equal(addr.match(ipaddr.IPv4.parse('10.4.5.0'), 15), true)
    test.equal(addr.match(ipaddr.IPv4.parse('10.5.0.2'), 32), false)
    test.equal(addr.match(addr, 32), true)
    test.done()

  'detects reserved networks': (test) ->
    test.equal(ipaddr.IPv4.parse('10.1.0.1').isPrivate(),          true)
    test.equal(ipaddr.IPv4.parse('192.168.2.1').isPrivate(),       true)
    test.equal(ipaddr.IPv4.parse('224.100.0.1').isMulticast(),     true)
    test.equal(ipaddr.IPv4.parse('169.254.15.0').isLinkLocal(),    true)
    test.equal(ipaddr.IPv4.parse('127.1.1.1').isLoopback(),        true)
    test.equal(ipaddr.IPv4.parse('255.255.255.255').isBroadcast(), true)
    test.equal(ipaddr.IPv4.parse('240.1.2.3').isReserved(),        true)
    test.equal(ipaddr.IPv4.parse('8.8.8.8').isSpecial(),           false)
    test.done()
