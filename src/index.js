const os = require('os')
const path = require('path')

const autoprefixer = require('autoprefixer')
const camelCase = require('lodash/camelCase')
const ExtractTextPlugin = require('extract-text-webpack-plugin')
const flexbugs = require('postcss-flexbugs-fixes')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const UglifyPlugin = require('uglifyjs-webpack-plugin')
const webpack = require('webpack')

const { env } = process
const PRODUCTION = env.NODE_ENV === 'production'


const makeExternalOnly = original => (options = {}) => {
  let rule = original(options);
  rule.include = VENDOR_MODULE_REGEX;
  return rule
}

const makeInternalOnly = original => (options = {}) => {
  let rule = original(options);
  rule.exclude = VENDOR_MODULE_REGEX;
  return rule
}

let VENDOR_MODULE_REGEX = /node_modules/
exports.setVendorRegex = (vendorRegex) => {
  VENDOR_MODULE_REGEX = vendorRegex
}

let DEFAULT_BROWSERS = ['> 1%', 'last 4 versions', 'Firefox ESR', 'not ie < 9']
exports.setBrowsers = (browsers) => {
  DEFAULT_BROWSERS = [].concat(browsers)
}

let ident = 0;

/**
 * Loaders
 */
const loaders =  {
  json: () => ({
    loader: require.resolve(`json-loader`),
  }),

  yaml: () => ({
    loader: require.resolve(`yaml-loader`),
  }),

  null: () => ({
    loader: require.resolve(`null-loader`),
  }),

  raw: () => ({
    loader: require.resolve(`raw-loader`),
  }),

  style: () => ({
    loader: require.resolve('style-loader'),
  }),

  css: (options = {}) => ({
    loader: require.resolve('css-loader'),
    options:  {
      minimize: PRODUCTION,
      sourceMap: !PRODUCTION,
      camelCase: 'dashesOnly',
      // https://github.com/webpack-contrib/css-loader/issues/406
      localIdentName: '[name]--[local]--[hash:base64:5]',
      ...options,
    },
  }),

  cssLiteral: (options) => ({
    options,
    loader: require.resolve('css-literal-loader'),
  }),

  postcss: (options = {}) => {
    let { plugins, browsers = DEFAULT_BROWSERS, ...postcssOpts } = options

    return {
      loader: require.resolve('postcss-loader'),
      options: {
        ident: `postcss-${++ident}`,
        plugins: loader => {
          plugins = (typeof plugins === `function` ? plugins(loader) : plugins) || []

          return [
            flexbugs,
            autoprefixer({ browsers, flexbox: `no-2009` }),
            ...plugins,
          ]
        },
        ...postcssOpts
      },
    }
  },

  less: (options = {}) => ({
    options,
    loader: require.resolve('less-loader')
  }),

  sass: (options = {}) => ({
    options,
    loader: require.resolve('sass-loader')
  }),

  url: (options = {}) => ({
    loader: require.resolve('url-loader'),
    options: {
      limit: 10000,
      name: '[name]-[hash].[ext]',
      ...options
    },
  }),

  woff: () => loaders.url({
    mimetype: 'application/font-woff',
  }),

  js: (options = {}) => ({
    options,
    loader: require.resolve('babel-loader'),
  }),

  imports: (options) => ({
    options,
    loader: require.resolve('imports-loader'),
  }),

  exports: (options) => ({
    options,
    loader: require.resolve('exports-loader'),
  }),
}



/**
 * Rules
 */
const rules = {};

/**
 * Javascript loader via babel, excludes node_modules
 */
rules.js = (options = {}) => ({
  test: /\.jsx?$/,
  exclude: VENDOR_MODULE_REGEX,
  use: [loaders.js(options)]
})

rules.js.inlineCss = (options = {}) => {
  let { tagName, extension, ...rest } = options
  let rule = rules.js(rest)
  rule.use.push(loaders.cssLiteral({ tagName, extension }))
  return rule
}


/**
 * Loads image assets, inlines images via a data URI if they are below
 * the size threshold
 */
rules.images = () => ({
  use: [loaders.url()],
  test: [/\.(eot|ttf|svg)(\?.*)?$/, /\.(gif|png|mp4)$/],
})

/**
 * Web font loader
 */
rules.woff = () => ({
  use: [loaders.woff()],
  test: /\.woff2?(\?.*)?$/,
})

/**
 * CSS style loader.
 */
rules.css = ({ browsers, ...options } = {}) => ({
  test: /\.css$/,
  use: ExtractTextPlugin.extract({
    fallback: loaders.style(),
    use: [
      loaders.css({ ...options, importLoaders: 1 }),
      loaders.postcss({ browsers }),
    ],
  }),
})


/**
 * CSS style loader, _excludes_ node_modules.
 */
rules.css.internal = makeInternalOnly(rules.css)
rules.css.external = makeExternalOnly(rules.css)

/**
 * PostCSS loader.
 */
rules.postcss = (options = {}) => ({
  test: /\.css$/,
  use: ExtractTextPlugin.extract({
    fallback: loaders.style,
    use: [
      loaders.css({ importLoaders: 1 }),
      loaders.postcss(options),
    ],
  }),
});

/**
 * PostCSS loader, _excludes_ node_modules.
 */
rules.postcss.internal = makeInternalOnly(rules.postcss)
rules.postcss.external = makeExternalOnly(rules.postcss)

/**
 * Less style loader.
 */
