'use strict';
var fs, logger, path, wrench, _copy;

fs = require('fs');

path = require('path');

wrench = require('wrench');

logger = require('logmimosa');

exports.formatFilename = function(filename, basePath) {
  filename = path.relative(basePath, filename);
  return filename.split(path.sep).join('/');
};

exports.mkdirIfNotExists = function(dir) {
  if (!fs.existsSync(dir)) {
    wrench.mkdirSyncRecursive(dir, 0x1ff);
    return logger.info("Created directory [[ " + dir + " ]]");
  }
};

exports.copyFile = function(inFile, outFile) {
  var statInFile, statOutFile;
  if (fs.existsSync(outFile)) {
    statInFile = fs.statSync(inFile);
    statOutFile = fs.statSync(outFile);
    if (statInFile.mtime > statOutFile.mtime) {
      return _copy(inFile, outFile);
    }
  } else {
    return _copy(inFile, outFile);
  }
};

_copy = function(inFile, outFile) {
  var fileText;
  fileText = fs.readFileSync(inFile, "utf8");
  fs.writeFileSync(outFile, fileText);
  return logger.info("Created file [[ " + outFile + " ]]");
};
