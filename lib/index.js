"use strict";
var logger, mimosaRequire, registration, _renderDependencyGraph;

logger = require('logmimosa');

mimosaRequire = null;

registration = function(mimosaConfig, register) {
  mimosaRequire = mimosaConfig.installedModules['mimosa-require'];
  if (!mimosaRequire) {
    return logger.error("mimosa-testem-require is configured but cannot be used unless mimosa-require is installed and used.");
  }
  return register(['postBuild'], 'beforeOptimize', _renderDependencyGraph);
};

_renderDependencyGraph = function(mimosaConfig, options, next) {
  return next();
};

module.exports = {
  registration: registration
};
