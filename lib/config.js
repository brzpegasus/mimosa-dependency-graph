'use strict';
var path;

path = require('path');

exports.defaults = function() {
  return {
    dependencyGraph: {
      assetFolder: ".mimosa/dependency_graph",
      safeAssets: [],
      watch: {
        enabled: false
      }
    }
  };
};

exports.placeholder = function() {
  return "\t\n\n  # dependencyGraph:                              # Configuration for the dependency-graph module\n    # assetFolder: \".mimosa/dependency_graph\"     # Output directory for all generated assets\n    # safeAssets: []                              # If you customized any of the assets (e.g. main.css)\n                                                  # and don't want mimosa to overwrite them, list them\n                                                  # out here (e.g. safeAssets: [\"main.css\"]).\n    # watch:\n      # enabled: false                            # Whether or not to regenerate the data.js file on file changes\n                                                  # during `mimosa watch`.";
};

exports.validate = function(config, validators) {
  var errors, graphConfig;
  errors = [];
  if (validators.ifExistsIsObject(errors, "dependencyGraph config", config.dependencyGraph)) {
    graphConfig = config.dependencyGraph;
    if (validators.ifExistsIsString(errors, "dependencyGraph.assetFolder", graphConfig.assetFolder)) {
      graphConfig.assetFolderFull = path.join(config.root, graphConfig.assetFolder);
    }
    validators.ifExistsIsArrayOfStrings(errors, "dependencyGraph.safeAssets", graphConfig.safeAssets);
    if (validators.ifExistsIsObject(errors, "dependencyGraph.watch", graphConfig.watch)) {
      validators.ifExistsIsBoolean(errors, "dependencyGraph.watch.enabled", graphConfig.watch.enabled);
    }
  }
  return errors;
};
