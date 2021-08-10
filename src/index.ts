/* eslint-disable prefer-const */
/* eslint-disable @typescript-eslint/no-shadow */
/* eslint-disable @typescript-eslint/ban-types */
import path from 'path'
import autoprefixer from 'autoprefixer'
import { loadConfig } from 'browserslist'
import CopyWebpackPlugin from 'copy-webpack-plugin'
import FaviconsWebpackPlugin from 'favicons-webpack-plugin'
import HtmlWebpackPlugin from 'html-webpack-plugin'
import MiniCssExtractPlugin from 'mini-css-extract-plugin'
import CssMinimizerPlugin from 'css-minimizer-webpack-plugin'
import TerserPlugin from 'terser-webpack-plugin'
import webpack, { RuleSetRule, RuleSetUseItem } from 'webpack'
import UnusedFilesWebpackPlugin from '@4c/unused-files-webpack-plugin'
import builtinPlugins from './plugins'
import statsConfig, { StatsOptions } from './stats'
import type { FaviconWebpackPlugionOptions } from 'favicons-webpack-plugin/src/options'

export type { FaviconWebpackPlugionOptions, HtmlWebpackPlugin }

export type Env = 'production' | 'test' | 'development'

export type LoaderResolver<T extends {}> = (options?: T) => RuleSetUseItem

type Rule = RuleSetRule

export type RuleFactory<T extends {} = {}> = (options?: T) => Rule

export type ContextualRuleFactory<T = {}> = RuleFactory<T> & {
  internal: RuleFactory<T>
  external: RuleFactory<T>
}

export interface AstroTurfOptions {
  getFileName?(path: string, opts: AstroTurfOptions, id: string): string
  allowGlobal?: boolean
  extension?: string
  tagName?: string
  styleTag?: string
  useAltLoader?: boolean
}

export type AstroturfRuleFactory = RuleFactory<AstroTurfOptions> & {
  sass: RuleFactory<AstroTurfOptions>
  less: RuleFactory<AstroTurfOptions>
}

type PluginInstance = any
type PluginFactory = (...args: any) => PluginInstance

type BuiltinPlugins = typeof builtinPlugins

type StatAtoms = {
  none: StatsOptions
  minimal: StatsOptions
}

export type WebpackAtomsOptions = {
  babelConfig?: {}
  browsers?: string[]
  vendorRegex?: RegExp
  env?: Env | null
  assetRelativeRoot?: string
  disableMiniExtractInDev?: boolean
  ignoreBrowserslistConfig?: boolean
}

export type LoaderAtoms = {
  json: LoaderResolver<any>
  yaml: LoaderResolver<any>
  null: LoaderResolver<any>
  raw: LoaderResolver<any>

  style: LoaderResolver<any>
  css: LoaderResolver<any>
  miniCssExtract: LoaderResolver<
    {
      disable?: boolean
      fallback?: RuleSetUseItem
    } & MiniCssExtractPlugin.PluginOptions
  >
  astroturf: LoaderResolver<any>
  postcss: LoaderResolver<{
    browsers?: string[]
    postcssOptions?:
      | Record<string, any>
      | ((...args: any[]) => Record<string, any>)
  }>
  less: LoaderResolver<any>
  sass: LoaderResolver<any>

  file: LoaderResolver<any>
  url: LoaderResolver<any>
  js: LoaderResolver<any>

  imports: LoaderResolver<any>
  exports: LoaderResolver<any>
}

type JsRule = RuleFactory<any> & {
  inlineCss: RuleFactory<any>
}

export type RuleAtoms = {
  js: JsRule
  yaml: RuleFactory<any>
  fonts: RuleFactory<any>
  images: RuleFactory<any>
  audioVideo: RuleFactory<any>
  files: RuleFactory<any>

  css: ContextualRuleFactory
  postcss: ContextualRuleFactory
  less: ContextualRuleFactory
  sass: ContextualRuleFactory

  astroturf: AstroturfRuleFactory
}

export type PluginAtoms = BuiltinPlugins & {
  define: PluginFactory
  extractCss: PluginFactory
  html: PluginFactory
  loaderOptions: PluginFactory
  moment: PluginFactory
  minifyJs: PluginFactory
  minifyCss: PluginFactory
  unusedFiles: PluginFactory
  favicons: PluginFactory
  copy: PluginFactory
}

export type WebpackAtoms = {
  loaders: LoaderAtoms

  rules: RuleAtoms

  plugins: PluginAtoms

  stats: StatAtoms

  makeExternalOnly: (original: RuleFactory<any>) => RuleFactory<any>
  makeInternalOnly: (original: RuleFactory<any>) => RuleFactory<any>
  makeExtractLoaders: (
    options: { extract?: boolean },
    config: { fallback: RuleSetUseItem; use: RuleSetUseItem[] },
  ) => RuleSetUseItem[]
}

const VENDOR_MODULE_REGEX = /node_modules/
const DEFAULT_BROWSERS = ['> 1%', 'Firefox ESR', 'not ie < 9']

