// This is all james' fault
// Don't worry, he eventually repented and became an electrical engineer

var webpack = require('webpack');
var merge = require('webpack-merge');
var path = require('path');
var CopyWebpackPlugin = require('copy-webpack-plugin');

var conf = {
  context: path.resolve(__dirname, 'src'),
  entry: {
    app: './app.ts',
    profiler: './profiler.ts'
  },
  output: {
    path: path.resolve(__dirname, 'bc20'),
    publicPath: '/bc20/',
    filename: '[name].js'
  },
  resolve: {
    extensions: ['.ts', '.js', '.png', '.jpg']
  },
  module: {
    rules: [
      { test: /\.ts$/, use: 'awesome-typescript-loader' },
      { test: /\.(png|jpg)$/, use: 'url-loader?limit=50000&name=[name]-[hash:base64:7].[ext]' },
      { test: /\.css$/, use: ['style-loader', 'css-loader'] }
    ]
  },
  plugins: [
    new CopyWebpackPlugin([
      {
        from: path.resolve(__dirname, 'node_modules/speedscope/dist/release'),
        to: path.resolve(__dirname, 'bc20/speedscope'),
        transform: (content, filePath) => {
          // Make speedscope's localProfilePath hash parameter support relative paths
          if (filePath.endsWith('.js')) {
            return content.toString().replace('file:///', '');
          }

          return content;
        }
      }
    ])
  ],
  devServer: {
    // Required to ensure the files copied by the CopyWebpackPlugin are copied when running the dev server
    writeToDisk: filePath => filePath.includes('speedscope/')
  }
};

module.exports = function(env) {
  env = env || {};

  if (env.dev) {
    // we're in dev
    conf = merge(conf, {
      mode: "development",
      devtool: 'source-map',
      plugins: [
        new webpack.HotModuleReplacementPlugin(),
        new webpack.LoaderOptionsPlugin({
          minimize: false,
          debug: true
        }),
      ]
    });
  } else {
    // we're compiling for prod
    conf = merge(conf, {
      mode: "production",
      plugins: [
        // new webpack.optimize.UglifyJsPlugin(),
        new webpack.LoaderOptionsPlugin({
          minimize: true,
          debug: false
        }),
      ]
    });
  }

  if (env.electron) {
    // we're compiling for electron
    conf = merge(conf, {
      target: 'electron-renderer',
      plugins: [
        new webpack.DefinePlugin({
          'process.env.ELECTRON': true
        })
      ],
      // electron will find './bc20/thing.ext' but won't find '/bc20/thing.ext'
      output: { publicPath: './bc20/' }
    });
  } else {
    // we're compiling for the browser
    conf = merge(conf, {
      plugins: [
        new webpack.DefinePlugin({
          'process.env.ELECTRON': false
        })
      ],
      // externals: {
      //   'electron': 'electron',
      //   'os': 'os',
      //   'fs': 'fs',
      //   'child_process': 'child_process',
      //   'http': 'http'
      // }
    });
  }

  return conf;
};
