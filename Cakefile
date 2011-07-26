fs            = require 'fs'
{spawn, exec} = require 'child_process'
nodeunit      = require 'nodeunit'

# Run a CoffeeScript through the coffee interpreter.
run = (args, cb) ->
  proc =         spawn 'coffee', args
  proc.stderr.on 'data', (buffer) -> console.log buffer.toString()
  proc.on        'exit', (status) ->
    process.exit(1) if status != 0
    cb() if typeof cb is 'function'

task 'build', 'build the JavaScript files from CoffeeScript source', build = (cb) ->
  files = fs.readdirSync 'src'
  files = ('src/' + file for file in files when file.match(/\.coffee$/))
  run ['-c', '-o', 'lib'].concat(files), cb

task 'test', 'run the bundled tests', (cb) ->
  invoke 'build'
  nodeunit.reporters.default.run ['test']