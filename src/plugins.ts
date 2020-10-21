import webpack, { optimize, Compiler } from 'webpack'

interface WebpackPlugin {
  new (...args: any): any

  /**
   * Apply the plugin
   */
  apply(compiler: Compiler): void
}

interface PluginFactory<P extends new (...args: any) => any> {
  (...args: ConstructorParameters<P>): P
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
  progress: plugin(webpack.ProgressPlugin),
  noEmitOnErrors: plugin(webpack.NoEmitOnErrorsPlugin),
  environment: plugin(webpack.EnvironmentPlugin),
  dll: plugin(webpack.DllPlugin),
  dllReference: plugin(webpack.DllReferencePlugin),
  loaderOptions: plugin(webpack.LoaderOptionsPlugin),

  aggressiveMerging: plugin(webpack.optimize.AggressiveMergingPlugin as any),
  aggressiveSplitting: plugin(
    webpack.optimize.AggressiveSplittingPlugin as any,
  ),
  limitChunkCount: plugin(webpack.optimize.LimitChunkCountPlugin as any),
  minChunkSize: plugin(webpack.optimize.MinChunkSizePlugin as any),
  moduleConcatenation: plugin(
    webpack.optimize.ModuleConcatenationPlugin as any,
  ),
}

export default plugins
