const { execFileSync } = require('child_process');
const path = require('path');
const fs = require('fs');
const readline = require('readline');

try {
  const componentsProjectRootPath = process.cwd();
  const componentsPackagePath = path.join(componentsProjectRootPath, 'packages', 'react-sdk-components');

  const readLineInterface = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  readLineInterface.question('Please enter the absolute path of react-sdk project: ', sdkProjectPathInput => {
    readLineInterface.close();

    const sdkProjectRootPath = path.resolve(sdkProjectPathInput.trim());

    if (!fs.existsSync(sdkProjectRootPath)) {
      throw new Error(`Path does not exist: ${sdkProjectRootPath}`);
    }

    if (!fs.existsSync(path.join(sdkProjectRootPath, 'package.json'))) {
      throw new Error(`No package.json found at: ${sdkProjectRootPath}`);
    }

    const existingTgzInComponents = fs
      .readdirSync(componentsPackagePath)
      .find(file => file.endsWith('.tgz') && file.indexOf('pega-react-sdk-components') > -1);

    if (existingTgzInComponents) {
      console.log(`---- Removing existing tgz: ${existingTgzInComponents} ----`);
      fs.unlinkSync(path.join(componentsPackagePath, existingTgzInComponents));
    }

    console.log(`---- Building react-sdk-components at: ${componentsProjectRootPath} ----`);
    execFileSync('npm', ['run', 'build-sdk'], { cwd: componentsProjectRootPath, stdio: 'inherit' });

    console.log(`---- Packing npm package in: ${componentsPackagePath} ----`);
    execFileSync('npm', ['pack'], { cwd: componentsPackagePath, stdio: 'inherit' });

    const componentsTgzFile = fs
      .readdirSync(componentsPackagePath)
      .find(file => file.endsWith('.tgz') && file.indexOf('pega-react-sdk-components') > -1);

    if (!componentsTgzFile) {
      throw new Error('No react-sdk-components .tgz file found after packing.');
    }

    const componentsTgzPath = path.join(componentsPackagePath, componentsTgzFile);
    const componentTargetTgzPath = path.join(sdkProjectRootPath, componentsTgzFile);

    const existingTgzInSDK = fs
      .readdirSync(sdkProjectRootPath)
      .find(file => file.endsWith('.tgz') && file.indexOf('pega-react-sdk-components') > -1);

    if (existingTgzInSDK) {
      console.log(`---- Removing old package: ${existingTgzInSDK} ----`);
      fs.unlinkSync(path.join(sdkProjectRootPath, existingTgzInSDK));
    }

    console.log(`---- Copying ${componentsTgzFile} to react-sdk folder: ${sdkProjectRootPath} ----`);
    fs.copyFileSync(componentsTgzPath, componentTargetTgzPath);

    console.log(`---- Installing ${componentsTgzFile} in react-sdk ----`);
    execFileSync('npm', ['install', `./${componentsTgzFile}`], { cwd: sdkProjectRootPath, stdio: 'inherit' });

    console.log("Done!!! 'react-sdk' now uses local build of react-sdk-components.");
  });
} catch (error) {
  console.error('Error:', error.message);
  process.exit(1);
}
