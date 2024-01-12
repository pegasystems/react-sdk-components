// @ts-nocheck

// NOTE: The @ts-nocheck above tells TypseScript not to check this file for various problems

'use strict';

const fs = require('fs');
const { posix: path } = require('path');

const copyStaticFiles = function (dirPath, arrayOfFiles) {
  const extensionsToCopy = ['.css', '.html'];
  let files = fs.readdirSync(dirPath);

  arrayOfFiles = arrayOfFiles || [];

  files.forEach(function (file) {
    if (fs.statSync(dirPath + '/' + file).isDirectory()) {
      arrayOfFiles = copyStaticFiles(dirPath + '/' + file, arrayOfFiles);
    } else {
      const theExt = path.extname(file);
      // console.log(`dirPath: ${dirPath} file: ${file} extension: ${theExt}`);
      if (extensionsToCopy.includes(theExt)) {
        const toPath = dirPath.replace('/src/', '/lib/');
        // create the toPath if it doesn't exist so we can copy into it
        if (!fs.existsSync(toPath)) {
          console.log(`     Creating ${toPath}`);
          fs.mkdirSync(toPath, { recursive: true });
        }
        // console.log(`\ndirPath: ${dirPath} file: ${file} extension: ${theExt} | toPath: ${toPath}`);
        const fromFullPath = path.join(__dirname, '..', `${dirPath}/${file}`);
        const toFullPath = path.join(__dirname, '..', `${toPath}/${file}`);
        console.log(`\n  copy to lib: ${file}`);
        console.log(`    from: ${fromFullPath}`);
        console.log(`      to: ${toFullPath}`);
        // Copy file fromPath toPath
        try {
          fs.copyFileSync(fromFullPath, toFullPath);
        } catch (err) {
          console.error(`copyStaticFiles: Unable to copy file from src to lib: ${err}`);
        }
      }

      // __dirname is an environment variable that tells you the absolute path of the directory
      //  containing the currently executing file.
      arrayOfFiles.push(path.join(__dirname, dirPath, '/', file));
    }
  });

  return arrayOfFiles;
};

console.log(`Copying static files (ex: .css, .html) to lib...`);
const myFiles = copyStaticFiles('./packages/react-sdk-components/src');
