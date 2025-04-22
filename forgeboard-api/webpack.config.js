const { composePlugins, withNx } = require('@nx/webpack');
const nodeExternals = require('webpack-node-externals');

module.exports = composePlugins(
  withNx(),
  (config) => {
    config.devtool = 'source-map';
    
    // Target Node.js environment
    config.target = 'node';

    config.experiments = {
      ...config.experiments,
      topLevelAwait: true,
      outputModule: true,
    };

    config.output = {
      ...config.output,
      module: true,
      libraryTarget: 'module',
    };

    config.resolve = {
      ...config.resolve,
      extensions: [...(config.resolve?.extensions || []), '.ts', '.tsx', '.mjs', '.js', '.jsx'],
      fallback: {
        ...config.resolve?.fallback,
        path: require.resolve('path-browserify'),
      }
    };

    config.ignoreWarnings = [
      ...(config.ignoreWarnings || []),
      /Critical dependency/,
      /Module not found/,
    ];

    // Don't bundle node_modules
    config.externals = [nodeExternals()];

    return config;
  }
);
