'use strict';

var ctrl = require('./controller');
var restifyRouter = require('restify-router').Router;
var router = new restifyRouter();
var R = require('ramda');

// apply public routes
var publicRoute = R.curry((module, r)=>router[r.verb](`/public/${module}${r.path}`, r.fn))(ctrl.module);
ctrl.public.map(publicRoute);

// apply private routes
var privateRoute = R.curry((module, r) => router[r.verb](`/${module}${r.path}`, r.fn))(ctrl.module);
ctrl.private.map(privateRoute);

// export api
module.exports = {
  api: router
};
