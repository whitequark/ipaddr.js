'use strict';

const assert = require('assert');

const ipaddr = require('../lib/ipaddr');

describe('ipaddr', () => {

    it('should define main classes', (done) => {
        assert.ok(ipaddr.IPv4, 'defines IPv4 class');
        assert.ok(ipaddr.IPv6, 'defines IPv6 class');
        done();
    })

    it('can construct IPv4 from octets', (done) => {
        assert.doesNotThrow(() => {
            new ipaddr.IPv4([192, 168, 1, 2]);
        });
        done();
    })

    it('refuses to construct invalid IPv4', (done) => {
        assert.throws(() => {
            new ipaddr.IPv4([300, 1, 2, 3]);
        });
        assert.throws(() => {
            new ipaddr.IPv4([8, 8, 8]);
        });
        done();
    })

    it('converts IPv4 to string correctly', (done) => {
        let addr = new ipaddr.IPv4([192, 168, 1, 1]);
        assert.equal(addr.toString(), '192.168.1.1');
        assert.equal(addr.toNormalizedString(), '192.168.1.1');
        done();
    })

    it('returns correct kind for IPv4', (done) => {
        let addr = new ipaddr.IPv4([1, 2, 3, 4]);
        assert.equal(addr.kind(), 'ipv4');
        done();
    })

    it('allows to access IPv4 octets', (done) => {
        let addr = new ipaddr.IPv4([42, 0, 0, 0]);
        assert.equal(addr.octets[0], 42);
        done();
    })

    it('checks IPv4 address format', (done) => {
        assert.equal(ipaddr.IPv4.isIPv4('192.168.007.0xa'), true);
        assert.equal(ipaddr.IPv4.isIPv4('1024.0.0.1'), true);
        assert.equal(ipaddr.IPv4.isIPv4('8.0xa.wtf.6'), false);
        done();
    })

    it('validates IPv4 addresses', (done) => {
        assert.equal(ipaddr.IPv4.isValid('192.168.007.0xa'), true);
        assert.equal(ipaddr.IPv4.isValid('1024.0.0.1'), false);
        assert.equal(ipaddr.IPv4.isValid('8.0xa.wtf.6'), false);
        done();
    })

    it('parses IPv4 in several weird formats', (done) => {
        assert.deepEqual(ipaddr.IPv4.parse('192.168.1.1').octets, [192, 168, 1, 1]);
        assert.deepEqual(ipaddr.IPv4.parse('0xc0.168.1.1').octets, [192, 168, 1, 1]);
        assert.deepEqual(ipaddr.IPv4.parse('192.0250.1.1').octets, [192, 168, 1, 1]);
        assert.deepEqual(ipaddr.IPv4.parse('0xc0a80101').octets, [192, 168, 1, 1]);
        assert.deepEqual(ipaddr.IPv4.parse('030052000401').octets, [192, 168, 1, 1]);
        assert.deepEqual(ipaddr.IPv4.parse('3232235777').octets, [192, 168, 1, 1]);
        assert.deepEqual(ipaddr.IPv4.parse('127.42.258').octets, [127, 42, 1, 2]);
        assert.deepEqual(ipaddr.IPv4.parse('127.66051').octets, [127, 1, 2, 3]);
        assert.deepEqual(ipaddr.IPv4.parse('10.1.1.0xff').octets, [10, 1, 1, 255]);
        done();
    })

    it('barfs at invalid IPv4', (done) => {
        assert.throws(() => {
            ipaddr.IPv4.parse('10.0.0.wtf');
        });
        assert.throws(() => {
            ipaddr.IPv4.parse('8.0x1ffffff');
        });
        assert.throws(() => {
            ipaddr.IPv4.parse('8.8.0x1ffff');
        });

        assert.throws(() => {
            ipaddr.IPv4.parse('10.048.1.1');
        });

        done();
    })

    it('matches IPv4 CIDR correctly', (done) => {
        let addr = new ipaddr.IPv4([10, 5, 0, 1]);
        assert.equal(addr.match(ipaddr.IPv4.parse('0.0.0.0'), 0), true);
        assert.equal(addr.match(ipaddr.IPv4.parse('11.0.0.0'), 8), false);
        assert.equal(addr.match(ipaddr.IPv4.parse('10.0.0.0'), 8), true);
        assert.equal(addr.match(ipaddr.IPv4.parse('10.0.0.1'), 8), true);
        assert.equal(addr.match(ipaddr.IPv4.parse('10.0.0.10'), 8), true);
        assert.equal(addr.match(ipaddr.IPv4.parse('10.5.5.0'), 16), true);
        assert.equal(addr.match(ipaddr.IPv4.parse('10.4.5.0'), 16), false);
        assert.equal(addr.match(ipaddr.IPv4.parse('10.4.5.0'), 15), true);
        assert.equal(addr.match(ipaddr.IPv4.parse('10.5.0.2'), 32), false);
        assert.equal(addr.match(addr, 32), true);
        done();
    })

    it('parses CIDR reversible', (done) => {
        assert.equal(ipaddr.parseCIDR('1.2.3.4/24').toString(), '1.2.3.4/24');
        assert.equal(ipaddr.parseCIDR('::1%zone/24').toString(), '::1%zone/24');
        done();
    })

    it('parses IPv4 CIDR correctly', (done) => {
        let addr = new ipaddr.IPv4([10, 5, 0, 1]);
        assert.equal(addr.match(ipaddr.IPv4.parseCIDR('0.0.0.0/0')), true);
        assert.equal(addr.match(ipaddr.IPv4.parseCIDR('11.0.0.0/8')), false);
        assert.equal(addr.match(ipaddr.IPv4.parseCIDR('10.0.0.0/8')), true);
        assert.equal(addr.match(ipaddr.IPv4.parseCIDR('10.0.0.1/8')), true);
        assert.equal(addr.match(ipaddr.IPv4.parseCIDR('10.0.0.10/8')), true);
        assert.equal(addr.match(ipaddr.IPv4.parseCIDR('10.5.5.0/16')), true);
        assert.equal(addr.match(ipaddr.IPv4.parseCIDR('10.4.5.0/16')), false);
        assert.equal(addr.match(ipaddr.IPv4.parseCIDR('10.4.5.0/15')), true);
        assert.equal(addr.match(ipaddr.IPv4.parseCIDR('10.5.0.2/32')), false);
        assert.equal(addr.match(ipaddr.IPv4.parseCIDR('10.5.0.1/32')), true);
        assert.throws(() => {
            ipaddr.IPv4.parseCIDR('10.5.0.1');
        });
        assert.throws(() => {
            ipaddr.IPv4.parseCIDR('0.0.0.0/-1');
        });
        assert.throws(() => {
            ipaddr.IPv4.parseCIDR('0.0.0.0/33');
        });
        done();
    })

    it('detects reserved IPv4 networks', (done) => {
        assert.equal(ipaddr.IPv4.parse('0.0.0.0').range(), 'unspecified');
        assert.equal(ipaddr.IPv4.parse('0.1.0.0').range(), 'unspecified');
        assert.equal(ipaddr.IPv4.parse('10.1.0.1').range(), 'private');
        assert.equal(ipaddr.IPv4.parse('100.64.0.0').range(), 'carrierGradeNat');
        assert.equal(ipaddr.IPv4.parse('100.127.255.255').range(), 'carrierGradeNat');
        assert.equal(ipaddr.IPv4.parse('192.168.2.1').range(), 'private');
        assert.equal(ipaddr.IPv4.parse('224.100.0.1').range(), 'multicast');
        assert.equal(ipaddr.IPv4.parse('169.254.15.0').range(), 'linkLocal');
        assert.equal(ipaddr.IPv4.parse('127.1.1.1').range(), 'loopback');
        assert.equal(ipaddr.IPv4.parse('255.255.255.255').range(), 'broadcast');
        assert.equal(ipaddr.IPv4.parse('240.1.2.3').range(), 'reserved');
        assert.equal(ipaddr.IPv4.parse('8.8.8.8').range(), 'unicast');
        done();
    })

    it('checks the conventional IPv4 address format', (done) => {
        assert.equal(ipaddr.IPv4.isValidFourPartDecimal('0.0.0.0'), true);
        assert.equal(ipaddr.IPv4.isValidFourPartDecimal('127.0.0.1'), true);
        assert.equal(ipaddr.IPv4.isValidFourPartDecimal('192.168.1.1'), true);
        assert.equal(ipaddr.IPv4.isValidFourPartDecimal('0xc0.168.1.1'), false);
        done();
    })

    it('refuses to construct IPv4 address with trailing and leading zeros', (done) => {
        assert.equal(ipaddr.IPv4.isValidFourPartDecimal('000000192.168.100.2'), false);
        assert.equal(ipaddr.IPv4.isValidFourPartDecimal('192.0000168.100.2'), false);
        assert.equal(ipaddr.IPv4.isValidFourPartDecimal('192.168.100.00000002'), false);
        assert.equal(ipaddr.IPv4.isValidFourPartDecimal('192.168.100.20000000'), false);
        done();
    })

    it('can construct IPv6 from 16bit parts', (done) => {
        assert.doesNotThrow(() => {
            new ipaddr.IPv6([0x2001, 0xdb8, 0xf53a, 0, 0, 0, 0, 1]);
        });
        done();
    })

    it('can construct IPv6 from 8bit parts', (done) => {
        assert.doesNotThrow(() => {
            new ipaddr.IPv6([0x20, 0x01, 0xd, 0xb8, 0xf5, 0x3a, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1]);
        });
        assert.deepEqual(
            new ipaddr.IPv6([0x20, 0x01, 0xd, 0xb8, 0xf5, 0x3a, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1]),
            new ipaddr.IPv6([0x2001, 0xdb8, 0xf53a, 0, 0, 0, 0, 1])
        );
        done();
    })

    it('refuses to construct invalid IPv6', (done) => {
        assert.throws(() => {
            new ipaddr.IPv6([0xfffff, 0, 0, 0, 0, 0, 0, 1]);
        });
        assert.throws(() => {
            new ipaddr.IPv6([0xfffff, 0, 0, 0, 0, 0, 1]);
        });
        assert.throws(() => {
            new ipaddr.IPv6([0xffff, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1]);
        });
        done();
    })

    it('converts IPv6 to string correctly', (done) => {
        let addr = new ipaddr.IPv6([0x2001, 0xdb8, 0xf53a, 0, 0, 0, 0, 1]);
        assert.equal(addr.toNormalizedString(), '2001:db8:f53a:0:0:0:0:1');
        assert.equal(addr.toFixedLengthString(), '2001:0db8:f53a:0000:0000:0000:0000:0001');
        assert.equal(addr.toString(), '2001:db8:f53a::1');
        assert.equal(new ipaddr.IPv6([0, 0, 0, 0, 0, 0, 0, 0]).toString(), '::');
        assert.equal(new ipaddr.IPv6([0, 0, 0, 0, 0, 0, 0, 1]).toString(), '::1');
        assert.equal(new ipaddr.IPv6([0x2001, 0xdb8, 0, 0, 0, 0, 0, 0]).toString(), '2001:db8::');
        assert.equal(new ipaddr.IPv6([0, 0xff, 0, 0, 0, 0, 0, 0]).toString(), '::ff:0:0:0:0:0:0');
        assert.equal(new ipaddr.IPv6([0, 0, 0, 0, 0, 0, 0xff, 0]).toString(), '::ff:0');
        assert.equal(new ipaddr.IPv6([0, 0, 0xff, 0, 0, 0, 0, 0]).toString(), '::ff:0:0:0:0:0');
        assert.equal(new ipaddr.IPv6([0, 0, 0, 0, 0, 0xff, 0, 0]).toString(), '::ff:0:0');
        assert.equal(new ipaddr.IPv6([0x2001, 0xdb8, 0xff, 0xabc, 0xdef, 0x123b, 0x456c, 0x78d]).toString(), '2001:db8:ff:abc:def:123b:456c:78d');
        assert.equal(new ipaddr.IPv6([0x2001, 0xdb8, 0xff, 0xabc, 0, 0x123b, 0x456c, 0x78d]).toString(), '2001:db8:ff:abc::123b:456c:78d');
        assert.equal(new ipaddr.IPv6([0x2001, 0xdb8, 0xff, 0xabc, 0, 0, 0x456c, 0x78d]).toString(), '2001:db8:ff:abc::456c:78d');
        done();
    })

    it('converts IPv6 to RFC 5952 string correctly', (done) => {
        // see https://tools.ietf.org/html/rfc5952#section-4
        let addr = new ipaddr.IPv6([0x2001, 0xdb8, 0xf53a, 0, 0, 0, 0, 1]);
        assert.equal(addr.toRFC5952String(), '2001:db8:f53a::1');
        assert.equal(new ipaddr.IPv6([0, 0, 0, 0, 0, 0, 0, 0]).toRFC5952String(), '::');
        assert.equal(new ipaddr.IPv6([0, 0, 0, 0, 0, 0, 0, 1]).toRFC5952String(), '::1');
        assert.equal(new ipaddr.IPv6([0x2001, 0xdb8, 0, 0, 0, 0, 0, 0]).toRFC5952String(), '2001:db8::');
        // longest set of zeroes gets collapsed (section 4.2.3)
        assert.equal(new ipaddr.IPv6([0, 0xff, 0, 0, 0, 0, 0, 0]).toRFC5952String(), '0:ff::');
        assert.equal(new ipaddr.IPv6([0, 0, 0, 0, 0, 0, 0xff, 0]).toRFC5952String(), '::ff:0');
        assert.equal(new ipaddr.IPv6([0, 0, 0xff, 0, 0, 0, 0, 0]).toRFC5952String(), '0:0:ff::');
        assert.equal(new ipaddr.IPv6([0, 0, 0, 0, 0, 0xff, 0, 0]).toRFC5952String(), '::ff:0:0');

        assert.equal(new ipaddr.IPv6([0x2001, 0, 0, 0, 0xff, 0, 0, 0]).toRFC5952String(), '2001::ff:0:0:0');
        assert.equal(new ipaddr.IPv6([0x2001, 0xdb8, 0xff, 0xabc, 0xdef, 0x123b, 0x456c, 0x78d]).toRFC5952String(), '2001:db8:ff:abc:def:123b:456c:78d');

        // don't shorten single 0s (section 4.2.2)
        assert.equal(new ipaddr.IPv6([0x2001, 0xdb8, 0xff, 0xabc, 0, 0x123b, 0x456c, 0x78d]).toRFC5952String(), '2001:db8:ff:abc:0:123b:456c:78d');
        assert.equal(new ipaddr.IPv6([0x2001, 0xdb8, 0xff, 0xabc, 0x78d, 0x123b, 0x456c, 0]).toRFC5952String(), '2001:db8:ff:abc:78d:123b:456c:0');
        assert.equal(new ipaddr.IPv6([0, 0xdb8, 0xff, 0xabc, 0x78d, 0x123b, 0x456c, 0x2001]).toRFC5952String(), '0:db8:ff:abc:78d:123b:456c:2001');

        assert.equal(new ipaddr.IPv6([0x2001, 0xdb8, 0xff, 0xabc, 0, 0, 0x456c, 0x78d]).toRFC5952String(), '2001:db8:ff:abc::456c:78d');
        done();
    })

    it('returns IPv6 zoneIndex', (done) => {
        let addr = new ipaddr.IPv6([0x2001, 0xdb8, 0xf53a, 0, 0, 0, 0, 1], 'utun0');
        assert.equal(addr.toNormalizedString(), '2001:db8:f53a:0:0:0:0:1%utun0');
        assert.equal(addr.toString(), '2001:db8:f53a::1%utun0');

        assert.equal(
            ipaddr.parse('2001:db8:f53a::1%2').toString(),
            '2001:db8:f53a::1%2'
        );
        assert.equal(
            ipaddr.parse('2001:db8:f53a::1%WAT').toString(),
            '2001:db8:f53a::1%WAT'
        );
        assert.equal(
            ipaddr.parse('2001:db8:f53a::1%sUp').toString(),
            '2001:db8:f53a::1%sUp'
        );

        done();
    })

    it('returns IPv6 zoneIndex for IPv4-mapped IPv6 addresses', (done) => {
        let addr = ipaddr.parse('::ffff:192.168.1.1%eth0');
        assert.equal(addr.toNormalizedString(), '0:0:0:0:0:ffff:c0a8:101%eth0');
        assert.equal(addr.toString(), '::ffff:c0a8:101%eth0');

        assert.equal(
            ipaddr.parse('::ffff:192.168.1.1%2').toString(),
            '::ffff:c0a8:101%2'
        );
        assert.equal(
            ipaddr.parse('::ffff:192.168.1.1%WAT').toString(),
            '::ffff:c0a8:101%WAT'
        );
        assert.equal(
            ipaddr.parse('::ffff:192.168.1.1%sUp').toString(),
            '::ffff:c0a8:101%sUp'
        );

        done();
    })

    it('returns correct kind for IPv6', (done) => {
        let addr = new ipaddr.IPv6([0x2001, 0xdb8, 0xf53a, 0, 0, 0, 0, 1]);
        assert.equal(addr.kind(), 'ipv6');
        done();
    })

    it('allows to access IPv6 address parts', (done) => {
        let addr = new ipaddr.IPv6([0x2001, 0xdb8, 0xf53a, 0, 0, 42, 0, 1]);
        assert.equal(addr.parts[5], 42);
        done();
    })

    it('checks IPv6 address format', (done) => {
        assert.equal(ipaddr.IPv6.isIPv6('2001:db8:F53A::1'), true);
        assert.equal(ipaddr.IPv6.isIPv6('200001::1'), true);
        assert.equal(ipaddr.IPv6.isIPv6('::ffff:192.168.1.1'), true);
        assert.equal(ipaddr.IPv6.isIPv6('::ffff:192.168.1.1%z'), true);
        assert.equal(ipaddr.IPv6.isIPv6('::10.2.3.4'), true);
        assert.equal(ipaddr.IPv6.isIPv6('::12.34.56.78%z'), true);
        assert.equal(ipaddr.IPv6.isIPv6('::ffff:300.168.1.1'), false);
        assert.equal(ipaddr.IPv6.isIPv6('::ffff:300.168.1.1:0'), false);
        assert.equal(ipaddr.IPv6.isIPv6('fe80::wtf'), false);
        assert.equal(ipaddr.IPv6.isIPv6('fe80::%'), false);
        done();
    })

    it('validates IPv6 addresses', (done) => {
        assert.equal(ipaddr.IPv6.isValid('2001:db8:F53A::1'), true);
        assert.equal(ipaddr.IPv6.isValid('200001::1'), false);
        assert.equal(ipaddr.IPv6.isValid('::ffff:192.168.1.1'), true);
        assert.equal(ipaddr.IPv6.isValid('::ffff:192.168.1.1%z'), true);
        assert.equal(ipaddr.IPv6.isValid('::1.1.1.1'), true);
        assert.equal(ipaddr.IPv6.isValid('::1.2.3.4%z'), true);
        assert.equal(ipaddr.IPv6.isValid('::ffff:300.168.1.1'), false);
        assert.equal(ipaddr.IPv6.isValid('::ffff:300.168.1.1:0'), false);
        assert.equal(ipaddr.IPv6.isValid('::ffff:222.1.41.9000'), false);
        assert.equal(ipaddr.IPv6.isValid('2001:db8::F53A::1'), false);
        assert.equal(ipaddr.IPv6.isValid('fe80::wtf'), false);
        assert.equal(ipaddr.IPv6.isValid('fe80::%'), false);
        assert.equal(ipaddr.IPv6.isValid('2002::2:'), false);
        assert.equal(ipaddr.IPv6.isValid('::%z'), true);

        assert.equal(ipaddr.IPv6.isValid(undefined), false);
        done();
    })

    it('parses IPv6 in different formats', (done) => {
        assert.deepEqual(ipaddr.IPv6.parse('2001:db8:F53A:0:0:0:0:1').parts, [0x2001, 0xdb8, 0xf53a, 0, 0, 0, 0, 1]);
        assert.deepEqual(ipaddr.IPv6.parse('fe80::10').parts, [0xfe80, 0, 0, 0, 0, 0, 0, 0x10]);
        assert.deepEqual(ipaddr.IPv6.parse('2001:db8:F53A::').parts, [0x2001, 0xdb8, 0xf53a, 0, 0, 0, 0, 0]);
        assert.deepEqual(ipaddr.IPv6.parse('::1').parts, [0, 0, 0, 0, 0, 0, 0, 1]);
        assert.deepEqual(ipaddr.IPv6.parse('::8.8.8.8').parts, [0, 0, 0, 0, 0, 0xffff, 2056, 2056]);
        assert.deepEqual(ipaddr.IPv6.parse('::').parts, [0, 0, 0, 0, 0, 0, 0, 0]);
        assert.deepEqual(ipaddr.IPv6.parse('::%z').parts, [0, 0, 0, 0, 0, 0, 0, 0]);
        assert.deepEqual(ipaddr.IPv6.parse('::%z').zoneId, 'z');
        done();
    })

    it('barfs at invalid IPv6', (done) => {
        assert.throws(() => {
            ipaddr.IPv6.parse('fe80::0::1');
        });
        done();
    })

    it('matches IPv6 CIDR correctly', (done) => {
        let addr = ipaddr.IPv6.parse('2001:db8:f53a::1');
        assert.equal(addr.match(ipaddr.IPv6.parse('::'), 0), true);
        assert.equal(addr.match(ipaddr.IPv6.parse('2001:db8:f53a::1:1'), 64), true);
        assert.equal(addr.match(ipaddr.IPv6.parse('2001:db8:f53b::1:1'), 48), false);
        assert.equal(addr.match(ipaddr.IPv6.parse('2001:db8:f531::1:1'), 44), true);
        assert.equal(addr.match(ipaddr.IPv6.parse('2001:db8:f500::1'), 40), true);
        assert.equal(addr.match(ipaddr.IPv6.parse('2001:db8:f500::1%z'), 40), true);
        assert.equal(addr.match(ipaddr.IPv6.parse('2001:db9:f500::1'), 40), false);
        assert.equal(addr.match(ipaddr.IPv6.parse('2001:db9:f500::1'), 40), false);
        assert.equal(addr.match(ipaddr.IPv6.parse('2001:db9:f500::1%z'), 40), false);
        assert.equal(addr.match(addr, 128), true);
        done();
    })

    it('parses IPv6 CIDR correctly', (done) => {
        let addr = ipaddr.IPv6.parse('2001:db8:f53a::1');
        assert.equal(addr.match(ipaddr.IPv6.parseCIDR('::/0')), true);
        assert.equal(addr.match(ipaddr.IPv6.parseCIDR('2001:db8:f53a::1:1/64')), true);
        assert.equal(addr.match(ipaddr.IPv6.parseCIDR('2001:db8:f53b::1:1/48')), false);
        assert.equal(addr.match(ipaddr.IPv6.parseCIDR('2001:db8:f531::1:1/44')), true);
        assert.equal(addr.match(ipaddr.IPv6.parseCIDR('2001:db8:f500::1/40')), true);
        assert.equal(addr.match(ipaddr.IPv6.parseCIDR('2001:db8:f500::1%z/40')), true);
        assert.equal(addr.match(ipaddr.IPv6.parseCIDR('2001:db9:f500::1/40')), false);
        assert.equal(addr.match(ipaddr.IPv6.parseCIDR('2001:db9:f500::1%z/40')), false);
        assert.equal(addr.match(ipaddr.IPv6.parseCIDR('2001:db8:f53a::1/128')), true);
        assert.throws(() => {
            ipaddr.IPv6.parseCIDR('2001:db8:f53a::1');
        });
        assert.throws(() => {
            ipaddr.IPv6.parseCIDR('2001:db8:f53a::1/-1');
        });
        assert.throws(() => {
            ipaddr.IPv6.parseCIDR('2001:db8:f53a::1/129');
        });
        done();
    })

    it('converts between IPv4-mapped IPv6 addresses and IPv4 addresses', (done) => {
        let addr = ipaddr.IPv4.parse('77.88.21.11');
        let mapped = addr.toIPv4MappedAddress();
        assert.deepEqual(mapped.parts, [0, 0, 0, 0, 0, 0xffff, 0x4d58, 0x150b]);
        assert.deepEqual(mapped.toIPv4Address().octets, addr.octets);
        done();
    })

    it('refuses to convert non-IPv4-mapped IPv6 address to IPv4 address', (done) => {
        assert.throws(() => {
            ipaddr.IPv6.parse('2001:db8::1').toIPv4Address();
        });
        done();
    })

    it('detects reserved IPv6 networks', (done) => {
        assert.equal(ipaddr.IPv6.parse('::').range(), 'unspecified');
        assert.equal(ipaddr.IPv6.parse('fe80::1234:5678:abcd:0123').range(), 'linkLocal');
        assert.equal(ipaddr.IPv6.parse('ff00::1234').range(), 'multicast');
        assert.equal(ipaddr.IPv6.parse('::1').range(), 'loopback');
        assert.equal(ipaddr.IPv6.parse('fc00::').range(), 'uniqueLocal');
        assert.equal(ipaddr.IPv6.parse('::ffff:192.168.1.10').range(), 'ipv4Mapped');
        assert.equal(ipaddr.IPv6.parse('::ffff:0:192.168.1.10').range(), 'rfc6145');
        assert.equal(ipaddr.IPv6.parse('64:ff9b::1234').range(), 'rfc6052');
        assert.equal(ipaddr.IPv6.parse('2002:1f63:45e8::1').range(), '6to4');
        assert.equal(ipaddr.IPv6.parse('2001::4242').range(), 'teredo');
        assert.equal(ipaddr.IPv6.parse('2001:db8::3210').range(), 'reserved');
        assert.equal(ipaddr.IPv6.parse('2001:470:8:66::1').range(), 'unicast');
        assert.equal(ipaddr.IPv6.parse('2001:470:8:66::1%z').range(), 'unicast');
        done();
    })

    it('is able to determine IP address type', (done) => {
        assert.equal(ipaddr.parse('8.8.8.8').kind(), 'ipv4');
        assert.equal(ipaddr.parse('2001:db8:3312::1').kind(), 'ipv6');
        assert.equal(ipaddr.parse('2001:db8:3312::1%z').kind(), 'ipv6');
        done();
    })

    it('throws an error if tried to parse an invalid address', (done) => {
        assert.throws(() => {
            ipaddr.parse('::some.nonsense');
        });
        done();
    })

    it('correctly processes IPv4-mapped addresses', (done) => {
        assert.equal(ipaddr.process('8.8.8.8').kind(), 'ipv4');
        assert.equal(ipaddr.process('2001:db8:3312::1').kind(), 'ipv6');
        assert.equal(ipaddr.process('::ffff:192.168.1.1').kind(), 'ipv4');
        assert.equal(ipaddr.process('::ffff:192.168.1.1%z').kind(), 'ipv4');
        assert.equal(ipaddr.process('::8.8.8.8').kind(), 'ipv4');
        done();
    })

    it('correctly converts IPv6 and IPv4 addresses to byte arrays', (done) => {
        assert.deepEqual(
            ipaddr.parse('1.2.3.4').toByteArray(),
            [0x1, 0x2, 0x3, 0x4]
        );
        // Fuck yeah. The first byte of Google's IPv6 address is 42. 42!
        assert.deepEqual(
            ipaddr.parse('2a00:1450:8007::68').toByteArray(),
            [42, 0x00, 0x14, 0x50, 0x80, 0x07, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x68]
        );
        assert.deepEqual(
            ipaddr.parse('2a00:1450:8007::68%z').toByteArray(),
            [42, 0x00, 0x14, 0x50, 0x80, 0x07, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x68]
        );

        done();
    })

    it('correctly parses 1 as an IPv4 address', (done) => {
        assert.equal(ipaddr.IPv6.isValid('1'), false);
        assert.equal(ipaddr.IPv4.isValid('1'), true);
        assert.deepEqual(new ipaddr.IPv4([0, 0, 0, 1]), ipaddr.parse('1'));
        done();
    })

    it('correctly detects IPv4 and IPv6 CIDR addresses', (done) => {
        assert.deepEqual(
            [ipaddr.IPv6.parse('fc00::'), 64],
            ipaddr.parseCIDR('fc00::/64')
        );
        assert.deepEqual(
            [ipaddr.IPv4.parse('1.2.3.4'), 5],
            ipaddr.parseCIDR('1.2.3.4/5')
        );
        done();
    })

    it('does not consider a very large or very small number a valid IP address', (done) => {
        assert.equal(ipaddr.isValid('4999999999'), false);
        assert.equal(ipaddr.isValid('-1'), false);
        done();
    })

    it('does not hang on ::8:8:8:8:8:8:8:8:8', (done) => {
        assert.equal(ipaddr.IPv6.isValid('::8:8:8:8:8:8:8:8:8'), false);
        assert.equal(ipaddr.IPv6.isValid('::8:8:8:8:8:8:8:8:8%z'), false);
        done();
    })

    it('subnetMatch does not fail on empty range', (done) => {
        ipaddr.subnetMatch(new ipaddr.IPv4([1, 2, 3, 4]), {}, false);
        ipaddr.subnetMatch(new ipaddr.IPv4([1, 2, 3, 4]), { subnet: [] }, false);
        done();
    })

    it('subnetMatch returns default subnet on empty range', (done) => {
        assert.equal(ipaddr.subnetMatch(new ipaddr.IPv4([1, 2, 3, 4]), {}, false), false);
        assert.equal(ipaddr.subnetMatch(new ipaddr.IPv4([1, 2, 3, 4]), { subnet: [] }, false), false);
        done();
    })

    it('subnetMatch does not fail on IPv4 when looking for IPv6', (done) => {
        let rangelist = { subnet6: ipaddr.parseCIDR('fe80::/64') };
        assert.equal(ipaddr.subnetMatch(new ipaddr.IPv4([1, 2, 3, 4]), rangelist, false), false);
        done();
    })

    it('subnetMatch does not fail on IPv6 when looking for IPv4', (done) => {
        let rangelist = { subnet4: ipaddr.parseCIDR('1.2.3.0/24') };
        assert.equal(ipaddr.subnetMatch(new ipaddr.IPv6([0xfe80, 0, 0, 0, 0, 0, 0, 1]), rangelist, false), false);
        done();
    })

    it('subnetMatch can use a hybrid IPv4/IPv6 range list', (done) => {
        let rangelist = { dual64: [ipaddr.parseCIDR('1.2.4.0/24'), ipaddr.parseCIDR('2001:1:2:3::/64')] };
        assert.equal(ipaddr.subnetMatch(new ipaddr.IPv4([1, 2, 4, 1]), rangelist, false), 'dual64');
        assert.equal(ipaddr.subnetMatch(new ipaddr.IPv6([0x2001, 1, 2, 3, 0, 0, 0, 1]), rangelist, false), 'dual64');
        done();
    })

    it('is able to determine IP address type from byte array input', (done) => {
        assert.equal(ipaddr.fromByteArray([0x7f, 0, 0, 1]).kind(), 'ipv4');
        assert.equal(ipaddr.fromByteArray([0x20, 0x01, 0xd, 0xb8, 0xf5, 0x3a, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1]).kind(), 'ipv6');
        assert.throws(() => {
            ipaddr.fromByteArray([1]);
        });
        done();
    })


    it('prefixLengthFromSubnetMask returns proper CIDR notation for standard IPv4 masks', (done) => {
        assert.equal(ipaddr.IPv4.parse('255.255.255.255').prefixLengthFromSubnetMask(), 32);
        assert.equal(ipaddr.IPv4.parse('255.255.255.254').prefixLengthFromSubnetMask(), 31);
        assert.equal(ipaddr.IPv4.parse('255.255.255.252').prefixLengthFromSubnetMask(), 30);
        assert.equal(ipaddr.IPv4.parse('255.255.255.248').prefixLengthFromSubnetMask(), 29);
        assert.equal(ipaddr.IPv4.parse('255.255.255.240').prefixLengthFromSubnetMask(), 28);
        assert.equal(ipaddr.IPv4.parse('255.255.255.224').prefixLengthFromSubnetMask(), 27);
        assert.equal(ipaddr.IPv4.parse('255.255.255.192').prefixLengthFromSubnetMask(), 26);
        assert.equal(ipaddr.IPv4.parse('255.255.255.128').prefixLengthFromSubnetMask(), 25);
        assert.equal(ipaddr.IPv4.parse('255.255.255.0').prefixLengthFromSubnetMask(), 24);
        assert.equal(ipaddr.IPv4.parse('255.255.254.0').prefixLengthFromSubnetMask(), 23);
        assert.equal(ipaddr.IPv4.parse('255.255.252.0').prefixLengthFromSubnetMask(), 22);
        assert.equal(ipaddr.IPv4.parse('255.255.248.0').prefixLengthFromSubnetMask(), 21);
        assert.equal(ipaddr.IPv4.parse('255.255.240.0').prefixLengthFromSubnetMask(), 20);
        assert.equal(ipaddr.IPv4.parse('255.255.224.0').prefixLengthFromSubnetMask(), 19);
        assert.equal(ipaddr.IPv4.parse('255.255.192.0').prefixLengthFromSubnetMask(), 18);
        assert.equal(ipaddr.IPv4.parse('255.255.128.0').prefixLengthFromSubnetMask(), 17);
        assert.equal(ipaddr.IPv4.parse('255.255.0.0').prefixLengthFromSubnetMask(), 16);
        assert.equal(ipaddr.IPv4.parse('255.254.0.0').prefixLengthFromSubnetMask(), 15);
        assert.equal(ipaddr.IPv4.parse('255.252.0.0').prefixLengthFromSubnetMask(), 14);
        assert.equal(ipaddr.IPv4.parse('255.248.0.0').prefixLengthFromSubnetMask(), 13);
        assert.equal(ipaddr.IPv4.parse('255.240.0.0').prefixLengthFromSubnetMask(), 12);
        assert.equal(ipaddr.IPv4.parse('255.224.0.0').prefixLengthFromSubnetMask(), 11);
        assert.equal(ipaddr.IPv4.parse('255.192.0.0').prefixLengthFromSubnetMask(), 10);
        assert.equal(ipaddr.IPv4.parse('255.128.0.0').prefixLengthFromSubnetMask(), 9);
        assert.equal(ipaddr.IPv4.parse('255.0.0.0').prefixLengthFromSubnetMask(), 8);
        assert.equal(ipaddr.IPv4.parse('254.0.0.0').prefixLengthFromSubnetMask(), 7);
        assert.equal(ipaddr.IPv4.parse('252.0.0.0').prefixLengthFromSubnetMask(), 6);
        assert.equal(ipaddr.IPv4.parse('248.0.0.0').prefixLengthFromSubnetMask(), 5);
        assert.equal(ipaddr.IPv4.parse('240.0.0.0').prefixLengthFromSubnetMask(), 4);
        assert.equal(ipaddr.IPv4.parse('224.0.0.0').prefixLengthFromSubnetMask(), 3);
        assert.equal(ipaddr.IPv4.parse('192.0.0.0').prefixLengthFromSubnetMask(), 2);
        assert.equal(ipaddr.IPv4.parse('128.0.0.0').prefixLengthFromSubnetMask(), 1);
        assert.equal(ipaddr.IPv4.parse('0.0.0.0').prefixLengthFromSubnetMask(), 0);
        // negative cases
        assert.equal(ipaddr.IPv4.parse('192.168.255.0').prefixLengthFromSubnetMask(), null);
        assert.equal(ipaddr.IPv4.parse('255.0.255.0').prefixLengthFromSubnetMask(), null);
        done();
    })

    it('prefixLengthFromSubnetMask returns proper CIDR notation for standard IPv6 masks', (done) => {
        assert.equal(ipaddr.IPv6.parse('ffff:ffff:ffff:ffff:ffff:ffff:ffff:ffff').prefixLengthFromSubnetMask(), 128);
        assert.equal(ipaddr.IPv6.parse('ffff:ffff:ffff:ffff::').prefixLengthFromSubnetMask(), 64);
        assert.equal(ipaddr.IPv6.parse('ffff:ffff:ffff:ff80::').prefixLengthFromSubnetMask(), 57);
        assert.equal(ipaddr.IPv6.parse('ffff:ffff:ffff::').prefixLengthFromSubnetMask(), 48);
        assert.equal(ipaddr.IPv6.parse('ffff:ffff:ffff::%z').prefixLengthFromSubnetMask(), 48);
        assert.equal(ipaddr.IPv6.parse('::').prefixLengthFromSubnetMask(), 0);
        assert.equal(ipaddr.IPv6.parse('::%z').prefixLengthFromSubnetMask(), 0);
        // negative cases
        assert.equal(ipaddr.IPv6.parse('2001:db8::').prefixLengthFromSubnetMask(), null);
        assert.equal(ipaddr.IPv6.parse('ffff:0:0:ffff::').prefixLengthFromSubnetMask(), null);
        assert.equal(ipaddr.IPv6.parse('ffff:0:0:ffff::%z').prefixLengthFromSubnetMask(), null);
        done();
    })

    it('subnetMaskFromPrefixLength returns correct IPv4 subnet mask given prefix length', (done) => {

        assert.equal(ipaddr.IPv4.subnetMaskFromPrefixLength(0), '0.0.0.0');
        assert.equal(ipaddr.IPv4.subnetMaskFromPrefixLength(1), '128.0.0.0');
        assert.equal(ipaddr.IPv4.subnetMaskFromPrefixLength(2), '192.0.0.0');
        assert.equal(ipaddr.IPv4.subnetMaskFromPrefixLength(3), '224.0.0.0');
        assert.equal(ipaddr.IPv4.subnetMaskFromPrefixLength(4), '240.0.0.0');
        assert.equal(ipaddr.IPv4.subnetMaskFromPrefixLength(5), '248.0.0.0');
        assert.equal(ipaddr.IPv4.subnetMaskFromPrefixLength(6), '252.0.0.0');
        assert.equal(ipaddr.IPv4.subnetMaskFromPrefixLength(7), '254.0.0.0');
        assert.equal(ipaddr.IPv4.subnetMaskFromPrefixLength(8), '255.0.0.0');
        assert.equal(ipaddr.IPv4.subnetMaskFromPrefixLength(9), '255.128.0.0');
        assert.equal(ipaddr.IPv4.subnetMaskFromPrefixLength(10), '255.192.0.0');
        assert.equal(ipaddr.IPv4.subnetMaskFromPrefixLength(11), '255.224.0.0');
        assert.equal(ipaddr.IPv4.subnetMaskFromPrefixLength(12), '255.240.0.0');
        assert.equal(ipaddr.IPv4.subnetMaskFromPrefixLength(13), '255.248.0.0');
        assert.equal(ipaddr.IPv4.subnetMaskFromPrefixLength(14), '255.252.0.0');
        assert.equal(ipaddr.IPv4.subnetMaskFromPrefixLength(15), '255.254.0.0');
        assert.equal(ipaddr.IPv4.subnetMaskFromPrefixLength(16), '255.255.0.0');
        assert.equal(ipaddr.IPv4.subnetMaskFromPrefixLength(17), '255.255.128.0');
        assert.equal(ipaddr.IPv4.subnetMaskFromPrefixLength(18), '255.255.192.0');
        assert.equal(ipaddr.IPv4.subnetMaskFromPrefixLength(19), '255.255.224.0');
        assert.equal(ipaddr.IPv4.subnetMaskFromPrefixLength(20), '255.255.240.0');
        assert.equal(ipaddr.IPv4.subnetMaskFromPrefixLength(21), '255.255.248.0');
        assert.equal(ipaddr.IPv4.subnetMaskFromPrefixLength(22), '255.255.252.0');
        assert.equal(ipaddr.IPv4.subnetMaskFromPrefixLength(23), '255.255.254.0');
        assert.equal(ipaddr.IPv4.subnetMaskFromPrefixLength(24), '255.255.255.0');
        assert.equal(ipaddr.IPv4.subnetMaskFromPrefixLength(25), '255.255.255.128');
        assert.equal(ipaddr.IPv4.subnetMaskFromPrefixLength(26), '255.255.255.192');
        assert.equal(ipaddr.IPv4.subnetMaskFromPrefixLength(27), '255.255.255.224');
        assert.equal(ipaddr.IPv4.subnetMaskFromPrefixLength(28), '255.255.255.240');
        assert.equal(ipaddr.IPv4.subnetMaskFromPrefixLength(29), '255.255.255.248');
        assert.equal(ipaddr.IPv4.subnetMaskFromPrefixLength(30), '255.255.255.252');
        assert.equal(ipaddr.IPv4.subnetMaskFromPrefixLength(31), '255.255.255.254');
        assert.equal(ipaddr.IPv4.subnetMaskFromPrefixLength(32), '255.255.255.255');
        done();
    })

    it('broadcastAddressFromCIDR returns correct IPv4 broadcast address', (done) => {
        assert.equal(ipaddr.IPv4.broadcastAddressFromCIDR('172.0.0.1/24'), '172.0.0.255');
        assert.equal(ipaddr.IPv4.broadcastAddressFromCIDR('172.0.0.1/26'), '172.0.0.63');
        done();
    })

    it('networkAddressFromCIDR returns correct IPv4 network address', (done) => {
        assert.equal(ipaddr.IPv4.networkAddressFromCIDR('172.0.0.1/24'), '172.0.0.0');
        assert.equal(ipaddr.IPv4.networkAddressFromCIDR('172.0.0.1/5'), '168.0.0.0');
        done();
    })
})
