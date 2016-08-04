'use strict';

var restify = require('restify');
var Promise = require('bluebird');
var Router = require('./routes');

class API {
  /**
   * API constructor
   *  set formatters & middlewares
   * @param log
   */
  constructor(log) {
    // create server
    this.server = restify.createServer({
      name: 'src',
      log: log,
      formatters: {
        'application/json': function (req, res, body, cb) {
          res.setHeader('Cache-Control', 'must-revalidate');

          // Does the client *explicitly* accepts application/json?
          var sendPlainText = false;
          if (req.header('Accept')) {
            sendPlainText = (req.header('Accept').split(/, */).indexOf('application/json') === -1);
          }

          // Send as plain text
          if (sendPlainText) {
            res.setHeader('Content-Type', 'text/plain; charset=utf-8');
          }

          // Send as JSON
          if (!sendPlainText) {
            res.setHeader('Content-Type', 'application/json; charset=utf-8');
          }
          return cb(null, JSON.stringify(body));
        }
      }
    });

    // setup defaults middlewares
    this.server
      .pre(restify.pre.sanitizePath())
      .use(restify.fullResponse())
      .use(restify.bodyParser())
      .use(restify.queryParser())
      .use(restify.gzipResponse())
      .use(restify.CORS());

    // setup server event handlers
    this.server
      .on('uncaughtException', function (req, res, route, err) {
        console.log('******* Begin Error *******');
        console.log(route);
        console.log('*******');
        console.log(err.stack);
        console.log('******* End Error *******');
        if (!res.headersSent) {
          return res.send(500, {error: err.message});
        }
        res.write("\n");
        res.end();
      })
      .on('after', restify.auditLogger({log: log}));
  }

  init() {
    // load all routes
    var router = Router(this.server);
    return Promise.resolve(this.server);
  }
}

module.exports = API;