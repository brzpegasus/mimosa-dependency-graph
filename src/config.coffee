'use strict'

path = require 'path'

exports.defaults = ->
  dependencyGraph:
    assetFolder: ".mimosa/dependency_graph"
    safeAssets: []
    exclude: [/[_-](spec|test)\.js$/]

exports.placeholder = ->
  """
  \t

    # dependencyGraph:                              # Configuration for the dependency-graph module
      # assetFolder: ".mimosa/dependency_graph"     # Output directory for all generated assets
      # safeAssets: []                              # If you customized any of the assets (e.g. main.css)
                                                    # and don't want mimosa to overwrite them, list them
                                                    # out here (e.g. safeAssets: ["main.css"]).
      # exclude: [/[_-](spec|test)\\.js$/]           # Array of string or regex paths to exclude from the graph.
                                                    # Paths can be absolute or relative to watch.javascriptDir.
  """

exports.validate = (config, validators) ->
  errors = []

  if validators.ifExistsIsObject(errors, "dependencyGraph config", config.dependencyGraph)
    if validators.ifExistsIsString(errors, "dependencyGraph.assetFolder", config.dependencyGraph.assetFolder)
      config.dependencyGraph.assetFolderFull = path.join config.root, config.dependencyGraph.assetFolder
    
    validators.ifExistsIsArrayOfStrings(errors, "dependencyGraph.safeAssets", config.dependencyGraph.safeAssets)

    javascriptDir = path.join config.watch.compiledDir, config.watch.javascriptDir
    validators.ifExistsFileExcludeWithRegexAndString(errors, "dependencyGraph.exclude", config.dependencyGraph, javascriptDir)

  errors
