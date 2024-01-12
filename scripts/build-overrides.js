// @ts-nocheck

// NOTE: The @ts-nocheck above tells TypeScript not to check this file for various problems

'use strict';

const fs = require('fs');
const path = require('path');
const replaceInFile = require('replace-in-file');
const overrideConstants = require('./override-constants');

// overridesPkgDir is path where the files in the package are
const overridesPkgDir = 'packages/react-sdk-overrides/lib';

// overrideLibDir is the path to where we've previously copied
//  the files in packages/react-sdk-overrides/lib
const overridesLibDir = path.join(__dirname, '..', overridesPkgDir);

// NOTE: Does not need to end with 'bridge/' because the fragment we're
//  inserting this into already starts with bridge/
const relativePathReplacementPrefix = '@pega/react-sdk-components/lib/';

// NOTE: Needs to end with 'components/' because the fragment we're
//  inserting this into just starts with the component name without 'components/'
const relativePathReplacementComponents = '@pega/react-sdk-components/lib/components/';

// keep track of how many path updates we actually make
let iPathReplacements = 0;
// keep track of how many paths may still need to be replaced
let iMayNeedPathReplacement = 0;

/**
 * getAllFilesInDir
 *
 * @param {*} dirPath path to start recursive descent
 * @param {*} arrFiles array of files so far. Start with empty array
 * @returns list of all files (recursive descent) in the given directory
 */
const getAllFilesInDir = function (dirPath, arrFiles) {
  const files = fs.readdirSync(dirPath);
  arrFiles = arrFiles || [];

  files.forEach(function (file) {
    if (fs.statSync(dirPath + '/' + file).isDirectory()) {
      // console.log(`about to iterate over: ${file}`);
      arrFiles = getAllFilesInDir(dirPath + '/' + file, arrFiles);
    } else {
      // console.log(` --> about to push: ${file}`);
      arrFiles.push(path.join(dirPath, '/', file));
    }
  });

  return arrFiles;
};

/**
 * hasRelativeDir
 *  returns true iff inMatch contains a relative reference to an entry in arrDirNames
 *  ex: ../bridge, ../infra, ../forms, ../components_map, etc. depending on the arrDirNames passed in
 *
 * @param {*} inMatch string we're searching in
 * @param {*} splitSep the split separator we're using
 * @param {*} arrDirNames an array of directory names that we're looking for after a splitSep
 * @returns {boolean} true if <splitSep><one of appDirNames entries> exists, otherwise false
 */
const hasRelativeDir = function (inMatch, splitSep, arrDirNames) {
  let bFound = false;

  for (let dirName of arrDirNames) {
    const strTarget = `${splitSep}${dirName}`;
    if (inMatch.includes(strTarget)) {
      bFound = true;
      return bFound;
    }
  }
  return bFound;
};

/**
 * hasRelativeComponent
 *  return true iff the relative reference is directly to a component
 *  ex: ../TextInput, ../Operator, etc.
 *
 * @param {*} inMatch string we're searching in
 * @param {*} splitSep the split separator we're using
 * @param {*} compLocMap JSON object that maps componentName to the component directory its in
 *              Used to test whether a string is a component and, if so where to find it
 * @returns {boolean} true if <splitSep><one of appDirNames entries> exists, otherwise false
 */
const hasRelativeComponent = function (inMatch, splitSep, compLocMap) {
  let bFound = false;

  const matchFragments = inMatch.split(splitSep);

  // There are 2 cases:
  //  a: when there is a single ../ in inMatch, there will be 2 fragments.
  //      [0] the import prelude
  //      [1] the rest of the import line which MAY start with a component name (and that's what we want to check)
  //  b: when there is more than one occurrence of ../, there will be more than 2 fragments
  //      [0] the import prelude
  //      [n] empty entries where each represents a place where ../../ was encountered
  //      [last] the rest of the import line which MAY start with a component name (and that's what we want to check)

  // we can check whether the relative path is to a component name by looking at the last fragment and extracting
  //  ONLY the first part (where there may be a ';' (end of line) or '/' (a longer path))
  //  If that first part is a component name, we can rewrite the path using the first fragment and the last fragment
  //    and putting the correct component directory in the rewritten path

  // const importPrelude = matchFragments[0];
  const relativeImportDetail = matchFragments[matchFragments.length - 1];

  // console.log(`hasRelativeComponent: ${importPrelude} <more path info> ${relativeImportDetail}`);

  const matchDetails = relativeImportDetail.split(/\W/); // split by non alphanumerics (\W regex)
  const possibleComponent = matchDetails[0];
  // console.log(`  possibleComponent: ${possibleComponent}`);

  if (compLocMap[possibleComponent]) {
    // console.log(`  IS A COMPONENT`);
    bFound = true;
  }
  return bFound;
};

