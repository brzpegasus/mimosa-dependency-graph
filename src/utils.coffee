'use strict'

fs     = require 'fs'
path   = require 'path'
wrench = require 'wrench'
logger = require 'logmimosa'

exports.formatFilename = (filename, basePath) ->
  filename = path.relative basePath, filename
  filename.split(path.sep).join('/')

exports.mkdirIfNotExists = (dir) ->
  unless fs.existsSync dir
    wrench.mkdirSyncRecursive dir, 0o0777
    logger.info "Created directory [[ #{dir} ]]"

exports.copyFile = (inFile, outFile) ->
  if fs.existsSync outFile
    statInFile = fs.statSync inFile
    statOutFile = fs.statSync outFile
    if statInFile.mtime > statOutFile.mtime
      _copy inFile, outFile
  else
    _copy inFile, outFile

_copy = (inFile, outFile) ->
  fileText = fs.readFileSync inFile, "utf8"
  fs.writeFileSync outFile, fileText
  logger.info "Created file [[ #{outFile} ]]"
