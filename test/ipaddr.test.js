import { ok, doesNotThrow, throws, equal, deepEqual } from 'node:assert';
import { describe, it } from 'node:test';

import { IPv4, IPv6, parseCIDR, parse, process, isValid, subnetMatch, fromByteArray } from '../lib/ipaddr.js';

describe('ipaddr', () => {

    it('should define main classes', () => {
        ok(IPv4, 'defines IPv4 class');
        ok(IPv6, 'defines IPv6 class');
    })

    it('can construct IPv4 from octets', () => {
        doesNotThrow(() => {
            new IPv4([192, 168, 1, 2]);
        });
    })

    it('refuses to construct invalid IPv4', () => {
        throws(() => {
            new IPv4([300, 1, 2, 3]);
        });
        throws(() => {
            new IPv4([8, 8, 8]);
        });
    })

    it('converts IPv4 to string correctly', () => {
        let addr = new IPv4([192, 168, 1, 1]);
        equal(addr.toString(), '192.168.1.1');
        equal(addr.toNormalizedString(), '192.168.1.1');
    })

    it('converts IPv4 CIDR to string correctly', () => {
        equal(IPv4.parseCIDR('192.168.1.1/24').toString(), '192.168.1.1/24');
    })

    it('returns correct kind for IPv4', () => {
        let addr = new IPv4([1, 2, 3, 4]);
        equal(addr.kind(), 'ipv4');
    })

    it('allows to access IPv4 octets', () => {
        let addr = new IPv4([42, 0, 0, 0]);
        equal(addr.octets[0], 42);
    })

    it('checks IPv4 address format', () => {
        equal(IPv4.isIPv4('192.168.007.0xa'), true);
        equal(IPv4.isIPv4('1024.0.0.1'), true);
        equal(IPv4.isIPv4('8.0xa.wtf.6'), false);
    })

    it('validates IPv4 addresses', () => {
        equal(IPv4.isValid('192.168.007.0xa'), true);
        equal(IPv4.isValid('1024.0.0.1'), false);
        equal(IPv4.isValid('8.0xa.wtf.6'), false);
    })

    it('validates IPv4 addresses in CIDR notation', () => {
        equal(IPv4.isValidCIDR('192.168.1.1/24'), true);
        equal(IPv4.isValidCIDR('10.5.0.1'), false);
        equal(IPv4.isValidCIDR('0.0.0.0/-1'), false);
        equal(IPv4.isValidCIDR('192.168.1.1/999'), false);
    })

    it('parses IPv4 in several weird formats', () => {
        deepEqual(IPv4.parse('192.168.1.1').octets, [192, 168, 1, 1]);
        deepEqual(IPv4.parse('0xc0.168.1.1').octets, [192, 168, 1, 1]);
        deepEqual(IPv4.parse('192.0250.1.1').octets, [192, 168, 1, 1]);
        deepEqual(IPv4.parse('0xc0a80101').octets, [192, 168, 1, 1]);
        deepEqual(IPv4.parse('030052000401').octets, [192, 168, 1, 1]);
        deepEqual(IPv4.parse('3232235777').octets, [192, 168, 1, 1]);
        deepEqual(IPv4.parse('127.42.258').octets, [127, 42, 1, 2]);
        deepEqual(IPv4.parse('127.66051').octets, [127, 1, 2, 3]);
        deepEqual(IPv4.parse('10.1.1.0xff').octets, [10, 1, 1, 255]);
    })

    it('barfs at invalid IPv4', () => {
        throws(() => {
            IPv4.parse('10.0.0.wtf');
        });
        throws(() => {
            IPv4.parse('8.0x1ffffff');
        });
        throws(() => {
            IPv4.parse('8.8.0x1ffff');
        });

        throws(() => {
            IPv4.parse('10.048.1.1');
        });
    })

    it('matches IPv4 CIDR correctly', () => {
        let addr = new IPv4([10, 5, 0, 1]);
        equal(addr.match(IPv4.parse('0.0.0.0'), 0), true);
        equal(addr.match(IPv4.parse('11.0.0.0'), 8), false);
        equal(addr.match(IPv4.parse('10.0.0.0'), 8), true);
        equal(addr.match(IPv4.parse('10.0.0.1'), 8), true);
        equal(addr.match(IPv4.parse('10.0.0.10'), 8), true);
        equal(addr.match(IPv4.parse('10.5.5.0'), 16), true);
        equal(addr.match(IPv4.parse('10.4.5.0'), 16), false);
        equal(addr.match(IPv4.parse('10.4.5.0'), 15), true);
        equal(addr.match(IPv4.parse('10.5.0.2'), 32), false);
        equal(addr.match(addr, 32), true);
    })

    it('parses CIDR reversible', () => {
        equal(parseCIDR('1.2.3.4/24').toString(), '1.2.3.4/24');
        equal(parseCIDR('::1%zone/24').toString(), '::1%zone/24');
    })

    it('parses IPv4 CIDR correctly', () => {
        let addr = new IPv4([10, 5, 0, 1]);
        equal(addr.match(IPv4.parseCIDR('0.0.0.0/0')), true);
        equal(addr.match(IPv4.parseCIDR('11.0.0.0/8')), false);
        equal(addr.match(IPv4.parseCIDR('10.0.0.0/8')), true);
        equal(addr.match(IPv4.parseCIDR('10.0.0.1/8')), true);
        equal(addr.match(IPv4.parseCIDR('10.0.0.10/8')), true);
        equal(addr.match(IPv4.parseCIDR('10.5.5.0/16')), true);
        equal(addr.match(IPv4.parseCIDR('10.4.5.0/16')), false);
        equal(addr.match(IPv4.parseCIDR('10.4.5.0/15')), true);
        equal(addr.match(IPv4.parseCIDR('10.5.0.2/32')), false);
        equal(addr.match(IPv4.parseCIDR('10.5.0.1/32')), true);
        throws(() => {
            IPv4.parseCIDR('10.5.0.1');
        });
        throws(() => {
            IPv4.parseCIDR('0.0.0.0/-1');
        });
        throws(() => {
            IPv4.parseCIDR('0.0.0.0/33');
        });
    })

    it('detects reserved IPv4 networks', () => {
        equal(IPv4.parse('0.0.0.0').range(), 'unspecified');
        equal(IPv4.parse('0.1.0.0').range(), 'unspecified');
        equal(IPv4.parse('10.1.0.1').range(), 'private');
        equal(IPv4.parse('100.64.0.0').range(), 'carrierGradeNat');
        equal(IPv4.parse('100.127.255.255').range(), 'carrierGradeNat');
        equal(IPv4.parse('192.52.193.1').range(), 'amt');
        equal(IPv4.parse('192.168.2.1').range(), 'private');
        equal(IPv4.parse('192.175.48.0').range(), 'as112');
        equal(IPv4.parse('224.100.0.1').range(), 'multicast');
        equal(IPv4.parse('169.254.15.0').range(), 'linkLocal');
        equal(IPv4.parse('127.1.1.1').range(), 'loopback');
        equal(IPv4.parse('255.255.255.255').range(), 'broadcast');
        equal(IPv4.parse('240.1.2.3').range(), 'reserved');
        equal(IPv4.parse('8.8.8.8').range(), 'unicast');
    })

    it('checks the conventional IPv4 address format', () => {
        equal(IPv4.isValidFourPartDecimal('0.0.0.0'), true);
        equal(IPv4.isValidFourPartDecimal('127.0.0.1'), true);
        equal(IPv4.isValidFourPartDecimal('192.168.1.1'), true);
        equal(IPv4.isValidFourPartDecimal('0xc0.168.1.1'), false);
    })

    it('checks the conventional IPv4 CIDR format', () => {
        equal(IPv4.isValidCIDRFourPartDecimal('192.168.1.1/24'), true);
        equal(IPv4.isValidCIDRFourPartDecimal('0.0.0.0/0'), true);
        equal(IPv4.isValidCIDRFourPartDecimal('0xc0.168.1.1/24'), false);
        equal(IPv4.isValidCIDRFourPartDecimal('192.168.1.1/33'), false);
        equal(IPv4.isValidCIDRFourPartDecimal('192.168.1/24'), false);
    })

    it('refuses to construct IPv4 address with trailing and leading zeros', () => {
        equal(IPv4.isValidFourPartDecimal('000000192.168.100.2'), false);
        equal(IPv4.isValidFourPartDecimal('192.0000168.100.2'), false);
        equal(IPv4.isValidFourPartDecimal('192.168.100.00000002'), false);
        equal(IPv4.isValidFourPartDecimal('192.168.100.20000000'), false);
    })

    it('can construct IPv6 from 16bit parts', () => {
        doesNotThrow(() => {
            new IPv6([0x2001, 0xdb8, 0xf53a, 0, 0, 0, 0, 1]);
        });
    })

    it('can construct IPv6 from 8bit parts', () => {
        doesNotThrow(() => {
            new IPv6([0x20, 0x01, 0xd, 0xb8, 0xf5, 0x3a, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1]);
        });
        deepEqual(
            new IPv6([0x20, 0x01, 0xd, 0xb8, 0xf5, 0x3a, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1]),
            new IPv6([0x2001, 0xdb8, 0xf53a, 0, 0, 0, 0, 1])
        );
    })

    it('refuses to construct invalid IPv6', () => {
        throws(() => {
            new IPv6([0xfffff, 0, 0, 0, 0, 0, 0, 1]);
        });
        throws(() => {
            new IPv6([0xfffff, 0, 0, 0, 0, 0, 1]);
        });
        throws(() => {
            new IPv6([0xffff, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1]);
        });
    })

    it('converts IPv6 to string correctly', () => {
        let addr = new IPv6([0x2001, 0xdb8, 0xf53a, 0, 0, 0, 0, 1]);
        equal(addr.toNormalizedString(), '2001:db8:f53a:0:0:0:0:1');
        equal(addr.toFixedLengthString(), '2001:0db8:f53a:0000:0000:0000:0000:0001');
        equal(addr.toString(), '2001:db8:f53a::1');
        equal(new IPv6([0, 0, 0, 0, 0, 0, 0, 0]).toString(), '::');
        equal(new IPv6([0, 0, 0, 0, 0, 0, 0, 1]).toString(), '::1');
        equal(new IPv6([0x2001, 0xdb8, 0, 0, 0, 0, 0, 0]).toString(), '2001:db8::');
        equal(new IPv6([0, 0xff, 0, 0, 0, 0, 0, 0]).toString(), '0:ff::');
        equal(new IPv6([0, 0, 0, 0, 0, 0, 0xff, 0]).toString(), '::ff:0');
        equal(new IPv6([0, 0, 0xff, 0, 0, 0, 0, 0]).toString(), '0:0:ff::');
        equal(new IPv6([0, 0, 0, 0, 0, 0xff, 0, 0]).toString(), '::ff:0:0');
        equal(new IPv6([0, 0, 0, 0xff, 0xff, 0, 0, 0]).toString(), '::ff:ff:0:0:0');
        // RFC 5952, 4.2.3: on equal-length runs the leftmost is compressed,
        // including when that run is at the start of the address.
        equal(new IPv6([0, 0, 0xff, 0xff, 0, 0, 0xff, 0xff]).toString(), '::ff:ff:0:0:ff:ff');
        equal(new IPv6([0, 0, 1, 0, 0, 1, 0, 0]).toString(), '::1:0:0:1:0:0');
        equal(new IPv6([0x2001, 0xdb8, 0, 0, 1, 0, 0, 1]).toString(), '2001:db8::1:0:0:1');
        equal(new IPv6([0x2001, 0xdb8, 0xff, 0xabc, 0xdef, 0x123b, 0x456c, 0x78d]).toString(), '2001:db8:ff:abc:def:123b:456c:78d');
        equal(new IPv6([0x2001, 0xdb8, 0xff, 0xabc, 0, 0x123b, 0x456c, 0x78d]).toString(), '2001:db8:ff:abc:0:123b:456c:78d');
        equal(new IPv6([0x2001, 0xdb8, 0xff, 0xabc, 0, 0, 0x456c, 0x78d]).toString(), '2001:db8:ff:abc::456c:78d');
    })

    it('converts IPv6 CIDR to string correctly', () => {
        equal(IPv6.parseCIDR('0:0:0:0:0:0:0:0/64').toString(), '::/64');
        equal(IPv6.parseCIDR('0:0:0:ff:ff:0:0:0/64').toString(), '::ff:ff:0:0:0/64');
        equal(IPv6.parseCIDR('2001:db8:ff:abc:def:123b:456c:78d/64').toString(), '2001:db8:ff:abc:def:123b:456c:78d/64');
    })

    it('converts IPv6 to RFC 5952 string correctly', () => {
        // see https://tools.ietf.org/html/rfc5952#section-4
        let addr = new IPv6([0x2001, 0xdb8, 0xf53a, 0, 0, 0, 0, 1]);
        equal(addr.toRFC5952String(), '2001:db8:f53a::1');
        equal(new IPv6([0, 0, 0, 0, 0, 0, 0, 0]).toRFC5952String(), '::');
        equal(new IPv6([0, 0, 0, 0, 0, 0, 0, 1]).toRFC5952String(), '::1');
        equal(new IPv6([0x2001, 0xdb8, 0, 0, 0, 0, 0, 0]).toRFC5952String(), '2001:db8::');
        // longest set of zeroes gets collapsed (section 4.2.3)
        equal(new IPv6([0, 0xff, 0, 0, 0, 0, 0, 0]).toRFC5952String(), '0:ff::');
        equal(new IPv6([0, 0, 0, 0, 0, 0, 0xff, 0]).toRFC5952String(), '::ff:0');
        equal(new IPv6([0, 0, 0xff, 0, 0, 0, 0, 0]).toRFC5952String(), '0:0:ff::');
        equal(new IPv6([0, 0, 0, 0, 0, 0xff, 0, 0]).toRFC5952String(), '::ff:0:0');

        equal(new IPv6([0x2001, 0, 0, 0, 0xff, 0, 0, 0]).toRFC5952String(), '2001::ff:0:0:0');
        equal(new IPv6([0x2001, 0xdb8, 0xff, 0xabc, 0xdef, 0x123b, 0x456c, 0x78d]).toRFC5952String(), '2001:db8:ff:abc:def:123b:456c:78d');

        // don't shorten single 0s (section 4.2.2)
        equal(new IPv6([0x2001, 0xdb8, 0xff, 0xabc, 0, 0x123b, 0x456c, 0x78d]).toRFC5952String(), '2001:db8:ff:abc:0:123b:456c:78d');
        equal(new IPv6([0x2001, 0xdb8, 0xff, 0xabc, 0x78d, 0x123b, 0x456c, 0]).toRFC5952String(), '2001:db8:ff:abc:78d:123b:456c:0');
        equal(new IPv6([0, 0xdb8, 0xff, 0xabc, 0x78d, 0x123b, 0x456c, 0x2001]).toRFC5952String(), '0:db8:ff:abc:78d:123b:456c:2001');

        equal(new IPv6([0x2001, 0xdb8, 0xff, 0xabc, 0, 0, 0x456c, 0x78d]).toRFC5952String(), '2001:db8:ff:abc::456c:78d');
    })

    it('returns IPv6 zoneIndex', () => {
        let addr = new IPv6([0x2001, 0xdb8, 0xf53a, 0, 0, 0, 0, 1], 'utun0');
        equal(addr.toNormalizedString(), '2001:db8:f53a:0:0:0:0:1%utun0');
        equal(addr.toString(), '2001:db8:f53a::1%utun0');

        equal(
            parse('2001:db8:f53a::1%2').toString(),
            '2001:db8:f53a::1%2'
        );
        equal(
            parse('2001:db8:f53a::1%WAT').toString(),
            '2001:db8:f53a::1%WAT'
        );
        equal(
            parse('2001:db8:f53a::1%sUp').toString(),
            '2001:db8:f53a::1%sUp'
        );
    })

    it('compresses a trailing zero run when a zoneIndex is present', () => {
        // The zone identifier (RFC 4007) is not part of the address and must
        // not prevent zero-run compression at the end of it (RFC 5952, 4.2.2).
        equal(new IPv6([0xfe80, 0, 0, 0, 0, 0, 0, 0], 'eth0').toString(), 'fe80::%eth0');
        equal(new IPv6([0x2001, 0xdb8, 0, 0, 0, 0, 0, 0], 'eth0').toRFC5952String(), '2001:db8::%eth0');
        equal(parse('fe80::%eth0').toString(), 'fe80::%eth0');
        equal(parse('::%eth0').toString(), '::%eth0');
    })

    it('returns IPv6 zoneIndex for IPv4-mapped IPv6 addresses', () => {
        let addr = parse('::ffff:192.168.1.1%eth0');
        equal(addr.toNormalizedString(), '0:0:0:0:0:ffff:c0a8:101%eth0');
        equal(addr.toString(), '::ffff:c0a8:101%eth0');

        equal(
            parse('::ffff:192.168.1.1%2').toString(),
            '::ffff:c0a8:101%2'
        );
        equal(
            parse('::ffff:192.168.1.1%WAT').toString(),
            '::ffff:c0a8:101%WAT'
        );
        equal(
            parse('::ffff:192.168.1.1%sUp').toString(),
            '::ffff:c0a8:101%sUp'
        );
    })

    it('returns correct kind for IPv6', () => {
        let addr = new IPv6([0x2001, 0xdb8, 0xf53a, 0, 0, 0, 0, 1]);
        equal(addr.kind(), 'ipv6');
    })

    it('allows to access IPv6 address parts', () => {
        let addr = new IPv6([0x2001, 0xdb8, 0xf53a, 0, 0, 42, 0, 1]);
        equal(addr.parts[5], 42);
    })

    it('checks IPv6 address format', () => {
        equal(IPv6.isIPv6('2001:db8:F53A::1'), true);
        equal(IPv6.isIPv6('200001::1'), true);
        equal(IPv6.isIPv6('::ffff:192.168.1.1'), true);
        equal(IPv6.isIPv6('::ffff:192.168.1.1%z'), true);
        equal(IPv6.isIPv6('::10.2.3.4'), true);
        equal(IPv6.isIPv6('::12.34.56.78%z'), true);
        equal(IPv6.isIPv6('::ffff:300.168.1.1'), false);
        equal(IPv6.isIPv6('::ffff:300.168.1.1:0'), false);
        equal(IPv6.isIPv6('fe80::wtf'), false);
        equal(IPv6.isIPv6('fe80::%'), false);
    })

    it('validates IPv6 addresses', () => {
        equal(IPv6.isValid('2001:db8:F53A::1'), true);
        equal(IPv6.isValid('200001::1'), false);
        equal(IPv6.isValid('::ffff:192.168.1.1'), true);
        equal(IPv6.isValid('::ffff:192.168.1.1%z'), true);
        equal(IPv6.isValid('::1.1.1.1'), true);
        equal(IPv6.isValid('::1.2.3.4%z'), true);
        equal(IPv6.isValid('::ffff:300.168.1.1'), false);
        equal(IPv6.isValid('::ffff:300.168.1.1:0'), false);
        equal(IPv6.isValid('::ffff:222.1.41.9000'), false);
        equal(IPv6.isValid('2001:db8::F53A::1'), false);
        equal(IPv6.isValid('fe80::wtf'), false);
        equal(IPv6.isValid('fe80::%'), false);
        equal(IPv6.isValid('2002::2:'), false);
        equal(IPv6.isValid('::%z'), true);

        equal(IPv6.isValid(undefined), false);
    })

    it('rejects IPv6 parts longer than four hexadecimal digits', () => {
        equal(IPv6.isValid('00000::1'), false);
        throws(() => IPv6.parse('00000::1'));
        equal(IPv6.isValid('00000:0:0:0:0:0:1.2.3.4'), false);
        throws(() => IPv6.parse('00000:0:0:0:0:0:1.2.3.4'));
    })

    it('rejects compression of zero IPv6 parts', () => {
        equal(IPv6.isValid('1:2:3:4:5:6:7:8::'), false);
        throws(() => IPv6.parse('1:2:3:4:5:6:7:8::'));
        equal(IPv6.isValid('::1:2:3:4:5:6:7:8'), false);
        throws(() => IPv6.parse('::1:2:3:4:5:6:7:8'));
    })

    it('does not reject compression of exactly one IPv6 part', () => {
        equal(IPv6.isValid('1:2:3:4:5:6:7::'), true);
        equal(IPv6.isValid('::1:2:3:4:5:6:7'), true);
    })

    it('validates IPv6 addresses in CIDR notation', () => {
        equal(IPv6.isValidCIDR('::/0'), true);
        equal(IPv6.isValidCIDR('2001:db8:F53A::1%z/64'), true);
        equal(IPv6.isValidCIDR('2001:db8:F53A::1/-1'), false);
        equal(IPv6.isValidCIDR('2001:db8:F53A::1'), false);
        equal(IPv6.isValidCIDR('2001:db8:F53A::1/129'), false);
        equal(IPv6.isValidCIDR('2001:db8:F53A::1%z/129'), false);
        equal(IPv6.isValidCIDR('2001:db8:F53A::1/64%z'), false);
        equal(IPv6.isValidCIDR('2001:db8:F53A::1/64%'), false);
        equal(IPv6.isValidCIDR('2001:db8:F53A::1/64%z/64'), false);
        equal(IPv6.isValidCIDR(undefined), false);
    })

    it('parses IPv6 in different formats', () => {
        deepEqual(IPv6.parse('2001:db8:F53A:0:0:0:0:1').parts, [0x2001, 0xdb8, 0xf53a, 0, 0, 0, 0, 1]);
        deepEqual(IPv6.parse('fe80::10').parts, [0xfe80, 0, 0, 0, 0, 0, 0, 0x10]);
        deepEqual(IPv6.parse('2001:db8:F53A::').parts, [0x2001, 0xdb8, 0xf53a, 0, 0, 0, 0, 0]);
        deepEqual(IPv6.parse('::1').parts, [0, 0, 0, 0, 0, 0, 0, 1]);
        deepEqual(IPv6.parse('::8.8.8.8').parts, [0, 0, 0, 0, 0, 0xffff, 2056, 2056]);
        deepEqual(IPv6.parse('FFFF::255.255.255.255').parts, [0xffff, 0, 0, 0, 0, 0, 0xffff, 0xffff]);
        deepEqual(IPv6.parse('64:ff9a::0.0.0.0').parts, [0x64, 0xff9a, 0, 0, 0, 0, 0, 0]);
        deepEqual(IPv6.parse('::').parts, [0, 0, 0, 0, 0, 0, 0, 0]);
        deepEqual(IPv6.parse('::%z').parts, [0, 0, 0, 0, 0, 0, 0, 0]);
        deepEqual(IPv6.parse('::%z').zoneId, 'z');
    })

    it('barfs at invalid IPv6', () => {
        throws(() => {
            IPv6.parse('fe80::0::1');
        });
    })

    it('throws a descriptive error when parsing a malformed IPv6 address', () => {
        throws(() => IPv6.parse('foobar'), /string is not formatted like an IPv6 Address/);
        throws(() => IPv6.parse('::ffff:999.1.1.1'), /string is not formatted like an IPv6 Address/);
        throws(() => IPv6.parse('1::2::3:1.2.3.4'), /string is not formatted like an IPv6 Address/);
    })

    it('matches IPv6 CIDR correctly', () => {
        let addr = IPv6.parse('2001:db8:f53a::1');
        equal(addr.match(IPv6.parse('::'), 0), true);
        equal(addr.match(IPv6.parse('2001:db8:f53a::1:1'), 64), true);
        equal(addr.match(IPv6.parse('2001:db8:f53b::1:1'), 48), false);
        equal(addr.match(IPv6.parse('2001:db8:f531::1:1'), 44), true);
        equal(addr.match(IPv6.parse('2001:db8:f500::1'), 40), true);
        equal(addr.match(IPv6.parse('2001:db8:f500::1%z'), 40), true);
        equal(addr.match(IPv6.parse('2001:db9:f500::1'), 40), false);
        equal(addr.match(IPv6.parse('2001:db9:f500::1'), 40), false);
        equal(addr.match(IPv6.parse('2001:db9:f500::1%z'), 40), false);
        equal(addr.match(addr, 128), true);
    })

    it('parses IPv6 CIDR correctly', () => {
        let addr = IPv6.parse('2001:db8:f53a::1');
        equal(addr.match(IPv6.parseCIDR('::/0')), true);
        equal(addr.match(IPv6.parseCIDR('2001:db8:f53a::1:1/64')), true);
        equal(addr.match(IPv6.parseCIDR('2001:db8:f53b::1:1/48')), false);
        equal(addr.match(IPv6.parseCIDR('2001:db8:f531::1:1/44')), true);
        equal(addr.match(IPv6.parseCIDR('2001:db8:f500::1/40')), true);
        equal(addr.match(IPv6.parseCIDR('2001:db8:f500::1%z/40')), true);
        equal(addr.match(IPv6.parseCIDR('2001:db9:f500::1/40')), false);
        equal(addr.match(IPv6.parseCIDR('2001:db9:f500::1%z/40')), false);
        equal(addr.match(IPv6.parseCIDR('2001:db8:f53a::1/128')), true);
        throws(() => {
            IPv6.parseCIDR('2001:db8:f53a::1');
        });
        throws(() => {
            IPv6.parseCIDR('2001:db8:f53a::1/-1');
        });
        throws(() => {
            IPv6.parseCIDR('2001:db8:f53a::1/129');
        });
    })

    it('converts between IPv4-mapped IPv6 addresses and IPv4 addresses', () => {
        let addr = IPv4.parse('77.88.21.11');
        let mapped = addr.toIPv4MappedAddress();
        deepEqual(mapped.parts, [0, 0, 0, 0, 0, 0xffff, 0x4d58, 0x150b]);
        deepEqual(mapped.toIPv4Address().octets, addr.octets);
    })

    it('refuses to convert non-IPv4-mapped IPv6 address to IPv4 address', () => {
        throws(() => {
            IPv6.parse('2001:db8::1').toIPv4Address();
        });
    })

    it('detects reserved IPv6 networks', () => {
        equal(IPv6.parse('::').range(), 'unspecified');
        equal(IPv6.parse('fe80::1234:5678:abcd:0123').range(), 'linkLocal');
        equal(IPv6.parse('ff00::1234').range(), 'multicast');
        equal(IPv6.parse('::1').range(), 'loopback');
        equal(IPv6.parse('100::42').range(), 'discard');
        equal(IPv6.parse('fc00::').range(), 'uniqueLocal');
        equal(IPv6.parse('::ffff:192.168.1.10').range(), 'ipv4Mapped');
        equal(IPv6.parse('fec0::1234').range(), 'deprecatedSiteLocal');
        equal(IPv6.parse('::ffff:0:192.168.1.10').range(), 'rfc6145');
        equal(IPv6.parse('64:ff9b::1234').range(), 'rfc6052');
        equal(IPv6.parse('64:ff9b:1::1234').range(), 'rfc6052');
        equal(IPv6.parse('2002:1f63:45e8::1').range(), '6to4');
        equal(IPv6.parse('2001::4242').range(), 'teredo');
        equal(IPv6.parse('2001:2::').range(), 'benchmarking');
        equal(IPv6.parse('2001:3::').range(), 'amt');
        equal(IPv6.parse('2001:4:112::').range(), 'as112v6');
        equal(IPv6.parse('2620:4f:8000::').range(), 'as112v6');
        equal(IPv6.parse('2001:10::').range(), 'deprecatedOrchid');
        equal(IPv6.parse('2001:20::').range(), 'orchid2');
        equal(IPv6.parse('2001:30::').range(), 'droneRemoteIdProtocolEntityTags');
        equal(IPv6.parse('2001:db8::3210').range(), 'reserved');
        equal(IPv6.parse('2001:470:8:66::1').range(), 'unicast');
        equal(IPv6.parse('2001:470:8:66::1%z').range(), 'unicast');
        equal(IPv6.parse('5f00::1').range(), 'segmentRouting');
        equal(IPv6.parse('3fff::1').range(), 'reserved');
    })

    it('is able to determine IP address type', () => {
        equal(parse('8.8.8.8').kind(), 'ipv4');
        equal(parse('2001:db8:3312::1').kind(), 'ipv6');
        equal(parse('2001:db8:3312::1%z').kind(), 'ipv6');
    })

    it('throws an error if tried to parse an invalid address', () => {
        throws(() => {
            parse('::some.nonsense');
        });
    })

    it('correctly processes IPv4-mapped addresses', () => {
        equal(process('8.8.8.8').kind(), 'ipv4');
        equal(process('2001:db8:3312::1').kind(), 'ipv6');
        equal(process('::ffff:192.168.1.1').kind(), 'ipv4');
        equal(process('::ffff:192.168.1.1%z').kind(), 'ipv4');
        equal(process('::8.8.8.8').kind(), 'ipv4');
    })

    it('correctly converts IPv6 and IPv4 addresses to byte arrays', () => {
        deepEqual(
            parse('1.2.3.4').toByteArray(),
            [0x1, 0x2, 0x3, 0x4]
        );
        // Fuck yeah. The first byte of Google's IPv6 address is 42. 42!
        deepEqual(
            parse('2a00:1450:8007::68').toByteArray(),
            [42, 0x00, 0x14, 0x50, 0x80, 0x07, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x68]
        );
        deepEqual(
            parse('2a00:1450:8007::68%z').toByteArray(),
            [42, 0x00, 0x14, 0x50, 0x80, 0x07, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x68]
        );
    })

    it('correctly parses 1 as an IPv4 address', () => {
        equal(IPv6.isValid('1'), false);
        equal(IPv4.isValid('1'), true);
        deepEqual(new IPv4([0, 0, 0, 1]), parse('1'));
    })

    it('correctly detects IPv4 and IPv6 CIDR addresses', () => {
        deepEqual(
            [IPv6.parse('fc00::'), 64],
            parseCIDR('fc00::/64')
        );
        deepEqual(
            [IPv4.parse('1.2.3.4'), 5],
            parseCIDR('1.2.3.4/5')
        );
    })

    it('does not consider a very large or very small number a valid IP address', () => {
        equal(isValid('4999999999'), false);
        equal(isValid('-1'), false);
    })

    it('does not hang on ::8:8:8:8:8:8:8:8:8', () => {
        equal(IPv6.isValid('::8:8:8:8:8:8:8:8:8'), false);
        equal(IPv6.isValid('::8:8:8:8:8:8:8:8:8%z'), false);
    })

    it('subnetMatch does not fail on empty range', () => {
        subnetMatch(new IPv4([1, 2, 3, 4]), {}, false);
        subnetMatch(new IPv4([1, 2, 3, 4]), { subnet: [] }, false);
    })

    it('subnetMatch returns default subnet on empty range', () => {
        equal(subnetMatch(new IPv4([1, 2, 3, 4]), {}, false), false);
        equal(subnetMatch(new IPv4([1, 2, 3, 4]), { subnet: [] }, false), false);
    })

    it('subnetMatch does not fail on IPv4 when looking for IPv6', () => {
        let rangelist = { subnet6: parseCIDR('fe80::/64') };
        equal(subnetMatch(new IPv4([1, 2, 3, 4]), rangelist, false), false);
    })

    it('subnetMatch does not fail on IPv6 when looking for IPv4', () => {
        let rangelist = { subnet4: parseCIDR('1.2.3.0/24') };
        equal(subnetMatch(new IPv6([0xfe80, 0, 0, 0, 0, 0, 0, 1]), rangelist, false), false);
    })

    it('subnetMatch can use a hybrid IPv4/IPv6 range list', () => {
        let rangelist = { dual64: [parseCIDR('1.2.4.0/24'), parseCIDR('2001:1:2:3::/64')] };
        equal(subnetMatch(new IPv4([1, 2, 4, 1]), rangelist, false), 'dual64');
        equal(subnetMatch(new IPv6([0x2001, 1, 2, 3, 0, 0, 0, 1]), rangelist, false), 'dual64');
    })

    it('is able to determine IP address type from byte array input', () => {
        equal(fromByteArray([0x7f, 0, 0, 1]).kind(), 'ipv4');
        equal(fromByteArray([0x20, 0x01, 0xd, 0xb8, 0xf5, 0x3a, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1]).kind(), 'ipv6');
        throws(() => {
            fromByteArray([1]);
        });
    })


    it('prefixLengthFromSubnetMask returns proper CIDR notation for standard IPv4 masks', () => {
        equal(IPv4.parse('255.255.255.255').prefixLengthFromSubnetMask(), 32);
        equal(IPv4.parse('255.255.255.254').prefixLengthFromSubnetMask(), 31);
        equal(IPv4.parse('255.255.255.252').prefixLengthFromSubnetMask(), 30);
        equal(IPv4.parse('255.255.255.248').prefixLengthFromSubnetMask(), 29);
        equal(IPv4.parse('255.255.255.240').prefixLengthFromSubnetMask(), 28);
        equal(IPv4.parse('255.255.255.224').prefixLengthFromSubnetMask(), 27);
        equal(IPv4.parse('255.255.255.192').prefixLengthFromSubnetMask(), 26);
        equal(IPv4.parse('255.255.255.128').prefixLengthFromSubnetMask(), 25);
        equal(IPv4.parse('255.255.255.0').prefixLengthFromSubnetMask(), 24);
        equal(IPv4.parse('255.255.254.0').prefixLengthFromSubnetMask(), 23);
        equal(IPv4.parse('255.255.252.0').prefixLengthFromSubnetMask(), 22);
        equal(IPv4.parse('255.255.248.0').prefixLengthFromSubnetMask(), 21);
        equal(IPv4.parse('255.255.240.0').prefixLengthFromSubnetMask(), 20);
        equal(IPv4.parse('255.255.224.0').prefixLengthFromSubnetMask(), 19);
        equal(IPv4.parse('255.255.192.0').prefixLengthFromSubnetMask(), 18);
        equal(IPv4.parse('255.255.128.0').prefixLengthFromSubnetMask(), 17);
        equal(IPv4.parse('255.255.0.0').prefixLengthFromSubnetMask(), 16);
        equal(IPv4.parse('255.254.0.0').prefixLengthFromSubnetMask(), 15);
        equal(IPv4.parse('255.252.0.0').prefixLengthFromSubnetMask(), 14);
        equal(IPv4.parse('255.248.0.0').prefixLengthFromSubnetMask(), 13);
        equal(IPv4.parse('255.240.0.0').prefixLengthFromSubnetMask(), 12);
        equal(IPv4.parse('255.224.0.0').prefixLengthFromSubnetMask(), 11);
        equal(IPv4.parse('255.192.0.0').prefixLengthFromSubnetMask(), 10);
        equal(IPv4.parse('255.128.0.0').prefixLengthFromSubnetMask(), 9);
        equal(IPv4.parse('255.0.0.0').prefixLengthFromSubnetMask(), 8);
        equal(IPv4.parse('254.0.0.0').prefixLengthFromSubnetMask(), 7);
        equal(IPv4.parse('252.0.0.0').prefixLengthFromSubnetMask(), 6);
        equal(IPv4.parse('248.0.0.0').prefixLengthFromSubnetMask(), 5);
        equal(IPv4.parse('240.0.0.0').prefixLengthFromSubnetMask(), 4);
        equal(IPv4.parse('224.0.0.0').prefixLengthFromSubnetMask(), 3);
        equal(IPv4.parse('192.0.0.0').prefixLengthFromSubnetMask(), 2);
        equal(IPv4.parse('128.0.0.0').prefixLengthFromSubnetMask(), 1);
        equal(IPv4.parse('0.0.0.0').prefixLengthFromSubnetMask(), 0);
        // negative cases
        equal(IPv4.parse('192.168.255.0').prefixLengthFromSubnetMask(), null);
        equal(IPv4.parse('255.0.255.0').prefixLengthFromSubnetMask(), null);
    })

    it('prefixLengthFromSubnetMask returns proper CIDR notation for standard IPv6 masks', () => {
        equal(IPv6.parse('ffff:ffff:ffff:ffff:ffff:ffff:ffff:ffff').prefixLengthFromSubnetMask(), 128);
        equal(IPv6.parse('ffff:ffff:ffff:ffff::').prefixLengthFromSubnetMask(), 64);
        equal(IPv6.parse('ffff:ffff:ffff:ff80::').prefixLengthFromSubnetMask(), 57);
        equal(IPv6.parse('ffff:ffff:ffff::').prefixLengthFromSubnetMask(), 48);
        equal(IPv6.parse('ffff:ffff:ffff::%z').prefixLengthFromSubnetMask(), 48);
        equal(IPv6.parse('::').prefixLengthFromSubnetMask(), 0);
        equal(IPv6.parse('::%z').prefixLengthFromSubnetMask(), 0);
        // negative cases
        equal(IPv6.parse('2001:db8::').prefixLengthFromSubnetMask(), null);
        equal(IPv6.parse('ffff:0:0:ffff::').prefixLengthFromSubnetMask(), null);
        equal(IPv6.parse('ffff:0:0:ffff::%z').prefixLengthFromSubnetMask(), null);
    })

    it('subnetMaskFromPrefixLength returns correct IPv4 subnet mask given prefix length', () => {

        equal(IPv4.subnetMaskFromPrefixLength(0), '0.0.0.0');
        equal(IPv4.subnetMaskFromPrefixLength(1), '128.0.0.0');
        equal(IPv4.subnetMaskFromPrefixLength(2), '192.0.0.0');
        equal(IPv4.subnetMaskFromPrefixLength(3), '224.0.0.0');
        equal(IPv4.subnetMaskFromPrefixLength(4), '240.0.0.0');
        equal(IPv4.subnetMaskFromPrefixLength(5), '248.0.0.0');
        equal(IPv4.subnetMaskFromPrefixLength(6), '252.0.0.0');
        equal(IPv4.subnetMaskFromPrefixLength(7), '254.0.0.0');
        equal(IPv4.subnetMaskFromPrefixLength(8), '255.0.0.0');
        equal(IPv4.subnetMaskFromPrefixLength(9), '255.128.0.0');
        equal(IPv4.subnetMaskFromPrefixLength(10), '255.192.0.0');
        equal(IPv4.subnetMaskFromPrefixLength(11), '255.224.0.0');
        equal(IPv4.subnetMaskFromPrefixLength(12), '255.240.0.0');
        equal(IPv4.subnetMaskFromPrefixLength(13), '255.248.0.0');
        equal(IPv4.subnetMaskFromPrefixLength(14), '255.252.0.0');
        equal(IPv4.subnetMaskFromPrefixLength(15), '255.254.0.0');
        equal(IPv4.subnetMaskFromPrefixLength(16), '255.255.0.0');
        equal(IPv4.subnetMaskFromPrefixLength(17), '255.255.128.0');
        equal(IPv4.subnetMaskFromPrefixLength(18), '255.255.192.0');
        equal(IPv4.subnetMaskFromPrefixLength(19), '255.255.224.0');
        equal(IPv4.subnetMaskFromPrefixLength(20), '255.255.240.0');
        equal(IPv4.subnetMaskFromPrefixLength(21), '255.255.248.0');
        equal(IPv4.subnetMaskFromPrefixLength(22), '255.255.252.0');
        equal(IPv4.subnetMaskFromPrefixLength(23), '255.255.254.0');
        equal(IPv4.subnetMaskFromPrefixLength(24), '255.255.255.0');
        equal(IPv4.subnetMaskFromPrefixLength(25), '255.255.255.128');
        equal(IPv4.subnetMaskFromPrefixLength(26), '255.255.255.192');
        equal(IPv4.subnetMaskFromPrefixLength(27), '255.255.255.224');
        equal(IPv4.subnetMaskFromPrefixLength(28), '255.255.255.240');
        equal(IPv4.subnetMaskFromPrefixLength(29), '255.255.255.248');
        equal(IPv4.subnetMaskFromPrefixLength(30), '255.255.255.252');
        equal(IPv4.subnetMaskFromPrefixLength(31), '255.255.255.254');
        equal(IPv4.subnetMaskFromPrefixLength(32), '255.255.255.255');
    })

    it('subnetMaskFromPrefixLength returns correct IPv6 subnet mask given prefix length', () => {
        equal(IPv6.subnetMaskFromPrefixLength(128), 'ffff:ffff:ffff:ffff:ffff:ffff:ffff:ffff');
        equal(IPv6.subnetMaskFromPrefixLength(112), 'ffff:ffff:ffff:ffff:ffff:ffff:ffff:0');
        equal(IPv6.subnetMaskFromPrefixLength(96),  'ffff:ffff:ffff:ffff:ffff:ffff::');
        equal(IPv6.subnetMaskFromPrefixLength(72),  'ffff:ffff:ffff:ffff:ff00::');
        equal(IPv6.subnetMaskFromPrefixLength(64),  'ffff:ffff:ffff:ffff::');
        equal(IPv6.subnetMaskFromPrefixLength(48),  'ffff:ffff:ffff::');
        equal(IPv6.subnetMaskFromPrefixLength(32),  'ffff:ffff::');
        equal(IPv6.subnetMaskFromPrefixLength(16),  'ffff::');
        equal(IPv6.subnetMaskFromPrefixLength(8),   'ff00::');
        equal(IPv6.subnetMaskFromPrefixLength(4),   'f000::');
        equal(IPv6.subnetMaskFromPrefixLength(2),   'c000::');
        equal(IPv6.subnetMaskFromPrefixLength(1),   '8000::');
        equal(IPv6.subnetMaskFromPrefixLength(0),   '::');
    })

    it('subnetMaskFromPrefixLength throws on an out-of-range or non-numeric prefix length', () => {
        throws(() => IPv4.subnetMaskFromPrefixLength(-1));
        throws(() => IPv4.subnetMaskFromPrefixLength(33));
        throws(() => IPv4.subnetMaskFromPrefixLength('not a number'));
        throws(() => IPv6.subnetMaskFromPrefixLength(-1));
        throws(() => IPv6.subnetMaskFromPrefixLength(129));
        throws(() => IPv6.subnetMaskFromPrefixLength('not a number'));
    })

    it('broadcastAddressFromCIDR returns correct IPv4 broadcast address', () => {
        equal(IPv4.broadcastAddressFromCIDR('172.0.0.1/24'), '172.0.0.255');
        equal(IPv4.broadcastAddressFromCIDR('172.0.0.1/26'), '172.0.0.63');
    })

    it('networkAddressFromCIDR returns correct IPv4 network address', () => {
        equal(IPv4.networkAddressFromCIDR('172.0.0.1/24'), '172.0.0.0');
        equal(IPv4.networkAddressFromCIDR('172.0.0.1/5'), '168.0.0.0');
    })

    it('networkAddressFromCIDR returns correct IPv6 network address', () => {
        equal(IPv6.networkAddressFromCIDR('::/0'),                  '::');
        equal(IPv6.networkAddressFromCIDR('2001:db8:f53a::1:1/64'), '2001:db8:f53a::');
        equal(IPv6.networkAddressFromCIDR('2001:db8:f53b::1:1/48'), '2001:db8:f53b::');
        equal(IPv6.networkAddressFromCIDR('2001:db8:f531::1:1/44'), '2001:db8:f530::');
        equal(IPv6.networkAddressFromCIDR('2001:db8:f500::1/40'),   '2001:db8:f500::');
        equal(IPv6.networkAddressFromCIDR('2001:db8:f500::1%z/40'), '2001:db8:f500::');
        equal(IPv6.networkAddressFromCIDR('2001:db9:f500::1/40'),   '2001:db9:f500::');
        equal(IPv6.networkAddressFromCIDR('2001:db9:f500::1%z/40'), '2001:db9:f500::');
        equal(IPv6.networkAddressFromCIDR('2001:db8:f53a::1/128'),  '2001:db8:f53a::1');
    })

    it('broadcastAddressFromCIDR returns correct IPv6 broadcast address', () => {
        equal(IPv6.broadcastAddressFromCIDR('::/0'),                  'ffff:ffff:ffff:ffff:ffff:ffff:ffff:ffff');
        equal(IPv6.broadcastAddressFromCIDR('2001:db8:f53a::1:1/64'), '2001:db8:f53a:0:ffff:ffff:ffff:ffff');
        equal(IPv6.broadcastAddressFromCIDR('2001:db8:f53b::1:1/48'), '2001:db8:f53b:ffff:ffff:ffff:ffff:ffff');
        equal(IPv6.broadcastAddressFromCIDR('2001:db8:f531::1:1/44'), '2001:db8:f53f:ffff:ffff:ffff:ffff:ffff');
        equal(IPv6.broadcastAddressFromCIDR('2001:db8:f500::1/40'),   '2001:db8:f5ff:ffff:ffff:ffff:ffff:ffff');
        equal(IPv6.broadcastAddressFromCIDR('2001:db8:f500::1%z/40'), '2001:db8:f5ff:ffff:ffff:ffff:ffff:ffff');
        equal(IPv6.broadcastAddressFromCIDR('2001:db9:f500::1/40'),   '2001:db9:f5ff:ffff:ffff:ffff:ffff:ffff');
        equal(IPv6.broadcastAddressFromCIDR('2001:db9:f500::1%z/40'), '2001:db9:f5ff:ffff:ffff:ffff:ffff:ffff');
        equal(IPv6.broadcastAddressFromCIDR('2001:db8:f53a::1/128'),  '2001:db8:f53a::1');
    })
})
