const { composePlugins, withNx } = require('@nx/webpack');
const nodeExternals = require('webpack-node-externals');

module.exports = composePlugins(
  withNx(),
  (config) => {
    // Don't bundle node_modules
    config.externals = [nodeExternals()];

    // Ensure we're outputting CommonJS modules
    config.output = {
      ...config.output,
      module: false,
      libraryTarget: 'commonjs2'
    };

    // Disable outputting ES modules
    config.experiments = {
      ...config.experiments,
      outputModule: false
    };

    return config;
  }
);
