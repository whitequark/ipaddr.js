### Unreleased

- classify IPv4-Compatible IPv6 addresses (RFC4291 §2.5.5.1, `::/96` excluding `::` and `::1`) as `ipv4Compat` instead of `unicast`, so consumers using `range() !== 'unicast'` as an SSRF safety check block `::7f00:1`, `::a9fe:a9fe`, etc. — the pure-hex form that WHATWG URL parsers (`new URL('https://[::127.0.0.1]/').hostname` → `[::7f00:1]`) emit for IPv4-Compatible literals. The more-specific `::/128` and `::1/128` ranges retain their existing `unspecified` and `loopback` classifications.


### 2.4.0 - 2026-05-03

- remove Bower support
- add RFC9637, RFC9602, RFC8215, RFC3879 reserved address ranges


### 2.3.0 - 2025-11-27

- add isValidCIDRFourPartDecimal helper for IPv4 CIDR in four-part decimal form
- upgrade eslint dev dependency to v9
- remove duplicated LICENSE entry from published files list


### 2.2.0 - 2024-04-20

- add isValidCIDR method
- fix parsing of some IPv4-embedded IPv6 addresses
- add RFC7534, RFC7535, RFC7450, RFC6666, RFC5180, RFC7450 reserved address ranges


### 2.1.0 - 2023-05-23

- un-deprecate IPv6.toString() and make it an alias to toRFC5952String()
- add reserved 198.18.0.0/15 block
- add reserved blocks in 2001: space


### 2.0.1 - 2020-01-06

- add support for deprecated IPv4 compatible IPv6 addresses #142
- drop node 8 testing, add v14
- fix parseInt for decimal, octal, hex
- add support for classful (2,3 octet) IPv4


### 2.0.0 - 2019-10-13

- use es6 templates instead of concatenated strings
- lint: update tests with no-var
- lint: allow no-cond-assign with extra parens
- es6: replace var with const/let
- update README with es6 examples #125
- replace nodeunit with mocha
- rewrite in JS, drop CoffeeScript


### 1.9.1 - 2019-07-03
