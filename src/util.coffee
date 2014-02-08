'use strict'

fs     = require 'fs'
path   = require 'path'

wrench = require 'wrench'

mkdirIfNotExists = (dir) ->
  unless fs.existsSync dir
    wrench.mkdirSyncRecursive dir, 0o0777
    return true

copyDir = (fromDir, toDir, filter) ->
  files = fs.readdirSync fromDir

  files.filter(filter).forEach (file) ->
    inFile = path.resolve fromDir, file
    outFile = path.resolve toDir, file
    copyFile inFile, outFile

copyFile = (inFile, outFile) ->
  if fs.existsSync outFile
    statInFile = fs.statSync inFile
    statOutFile = fs.statSync outFile
    if statInFile.mtime <= statOutFile.mtime
      return

  fileText = fs.readFileSync inFile, "utf8"
  writeFile outFile, fileText

writeFile = (file, data) ->
  fs.writeFileSync file, data

exports.mkdirIfNotExists = mkdirIfNotExists
exports.copyDir = copyDir
exports.copyFile = copyFile
exports.writeFile = writeFile
