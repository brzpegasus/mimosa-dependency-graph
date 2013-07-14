"use strict"

logger = require 'logmimosa'

mimosaRequire = null

registration = (mimosaConfig, register) ->

  mimosaRequire = mimosaConfig.installedModules['mimosa-require']
  if not mimosaRequire
    return logger.error "mimosa-testem-require is configured but cannot be used unless mimosa-require is installed and used."

  register ['postBuild'], 'beforeOptimize',  _renderDependencyGraph

_renderDependencyGraph = (mimosaConfig, options, next) ->
  # TODO: Get dependency tree from mimosaRequire (mimosaRequire.depsRegistry() ?)
  next()

module.exports =
  registration: registration
