module.exports =
  fail: (test) ->
    test.ok(false, 'this should fail')
    test.done()