const startsWithOneOf = function (inStr, arrDirNames) {
  let bFound = false;

  for (let dirName of arrDirNames) {
    if (inStr.startsWith(dirName)) {
      bFound = true;
      return bFound;
    }
  }
  return bFound;
};

/**
 * processRelativeRef
 *
 * @param {*} inMatch string we're searching in
 * @param {*} splitSep the split separator we're using
 * @param {*} arrTerms an array of terms that we're looking for after a splitSep
 * @returns {string} string that should replace inMatch (with relative path replacements)
 */
const processRelativeRef = function (inMatch, splitSep, arrTerms) {
  let retString = '';

  // console.log(`    in processRelativeRef`);

  //  If inMatch does contain '../', then split by '../' and proceed
  //    Clear retString
  //    Copy fragment to retString until encounter an empty fragment (where a '../' was)
  //      If next fragment empty, proceed
  //      If next fragment not empty and begins with one of the entries in arrTerms,
  //        insert '@pega/react-sdk-components/lib/, any other relevant fragments, and append remaining fragment(s)
  //
  //  Example: import NavBar from '../../infra/NavBar';
  //  becomes:  import NavBar from '@pega/react-sdk-components/lib/components/infra/NavBar';

  if (!hasRelativeDir(inMatch, splitSep, arrTerms)) {
    throw `!!!! -> Can't process relative reference when there isn't one! ${inMatch}`;
  }

  const matchFragments = inMatch.split(splitSep);
  // console.log( `    --> matchFragments: ${JSON.stringify(matchFragments)}`);

  // Clear out retString. We're building it up from the matchFragments
  retString = '';

  matchFragments.forEach((frag, index, origArray) => {
    // initial fragment should be non-empty
    if (frag.length !== 0 && index == 0) {
      retString = `${retString}${frag}`;
    } else if (frag.length !== 0 && startsWithOneOf(frag, origArray)) {
      // Working on fragments that are NOT the first fragment - so should be at/beyond first '../'
      //  This algorithm skips any empty fragments (which would be where '../' are)
      // if this fragment not empty and starts with one of our dir names,
      //  concatenate retString depending on which arrTerms we have

      switch (arrTerms) {
        case overrideConstants.SDK_BRIDGE_DIR:
          // if this fragment not empty and starts with one of our dir names,
          //  concatenate retString and frag (the frag will already start with 'bridge')
          retString = `${retString}${relativePathReplacementPrefix}${frag}`;
          break;

        case overrideConstants.SDK_COMP_SUBDIRS:
          // if this fragment not empty and starts with one of our dir names,
          //  Add in the relativePathReplacementComponents and this fragment
          retString = `${retString}${relativePathReplacementComponents}${frag}`;
          break;

        case overrideConstants.SDK_TOP_LEVEL_CONTENT:
          //  concatenate retString and frag (the frag will already start
          //     with the top-level content - ex: components_map)
          retString = `${retString}${relativePathReplacementPrefix}${frag}`;
          break;

        case overrideConstants.SDK_TYPES_DIR:
          // if this fragment not empty and starts with one of our dir names,
          //  concatenate retString and frag (the frag will already start with 'types')
          retString = `${retString}${relativePathReplacementPrefix}${frag}`;
          break;

        case overrideConstants.SDK_HOOKS_DIR:
          // if this fragment not empty and starts with one of our dir names,
          //  concatenate retString and frag (the frag will already start with 'hooks')
          retString = `${retString}${relativePathReplacementPrefix}${frag}`;
          break;

        default:
          console.error(`processRelativeRef failed: inMatch: ${inMatch}`);
          break;
      }
    }
  });

  // console.log(`retString: ${retString}`);
  // return that string that the import line should be replaced with
  return retString;
};

/**
 * processRelativeComponentRef
 *
 * @param {*} inMatch string we're searching in
 * @param {*} splitSep the split separator we're using
 * @param {*} compLocMap JSON object that maps componentName to the component directory its in
 *              Used to test whether a string is a component and, if so where to find it
 * @returns {string} string that should replace inMatch (with relative path replacements)
 */
