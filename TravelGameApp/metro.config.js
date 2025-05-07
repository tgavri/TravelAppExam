const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Ensure .tflite is recognized as an asset
// Add .tflite to assetExts if it's not already there
if (!config.resolver.assetExts.includes('tflite')) {
    config.resolver.assetExts.push('tflite');
}

// It's also common to see other asset types like .bin for model weights if you were using TFJS model format
if (!config.resolver.assetExts.includes('bin')) {
    config.resolver.assetExts.push('bin');
}

// Ensure .json can be required, adding it to sourceExts might help resolution
if (!config.resolver.sourceExts.includes('json')) {
    config.resolver.sourceExts.push('json');
}

console.log('Updated Metro config sourceExts:', config.resolver.sourceExts);
console.log('Updated Metro config assetExts:', config.resolver.assetExts);

module.exports = config; 