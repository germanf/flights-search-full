'use strict';

var gulp = require('gulp');
var url = require('url');
var browserSync = require('browser-sync');
var proxy = require('proxy-middleware');
var nodemon = require('gulp-nodemon');

gulp.task('default', ['browser-sync'], function () {
  console.log('serving app (frontend + backend)');
});

/**
 * We need to redirect api request to port 8881, because the port 3000 is used to serve static files
 * take in mind you must serve the static files with nginx directly
 *
 */
gulp.task('browser-sync', ['nodemon'], function () {
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
    env: { 'PORT': 8881 }
}).on('start', function () {
    // to avoid nodemon being started multiple times
    if (!started) {
      cb();
      started = true;
    }
  });
});