const processRelativeComponentRef = function (inMatch, splitSep, compLocMap) {
  let retString = '';

  // console.log(`    in processRelativeComponentRef`);

  if (!hasRelativeComponent(inMatch, splitSep, compLocMap)) {
    throw `!!!! -> Can't process relative component when there isn't one! ${inMatch}`;
  }

  // There are 2 cases:
  //  a: when there is a single ../ in inMatch, there will be 2 fragments.
  //      [0] the import prelude
  //      [1] the rest of the import line which MAY start with a component name (and that's what we want to check)
  //  b: when there is more than one occurrence of ../, there will be more than 2 fragments
  //      [0] the import prelude
  //      [n] empty entries where each represents a place where ../../ was encountered
  //      [last] the rest of the import line which MAY start with a component name (and that's what we want to check)

  // we can check whether the relative path is to a component name by looking at the last fragment and extracting
  //  ONLY the first part (where there may be a ';' (end of line) or '/' (a longer path))
  //  If that first part is a component name, we can rewrite the path using the first fragment and the last fragment
  //    and putting the correct component directory in the rewritten path

  const matchFragments = inMatch.split(splitSep);

  const importPrelude = matchFragments[0];
  const relativeImportDetail = matchFragments[matchFragments.length - 1];

  // console.log(`processRelativeComponentRef: ${importPrelude} <more path info> ${relativeImportDetail}`);

  const matchDetails = relativeImportDetail.split(/\W/); // split by non alphanumerics (\W regex)
  const possibleComponent = matchDetails[0];
  // console.log(`  possibleComponent: ${possibleComponent}`);

  if (overrideConstants.SDK_COMP_LOCATION_MAP[possibleComponent]) {
    const theCompDir = overrideConstants.SDK_COMP_LOCATION_MAP[possibleComponent];
    retString = `${importPrelude}${relativePathReplacementComponents}${theCompDir}/${relativeImportDetail}`;
  }

  // console.log(`retString: ${retString}`);
  // return that string that the import line should be replaced with
  return retString;
};

/**
 * processImportLine
 *
 * @param {*} inMatch - should be a line starting with import
 * @returns string that inMatch should be replaced with (possible import path updates)
 */
