'use strict';
var assets, basePath, config, dataFile, logger, mimosaRequire, path, registration, util, _, _generateGraphData, _writeStaticAssets,
  __slice = [].slice;

path = require('path');

_ = require('lodash');

logger = require('logmimosa');

config = require('./config');

util = require('./util');

mimosaRequire = null;

basePath = null;

dataFile = null;

assets = ["d3.v3.min.js", "dependency_graph.js", "main.js", "main.css", "index.html"];

registration = function(mimosaConfig, register) {
  var ext;
  mimosaRequire = mimosaConfig.installedModules['mimosa-require'];
  if (!mimosaRequire) {
    return logger.error("mimosa-dependency-graph is configured but cannot be used unless mimosa-require is installed and used.");
  }
  basePath = mimosaConfig.watch.compiledJavascriptDir;
  dataFile = path.join(mimosaConfig.dependencyGraph.assetFolderFull, 'data.js');
  ext = mimosaConfig.extensions;
  register(['postBuild'], 'beforeOptimize', _writeStaticAssets);
  register(['postBuild'], 'beforeOptimize', _generateGraphData);
  return register(['add', 'update', 'remove'], 'afterWrite', _generateGraphData, ext.javascript);
};

_generateGraphData = function(mimosaConfig, options, next) {
  var data, dep, dependencies, dependencyInfo, link, links, module, node, nodes, _i, _len;
  dependencyInfo = mimosaRequire.dependencyInfo();
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
  data = {
    nodes: (function() {
      var _j, _len1, _ref, _results;
      _ref = (nodes = _.uniq(nodes));
      _results = [];
      for (_j = 0, _len1 = _ref.length; _j < _len1; _j++) {
        node = _ref[_j];
        _results.push({
          filename: util.formatFilename(node, basePath)
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
  util.writeFile(dataFile, "window.MIMOSA_DEPENDENCY_DATA = " + (JSON.stringify(data, null, 2)));
  return next();
};

_writeStaticAssets = function(mimosaConfig, options, next) {
  config = mimosaConfig.dependencyGraph;
  util.mkdirIfNotExists(config.assetFolderFull);
  assets.filter(function(asset) {
    return config.safeAssets.indexOf(asset === -1);
  }).forEach(function(asset) {
    var inFile, outFile;
    inFile = path.join(__dirname, '..', 'assets', asset);
    outFile = path.join(config.assetFolderFull, asset);
    return util.copyFile(inFile, outFile);
  });
  return next();
};

module.exports = {
  registration: registration,
  defaults: config.defaults,
  placeholder: config.placeholder,
  validate: config.validate
};
