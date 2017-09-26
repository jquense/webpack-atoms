'use strict';

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

function _objectWithoutProperties(obj, keys) { var target = {}; for (var i in obj) { if (keys.indexOf(i) >= 0) continue; if (!Object.prototype.hasOwnProperty.call(obj, i)) continue; target[i] = obj[i]; } return target; }

var os = require('os');
var path = require('path');

var autoprefixer = require('autoprefixer');
var camelCase = require('lodash/camelCase');
var ExtractTextPlugin = require('extract-text-webpack-plugin');
var flexbugs = require('postcss-flexbugs-fixes');
var HtmlWebpackPlugin = require('html-webpack-plugin');
var UglifyPlugin = require('uglifyjs-webpack-plugin');
var webpack = require('webpack');

var _process = process,
    env = _process.env;

var PRODUCTION = env.NODE_ENV === 'production';

var makeExternalOnly = function makeExternalOnly(original) {
  return function () {
    var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

    var rule = original(options);
    rule.include = VENDOR_MODULE_REGEX;
    return rule;
  };
};

var makeInternalOnly = function makeInternalOnly(original) {
  return function () {
    var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

    var rule = original(options);
    rule.exclude = VENDOR_MODULE_REGEX;
    return rule;
  };
};

var VENDOR_MODULE_REGEX = /node_modules/;
exports.setVendorRegex = function (vendorRegex) {
  VENDOR_MODULE_REGEX = vendorRegex;
};

