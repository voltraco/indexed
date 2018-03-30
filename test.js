const browserify = require('browserify')
const browser = require('browser-run')

browserify('browser-test.js')
  .bundle()
  .pipe(browser())
  .pipe(process.stdout)
