const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const webpack = require('webpack');

const buildDirectory = path.resolve(__dirname, 'build');

module.exports = {
  // mode: "production",
  entry: './src/index.js',
  output: {
    filename: 'bundle.js',
    path: buildDirectory,
  },
  module: {
    rules: [
      {
        test: /\.m?js$/,
        exclude: /(node_modules|bower_components)/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env'],
            cacheDirectory: true,
          },
        },
      },
      {
        test: /\.(fbx|gltf)$/,
        use: {
          loader: 'file-loader',
          options: {
            name: 'static/[name].[hash:8].[ext]',
          },
        },
      },
    ],
  },
  plugins: [
    new webpack.EnvironmentPlugin({
      DEBUG: false,
      ORBIT_CONTROLS: false,
    }),
    new HtmlWebpackPlugin({
      inject: true,
      template: 'public/index.html',
    }),
    new CopyPlugin([
      {
        from: 'public/assets',
        to: 'assets',
      },
      {
        from: 'public/index.css',
      },
    ]),
  ],
  optimization: {
    splitChunks: {
      chunks: 'all',
      name: false,
    },
    runtimeChunk: true,
  },
  devServer: {
    contentBase: buildDirectory,
    disableHostCheck: true,
    compress: true,
    port: 3000,
    hot: true,
    clientLogLevel: 'error',
  },
  performance: {
    hints: false,
  },
};
