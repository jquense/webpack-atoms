import webpack from 'webpack'

type GetConstructorArgs<T> = T extends new (...args: infer U) => any ? U : never

interface WebpackPlugin extends webpack.Plugin {
  new (...args: any): any
}

interface PluginFactory<P extends new (...args: any) => any> {
  (...args: GetConstructorArgs<P>): P
}

function plugin<P extends WebpackPlugin>(plugin: P): PluginFactory<P> {
  return (...args: any) => {
    return new plugin(...args)
  }
}

const plugins = {
  normalModuleReplacement: plugin(webpack.NormalModuleReplacementPlugin),
  contextReplacement: plugin(webpack.ContextReplacementPlugin),
  ignore: plugin(webpack.IgnorePlugin),
  watchIgnore: plugin(webpack.WatchIgnorePlugin),
  banner: plugin(webpack.BannerPlugin),
  prefetch: plugin(webpack.PrefetchPlugin),
  provide: plugin(webpack.ProvidePlugin),
  hotModuleReplacement: plugin(webpack.HotModuleReplacementPlugin),
  sourceMapDevTool: plugin(webpack.SourceMapDevToolPlugin),
  evalSourceMapDevTool: plugin(webpack.EvalSourceMapDevToolPlugin),
  // evalDevToolModule: plugin(webpack.EvalDevToolModulePlugin),
  // cache: plugin(webpack.CachePlugin),
  extendedAPI: plugin(webpack.ExtendedAPIPlugin),
  // externals: plugin('ExternalsPlugin'),
  // jsonpTemplate: plugin('JsonpTemplatePlugin'),
  // libraryTemplate: plugin('LibraryTemplatePlugin'),
  // loaderTarget: plugin('LoaderTargetPlugin'),
  // memoryOutputFile: plugin('MemoryOutputFileSystem'),
  progress: plugin(webpack.ProgressPlugin),
  // setVarMainTemplate: plugin(webpack.SetVarMainTemplatePlugin),
  // umdMainTemplate: plugin(webpack.UmdMainTemplatePlugin),
  noEmitOnErrors: plugin(webpack.NoEmitOnErrorsPlugin),
  environment: plugin(webpack.EnvironmentPlugin),
  dll: plugin(webpack.DllPlugin),
  dllReference: plugin(webpack.DllReferencePlugin),
  loaderOptions: plugin(webpack.LoaderOptionsPlugin),
  namedModules: plugin(webpack.NamedModulesPlugin),
  namedChunks: plugin(webpack.NamedChunksPlugin),
  hashedModuleIds: plugin(webpack.HashedModuleIdsPlugin),
  // moduleFilenameH: plugin('ModuleFilenameHelpers'),

  aggressiveMerging: plugin(webpack.optimize.AggressiveMergingPlugin),
  aggressiveSplitting: plugin(webpack.optimize.AggressiveSplittingPlugin),
  // chunkModuleIdRange: plugin(webpack.optimize.ChunkModuleIdRangePlugin),
  limitChunkCount: plugin(webpack.optimize.LimitChunkCountPlugin),
  minChunkSize: plugin(webpack.optimize.MinChunkSizePlugin),
  occurrenceOrder: plugin(webpack.optimize.OccurrenceOrderPlugin),
  moduleConcatenation: plugin(webpack.optimize.ModuleConcatenationPlugin),
}

export default plugins
