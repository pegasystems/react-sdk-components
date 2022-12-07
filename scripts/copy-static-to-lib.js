// @ts-nocheck

// NOTE: The @ts-nocheck above tells TypseScript not to check this file for various problems

'use strict';

const fs = require('fs');
const { posix: path } = require('path');

const copyStaticFiles = function(dirPath, arrayOfFiles) {
  const extensionsToCopy = [ '.css', '.html' ];
  let files = fs.readdirSync(dirPath)

  arrayOfFiles = arrayOfFiles || []

  files.forEach(function(file) {
    if (fs.statSync(dirPath + "/" + file).isDirectory()) {
      arrayOfFiles = copyStaticFiles(dirPath + "/" + file, arrayOfFiles)
    } else {
      const theExt = path.extname(file);
      // console.log(`dirPath: ${dirPath} file: ${file} extension: ${theExt}`);
      if (extensionsToCopy.includes(theExt)) {
        const fromPath = path.join(__dirname, '..', `${dirPath}/${file}` );
        console.log(`  copy to lib: ${file}`);
        // console.log(`    from: ${fromPath}`);
        const toPath = fromPath.replace('/src/', '/lib/');
        // console.log(`      to: ${toPath}`);
        // Copy file fromPath toPath
        try {
          fs.copyFileSync(fromPath, toPath);
        }
        catch(err) {
          console.error(`copyStaticFiles: Unable to copy file from src to lib: ${err}`);
        }
      }

      // __dirname is an environment variable that tells you the absolute path of the directory
      //  containing the currently executing file.
      arrayOfFiles.push(path.join(__dirname, dirPath, "/", file))
    }
  })

  return arrayOfFiles
}

console.log(`Copying static files (ex: .css, .html) to lib...`);
const myFiles = copyStaticFiles("./packages/react-sdk-components/src");