const processImportLine = function (inMatch) {
  // console.log(`  in processImportLine: |${inMatch}|`);

  let retString = inMatch; // default to return incoming matched string
  const splitWith = '../';

  // pseudocode:
  //  1. If inMatch doesn't contain '../', then return inMatch (nothing to process)
  //  2. If inMatch does contain '../' followed by sdkBridgeDir then process as relative bridge reference
  //  3. If inMatch does contain '../' followed by sdkHooksDir then process as relative bridge reference
  //  4. If inMatch does contain '../' followed by one of our sdkCompSubDirs then process as relative component DIR reference
  //  5. If inMatch does contain '../' followed directly by a component name, the process as relative component reference
  //  6. If inMatch does contain '../' followed directly by a top-level content name, the process as relative top-level content reference
  //  7. If inMatch does contain '../' followed by one of our typesDirs, then process as relative reference to types dir
  //  otherwise, return inMatch unprocessed..

  //  1. If inMatch doesn't contain '../', then return inMatch (nothing to process)
  if (!inMatch.includes(splitWith)) {
    return inMatch;
  }

  //  2. If inMatch does contain '../' followed by sdkBridgeDir then process as relative bridge reference
  if (hasRelativeDir(inMatch, splitWith, overrideConstants.SDK_BRIDGE_DIR)) {
    const replacementString = processRelativeRef(inMatch, splitWith, overrideConstants.SDK_BRIDGE_DIR);
    console.log(`  --> replacing with: ${replacementString}`);
    iPathReplacements = iPathReplacements + 1;
    return replacementString;
  }

  //  3. If inMatch does contain '../' followed by sdkHooksDir then process as relative bridge reference
  if (hasRelativeDir(inMatch, splitWith, overrideConstants.SDK_HOOKS_DIR)) {
    const replacementString = processRelativeRef(inMatch, splitWith, overrideConstants.SDK_HOOKS_DIR);
    console.log(`  --> replacing with: ${replacementString}`);
    iPathReplacements = iPathReplacements + 1;
    return replacementString;
  }

  //  4. If inMatch does contain '../' followed by one of our sdkCompSubDirs, then process as relative component DIR reference
  if (hasRelativeDir(inMatch, splitWith, overrideConstants.SDK_COMP_SUBDIRS)) {
    const replacementString = processRelativeRef(inMatch, splitWith, overrideConstants.SDK_COMP_SUBDIRS);
    console.log(`  --> replacing with: ${replacementString}`);
    iPathReplacements = iPathReplacements + 1;
    return replacementString;
  }

  //  5. If inMatch does contain '../' followed by directly by a component name, the process as relative component reference
  if (hasRelativeComponent(inMatch, splitWith, overrideConstants.SDK_COMP_LOCATION_MAP)) {
    // console.log(` ----> hasRelativeComponent: ${inMatch}`);

    const replacementString = processRelativeComponentRef(inMatch, splitWith, overrideConstants.SDK_COMP_LOCATION_MAP);
    console.log(`  --> replacing with: ${replacementString}`);
    iPathReplacements = iPathReplacements + 1;
    return replacementString;
  }

  //  6. If inMatch does contain '../' followed directly by a top-level content name, the process as relative top-level content reference
  if (hasRelativeDir(inMatch, splitWith, overrideConstants.SDK_TOP_LEVEL_CONTENT)) {
    // console.log(` ----> hasTopLevelContent: ${inMatch}`);

    const replacementString = processRelativeRef(inMatch, splitWith, overrideConstants.SDK_TOP_LEVEL_CONTENT);
    console.log(`  --> replacing with: ${replacementString}`);
    iPathReplacements = iPathReplacements + 1;
    return replacementString;
  }

  //  7. If inMatch does contain '../' followed by one of our typesDirs, then process as relative reference to types dir
  if (hasRelativeDir(inMatch, splitWith, overrideConstants.SDK_TYPES_DIR)) {
    const replacementString = processRelativeRef(inMatch, splitWith, overrideConstants.SDK_TYPES_DIR);
    console.log(`  --> replacing with: ${replacementString}`);
    iPathReplacements = iPathReplacements + 1;
    return replacementString;
  }

  // more work to do
  console.log(` ----> More work to do: ${inMatch}`);
  iMayNeedPathReplacement = iMayNeedPathReplacement + 1;
  return retString;
};

/**
 * processOverrideFile
 *
 * @param {*} filePath absolute path to file being process
 *
 * This function processes the given file which is expected to be a file in the overrides/lib
 * directory. It finds relative paths of import statements to other components/files in the
 * react-sdk-components package and updates those relative paths
 * (ex: import FieldValueList from '../../designSystemExtension/FieldValueList';)
 * and updates those to the appropriate @pega/react-sdk-components path
 * (ex: import FieldValueList from '@pega/react-sdk-components/lib/components/designSystemExtension/FieldValueList';)
 */
const processOverrideFile = function (filePath) {
  // trim off the directory info from the string to make it shorter
  console.log(`\nProcessing override file: ${filePath.slice(overridesLibDir.length)}`);

  // The regex gets any complete line starting with 'import '. We then process it in the processImportLine function
  //  the 'gm' (m for multiline) makes sure we get the matches for EVERY line in the file that starts with import
  const options = {
    files: filePath,
    from: /^import .+/gm,
    to: match => processImportLine(match),
    countMatches: true
  };

  const theResults = replaceInFile.sync(options);

  const { hasChanged, file } = theResults[0];
  // console.log(`replacement results: ${JSON.stringify(results[0])}`);
  if (hasChanged) {
    // trim off the directory info from the string to make it shorter
    console.log(`  edited: ${file.slice(overridesLibDir.length)}`);
  } else {
    // console.log(`NOT edited: ${file}: found ${numMatches} | replaced ${numReplacements}`);
  }
};

const processSdkOverrides = async () => {
  console.log(`in processSdkOverrides`);
  iPathReplacements = 0;
  iMayNeedPathReplacement = 0;
  const allFilesInDir = getAllFilesInDir(overridesLibDir, []);
  allFilesInDir.forEach(file => {
    processOverrideFile(file);
  });
  console.log(`Processed ${allFilesInDir.length} files in ${overridesPkgDir}`);
  console.log(`  paths replaced: ${iPathReplacements}`);
  console.log(`  paths needing work: ${iMayNeedPathReplacement}`);
};

// Run the code to build the override output
processSdkOverrides();
