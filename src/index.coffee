'use strict'

path   = require 'path'

logger = require 'logmimosa'

config = require './config'
util  = require './util'

mimosaRequire = null
dataFile = null

registration = (mimosaConfig, register) ->
  mimosaRequire = mimosaConfig.installedModules['mimosa-require']
  if not mimosaRequire
    return logger.error "mimosa-dependency-graph is configured but cannot be used unless mimosa-require is installed and used."
  
  dataFile = path.join mimosaConfig.dependencyGraph.assetFolderFull, 'data.js'

  ext = mimosaConfig.extensions

  register ['postBuild'], 'beforeOptimize',  _writeStaticAssets
  register ['postBuild'], 'beforeOptimize',  _generateGraphData

  register ['add','update', 'remove'], 'afterWrite', _generateGraphData, ext.javascript

# Generate a data object with node and link information for each main file.
#
# In this case, `nodes` is just an array of module names, while `links`
# is an array of objects that specify the dependency between a module
# (source) and another (target).
_generateGraphData = (mimosaConfig, options, next) ->
  basePath = mimosaConfig.watch.compiledJavascriptDir
  dependencyInfo = mimosaRequire.dependencyInfo mimosaConfig

  data = {}

  formatFilename = (filename, basePath) ->
    filename = path.relative basePath, filename
    filename.replace(/\.js$/, '').split(path.sep).join '/'

  formatData = (d, main) ->
    nodes: for node in d.nodes
      filename: formatFilename node, basePath
    links: for link in d.links
      source: d.nodes.indexOf link.source
      target: d.nodes.indexOf link.target

  for main in dependencyInfo.mainFiles
    mainData =
      nodes: []
      links: []

    _findModuleDependencies dependencyInfo.registry, main, mainData

    if mainData.nodes.length > 0
      mainFilename = formatFilename(main, basePath)
      data[mainFilename] = formatData mainData, main

  # Output the dependency graph data to a file in the assets folder
  util.writeFile dataFile, "window.MIMOSA_DEPENDENCY_DATA = #{JSON.stringify(data)}"

  next()

# Write all necessary html, js, css files to the assets folder
_writeStaticAssets = (mimosaConfig, options, next) ->
  config = mimosaConfig.dependencyGraph

  util.mkdirIfNotExists config.assetFolderFull

  fromDir = path.join __dirname, '..', 'assets'
  toDir = config.assetFolderFull
  util.copyDir fromDir, toDir, (file) ->
    config.safeAssets.indexOf(file) is -1

  next()

_findModuleDependencies = (registry, module, data) ->
  if data.nodes.indexOf(module) is -1
    data.nodes.push module

    for dep in registry[module] or []
      data.links.push { source: module, target: dep }
      _findModuleDependencies registry, dep, data

_skipModule = (mimosaConfig, module) ->
  excludeRegexes = mimosaConfig.dependencyGraph.excludeRegex
  excludeStrings = mimosaConfig.dependencyGraph.exclude
  (excludeRegexes? and module.match excludeRegexes) or (excludeStrings.indexOf(module) > -1)

module.exports =
  registration: registration
  defaults:     config.defaults
  placeholder:  config.placeholder
  validate:     config.validate
