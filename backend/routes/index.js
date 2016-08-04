'use strict';

//--- API VERSION ---//
var version = 'v1';

// modules to load
var flights = require('../module/flights').api;

function routes(server) {
  flights.applyRoutes(server, version);
}

module.exports = routes;
