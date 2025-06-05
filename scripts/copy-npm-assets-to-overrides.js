const copyFile = require('./copy-file.js');

// Copy Security.md file from root to react-sdk-components lib folder
copyFile('.', './packages/react-sdk-overrides', 'SECURITY.md');

// Copy LICENSE file from root to react-sdk-components lib folder
copyFile('.', './packages/react-sdk-overrides', 'LICENSE');
