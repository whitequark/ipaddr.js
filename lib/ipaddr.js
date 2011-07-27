(function() {
  var ipaddr, ipv4Part, ipv4Regexes, matchCIDR, matchSubnet, root;
  ipaddr = {};
  root = this;
  if ((typeof module !== "undefined" && module !== null) && module.exports) {
    module.exports = ipaddr;
  } else {
    root['ipaddr'] = ipaddr;
  }
  matchCIDR = function(first, second, partSize, cidrBits) {
    var part, shift;
    if (first.length !== second.length) {
      throw new Error("ipaddr: cannot match CIDR for objects with different lengths");
    }
    part = 0;
    while (cidrBits > 0) {
      shift = partSize - cidrBits;
      if (shift < 0) {
        shift = 0;
      }
      if (first[part] >> shift !== second[part] >> shift) {
        return false;
      }
      cidrBits -= partSize;
      part += 1;
    }
    return true;
  };
  matchSubnet = function(address, rangeList, defaultName) {
    var rangeName, rangeSubnets, subnet, _i, _len;
    if (defaultName == null) {
      defaultName = 'unicast';
    }
    for (rangeName in rangeList) {
      rangeSubnets = rangeList[rangeName];
      for (_i = 0, _len = rangeSubnets.length; _i < _len; _i++) {
        subnet = rangeSubnets[_i];
        if (address.match.apply(address, subnet)) {
          return rangeName;
        }
      }
    }
    return defaultName;
  };
  ipaddr.IPv4 = (function() {
    function IPv4(octets) {
      var octet, _i, _len;
      if (octets.length !== 4) {
        throw new Error("ipaddr: ipv4 octet count should be 4");
      }
      for (_i = 0, _len = octets.length; _i < _len; _i++) {
        octet = octets[_i];
        if (!((0 <= octet && octet <= 255))) {
          throw new Error("ipaddr: ipv4 octet is a byte");
        }
      }
      this.octets = octets;
    }
    IPv4.prototype.kind = function() {
      return 'ipv4';
    };
    IPv4.prototype.toString = function() {
      return this.octets.join(".");
    };
    IPv4.prototype.match = function(other, cidrRange) {
      if (other.kind() !== 'ipv4') {
        throw new Error("ipaddr: cannot match ipv4 address with non-ipv4 one");
      }
      return matchCIDR(this.octets, other.octets, 8, cidrRange);
    };
    IPv4.prototype.SpecialRanges = {
      broadcast: [[new IPv4([255, 255, 255, 255]), 32]],
      multicast: [[new IPv4([224, 0, 0, 0]), 4]],
      linkLocal: [[new IPv4([169, 254, 0, 0]), 16]],
      loopback: [[new IPv4([127, 0, 0, 0]), 8]],
      private: [[new IPv4([10, 0, 0, 0]), 8], [new IPv4([172, 16, 0, 0]), 12], [new IPv4([192, 168, 0, 0]), 16]],
      reserved: [[new IPv4([192, 0, 0, 0]), 24], [new IPv4([192, 0, 2, 0]), 24], [new IPv4([192, 88, 99, 0]), 24], [new IPv4([198, 51, 100, 0]), 24], [new IPv4([203, 0, 113, 0]), 24], [new IPv4([240, 0, 0, 0]), 4]]
    };
    IPv4.prototype.range = function() {
      return matchSubnet(this, this.SpecialRanges);
    };
    return IPv4;
  })();
  ipv4Part = "(0?\\d+|0x[a-f0-9]+)";
  ipv4Regexes = {
    fourOctet: new RegExp("^" + ipv4Part + "\\." + ipv4Part + "\\." + ipv4Part + "\\." + ipv4Part + "$", 'i'),
    longValue: new RegExp("^" + ipv4Part + "$", 'i')
  };
  ipaddr.IPv4.parser = function(string) {
    var match, part, shift, value, _i, _len, _ref, _results;
    if (match = string.match(ipv4Regexes.fourOctet)) {
      _ref = match.slice(1, 6);
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        part = _ref[_i];
        _results.push(parseInt(part));
      }
      return _results;
    } else if (match = string.match(ipv4Regexes.longValue)) {
      value = parseInt(match[1]);
      return ((function() {
        var _results2, _step;
        _results2 = [];
        for (shift = 0, _step = 8; shift <= 24; shift += _step) {
          _results2.push((value >> shift) & 0xff);
        }
        return _results2;
      })()).reverse();
    } else {
      return null;
    }
  };
  ipaddr.IPv4.isIPv4 = function(string) {
    return this.parser(string) !== null;
  };
  ipaddr.IPv4.isValid = function(string) {
    try {
      new this(this.parser(string));
      return true;
    } catch (e) {
      return false;
    }
  };
  ipaddr.IPv4.parse = function(string) {
    var parts;
    parts = this.parser(string);
    if (parts === null) {
      throw new Error("ipaddr: string is not formatted like ipv4 address");
    }
    return new this(parts);
  };
  ipaddr.IPv6 = (function() {
    function IPv6() {}
    return IPv6;
  })();
}).call(this);
