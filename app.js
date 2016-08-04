'use strict';

var restify = require('restify');
var bunyan = require('bunyan');
var API = require('./backend');
var path = require('path');

// setup logger
let log = bunyan.createLogger({
  name: 'flights.locomote',
  level: process.env.LOG_LEVEL || 'info',
  stream: process.stdout,
  serializers: bunyan.stdSerializers
});

/**
 * if the port is undefined in process.env.PORT, it will be 3000 by default
 */
var port = process.env.PORT || 3000;
var api = new API(log, port);

// init API
api.init()
  .then((server)=> {
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