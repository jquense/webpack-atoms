const os = require('os')
const path = require('path')

const autoprefixer = require('autoprefixer')
const camelCase = require('lodash/camelCase')
const ExtractTextPlugin = require('extract-text-webpack-plugin')
const flexbugs = require('postcss-flexbugs-fixes')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const UglifyParallelPlugin = require('webpack-uglify-parallel')
const webpack = require('webpack')

const { env } = process
const PRODUCTION = env.NODE_ENV === 'production'

const DEFAULT_BROWSERS = ['> %1', 'last 4 versions', 'Firefox ESR']

const VENDOR_MODULE_REGEX = /node_modules/

const a = (...args) => Object.assign({}, ...args)

/**
 * Loaders
 */
const loaders = (exports.loaders = {})

loaders.style = {
  loader: require.resolve('style-loader'),
}

loaders.css = (opts = {}) => ({
  loader: require.resolve('css-loader'),
  options: a(
    {
      minimize: PRODUCTION,
      camelCase: 'dashesOnly',
      // https://github.com/webpack-contrib/css-loader/issues/406
      localIdentName: '[name]--[local]--[hash:base64:5]',
    },
    opts
  ),
})

loaders.postcss = ({ plugins, browsers = DEFAULT_BROWSERS } = {}) => ({
  loader: require.resolve('postcss-loader'),
  options: {
    ident: 'postcss',
    plugins: () => [
      flexbugs,
      autoprefixer({
        browsers,
        flexbox: 'no-2009',
      }),
      ...plugins,
    ],
  },
})

loaders.url = options => ({
  loader: require.resolve('url-loader'),
  options: a(
    {
      limit: 10000,
      name: '[name]-[hash].[ext]',
    },
    options
  ),
})

loaders.woff = loaders.url({
  mimetype: 'application/font-woff',
})

loaders.js = (options = {}) =>
  [
    {
      options,
      loader: require.resolve('babel-loader'),
    },
    options.inlineCSS !== false && {
      options,
      loader: require.resolve('css-literal-loader'),
    },
  ].filter(Boolean)

loaders.imports = options => ({
  loader: require.resolve('imports-loader'),
  options,
})

loaders.exports = options => ({
  loader: require.resolve('exports-loader'),
  options,
})

/**
 * Rules
 */
const rules = (exports.rules = {})

/**
 * Javascript loader via babel, excludes node_modules
 */
rules.js = options => ({
  test: /\.js$/,
  exclude: VENDOR_MODULE_REGEX,
  use: loaders.js(options),
})

/**
 * Loads image assets, inlines images via a data URI if they are below
 * the size threshold
 */
rules.images = () => ({
  use: loaders.url,
  test: [/\.(eot|ttf|svg)(\?.*)?$/, /\.(gif|png|mp4)$/],
})

/**
 * Web font loader
 */
rules.woff = () => ({
  use: loaders.woff,
  test: /\.woff2?(\?.*)?$/,
})

/**
 * CSS style loader, excludes node_modules.
 */
rules.css = options => ({
  test: /\.css$/,
  use: ExtractTextPlugin.extract({
    fallback: loaders.style,
    use: [
      loaders.css(a({}, options, { importLoaders: 1 })),
      loaders.postcss(options),
    ],
  }),
})

/**
 * CSS style loader, _includes_ node_modules.
 */
rules.css.external = options =>
  a(rules.css(options), {
    include: VENDOR_MODULE_REGEX,
  })

/**
 * Less style loader, excludes node_modules.
 */
rules.less = options => ({
  test: /\.less$/,
  use: ExtractTextPlugin.extract({
    fallback: loaders.style,
    use: [loaders.css(options), require.resolve('less-loader')],
  }),
})

/**
 * Less style loader, _includes_ node_modules.
 */
rules.less.external = options =>
  a(rules.less(options), {
    include: VENDOR_MODULE_REGEX,
  })

/**
 * SCSS style loader, excludes node_modules.
 */
rules.scss = options => ({
  test: /\.scss$/,
  use: ExtractTextPlugin.extract({
    fallback: loaders.style,
    use: [loaders.css(options), require.resolve('scss-loader')],
  }),
})

/**
 * SCSS style loader, _includes_ node_modules.
 */
rules.scss.external = options =>
  a(rules.scss(options), {
    include: VENDOR_MODULE_REGEX,
  })

rules.noAMD = ({ exlude, include }) => ({
  parser: { amd: false },
  exlude,
  include,
})

/**
 * Plugins
 */
const plugins = (exports.plugins = {})
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
  new webpack.DefinePlugin(
    a(defines, {
      env: ({
        NODE_ENV: JSON.stringify(env.NODE_ENV),
      }, defines.env),
    })
  )

/**
 * The webpack2 shim plugin for passing options to loaders. Sets
 * the minize and debug options to `true` in production (used by various loaders)
 */
plugins.loaderOptions = options =>
  new webpack.LoaderOptionsPlugin({
    options,
    minimize: PRODUCTION,
    debug: !PRODUCTION,
  })

/**
 * Minify javascript code without regard for IE8. Attempts
 * to parallelize the work to save time. Generally only add in Production
 */
plugins.uglify = () =>
  new UglifyParallelPlugin({
    workers: os.cpus().length,
    sourceMap: true,
    compress: {
      screw_ie8: true,
      warnings: false,
      drop_console: true,
    },
    mangle: {
      screw_ie8: true,
    },
    output: {
      comments: false,
      screw_ie8: true,
    },
  })

/**
 * Extracts css requires into a single file;
 * includes some reasonable defaults
 */
plugins.extractText = options =>
  new ExtractTextPlugin(
    a(
      {
        filename: '[name]-[contenthash].css',
        allChunks: true,
        disable: !PRODUCTION,
        // Useful when using css modules
        ignoreOrder: true,
      },
      options
    )
  )

/**
 * Generates an html file that includes the output bundles.
 * Sepecify a `title` option to set the page title.
 */
plugins.html = opts =>
  new HtmlWebpackPlugin(
    a(
      {
        inject: true,
        template: path.join(__dirname, '../assets/index.html'),
      },
      opts
    )
  )

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

stats.minimal = a(stats.none, {
  errors: true,
  errorDetails: true,
  assets: true,
  chunks: true,
  colors: true,
  performance: true,
  timings: true,
  warnings: true,
})
