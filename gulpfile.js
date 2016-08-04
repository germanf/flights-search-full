'use strict';

var gulp = require('gulp'),
  $ = require('gulp-load-plugins')(),
  url = require('url'),
  browserSync = require('browser-sync'),
  proxy = require('proxy-middleware'),
  nodemon = require('gulp-nodemon');

// VENDOR CONFIG
var vendor = {
  app: {
    source: require('./vendor.json'),
    dest: './frontend/vendor'
  }
};

// VENDOR BUILD
// copy file from bower folder into the app vendor folder
gulp.task('vendor', function () {
  console.log('Copying vendor assets..');

  var jsFilter = $.filter('**/*.js');
  var cssFilter = $.filter('**/*.css');

  return gulp.src(vendor.app.source, {
    base: 'bower_components'
  })
    .pipe($.expectFile(vendor.app.source))
    .pipe(jsFilter)
    .pipe(jsFilter.restore())
    .pipe(cssFilter)
    .pipe(cssFilter.restore())
    .pipe(gulp.dest(vendor.app.dest));

});

gulp.task('default', ['browser-sync'], function () {
  console.log('serving app (frontend + backend)');
});

/**
 * We need to redirect api request to port 8881, because the port 3000 is used to serve static files
 * take in mind you must serve the static files with nginx directly
 *
 */
gulp.task('browser-sync', ['vendor', 'nodemon'], function () {
  console.log('Starting BrowserSync..');

  var proxyOptions = url.parse('http://localhost:8881/');
  proxyOptions.route = '/api';

  browserSync({
    notify: false,
    server: {
      baseDir: './frontend',
      middleware: [proxy(proxyOptions)]
    },
    port: 3000,
    browser: "google chrome"
  });
});

/**
 * Listen API in port 8881
 */
gulp.task('nodemon', function (cb) {
  var started = false;

  return nodemon({
    script: 'app.js',
    env: {'PORT': 8881}
  }).on('start', function () {
    // to avoid nodemon being started multiple times
    if (!started) {
      cb();
      started = true;
    }
  });
});