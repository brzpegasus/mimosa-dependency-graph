"use strict";
var basePath, logger, mimosaRequire, path, registration, _, _buildGraphData, _formatFilename, _getDependencyInfo, _renderDependencyGraph,
  __slice = [].slice;

path = require('path');

logger = require('logmimosa');

_ = require('lodash');

mimosaRequire = null;

basePath = '';

registration = function(mimosaConfig, register) {
  mimosaRequire = mimosaConfig.installedModules['mimosa-require'];
  if (!mimosaRequire) {
    return logger.error("mimosa-dependency-graph is configured but cannot be used unless mimosa-require is installed and used.");
  }
  basePath = mimosaConfig.watch.compiledJavascriptDir;
  return register(['postBuild'], 'beforeOptimize', _renderDependencyGraph);
};

_renderDependencyGraph = function(mimosaConfig, options, next) {
  var data, dependencyInfo;
  dependencyInfo = _getDependencyInfo();
  data = _buildGraphData(dependencyInfo);
  console.log(data);
  return next();
};

_getDependencyInfo = function() {
  return mimosaRequire.dependencyInfo();
};

_buildGraphData = function(dependencyInfo) {
  var data, dep, dependencies, link, links, module, node, nodes, _i, _len;
  nodes = [];
  links = [];
  for (module in dependencyInfo) {
    dependencies = dependencyInfo[module];
    nodes.push.apply(nodes, [module].concat(__slice.call(dependencies)));
    for (_i = 0, _len = dependencies.length; _i < _len; _i++) {
      dep = dependencies[_i];
      links.push({
        source: module,
        target: dep
      });
    }
  }
  return data = {
    nodes: (function() {
      var _j, _len1, _ref, _results;
      _ref = (nodes = _.uniq(nodes));
      _results = [];
      for (_j = 0, _len1 = _ref.length; _j < _len1; _j++) {
        node = _ref[_j];
        _results.push({
          filename: _formatFilename(node)
        });
      }
      return _results;
    })(),
    links: (function() {
      var _j, _len1, _results;
      _results = [];
      for (_j = 0, _len1 = links.length; _j < _len1; _j++) {
        link = links[_j];
        _results.push({
          source: nodes.indexOf(link.source),
          target: nodes.indexOf(link.target)
        });
      }
      return _results;
    })()
  };
};

_formatFilename = function(filename) {
  filename = path.relative(basePath, filename);
  return filename.replace(/\\/g, '/');
};

module.exports = {
  registration: registration
};
