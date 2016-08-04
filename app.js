'use strict';

var restify = require('restify');
var bunyan = require('bunyan');
var API = require('./backend');

// setup logger
let log = bunyan.createLogger({
  name: 'flights.locomote',
  level: process.env.LOG_LEVEL || 'info',
  stream: process.stdout,
  serializers: bunyan.stdSerializers
});

var port = 3000;
var api = new API(log, port);

// init API
api.init()
  .then((server)=> {
    // serve static files (frontend)
    server.get(/\/app\/?.*/, restify.serveStatic({
      directory: __dirname
    }));

    server.listen(
      port, (err) => {
        if (err) {
          console.error(err);
        } else {
          console.log('App is ready at : ' + port);
          console.log('running on :' + process.cwd());
        }
      });
  })