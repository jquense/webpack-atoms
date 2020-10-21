interface ToJsonOptionsObject {
  /** fallback value for stats options when an option is not defined (has precedence over local webpack defaults) */
  all?: boolean
  /** Add asset Information */
  assets?: boolean
  /** Sort assets by a field */
  assetsSort?: string
  /** Add built at time information */
  builtAt?: boolean
  /** Add information about cached (not built) modules */
  cached?: boolean
  /** Show cached assets (setting this to `false` only shows emitted files) */
  cachedAssets?: boolean
  /** Add children information */
  children?: boolean
  /** Add information about the `namedChunkGroups` */
  chunkGroups?: boolean
  /** Add built modules information to chunk information */
  chunkModules?: boolean
  /** Add the origins of chunks and chunk merging info */
  chunkOrigins?: boolean
  /** Add chunk information (setting this to `false` allows for a less verbose output) */
  chunks?: boolean
  /** Sort the chunks by a field */
  chunksSort?: string
  /** Context directory for request shortening */
  context?: string
  /** Display the distance from the entry point for each module */
  depth?: boolean
  /** Display the entry points with the corresponding bundles */
  entrypoints?: boolean
  /** Add --env information */
  env?: boolean
  /** Add errors */
  errors?: boolean
  /** Add details to errors (like resolving log) */
  errorDetails?: boolean
  /** Exclude assets from being displayed in stats */
  excludeAssets?: StatsExcludeFilter
  /** Exclude modules from being displayed in stats */
  excludeModules?: StatsExcludeFilter
  /** See excludeModules */
  exclude?: StatsExcludeFilter
  /** Add the hash of the compilation */
  hash?: boolean
  /** Set the maximum number of modules to be shown */
  maxModules?: number
  /** Add built modules information */
  modules?: boolean
  /** Sort the modules by a field */
  modulesSort?: string
  /** Show dependencies and origin of warnings/errors */
  moduleTrace?: boolean
  /** Add public path information */
  publicPath?: boolean
  /** Add information about the reasons why modules are included */
  reasons?: boolean
  /** Add the source code of modules */
  source?: boolean
  /** Add timing information */
  timings?: boolean
  /** Add webpack version information */
  version?: boolean
  /** Add warnings */
  warnings?: boolean
  /** Show which exports of a module are used */
  usedExports?: boolean
  /** Filter warnings to be shown */
  warningsFilter?:
    | string
    | RegExp
    | Array<string | RegExp>
    | ((warning: string) => boolean)
  /** Show performance hint when file size exceeds `performance.maxAssetSize` */
  performance?: boolean
  /** Show the exports of the modules */
  providedExports?: boolean
}

type StatsExcludeFilter =
  | string
  | string[]
  | RegExp
  | RegExp[]
  | ((assetName: string) => boolean)
  | Array<(assetName: string) => boolean>

export interface StatsOptions extends ToJsonOptionsObject {
  /** `webpack --colors` equivalent */
  colors?: boolean | string
}

const stats: StatsOptions = {
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

export default stats
