#!/usr/bin/env node

var ejs = require('ejs')
var fs = require('fs')
var prettier = require('prettier')
var mkdirp = require('mkdirp')
var path = require('path')
var nodepath = require('path')
var program = require('commander')
var readline = require('readline')
var sortedObject = require('sorted-object')
var util = require('util')
const inflect = require('inflect')
var MODE_0666 = parseInt('0666', 8)
var MODE_0755 = parseInt('0755', 8)
const postmanGen = require('./postmanGen')

var _exit = process.exit
var pkg = require('../package.json')

var version = pkg.version

let prettierConfig = {
  semi : false,
  trailingComma : 'none',
  singleQuote : true
}


// Re-assign process.exit because of commander
// TODO: Switch to a different command framework
process.exit = exit

// CLI

around(program, 'optionMissingArgument', function (fn, args) {
  program.outputHelp()
  fn.apply(this, args)
  return { args: [], unknown: [] }
})

before(program, 'outputHelp', function () {
  // track if help was shown for unknown option
  this._helpShown = true
})

before(program, 'unknownOption', function () {
  // allow unknown options if help was shown, to prevent trailing error
  this._allowUnknownOption = this._helpShown

  // show help if not yet shown
  if (!this._helpShown) {
    program.outputHelp()
  }
})


function parseAttributes(val){
  return val.split(',').map(attr => {
    let name = attr.split(':')[0].toLowerCase()
    let type = attr.split(':')[1].toLowerCase().trim()
    switch (type) {
      case 'string':
      type = 'String'
        break;       
      case 'objectid':
        type = 'Schema.Types.ObjectId'
        break;
      case 'mixed':
        type = 'Schema.Types.Mixed'
        break;
      case 'number':
        type = 'Number'
        break;
      case 'date':
        type = 'Date'
        break;
      case 'boolean':
        type = 'Boolean'
        break;
      case 'buffer':
        type = 'Buffer'
        break;                          
      default:
        type : 'String'
        break;
    }
    return {
      name,
      type
    }
  })
}

program
  .name('express-crud-api')
  .version(version, '    --version')
  .usage('[options] [dir]')
  .option('    --init', 'init new project')
  .option('    --projectname <projectname>', 'project name',inflect.dasherize)
  .option('    --attributes <attributes>', 'schema attributes', parseAttributes)
  .option('    --schema <schema>', 'schema name')
  .option('    --git', 'add .gitignore')
  .option('-f, --force', 'force on non-empty directory')


program.parse(process.argv)

if (!exit.exited) {
  main()
}

/**
 * Install an around function; AOP.
 */

function around (obj, method, fn) {
  var old = obj[method]

  obj[method] = function () {
    var args = new Array(arguments.length)
    for (var i = 0; i < args.length; i++) args[i] = arguments[i]
    return fn.call(this, old, args)
  }
}

/**
 * Install a before function; AOP.
 */

function before (obj, method, fn) {
  var old = obj[method]

  obj[method] = function () {
    fn.call(this)
    old.apply(this, arguments)
  }
}

/**
 * Prompt for confirmation on STDOUT/STDIN
 */

function confirm (msg, callback) {
  var rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  })

  rl.question(msg, function (input) {
    rl.close()
    callback(/^y|yes|ok|true$/i.test(input))
  })
}

/**
 * Copy file from template directory.
 */

function copyTemplate (from, to) {
  from = path.join(__dirname, '..', 'templates', from)
  write(to, fs.readFileSync(from, 'utf-8'))
}

/**
 * Infect name
 */

function inflectMe (route) {
  return {
    capSingular : inflect.singularize(inflect.capitalize(route)),
    capPlural : inflect.pluralize(inflect.capitalize(route)),
    singular : inflect.singularize(route),
    plural : inflect.pluralize(route)
  }
}


/**
 * Create application at the given directory `path`.
 *
 * @param {String} path
 */

