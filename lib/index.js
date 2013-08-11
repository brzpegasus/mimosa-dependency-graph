'use strict';
var config, dataFile, logger, mimosaRequire, path, registration, util, _findModuleDependencies, _generateGraphData, _writeStaticAssets;

path = require('path');

logger = require('logmimosa');

config = require('./config');

util = require('./util');

mimosaRequire = null;

dataFile = null;

registration = function(mimosaConfig, register) {
  var ext;
  mimosaRequire = mimosaConfig.installedModules['mimosa-require'];
  if (!mimosaRequire) {
    return logger.error("mimosa-dependency-graph is configured but cannot be used unless mimosa-require is installed and used.");
  }
  dataFile = path.join(mimosaConfig.dependencyGraph.assetFolderFull, 'data.js');
  ext = mimosaConfig.extensions;
  register(['postBuild'], 'beforeOptimize', _writeStaticAssets);
  register(['postBuild'], 'beforeOptimize', _generateGraphData);
  if (mimosaConfig.dependencyGraph.watch.enabled) {
    return register(['add', 'update', 'remove'], 'afterWrite', _generateGraphData, ext.javascript);
  }
};

_generateGraphData = function(mimosaConfig, options, next) {
  var basePath, data, dependencyInfo, formatData, formatFilename, main, mainData, mainFilename, _i, _len, _ref;
  basePath = mimosaConfig.watch.compiledJavascriptDir;
  dependencyInfo = mimosaRequire.dependencyInfo(mimosaConfig);
  data = {};
  formatFilename = function(filename, basePath) {
    filename = path.relative(basePath, filename);
    return filename.replace(/\.js$/, '').split(path.sep).join('/');
  };
  formatData = function(d, main) {
    var link, node;
    return {
      nodes: (function() {
        var _i, _len, _ref, _results;
        _ref = d.nodes;
        _results = [];
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          node = _ref[_i];
          _results.push({
            filename: formatFilename(node, basePath)
          });
        }
        return _results;
      })(),
      links: (function() {
        var _i, _len, _ref, _results;
        _ref = d.links;
        _results = [];
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          link = _ref[_i];
          _results.push({
            source: d.nodes.indexOf(link.source),
            target: d.nodes.indexOf(link.target)
          });
        }
        return _results;
      })()
    };
  };
  _ref = dependencyInfo.mainFiles;
  for (_i = 0, _len = _ref.length; _i < _len; _i++) {
    main = _ref[_i];
    mainData = {
      nodes: [],
      links: []
    };
    _findModuleDependencies(dependencyInfo.registry, main, mainData);
    if (mainData.nodes.length > 0) {
      mainFilename = formatFilename(main, basePath);
      data[mainFilename] = formatData(mainData, main);
    }
  }
  util.writeFile(dataFile, "window.MIMOSA_DEPENDENCY_DATA = " + (JSON.stringify(data)));
  return next();
};

_writeStaticAssets = function(mimosaConfig, options, next) {
  var fromDir, toDir;
  config = mimosaConfig.dependencyGraph;
  util.mkdirIfNotExists(config.assetFolderFull);
  fromDir = path.join(__dirname, '..', 'assets');
  toDir = config.assetFolderFull;
  util.copyDir(fromDir, toDir, function(file) {
    return config.safeAssets.indexOf(file) === -1;
  });
  return next();
};

_findModuleDependencies = function(registry, module, data) {
  var dep, _i, _len, _ref, _results;
  if (data.nodes.indexOf(module) === -1) {
    data.nodes.push(module);
    _ref = registry[module] || [];
    _results = [];
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      dep = _ref[_i];
      data.links.push({
        source: module,
        target: dep
      });
      _results.push(_findModuleDependencies(registry, dep, data));
    }
    return _results;
  }
};

module.exports = {
  registration: registration,
  defaults: config.defaults,
  placeholder: config.placeholder,
  validate: config.validate
};
