// @flow

const path = require('path')

const autoprefixer = require('autoprefixer')
const flexbugs = require('postcss-flexbugs-fixes')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const UglifyPlugin = require('uglifyjs-webpack-plugin')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const webpack = require('webpack')

const builtinPlugins = require('./plugins')
const statsConfig = require('./stats')

export type Env = 'production' | 'test' | 'development'

export type LoaderSpec = string | { loader: string, options?: Object }
export type LoaderResolver<T: Object> = (options?: T) => LoaderSpec

type Condition = string | RegExp | RegExp[]

export type Rule = {
  test?: Condition,
  use: LoaderSpec[],
  exclude?: Condition,
  include?: Condition,
}

export type RuleFactory<T: Object> = (options?: T) => Rule

export type ContextualRuleFactory = RuleFactory<*> & {
  internal: RuleFactory<*>,
  external: RuleFactory<*>,
}

type PluginInstance = any
type PluginFactory = (...args?: any) => PluginInstance

type BuiltinPlugins = typeof builtinPlugins

export type StatKeys = $Keys<typeof statsConfig> // eslint-disable-line
export type StatsConfig = {| [key: StatKeys]: boolean |}
type StatAtoms = {|
  none: StatsConfig,
  minimal: StatsConfig,
|}

export type WebpackAtomsOptions = {
  babelConfig?: Object,
  browsers?: string[],
  vendorRegex?: RegExp,
  env: ?Env,
  assetRelativeRoot?: string,
  useMiniExtract: boolean,
}

export type LoaderAtoms = {
  json: LoaderResolver<*>,
  yaml: LoaderResolver<*>,
  null: LoaderResolver<*>,
  raw: LoaderResolver<*>,

  style: LoaderResolver<*>,
  css: LoaderResolver<*>,
  cssLiteral: LoaderResolver<*>,
  postcss: LoaderResolver<{
    browsers?: string[],
    plugins?: Array<any> | ((loader: any) => Array<any>),
  }>,
  less: LoaderResolver<*>,
  sass: LoaderResolver<*>,

  file: LoaderResolver<*>,
  url: LoaderResolver<*>,
  js: LoaderResolver<*>,

  imports: LoaderResolver<*>,
  exports: LoaderResolver<*>,
}

type JsRule = RuleFactory<*> & {
  inlineCss: RuleFactory<*>,
}

export type RuleAtoms = {
  js: JsRule,
  yaml: RuleFactory<*>,
  fonts: RuleFactory<*>,
  images: RuleFactory<*>,
  audioVideo: RuleFactory<*>,
  files: RuleFactory<*>,

  css: ContextualRuleFactory,
  postcss: ContextualRuleFactory,
  less: ContextualRuleFactory,
  sass: ContextualRuleFactory,
}

export type PluginAtoms = BuiltinPlugins & {
  define: PluginFactory,
  extractText: PluginFactory,
  html: PluginFactory,
  loaderOptions: PluginFactory,
  moment: PluginFactory,
  uglify: PluginFactory,
}

export type WebpackAtoms = {
  loaders: LoaderAtoms,

  rules: RuleAtoms,

  plugins: PluginAtoms,

  stats: StatAtoms,
}

let VENDOR_MODULE_REGEX = /node_modules/
let DEFAULT_BROWSERS = ['> 1%', 'Firefox ESR', 'not ie < 9']

