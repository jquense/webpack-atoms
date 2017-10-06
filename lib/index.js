'use strict';

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

function _objectWithoutProperties(obj, keys) { var target = {}; for (var i in obj) { if (keys.indexOf(i) >= 0) continue; if (!Object.prototype.hasOwnProperty.call(obj, i)) continue; target[i] = obj[i]; } return target; }

var os = require('os');
var path = require('path');

var autoprefixer = require('autoprefixer');
var ExtractTextPlugin = require('extract-text-webpack-plugin');
var flexbugs = require('postcss-flexbugs-fixes');
var HtmlWebpackPlugin = require('html-webpack-plugin');
var UglifyPlugin = require('uglifyjs-webpack-plugin');
var webpack = require('webpack');

var builtinPlugins = require('./plugins');
var statsConfig = require('./stats'); // eslint-disable-line


var VENDOR_MODULE_REGEX = /(node_modules|bower_components)/;
var DEFAULT_BROWSERS = ['> 1%', 'last 4 versions', 'Firefox ESR', 'not ie < 9'];

function createAtoms(options) {
  var _ref = options || {},
      _ref$assetRelativeRoo = _ref.assetRelativeRoot,
      assetRelativeRoot = _ref$assetRelativeRoo === undefined ? '' : _ref$assetRelativeRoo,
      _ref$env = _ref.env,
      env = _ref$env === undefined ? process.env.NODE_ENV : _ref$env,
      _ref$vendorRegex = _ref.vendorRegex,
      vendorRegex = _ref$vendorRegex === undefined ? VENDOR_MODULE_REGEX : _ref$vendorRegex,
      _ref$browsers = _ref.browsers,
      supportedBrowsers = _ref$browsers === undefined ? DEFAULT_BROWSERS : _ref$browsers;

  var makeExternalOnly = function makeExternalOnly(original) {
    return function () {
      var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

      var rule = original(options);
      rule.include = vendorRegex;
      return rule;
    };
  };

  var makeInternalOnly = function makeInternalOnly(original) {
    return function () {
      var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

      var rule = original(options);
      rule.exclude = vendorRegex;
      return rule;
    };
  };

  var PRODUCTION = env === 'production';

  var ident = 0;

  /**
   * Loaders
   */
  var loaders = {
    json: function json() {
      return {
        loader: require.resolve(`json-loader`)
      };
    },

    yaml: function yaml() {
      return {
        loader: require.resolve(`yaml-loader`)
      };
    },

    null: function _null() {
      return {
        loader: require.resolve(`null-loader`)
      };
    },

    raw: function raw() {
      return {
        loader: require.resolve(`raw-loader`)
      };
    },

    style: function style() {
      return {
        loader: require.resolve('style-loader')
      };
    },

    css: function css() {
      var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
      return {
        loader: require.resolve('css-loader'),
        options: _extends({
          minimize: PRODUCTION,
          sourceMap: !PRODUCTION,
          camelCase: 'dashesOnly',
          // https://github.com/webpack-contrib/css-loader/issues/406
          localIdentName: '[name]--[local]--[hash:base64:5]'
        }, options)
      };
    },

    cssLiteral: function cssLiteral(options) {
      return {
        options,
        loader: require.resolve('css-literal-loader')
      };
    },

    postcss: function postcss() {
      var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

      var plugins = options.plugins,
          _options$browsers = options.browsers,
          browsers = _options$browsers === undefined ? supportedBrowsers : _options$browsers,
          postcssOpts = _objectWithoutProperties(options, ['plugins', 'browsers']);

      return {
        loader: require.resolve('postcss-loader'),
        options: _extends({
          ident: `postcss-${++ident}`,
          plugins: function (_plugins) {
            function plugins(_x5) {
              return _plugins.apply(this, arguments);
            }

            plugins.toString = function () {
              return _plugins.toString();
            };

            return plugins;
          }(function (loader) {
            plugins = (typeof plugins === `function` ? plugins(loader) : plugins) || [];

            return [flexbugs, autoprefixer({ browsers, flexbox: `no-2009` })].concat(plugins);
          })
        }, postcssOpts)
      };
    },

    less: function less() {
      var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
      return {
        options,
        loader: require.resolve('less-loader')
      };
    },

    sass: function sass() {
      var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
      return {
        options,
        loader: require.resolve('sass-loader')
      };
    },

    file: function file() {
      var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
      return {
        loader: require.resolve('url-loader'),
        options: _extends({
          name: `${assetRelativeRoot}[name]-[hash].[ext]`
        }, options)
      };
    },

    url: function url() {
      var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
      return {
        loader: require.resolve('url-loader'),
        options: _extends({
          limit: 10000,
          name: `${assetRelativeRoot}[name]-[hash].[ext]`
        }, options)
      };
    },

    js: function js() {
      var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
      return {
        options,
        loader: require.resolve('babel-loader')
      };
    },

    imports: function imports(options) {
      return {
        options,
        loader: require.resolve('imports-loader')
      };
    },

    exports: function exports(options) {
      return {
        options,
        loader: require.resolve('exports-loader')
      };
    }

    /**
     * Rules
     */
  };var rules = {};

  /**
   * Javascript loader via babel, excludes node_modules
   */
  {
    var _js = function _js() {
      var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
      return {
        test: /\.jsx?$/,
        exclude: VENDOR_MODULE_REGEX,
        use: [loaders.js(options)]
      };
    };

    _js.inlineCss = function () {
      var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

      var tagName = options.tagName,
          extension = options.extension,
          rest = _objectWithoutProperties(options, ['tagName', 'extension']);

      var rule = _js(rest);
      rule.use.push(loaders.cssLiteral({ tagName, extension }));
      return rule;
    };

    rules.js = _js;
  }

  /**
  * Font loader
  */
  rules.fonts = function () {
    return {
      use: [loaders.url()],
      test: /\.(eot|otf|ttf|woff(2)?)(\?.*)?$/
    };
  };

  /**
   * Loads image assets, inlines images via a data URI if they are below
   * the size threshold
   */
  rules.images = function () {
    return {
      use: [loaders.url()],
      test: /\.(ico|svg|jpg|jpeg|png|gif|webp)(\?.*)?$/
    };
  };

  /**
   * Loads audio or video assets
   */
  rules.audioVideo = function () {
    return {
      use: [loaders.file()],
      test: /\.(mp4|webm|wav|mp3|m4a|aac|oga|flac)$/
    };
  };

  /**
   * A catch-all rule for everything that isn't js, json, or html.
   * Should only be used in the context of a webpack `oneOf` rule as a fallback
   * (see rules.assets())
   */
  rules.files = function () {
    return {
      // Exclude `js` files to keep "css" loader working as it injects
      // it's runtime that would otherwise processed through "file" loader.
      // Also exclude `html` and `json` extensions so they get processed
      // by webpacks internal loaders.
      exclude: [/\.jsx?$/, /\.html$/, /\.json$/],
      use: [loaders.file()]
    };
  };

  /**
   * CSS style loader.
   */
  {
    var _css = function _css() {
      var _ref2 = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

      var browsers = _ref2.browsers,
          options = _objectWithoutProperties(_ref2, ['browsers']);

      return {
        test: /\.css$/,
        use: ExtractTextPlugin.extract({
          fallback: loaders.style(),
          use: [loaders.css(_extends({}, options, { importLoaders: 1 })), loaders.postcss({ browsers })]
        })
      };
    };

    /**
     * CSS style loader, _excludes_ node_modules.
     */
    _css.internal = makeInternalOnly(_css);
    _css.external = makeExternalOnly(_css);
    rules.css = _css;
  }

  /**
   * PostCSS loader.
   */
  {
    var _postcss = function _postcss(options) {
      return {
        test: /\.css$/,
        use: ExtractTextPlugin.extract({
          fallback: loaders.style,
          use: [loaders.css({ importLoaders: 1 }), loaders.postcss(options)]
        })
      };
    };

    /**
     * PostCSS loader, _excludes_ node_modules.
     */
    _postcss.internal = makeInternalOnly(_postcss);
    _postcss.external = makeExternalOnly(_postcss);
    rules.postcss = _postcss;
  }

  /**
   * Less style loader.
   */
  {
    var _less = function _less() {
      var _ref3 = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

      var browsers = _ref3.browsers,
          options = _objectWithoutProperties(_ref3, ['browsers']);

      return {
        test: /\.less$/,
        use: ExtractTextPlugin.extract({
          fallback: loaders.style(),
          use: [loaders.css({ importLoaders: 1 }), loaders.postcss({ browsers }), loaders.less(options)]
        })
      };
    };

    /**
     * Less style loader, _excludes_ node_modules.
     */
    _less.internal = makeInternalOnly(_less);
    _less.external = makeExternalOnly(_less);
    rules.less = _less;
  }

  /**
   * SASS style loader, excludes node_modules.
   */
  {
    var _sass = function _sass() {
      var _ref4 = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

      var browsers = _ref4.browsers,
          options = _objectWithoutProperties(_ref4, ['browsers']);

      return {
        test: /\.s(a|c)ss$/,
        use: ExtractTextPlugin.extract({
          fallback: loaders.style(),
          use: [loaders.css({ importLoaders: 1 }), loaders.postcss({ browsers }), loaders.sass(options)]
        })
      };
    };

    /**
     * SCSS style loader, _excludes_ node_modules.
     */
    _sass.internal = makeInternalOnly(_sass);
    _sass.external = makeExternalOnly(_sass);
    rules.sass = _sass;
  }

  // rules.noAMD = ({ exlude, include } = {}) => ({
  //   parser: { amd: false },
  //   exlude,
  //   include,
  // })


  /**
   * Plugins
   */
  var plugins = _extends({}, builtinPlugins);

  /**
   * https://webpack.js.org/plugins/define-plugin/
   *
   * Replace tokens in code with static values. Defaults to setting NODE_ENV
   * which is used by React and other libraries to toggle development mode.
   */
  plugins.define = function () {
    var defines = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
    return new webpack.DefinePlugin(_extends({
      'process.env.NODE_ENV': JSON.stringify(env)
    }, defines));
  };

  /**
   * The webpack2 shim plugin for passing options to loaders. Sets
   * the minize and debug options to `true` in production (used by various loaders)
   */
  plugins.loaderOptions = function () {
    var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
    return new webpack.LoaderOptionsPlugin({
      options,
      minimize: PRODUCTION,
      debug: !PRODUCTION
    });
  };

  /**
   * Minify javascript code without regard for IE8. Attempts
   * to parallelize the work to save time. Generally only add in Production
   */
  plugins.uglify = function () {
    var _ref5 = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

    var uglifyOptions = _ref5.uglifyOptions,
        options = _objectWithoutProperties(_ref5, ['uglifyOptions']);

    return new UglifyPlugin(_extends({
      parallel: {
        cache: true,
        workers: os.cpus().length - 1
      },
      exclude: /\.min\.js/,
      sourceMap: true,
      uglifyOptions: _extends({
        compress: {
          drop_console: true
        },
        ie8: false
      }, uglifyOptions)
    }, options));
  };

  /**
   * Extracts css requires into a single file;
   * includes some reasonable defaults
   */
  plugins.extractText = function (options) {
    return new ExtractTextPlugin(_extends({
      filename: '[name]-[contenthash].css',
      allChunks: true,
      disable: !PRODUCTION,
      // Useful when using css modules
      ignoreOrder: true
    }, options));
  };

  plugins.extractText.extract = function () {
    return ExtractTextPlugin.extract.apply(ExtractTextPlugin, arguments);
  };

  /**
   * Generates an html file that includes the output bundles.
   * Sepecify a `title` option to set the page title.
   */
  plugins.html = function (opts) {
    return new HtmlWebpackPlugin(_extends({
      inject: true,
      template: path.join(__dirname, '../assets/index.html')
    }, opts));
  };

  plugins.moment = function () {
    return new webpack.IgnorePlugin(/^\.\/locale$/, /moment$/);
  };

  var stats = {
    none: statsConfig,
    minimal: _extends({}, statsConfig, {
      errors: true,
      errorDetails: true,
      assets: true,
      chunks: true,
      colors: true,
      performance: true,
      timings: true,
      warnings: true
    })
  };

  return {
    loaders,
    rules: rules,
    plugins: plugins,
    stats
  };
}

module.exports = _extends({}, createAtoms(), {
  createAtoms
});