var DEFAULT_BROWSERS = ['> 1%', 'last 4 versions', 'Firefox ESR', 'not ie < 9'];
exports.setBrowsers = function (browsers) {
  DEFAULT_BROWSERS = [].concat(browsers);
};

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

    var _plugins = options.plugins,
        _options$browsers = options.browsers,
        browsers = _options$browsers === undefined ? DEFAULT_BROWSERS : _options$browsers,
        postcssOpts = _objectWithoutProperties(options, ['plugins', 'browsers']);

    return {
      loader: require.resolve('postcss-loader'),
      options: _extends({
        ident: `postcss-${++ident}`,
        plugins: function plugins(loader) {
          _plugins = (typeof _plugins === `function` ? _plugins(loader) : _plugins) || [];

          return [flexbugs, autoprefixer({ browsers, flexbox: `no-2009` })].concat(_plugins);
        }
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

  url: function url() {
    var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
    return {
      loader: require.resolve('url-loader'),
      options: _extends({
        limit: 10000,
        name: '[name]-[hash].[ext]'
      }, options)
    };
  },

  woff: function woff() {
    return loaders.url({
      mimetype: 'application/font-woff'
    });
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
rules.js = function () {
  var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
  return {
    test: /\.jsx?$/,
    exclude: VENDOR_MODULE_REGEX,
    use: [loaders.js(options)]
  };
};

rules.js.inlineCss = function () {
  var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

  var tagName = options.tagName,
      extension = options.extension,
      rest = _objectWithoutProperties(options, ['tagName', 'extension']);

  var rule = rules.js(rest);
  rule.use.push(loaders.cssLiteral({ tagName, extension }));
  return rule;
};

/**
 * Loads image assets, inlines images via a data URI if they are below
 * the size threshold
 */
rules.images = function () {
  return {
    use: [loaders.url()],
    test: [/\.(eot|ttf|svg)(\?.*)?$/, /\.(gif|png|mp4)$/]
  };
};

/**
 * Web font loader
 */
rules.woff = function () {
  return {
    use: [loaders.woff()],
    test: /\.woff2?(\?.*)?$/
  };
};

/**
 * CSS style loader.
 */
rules.css = function () {
  var _ref = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

  var browsers = _ref.browsers,
      options = _objectWithoutProperties(_ref, ['browsers']);

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
rules.css.internal = makeInternalOnly(rules.css);
rules.css.external = makeExternalOnly(rules.css);

/**
 * PostCSS loader.
 */
rules.postcss = function () {
  var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
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
rules.postcss.internal = makeInternalOnly(rules.postcss);
rules.postcss.external = makeExternalOnly(rules.postcss);

/**
 * Less style loader.
 */
rules.less = function () {
  var _ref2 = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

  var browsers = _ref2.browsers,
      options = _objectWithoutProperties(_ref2, ['browsers']);

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
rules.less.internal = makeInternalOnly(rules.less);
rules.less.external = makeExternalOnly(rules.less);

/**
 * SASS style loader, excludes node_modules.
 */
rules.sass = function () {
  var _ref3 = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

  var browsers = _ref3.browsers,
      options = _objectWithoutProperties(_ref3, ['browsers']);

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
rules.sass.internal = makeInternalOnly(rules.sass);
rules.sass.external = makeExternalOnly(rules.sass);

rules.noAMD = function () {
  var _ref4 = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {},
      exlude = _ref4.exlude,
      include = _ref4.include;

  return {
    parser: { amd: false },
    exlude,
    include
  };
};

/**
 * Plugins
 */
var plugins = {};
var pluginName = function pluginName(name) {
  return camelCase(name.replace(/Plugin$/, ''));
}

// Re-export all the built-in plugins
;['DefinePlugin', 'NormalModuleReplacementPlugin', 'ContextReplacementPlugin', 'IgnorePlugin', 'WatchIgnorePlugin', 'BannerPlugin', 'PrefetchPlugin', 'AutomaticPrefetchPlugin', 'ProvidePlugin', 'HotModuleReplacementPlugin', 'SourceMapDevToolPlugin', 'EvalSourceMapDevToolPlugin', 'EvalDevToolModulePlugin', 'CachePlugin', 'ExtendedAPIPlugin', 'ExternalsPlugin', 'JsonpTemplatePlugin', 'LibraryTemplatePlugin', 'LoaderTargetPlugin', 'MemoryOutputFileSystem', 'ProgressPlugin', 'SetVarMainTemplatePlugin', 'UmdMainTemplatePlugin', 'NoErrorsPlugin', 'NoEmitOnErrorsPlugin', 'NewWatchingPlugin', 'EnvironmentPlugin', 'DllPlugin', 'DllReferencePlugin', 'LoaderOptionsPlugin', 'NamedModulesPlugin', 'NamedChunksPlugin', 'HashedModuleIdsPlugin', 'ModuleFilenameHelpers'].forEach(function (plugin) {
  plugins[pluginName(plugin)] = function () {
    for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
      args[_key] = arguments[_key];
    }

    return new (Function.prototype.bind.apply(webpack[plugin], [null].concat(args)))();
  };
});['AggressiveMergingPlugin', 'AggressiveSplittingPlugin', 'CommonsChunkPlugin', 'ChunkModuleIdRangePlugin', 'DedupePlugin', 'LimitChunkCountPlugin', 'MinChunkSizePlugin', 'OccurrenceOrderPlugin'].forEach(function (plugin) {
  plugins[pluginName(plugin)] = function () {
    for (var _len2 = arguments.length, args = Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
      args[_key2] = arguments[_key2];
    }

    return new (Function.prototype.bind.apply(webpack.optimize[plugin], [null].concat(args)))();
  };
});

/**
 * https://webpack.js.org/plugins/define-plugin/
 *
 * Replace tokens in code with static values. Defaults to setting NODE_ENV
 * which is used by React and other libraries to toggle development mode.
 */
plugins.define = function () {
  var defines = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
  return new webpack.DefinePlugin(_extends({}, defines, {
    env: _extends({
      NODE_ENV: JSON.stringify(env.NODE_ENV)
    }, defines.env)
  }));
};

/**
 * The webpack2 shim plugin for passing options to loaders. Sets
 * the minize and debug options to `true` in production (used by various loaders)
 */
plugins.loaderOptions = function (options) {
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

var stats = module.exports.stats = {};

stats.none = {
  hash: false,
  version: false,
  timings: false,
  assets: false,
  entrypoints: false,
  chunks: false,
  chunkModules: false,
  modules: false,
  reasons: false,
  depth: false,
  usedExports: false,
  providedExports: false,
  children: false,
  source: false,
  errors: false,
  errorDetails: false,
  warnings: false,
  publicPath: false,
  performance: false
};

stats.minimal = _extends({}, stats.none, {
  errors: true,
  errorDetails: true,
  assets: true,
  chunks: true,
  colors: true,
  performance: true,
  timings: true,
  warnings: true
});

exports.plugins = plugins;
exports.loaders = loaders;
exports.rules = rules;