'use strict'

path = require 'path'

exports.defaults = ->
  dependencyGraph:
    assetFolder: ".mimosa/dependency_graph"
    safeAssets: []
    watch:
      enabled: false

exports.placeholder = ->
  """
  \t

    # dependencyGraph:                              # Configuration for the dependency-graph module
      # assetFolder: ".mimosa/dependency_graph"     # Output directory for all generated assets
      # safeAssets: []                              # If you customized any of the assets (e.g. main.css)
                                                    # and don't want mimosa to overwrite them, list them
                                                    # out here (e.g. safeAssets: ["main.css"]).
      # watch:
        # enabled: false                            # Whether or not to regenerate the data.js file on file changes
                                                    # during `mimosa watch`.
  """

exports.validate = (config, validators) ->
  errors = []

  if validators.ifExistsIsObject(errors, "dependencyGraph config", config.dependencyGraph)

    graphConfig = config.dependencyGraph

    if validators.ifExistsIsString(errors, "dependencyGraph.assetFolder", graphConfig.assetFolder)
      graphConfig.assetFolderFull = path.join config.root, graphConfig.assetFolder
    
    validators.ifExistsIsArrayOfStrings(errors, "dependencyGraph.safeAssets", graphConfig.safeAssets)

    if validators.ifExistsIsObject(errors, "dependencyGraph.watch", graphConfig.watch)
      validators.ifExistsIsBoolean(errors, "dependencyGraph.watch.enabled", graphConfig.watch.enabled)

  errors