function createApplication (name, path) {
  var wait = 5

  console.log()
  function complete () {
    if (--wait) return
    var prompt = launchedFromCmd() ? '>' : '$'

    console.log()
    console.log('   install dependencies:')
    console.log('     %s cd %s && npm install', prompt, path)
    console.log()
    console.log('   run the app:')

    if (launchedFromCmd()) {
      console.log('     %s SET DEBUG=%s:* & npm start', prompt, name)
    } else {
      console.log('     %s DEBUG=%s:* npm start', prompt, name)
    }

    console.log()
  }

  // JavaScript
  var app = loadTemplate('js/app.js')
  var www = loadTemplate('js/www')

  // App name
  www.locals.name = name

  // App modules
  app.locals.modules = Object.create(null)
  app.locals.name = name
  app.locals.uses = []
  if(program.init){
    mkdir(path, function () {
      mkdir(path + '/models')
      mkdir(path + '/controllers')    
      mkdir(path + '/routes',function(){
        copyTemplate('js/routes/index.js', path + '/routes/index.js')
      })
      
      // package.json
      var pkg = {
        name: name,
        version: '0.1.0',
        private: true,
        scripts: {
          start: 'node ./bin/www',
          dev: `DEBUG_COLORS=false DEBUG=${name}:* NODE_ENV=development nodemon ./bin/www`
        },
        dependencies: {
          'body-parser': '~1.18.2',
          'cookie-parser': '~1.4.3',
          'debug': '~2.6.9',
          'express': '~4.15.5',
          'morgan': '~1.9.0',
          'boom' : '~7.1.1',
          'mongoose' : '~4.13.7',
          'cors' : '~2.8.4'
        }
      }
  
      // sort dependencies like npm(1)
      pkg.dependencies = sortedObject(pkg.dependencies)

      let postman = postmanGen.init(name)
  
      // write files
      write(path + '/'+inflect.dasherize(name)+'.postman_collection.json', JSON.stringify(postman, null, 2) + '\n')
      write(path + '/package.json', JSON.stringify(pkg, null, 2) + '\n')
      write(path + '/app.js', app.render())
      mkdir(path + '/bin', function () {
        write(path + '/bin/www', www.render(), MODE_0755)
        complete()
      })
  
      if (program.git) {
        copyTemplate('js/gitignore', path + '/.gitignore')
      }
  
      complete()
    })
  }
  function loadRender(mrc, loc){
    let template = loadTemplate('js/dynamic/'+mrc+'.js')
    template.locals.vars = inflectMe(program.schema)
    template.locals.attributes = program.attributes
    let pretty = prettier.format(template.render(), prettierConfig)
    write(path + '/'+loc+'/'+ program.schema +'.js', pretty)

  }
  if(program.schema){
    let schema = program.schema
    // console.log('schema',schema)
    // let routeTemplate = loadTemplate('js/dynamic/route.js')
    // routeTemplate.locals.vars = inflectMe(schema)
    // routeTemplate.locals.attributes = program.attributes
    // write(path + '/routes/'+ schema +'.js', routeTemplate.render())

    loadRender('route', 'routes')
    loadRender('controller', 'controllers')
    loadRender('model', 'models')

    // let modelTemplate = loadTemplate('js/dynamic/model.js')
    // modelTemplate.locals.vars = inflectMe(schema)
    // modelTemplate.locals.attributes = program.attributes
    // write(path + '/models/'+ schema +'.js', modelTemplate.render())

    // let controllerTemplate = loadTemplate('js/dynamic/controller.js')
    // controllerTemplate.locals.vars = inflectMe(schema)
    // controllerTemplate.locals.attributes = program.attributes
    // write(path + '/controllers/'+ schema +'.js', controllerTemplate.render())

    let postman  = JSON.parse(fs.readFileSync(path + '/' + name + '.postman_collection.json'))
    postman.item = postman.item.concat(postmanGen.appendModel(inflectMe(schema), program.attributes))
    write(path + '/'+inflect.dasherize(name)+'.postman_collection.json', JSON.stringify(postman, null, 2) + '\n')
    
    console.log(program.attributes)
  }
}

