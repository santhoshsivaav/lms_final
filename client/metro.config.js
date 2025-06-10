const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Add any custom configuration here
config.resolver.sourceExts = ['jsx', 'js', 'ts', 'tsx', 'json'];
config.resolver.assetExts = ['png', 'jpg', 'jpeg', 'gif', 'webp', 'ttf', 'otf'];

// Ensure proper module resolution
config.resolver.nodeModulesPaths = [__dirname + '/node_modules'];

// Enable Hermes
config.transformer.minifierConfig = {
    compress: {
        drop_console: true,
    },
};

module.exports = config; 