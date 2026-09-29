const fs = require('fs');
const path = require('path');

try {
  const rnPath = path.resolve(__dirname, '../node_modules/react-native');
  if (fs.existsSync(rnPath)) {
    const targetFile = path.join(rnPath, 'rn-get-polyfills.js');
    const content = `module.exports = () => {
  try {
    return require('@react-native/js-polyfills')();
  } catch (e) {
    return [];
  }
};
`;
    fs.writeFileSync(targetFile, content, 'utf8');
    console.log('[setup-polyfills] Successfully linked rn-get-polyfills.js in react-native');
  }
} catch (e) {
  console.warn('[setup-polyfills] Warning:', e.message);
}
