"use strict"

path = require 'path'

logger = require 'logmimosa'
_ = require 'lodash'

mimosaRequire = null
basePath = ''

registration = (mimosaConfig, register) ->
  mimosaRequire = mimosaConfig.installedModules['mimosa-require']
  if not mimosaRequire
    return logger.error "mimosa-dependency-graph is configured but cannot be used unless mimosa-require is installed and used."
  
  basePath = mimosaConfig.watch.compiledJavascriptDir

  register ['postBuild'], 'beforeOptimize',  _renderDependencyGraph

_renderDependencyGraph = (mimosaConfig, options, next) ->
  dependencyInfo = _getDependencyInfo()
  data = _buildGraphData dependencyInfo
  console.log data
  next()

_getDependencyInfo = ->
  mimosaRequire.dependencyInfo()

_buildGraphData = (dependencyInfo) ->
  nodes = []
  links = []

  for module, dependencies of dependencyInfo
    nodes.push module, dependencies...
    links.push { source: module, target: dep } for dep in dependencies

  data =
    nodes: for node in (nodes = _.uniq(nodes))
      filename: _formatFilename node
    links: for link in links
      source: nodes.indexOf link.source
      target: nodes.indexOf link.target

_formatFilename = (filename) ->
  filename = path.relative basePath, filename
  filename.replace /\\/g, '/'

module.exports =
  registration: registration
