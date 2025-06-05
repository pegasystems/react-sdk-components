'use strict';

const fs = require('fs');

/**
 * Function which copies file from source directory to destination directory
 * @param {string} sourcePath
 * @param {string} destinationPath
 * @param {string} fileName
 */
function copyFile(sourcePath, destinationPath, fileName) {
  // Copy SECURITY.md file
  const securitySrcDir = `${sourcePath}/${fileName}`;
  const securityDestDir = `${destinationPath}/${fileName}`;

  fs.copyFileSync(securitySrcDir, securityDestDir);
}

module.exports = copyFile;
