'use strict';
var fs, logger, path, wrench, writeFile;

fs = require('fs');

path = require('path');

wrench = require('wrench');

logger = require('logmimosa');

exports.formatFilename = function(filename, basePath) {
  filename = path.relative(basePath, filename);
  return filename.replace(/\.js$/, '').split(path.sep).join('/');
};

exports.mkdirIfNotExists = function(dir) {
  if (!fs.existsSync(dir)) {
    wrench.mkdirSyncRecursive(dir, 0x1ff);
    return logger.info("mimosa-dependency-graph created directory [[ " + dir + " ]]");
  }
};

exports.copyFile = function(inFile, outFile) {
  var fileText, statInFile, statOutFile;
  if (fs.existsSync(outFile)) {
    statInFile = fs.statSync(inFile);
    statOutFile = fs.statSync(outFile);
    if (statInFile.mtime <= statOutFile.mtime) {
      return;
    }
  }
  fileText = fs.readFileSync(inFile, "utf8");
  return writeFile(outFile, fileText);
};

exports.writeFile = writeFile = function(file, data) {
  fs.writeFileSync(file, data);
  return logger.info("mimosa-dependency-graph created file [[ " + file + " ]]");
};