function createAtoms(options: WebpackAtomsOptions = {}): WebpackAtoms {
  let {
    babelConfig = {},
    assetRelativeRoot = '',
    env = process.env.NODE_ENV,
    vendorRegex = VENDOR_MODULE_REGEX,
    disableMiniExtractInDev = true,
    ignoreBrowserslistConfig = false,
    browsers: supportedBrowsers,
  } = options

  const hasBrowsersListConfig = !!loadConfig({ path: path.resolve('.') })

  if (ignoreBrowserslistConfig || !hasBrowsersListConfig) {
    supportedBrowsers = supportedBrowsers || DEFAULT_BROWSERS
  }

  const makeExternalOnly = (original: RuleFactory<any>) => (
    options = {},
  ): Rule => {
    const rule = original(options)
    rule.include = vendorRegex
    return rule
  }

  const makeInternalOnly = (original: RuleFactory<any>) => (
    options = {},
  ): Rule => {
    const rule = original(options)
    rule.exclude = vendorRegex
    return rule
  }

  const makeContextual = <T>(
    rule: RuleFactory<T>,
  ): ContextualRuleFactory<T> => {
    return Object.assign(rule, {
      external: makeExternalOnly(rule),
      internal: makeInternalOnly(rule),
    })
  }

  const makeExtractLoaders = (
    { extract }: { extract?: boolean } = {},
    config: { fallback: RuleSetUseItem; use: RuleSetUseItem[] },
  ): RuleSetUseItem[] => [
    // eslint-disable-next-line @typescript-eslint/no-use-before-define
    loaders.miniCssExtract({
      fallback: config.fallback,
      disable: extract == undefined ? extract : !extract,
    }),
    ...config.use,
  ]

  const PRODUCTION = env === 'production'

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

    miniCssExtract: (opts = {}) => {
      const {
        disable = !PRODUCTION && disableMiniExtractInDev,
        fallback,
        ...options
      } = opts!

      return disable
        ? fallback || loaders.style()
        : { loader: MiniCssExtractPlugin.loader, options }
    },

    css: (options = {}) => ({
      loader: require.resolve('css-loader'),
      options: {
        sourceMap: !PRODUCTION,
        ...options,
        modules: options.modules
          ? {
              // https://github.com/webpack-contrib/css-loader/issues/406
              localIdentName: '[name]--[local]--[hash:base64:5]',
              exportLocalsConvention: 'dashes',
              ...options.modules,
            }
          : false,
      },
    }),

    astroturf: (options) => ({
      options: { extension: '.module.css', ...options },
      loader: require.resolve('astroturf/loader'),
    }),

    postcss: (options = {}) => {
      let { plugins, browsers = supportedBrowsers, ...postcssOpts } = options
      const loader = require.resolve('postcss-loader')

      return {
        loader,
        options: {
          postcssOptions: {
            plugins: [
              ...(typeof plugins === `function` ? plugins(loader) : plugins) || [],
              // overrideBrowserslist is only set when browsers is explicit
              autoprefixer({
                overrideBrowserslist: browsers,
                flexbox: `no-2009`,
              }),
            ],
            ...postcssOpts,
          },
        },
      };
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
      loader: require.resolve('file-loader'),
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
  const rules: any = {}

  /**
   * Javascript loader via babel, excludes node_modules
   */
  {
    const js = (options = {}) => ({
      test: /\.(j|t)sx?$/,
      exclude: vendorRegex,
      use: [loaders.js(options)],
    })

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
    type: 'asset',
    test: /\.(eot|otf|ttf|woff(2)?)(\?.*)?$/,
    parser: {
      dataUrlCondition: {
        maxSize: 10000,
      }
    },
    generator: {
      filename: `${assetRelativeRoot}[name]-[hash].[ext]`,
    },
  })

  /**
   * Loads image assets, inlines images via a data URI if they are below
   * the size threshold
   */
  rules.images = () => ({
    type: 'asset',
    test: /\.(ico|svg|jpg|jpeg|png|gif|webp)(\?.*)?$/,
    parser: {
      dataUrlCondition: {
        maxSize: 10000,
      }
    },
    generator: {
      filename: `${assetRelativeRoot}[name]-[hash].[ext]`,
    },
  })

  /**
   * Loads audio or video assets
   */
  rules.audioVideo = () => ({
    type: 'asset/resource',
    test: /\.(mp4|webm|wav|mp3|m4a|aac|oga|flac)$/,
    generator: {
      filename: `${assetRelativeRoot}[name]-[hash].[ext]`,
    },
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
    type: 'asset/resource',
    generator: {
      filename: `${assetRelativeRoot}[name]-[hash].[ext]`,
    },
  })

  /**
   * Astroturf loader.
   */
  {
    const astroturf = (options = {}) => ({
      test: /\.(j|t)sx?$/,
      use: [loaders.astroturf(options)],
    })

    Object.assign(astroturf, {
      sass: (opts) => astroturf({ extension: '.module.scss', ...opts }),
      less: (opts) => astroturf({ extension: '.module.less', ...opts }),
    })

    rules.astroturf = astroturf as AstroturfRuleFactory
  }
  /**
   * CSS style loader.
   */
  {
    const css = ({ browsers, extract, ...options }: any = {}) => ({
      test: /\.css$/,
      use: makeExtractLoaders(
        { extract },
        {
          fallback: loaders.style(),
          use: [
            loaders.css({ ...options, importLoaders: 1 }),
            loaders.postcss({ browsers }),
          ],
        },
      ),
    })

    rules.css = makeContextual(({ modules = true, ...opts }: any = {}) => ({
      oneOf: [
        { ...css({ ...opts, modules }), test: /\.module\.css$/ },
        css(opts),
      ],
    }))
  }

  /**
   * PostCSS loader.
   */
  {
    const postcss = ({ modules, extract, ...opts }: any = {}) => ({
      test: /\.css$/,
      use: makeExtractLoaders(
        { extract },
        {
          fallback: loaders.style(),
          use: [
            loaders.css({ importLoaders: 1, modules }),
            loaders.postcss(opts),
          ],
        },
      ),
    })

    rules.postcss = makeContextual(({ modules = true, ...opts }: any = {}) => ({
      oneOf: [
        { ...postcss({ ...opts, modules }), test: /\.module\.css$/ },
        postcss(opts),
      ],
    }))
  }

  /**
   * Less style loader.
   */
  {
    const less = ({ modules, browsers, extract, ...options }: any = {}) => ({
      test: /\.less$/,
      use: makeExtractLoaders(
        { extract },
        {
          fallback: loaders.style(),
          use: [
            loaders.css({ importLoaders: 2, modules }),
            loaders.postcss({ browsers }),
            loaders.less(options),
          ],
        },
      ),
    })

    rules.less = makeContextual(({ modules = true, ...opts }: any = {}) => ({
      oneOf: [
        { ...less({ ...opts, modules }), test: /\.module\.less$/ },
        less(opts),
      ],
    }))
  }

  /**
   * SASS style loader, excludes node_modules.
   */
  {
    const sass = ({ browsers, modules, extract, ...options }: any = {}) => ({
      test: /\.s(a|c)ss$/,
      use: makeExtractLoaders(
        { extract },
        {
          fallback: loaders.style(),
          use: [
            loaders.css({ importLoaders: 2, modules }),
            loaders.postcss({ browsers }),
            loaders.sass(options),
          ],
        },
      ),
    })

    rules.sass = makeContextual(({ modules = true, ...opts }: any = {}) => ({
      oneOf: [
        { ...sass({ ...opts, modules }), test: /\.module\.s(a|c)ss$/ },
        sass(opts),
      ],
    }))
  }

  /**
   * Plugins
   */
  const plugins: PluginAtoms = {
    ...builtinPlugins,
    /**
     * https://webpack.js.org/plugins/define-plugin/
     *
     * Replace tokens in code with static values. Defaults to setting NODE_ENV
     * which is used by React and other libraries to toggle development mode.
     */
    define: (defines = {}) =>
      new webpack.DefinePlugin({
        // eslint-disable-next-line @typescript-eslint/naming-convention
        'process.env.NODE_ENV': JSON.stringify(env),
        ...defines,
      }),
    /**
     * Minify javascript code without regard for IE8. Attempts
     * to parallelize the work to save time. Generally only add in Production
     */
    /**
     * Minify javascript code without regard for IE8. Attempts
     * to parallelize the work to save time. Generally only add in Production
     */
    minifyJs: ({ terserOptions, ...options }: any = {}) =>
      new TerserPlugin({
        parallel: true,
        exclude: /\.min\.js/,
        terserOptions: {
          ecma: 8,
          ie8: false,
          ...terserOptions,
        },
        ...options,
      }),

    /**
     * Extracts css requires into a single file;
     * includes some reasonable defaults
     */
    extractCss: (options) =>
      new MiniCssExtractPlugin({
        filename: '[name]-[contenthash].css',
        ...options,
      }),

    minifyCss: (options = {}) => new CssMinimizerPlugin(options),

    /**
     * Generates an html file that includes the output bundles.
     * Sepecify a `title` option to set the page title.
     */
    html: (options?: HtmlWebpackPlugin.Options | undefined) =>
      new HtmlWebpackPlugin({
        inject: true,
        template: path.join(__dirname, '../assets/index.html'),
        ...options,
      }),

    moment: () =>
      new webpack.IgnorePlugin({
        contextRegExp: /^\.\/locale$/,
        resourceRegExp: /moment$/,
      }),

    copy: (...args) => new CopyWebpackPlugin(...args),
    unusedFiles: (...args) => new UnusedFilesWebpackPlugin(...args),
    favicons: (args: string | FaviconWebpackPlugionOptions) =>
      new FaviconsWebpackPlugin(args),
  }

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
    rules: rules as RuleAtoms,
    plugins: plugins as PluginAtoms,
    stats,

    makeExternalOnly,
    makeInternalOnly,
    makeExtractLoaders,
  }
}

const {
  makeExternalOnly,
  makeInternalOnly,
  makeExtractLoaders,
  stats,
  loaders,
  rules,
  plugins,
} = createAtoms()

export {
  makeExternalOnly,
  makeInternalOnly,
  makeExtractLoaders,
  loaders,
  rules,
  plugins,
  stats,
  createAtoms,
}