function createAtoms(options?: WebpackAtomsOptions): WebpackAtoms {
  let {
    babelConfig = {},
    assetRelativeRoot = '',
    env = process.env.NODE_ENV,
    vendorRegex = VENDOR_MODULE_REGEX,
    disableMiniExtractInDev = true,
    browsers: supportedBrowsers = DEFAULT_BROWSERS,
  } =
    options || {}

  const makeExternalOnly = (original: RuleFactory<*>) => (
    options = {}
  ): Rule => {
    let rule = original(options)
    rule.include = vendorRegex
    return rule
  }

  const makeInternalOnly = (original: RuleFactory<*>) => (
    options = {}
  ): Rule => {
    let rule = original(options)
    rule.exclude = vendorRegex
    return rule
  }

  const makeExtractLoaders = ({ extract } = {}, config) => [
    loaders.miniCssExtract({
      fallback: config.fallback,
      disable: extract == undefined ? extract : !extract,
    }),
    ...config.use,
  ]

  const PRODUCTION = env === 'production'

  let ident = 0

  /**
   * Loaders
   */
  const loaders: LoaderAtoms = {
    json: () => ({
      loader: require.resolve('json-loader'),
    }),

    yaml: () => ({
      loader: require.resolve('yaml-loader'),
    }),

    null: () => ({
      loader: require.resolve('null-loader'),
    }),

    raw: () => ({
      loader: require.resolve('raw-loader'),
    }),

    style: () => ({
      loader: require.resolve('style-loader'),
    }),

    miniCssExtract: ({
      disable = !PRODUCTION && disableMiniExtractInDev,
      fallback,
      ...options
    }) =>
      disable
        ? fallback || loaders.style()
        : {
            loader: MiniCssExtractPlugin.loader,
            options,
          },

    css: (options = {}) => ({
      loader: require.resolve('css-loader'),
      options: {
        minimize: PRODUCTION,
        sourceMap: !PRODUCTION,
        camelCase: 'dashesOnly',
        // https://github.com/webpack-contrib/css-loader/issues/406
        localIdentName: '[name]--[local]--[hash:base64:5]',
        ...options,
      },
    }),

    cssLiteral: (options = {}) => ({
      options,
      loader: require.resolve('css-literal-loader'),
    }),

    postcss: (options = {}) => {
      let { plugins, browsers = supportedBrowsers, ...postcssOpts } = options

      return {
        loader: require.resolve('postcss-loader'),
        options: {
          ident: `postcss-${++ident}`,
          plugins: loader => {
            plugins =
              (typeof plugins === `function` ? plugins(loader) : plugins) || []

            return [
              flexbugs,
              autoprefixer({ browsers, flexbox: `no-2009` }),
              ...plugins,
            ]
          },
          ...postcssOpts,
        },
      }
    },

    less: (options = {}) => ({
      options,
      loader: require.resolve('less-loader'),
    }),

    sass: (options = {}) => ({
      options,
      loader: require.resolve('sass-loader'),
    }),

    file: (options = {}) => ({
      loader: require.resolve('url-loader'),
      options: {
        name: `${assetRelativeRoot}[name]-[hash].[ext]`,
        ...options,
      },
    }),

    url: (options = {}) => ({
      loader: require.resolve('url-loader'),
      options: {
        limit: 10000,
        name: `${assetRelativeRoot}[name]-[hash].[ext]`,
        ...options,
      },
    }),

    js: (options = babelConfig) => ({
      options,
      loader: require.resolve('babel-loader'),
    }),

    imports: (options = {}) => ({
      options,
      loader: require.resolve('imports-loader'),
    }),

    exports: (options = {}) => ({
      options,
      loader: require.resolve('exports-loader'),
    }),
  }

  /**
   * Rules
   */
  const rules = {}

  /**
   * Javascript loader via babel, excludes node_modules
   */
  {
    let js = (options = {}) => ({
      test: /\.jsx?$/,
      exclude: vendorRegex,
      use: [loaders.js(options)],
    })

    js.inlineCss = (options = {}) => {
      let { tagName, extension, ...rest } = options
      let rule = js(rest)
      rule.use.push(loaders.cssLiteral({ tagName, extension }))
      return rule
    }

    rules.js = js
  }

  rules.yaml = () => ({
    test: /\.ya?ml/,
    use: [loaders.json(), loaders.yaml()],
  })

  /**
   * Font loader
   */
  rules.fonts = () => ({
    use: [loaders.url()],
    test: /\.(eot|otf|ttf|woff(2)?)(\?.*)?$/,
  })

  /**
   * Loads image assets, inlines images via a data URI if they are below
   * the size threshold
   */
  rules.images = () => ({
    use: [loaders.url()],
    test: /\.(ico|svg|jpg|jpeg|png|gif|webp)(\?.*)?$/,
  })

  /**
   * Loads audio or video assets
   */
  rules.audioVideo = () => ({
    use: [loaders.file()],
    test: /\.(mp4|webm|wav|mp3|m4a|aac|oga|flac)$/,
  })

  /**
   * A catch-all rule for everything that isn't js, json, or html.
   * Should only be used in the context of a webpack `oneOf` rule as a fallback
   * (see rules.assets())
   */
  rules.files = () => ({
    // Exclude `js` files to keep "css" loader working as it injects
    // it's runtime that would otherwise processed through "file" loader.
    // Also exclude `html` and `json` extensions so they get processed
    // by webpacks internal loaders.
    exclude: [/\.jsx?$/, /\.html$/, /\.json$/],
    use: [loaders.file()],
  })

  /**
   * CSS style loader.
   */
  {
    const css = ({ browsers, ...options } = {}) => ({
      test: /\.css$/,
      use: makeExtractLoaders(options, {
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
    css.internal = makeInternalOnly(css)
    css.external = makeExternalOnly(css)
    css.modules = options => ({
      ...css({ ...options, modules: true }),
      test: /\.module\.css$/,
    })

    rules.css = css
  }

  /**
   * PostCSS loader.
   */
  {
    const postcss = ({ modules, ...opts } = {}) => ({
      test: /\.css$/,
      use: makeExtractLoaders(opts, {
        fallback: loaders.style,
        use: [
          loaders.css({ importLoaders: 1, modules }),
          loaders.postcss(opts),
        ],
      }),
    })

    /**
     * PostCSS loader, _excludes_ node_modules.
     */
    postcss.internal = makeInternalOnly(postcss)
    postcss.external = makeExternalOnly(postcss)
    postcss.modules = options => ({
      ...postcss({ ...options, modules: true }),
      test: /\.module\.css$/,
    })
    rules.postcss = postcss
  }

  /**
   * Less style loader.
   */
  {
    const less = ({ modules, browsers, ...options } = {}) => ({
      test: /\.less$/,
      use: makeExtractLoaders(options, {
        fallback: loaders.style(),
        use: [
          loaders.css({ importLoaders: 1, modules }),
          loaders.postcss({ browsers }),
          loaders.less(options),
        ],
      }),
    })

    /**
     * Less style loader, _excludes_ node_modules.
     */
    less.internal = makeInternalOnly(less)
    less.external = makeExternalOnly(less)
    less.modules = options => ({
      ...less({ ...options, modules: true }),
      test: /\.module\.less$/,
    })
    rules.less = less
  }

  /**
   * SASS style loader, excludes node_modules.
   */
  {
    const sass = ({ browsers, modules, ...options } = {}) => ({
      test: /\.s(a|c)ss$/,
      use: makeExtractLoaders(options, {
        fallback: loaders.style(),
        use: [
          loaders.css({ importLoaders: 1, modules }),
          loaders.postcss({ browsers }),
          loaders.sass(options),
        ],
      }),
    })

    /**
     * SCSS style loader, _excludes_ node_modules.
     */
    sass.internal = makeInternalOnly(sass)
    sass.external = makeExternalOnly(sass)
    sass.modules = options => ({
      ...sass({ ...options, modules: true }),
      test: /\.module\.s(a|c)ss$/,
    })
    rules.sass = sass
  }

  /**
   * Plugins
   */
  const plugins = { ...builtinPlugins }

  /**
   * https://webpack.js.org/plugins/define-plugin/
   *
   * Replace tokens in code with static values. Defaults to setting NODE_ENV
   * which is used by React and other libraries to toggle development mode.
   */
  plugins.define = (defines = {}) =>
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': JSON.stringify(env),
      ...defines,
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
      cache: true,
      parallel: true,
      sourceMap: true,
      uglifyOptions: {
        compress: {
          drop_console: true,
        },
        ie8: false,
        ...uglifyOptions,
      },
      ...options,
    })

  /**
   * Extracts css requires into a single file;
   * includes some reasonable defaults
   */
  plugins.extractCss = options =>
    new MiniCssExtractPlugin({
      filename: '[name]-[contenthash].css',
      ...options,
    })

  /**
   * Generates an html file that includes the output bundles.
   * Sepecify a `title` option to set the page title.
   */
  plugins.html = opts =>
    new HtmlWebpackPlugin({
      inject: true,
      template: path.join(__dirname, '../assets/index.html'),
      ...opts,
    })

  plugins.moment = () => new webpack.IgnorePlugin(/^\.\/locale$/, /moment$/)

  const stats: StatAtoms = {
    none: statsConfig,
    minimal: {
      ...statsConfig,
      errors: true,
      errorDetails: true,
      assets: true,
      chunks: true,
      colors: true,
      performance: true,
      timings: true,
      warnings: true,
    },
  }

  return {
    loaders,
    rules: (rules: RuleAtoms),
    plugins: (plugins: PluginAtoms),
    stats,
  }
}

module.exports = {
  ...createAtoms(),
  createAtoms,
}
