'use strict'

fs     = require 'fs'
path   = require 'path'

wrench = require 'wrench'
logger = require 'logmimosa'

exports.formatFilename = (filename, basePath) ->
  filename = path.relative basePath, filename
  filename.replace(/\.js$/, '').split(path.sep).join '/'

exports.mkdirIfNotExists = (dir) ->
  unless fs.existsSync dir
    wrench.mkdirSyncRecursive dir, 0o0777
    logger.info "mimosa-dependency-graph created directory [[ #{dir} ]]"

exports.copyFile = (inFile, outFile) ->
  if fs.existsSync outFile
    statInFile = fs.statSync inFile
    statOutFile = fs.statSync outFile
    if statInFile.mtime <= statOutFile.mtime
      return

  fileText = fs.readFileSync inFile, "utf8"
  writeFile outFile, fileText

exports.writeFile = writeFile = (file, data) ->
  fs.writeFileSync file, data
  logger.info "mimosa-dependency-graph created file [[ #{file} ]]"
