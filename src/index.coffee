'use strict'

path   = require 'path'

_      = require 'lodash'
logger = require 'logmimosa'

config = require './config'
util  = require './util'

mimosaRequire = null
basePath = null
dataFile = null

assets = [
  "d3.min.js"
  "d3.chart.min.js"
  "dependency_graph.js"
  "main.js"
  "main.css"
  "index.html"
]

registration = (mimosaConfig, register) ->
  mimosaRequire = mimosaConfig.installedModules['mimosa-require']
  if not mimosaRequire
    return logger.error "mimosa-dependency-graph is configured but cannot be used unless mimosa-require is installed and used."
  
  basePath = mimosaConfig.watch.compiledJavascriptDir
  dataFile = path.join mimosaConfig.dependencyGraph.assetFolderFull, 'data.js'

  ext = mimosaConfig.extensions

  register ['postBuild'], 'beforeOptimize',  _writeStaticAssets
  register ['postBuild'], 'beforeOptimize',  _generateGraphData

  register ['add','update', 'remove'], 'afterWrite', _generateGraphData, ext.javascript

# Generate an object containing nodes and links data that can be used
# to construct a d3.js force-directed graph.
#
# In this case, `nodes` is just an array of module names, while `links`
# is an array of objects that specify the dependency between a module
# (source) and another (target).
_generateGraphData = (mimosaConfig, options, next) ->
  dependencyInfo = _getDependencyInfo mimosaConfig
  nodes = []
  links = []

  for module, dependencies of dependencyInfo
    nodes.push module, dependencies...
    links.push { source: module, target: dep } for dep in dependencies

  data =
    nodes: for node in (nodes = _.uniq(nodes))
      filename: util.formatFilename node, basePath
    links: for link in links
      source: nodes.indexOf link.source
      target: nodes.indexOf link.target

  # Output the dependency graph data to a file in the assets folder
  util.writeFile dataFile, "window.MIMOSA_DEPENDENCY_DATA = #{JSON.stringify(data, null, 2)}"

  next()

# Write all necessary html, js, css files to the assets folder
_writeStaticAssets = (mimosaConfig, options, next) ->
  config = mimosaConfig.dependencyGraph

  util.mkdirIfNotExists config.assetFolderFull

  assets.filter (asset) ->
    config.safeAssets.indexOf asset is -1
  .forEach (asset) ->
    inFile = path.join __dirname, '..', 'assets', asset
    outFile = path.join config.assetFolderFull, asset
    util.copyFile inFile, outFile

  next()

_getDependencyInfo = (mimosaConfig) ->
  config = mimosaConfig.dependencyGraph
  dependencyInfo = {}

  for module, dependencies of mimosaRequire.dependencyInfo()
    unless (config.excludeRegex? and module.match config.excludeRegex) or (config.exclude.indexOf(module) > -1)
      dependencyInfo[module] = dependencies

  dependencyInfo

module.exports =
  registration: registration
  defaults:     config.defaults
  placeholder:  config.placeholder
  validate:     config.validate
