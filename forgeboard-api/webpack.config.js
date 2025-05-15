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

    // Add Babel loader for TypeScript files to support decorators
    config.module.rules = config.module.rules || [];
    config.module.rules.unshift({
      test: /\.tsx?$/,
      use: [
        {
          loader: 'babel-loader',
          options: {
            cacheDirectory: true,
            presets: [
              ['@babel/preset-env', { targets: { node: 'current' } }],
              '@babel/preset-typescript'
            ],
            plugins: [
              ['@babel/plugin-proposal-decorators', { legacy: true }],
              ['@babel/plugin-proposal-class-properties', { loose: false }],
              'babel-plugin-transform-typescript-metadata'
            ]
          }
        }
      ],
      exclude: /node_modules/
    });

    return config;
  }
);
