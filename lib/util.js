'use strict';
var copyDir, copyFile, fs, mkdirIfNotExists, path, wrench, writeFile;

fs = require('fs');

path = require('path');

wrench = require('wrench');

mkdirIfNotExists = function(dir) {
  if (!fs.existsSync(dir)) {
    wrench.mkdirSyncRecursive(dir, 0x1ff);
    return true;
  }
};

copyDir = function(fromDir, toDir, filter) {
  var files;
  files = fs.readdirSync(fromDir);
  return files.filter(filter).forEach(function(file) {
    var inFile, outFile;
    inFile = path.resolve(fromDir, file);
    outFile = path.resolve(toDir, file);
    return copyFile(inFile, outFile);
  });
};

copyFile = function(inFile, outFile) {
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

writeFile = function(file, data) {
  return fs.writeFileSync(file, data);
};

exports.mkdirIfNotExists = mkdirIfNotExists;

exports.copyDir = copyDir;

exports.copyFile = copyFile;

exports.writeFile = writeFile;
