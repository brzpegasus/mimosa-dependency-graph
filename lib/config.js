'use strict';
var path;

path = require('path');

exports.defaults = function() {
  return {
    dependencyGraph: {
      assetFolder: ".mimosa/dependency_graph",
      safeAssets: [],
      exclude: [/[_-](spec|test)\.js$/]
    }
  };
};

exports.placeholder = function() {
  return "\t\n\n  # dependencyGraph:                              # Configuration for the dependency-graph module\n    # assetFolder: \".mimosa/dependency_graph\"     # Output directory for all generated assets\n    # safeAssets: []                              # If you customized any of the assets (e.g. main.css)\n                                                  # and don't want mimosa to overwrite them, list them\n                                                  # out here (e.g. safeAssets: [\"main.css\"]).\n    # exclude: [/[_-](spec|test)\\.js$/]           # Array of string or regex paths to exclude from the graph.\n                                                  # Paths can be absolute or relative to watch.javascriptDir.";
};

exports.validate = function(config, validators) {
  var errors, javascriptDir;
  errors = [];
  if (validators.ifExistsIsObject(errors, "dependencyGraph config", config.dependencyGraph)) {
    if (validators.ifExistsIsString(errors, "dependencyGraph.assetFolder", config.dependencyGraph.assetFolder)) {
      config.dependencyGraph.assetFolderFull = path.join(config.root, config.dependencyGraph.assetFolder);
    }
    validators.ifExistsIsArrayOfStrings(errors, "dependencyGraph.safeAssets", config.dependencyGraph.safeAssets);
    javascriptDir = path.join(config.watch.compiledDir, config.watch.javascriptDir);
    validators.ifExistsFileExcludeWithRegexAndString(errors, "dependencyGraph.exclude", config.dependencyGraph, javascriptDir);
  }
  return errors;
};