/**
 * Create an app name from a directory path, fitting npm naming requirements.
 *
 * @param {String} pathName
 */

function createAppName (pathName) {
  return path.basename(pathName)
    .replace(/[^A-Za-z0-9.()!~*'-]+/g, '-')
    .replace(/^[-_.]+|-+$/g, '')
    .toLowerCase()
}

/**
 * Check if the given directory `path` is empty.
 *
 * @param {String} path
 * @param {Function} fn
 */

function emptyDirectory (path, fn) {
  fs.readdir(path, function (err, files) {
    if (err && err.code !== 'ENOENT') throw err
    fn(!files || !files.length)
  })
}

/**
 * Graceful exit for async STDIO
 */

function exit (code) {
  // flush output for Node.js Windows pipe bug
  // https://github.com/joyent/node/issues/6247 is just one bug example
  // https://github.com/visionmedia/mocha/issues/333 has a good discussion
  function done () {
    if (!(draining--)) _exit(code)
  }

  var draining = 0
  var streams = [process.stdout, process.stderr]

  exit.exited = true

  streams.forEach(function (stream) {
    // submit empty write request and wait for completion
    draining += 1
    stream.write('', done)
  })

  done()
}

/**
 * Determine if launched from cmd.exe
 */

function launchedFromCmd () {
  return process.platform === 'win32' &&
    process.env._ === undefined
}

/**
 * Load template file.
 */

function loadTemplate (name) {
  var contents = fs.readFileSync(path.join(__dirname, '..', 'templates', (name + '.ejs')), 'utf-8')
  var locals = Object.create(null)

  function render () {
    return ejs.render(contents, locals)
  }

  return {
    locals: locals,
    render: render
  }
}

/**
 * Main program.
 */

function main () {
  // Path
  var destinationPath = program.args.shift() || '.'

  // App name
  
  if(program.init && !program.projectname){
    console.error('missing argument --projectname')
    exit(1)
  }

  let appName = null
  if(program.init && program.projectname){
    appName = createAppName(program.projectname)
  }

  if(program.schema){
    let pkg  = JSON.parse(fs.readFileSync(path.join(destinationPath, 'package.json')))
    appName = createAppName(pkg.name)
    
  }

  console.log('appname', appName)
  // var appName = createAppName(path.resolve(destinationPath)) || 'hello-world'

 

  // Generate application
  emptyDirectory(destinationPath, function (empty) {
    if (empty || program.force) {
      createApplication(appName, destinationPath)
    } else {
      confirm('destination is not empty, continue? [y/N] ', function (ok) {
        if (ok) {
          process.stdin.destroy()
          createApplication(appName, destinationPath)
        } else {
          console.error('aborting')
          exit(1)
        }
      })
    }
  })
}

/**
 * Mkdir -p.
 *
 * @param {String} path
 * @param {Function} fn
 */

function mkdir (path, fn) {
  mkdirp(path, MODE_0755, function (err) {
    if (err) throw err
    console.log('   \x1b[36mcreate\x1b[0m : ' + path)
    fn && fn()
  })
}

/**
 * Generate a callback function for commander to warn about renamed option.
 *
 * @param {String} originalName
 * @param {String} newName
 */

function renamedOption (originalName, newName) {
  return function (val) {
    warning(util.format("option `%s' has been renamed to `%s'", originalName, newName))
    return val
  }
}

/**
 * Display a warning similar to how errors are displayed by commander.
 *
 * @param {String} message
 */

function warning (message) {
  console.error()
  message.split('\n').forEach(function (line) {
    console.error('  warning: %s', line)
  })
  console.error()
}

/**
 * echo str > path.
 *
 * @param {String} path
 * @param {String} str
 */

function write (path, str, mode) {
  fs.writeFileSync(path, str, { mode: mode || MODE_0666 })
  console.log('   \x1b[36mcreate\x1b[0m : ' + path)
}
