# webpack-atoms
Small atomic bits for crafting webpack configs

```sh
npm i webpack-atoms
```

**webpack.config**
```js
const { rules, plugins, loaders } = require('webpack-atoms');

module.exports = {
  entry: './src/app.js',
  output: {
    /* ... */
  },

  module: {
    rules: [
      rules.js(),
      rules.images(),
      rules.css(),
    ]
  },

  plugins: [
    plugins.ugilfy(),
    plugins.loaderOptions(),
    plugins.extractText(),
  ]
}
```
