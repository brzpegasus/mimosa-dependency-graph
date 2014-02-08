exports.config =
  modules: ["coffeescript", "jshint"]
  coffeescript:
    options:
      sourceMap: false
  watch:
    sourceDir: "src"
    compiledDir: "lib"
    javascriptDir: null
  jshint:
    rules:
      node: true
