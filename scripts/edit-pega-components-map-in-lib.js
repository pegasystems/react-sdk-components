// @ts-nocheck

// NOTE: The @ts-nocheck above tells TypseScript not to check this file for various problems

// Doc for replace-in-file package here:
//  https://www.npmjs.com/package/replace-in-file?activeTab=readme

'use strict';

const replaceInFile = require('replace-in-file');

const editPegaComponentsMapInLib = function () {
  console.log(`in editPegaComponentsMapInLib`);

  const compDtsFileToEdit = 'packages/react-sdk-components/lib/sdk-pega-component-map.d.ts';
  const compDtsMapFileToEdit = 'packages/react-sdk-components/lib/sdk-pega-component-map.d.ts.map';
  const compJsFileToEdit = 'packages/react-sdk-components/lib/sdk-pega-component-map.js';
  const compJSMapFileToEdit = 'packages/react-sdk-components/lib/sdk-pega-component-map.js.map';

  const options = {
    files: [compJsFileToEdit, compJSMapFileToEdit, compDtsFileToEdit, compDtsMapFileToEdit],
    from: /\/src\//g,
    to: '/lib/',
    countMatches: true,
  };

  try {
    const results = replaceInFile.sync(options);
    results.map((theResults) => {
      const { hasChanged, file, numMatches, numReplacements } = theResults;
      // console.log(`replacement results: ${JSON.stringify(results[0])}`);
      if (hasChanged) {
        console.log(`edited: ${file}: found ${numMatches} | replaced ${numReplacements}`);
      } else {
        console.log(`NOT edited: ${file}: found ${numMatches} | replaced ${numReplacements}`);
      }
    });
  } catch (error) {
    console.error(`ERROR in edit: ${error}`);
  }
};

editPegaComponentsMapInLib();