rules.less = ({ browsers, ...options } = {}) => ({
  test: /\.less$/,
  use: ExtractTextPlugin.extract({
    fallback: loaders.style(),
    use: [
      loaders.css({ importLoaders: 1 }),
      loaders.postcss({ browsers }),
      loaders.less(options)
    ],
  }),
})

/**
 * Less style loader, _excludes_ node_modules.
 */
rules.less.internal = makeInternalOnly(rules.less)
rules.less.external = makeExternalOnly(rules.less)

/**
 * SASS style loader, excludes node_modules.
 */
rules.sass = ({ browsers, ...options } = {}) => ({
  test: /\.s(a|c)ss$/,
  use: ExtractTextPlugin.extract({
    fallback: loaders.style(),
    use: [
      loaders.css({ importLoaders: 1 }),
      loaders.postcss({ browsers }),
      loaders.sass(options),
    ],
  }),
})

/**
 * SCSS style loader, _excludes_ node_modules.
 */
rules.sass.internal = makeInternalOnly(rules.sass)
rules.sass.external = makeExternalOnly(rules.sass)

rules.noAMD = ({ exlude, include } = {}) => ({
  parser: { amd: false },
  exlude,
  include,
})



/**
 * Plugins
 */
const plugins = {};
const pluginName = name => camelCase(name.replace(/Plugin$/, ''))

// Re-export all the built-in plugins
;[
  'DefinePlugin',
  'NormalModuleReplacementPlugin',
  'ContextReplacementPlugin',
  'IgnorePlugin',
  'WatchIgnorePlugin',
  'BannerPlugin',
  'PrefetchPlugin',
  'AutomaticPrefetchPlugin',
  'ProvidePlugin',
  'HotModuleReplacementPlugin',
  'SourceMapDevToolPlugin',
  'EvalSourceMapDevToolPlugin',
  'EvalDevToolModulePlugin',
  'CachePlugin',
  'ExtendedAPIPlugin',
  'ExternalsPlugin',
  'JsonpTemplatePlugin',
  'LibraryTemplatePlugin',
  'LoaderTargetPlugin',
  'MemoryOutputFileSystem',
  'ProgressPlugin',
  'SetVarMainTemplatePlugin',
  'UmdMainTemplatePlugin',
  'NoErrorsPlugin',
  'NoEmitOnErrorsPlugin',
  'NewWatchingPlugin',
  'EnvironmentPlugin',
  'DllPlugin',
  'DllReferencePlugin',
  'LoaderOptionsPlugin',
  'NamedModulesPlugin',
  'NamedChunksPlugin',
  'HashedModuleIdsPlugin',
  'ModuleFilenameHelpers',
].forEach(plugin => {
  plugins[pluginName(plugin)] = (...args) => new webpack[plugin](...args)
})
;[
  'AggressiveMergingPlugin',
  'AggressiveSplittingPlugin',
  'CommonsChunkPlugin',
  'ChunkModuleIdRangePlugin',
  'DedupePlugin',
  'LimitChunkCountPlugin',
  'MinChunkSizePlugin',
  'OccurrenceOrderPlugin',
  //'UglifyJsPlugin'
].forEach(plugin => {
  plugins[pluginName(plugin)] = (...args) =>
    new webpack.optimize[plugin](...args)
})

/**
 * https://webpack.js.org/plugins/define-plugin/
 *
 * Replace tokens in code with static values. Defaults to setting NODE_ENV
 * which is used by React and other libraries to toggle development mode.
 */
plugins.define = (defines = {}) =>
  new webpack.DefinePlugin({
    ...defines,
    env: {
      NODE_ENV: JSON.stringify(env.NODE_ENV),
      ...defines.env
    },
  })

/**
 * The webpack2 shim plugin for passing options to loaders. Sets
 * the minize and debug options to `true` in production (used by various loaders)
 */
plugins.loaderOptions = (options = {}) =>
  new webpack.LoaderOptionsPlugin({
    options,
    minimize: PRODUCTION,
    debug: !PRODUCTION,
  })

/**
 * Minify javascript code without regard for IE8. Attempts
 * to parallelize the work to save time. Generally only add in Production
 */
plugins.uglify = ({ uglifyOptions, ...options } = {}) =>
  new UglifyPlugin({
    parallel: {
      cache: true,
      workers: os.cpus().length - 1,
    },
    exclude: /\.min\.js/,
    sourceMap: true,
    uglifyOptions: {
      compress: {
        drop_console: true,
      },
      ie8: false,
      ...uglifyOptions
    },
    ...options,
  })

/**
 * Extracts css requires into a single file;
 * includes some reasonable defaults
 */
plugins.extractText = options =>
  new ExtractTextPlugin({
    filename: '[name]-[contenthash].css',
    allChunks: true,
    disable: !PRODUCTION,
    // Useful when using css modules
    ignoreOrder: true,
    ...options,
  })

plugins.extractText.extract = (...args) =>
  ExtractTextPlugin.extract(...args)

/**
 * Generates an html file that includes the output bundles.
 * Sepecify a `title` option to set the page title.
 */
plugins.html = opts =>
  new HtmlWebpackPlugin({
    inject: true,
    template: path.join(__dirname, './assets/index.html'),
    ...opts,
  })

plugins.moment = () => new webpack.IgnorePlugin(/^\.\/locale$/, /moment$/)

const stats = (module.exports.stats = {})

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
  performance: false,
}

stats.minimal = {
  ...stats.none,
  errors: true,
  errorDetails: true,
  assets: true,
  chunks: true,
  colors: true,
  performance: true,
  timings: true,
  warnings: true,
}


exports.plugins = plugins;
exports.loaders = loaders;
exports.rules = rules;
