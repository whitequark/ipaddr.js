fs           = require 'fs'
CoffeeScript = require 'coffee-script'
nodeunit     = require 'nodeunit'

task 'build', 'build the JavaScript files from CoffeeScript source', build = (cb) ->
  source = fs.readFileSync 'src/ipaddr.coffee'
  fs.writeFileSync 'lib/ipaddr.js', CoffeeScript.compile source.toString()

  invoke 'test'

task 'test', 'run the bundled tests', (cb) ->
  nodeunit.reporters.default.run ['test']