"use strict";

var R = require('ramda');
var _ = require('lodash');
var moment = require('moment');
var request = require('superagent');

// ================= ROUTES =================
/**
 * Lists all available airlines from the Flight API.
 * @method airlines
 * @param req
 * @param res
 * @param next
 */
function airlines(req, res, next) {
  request
    .get(endpoints.airlines)
    .then((result)=> {
      var data = R.map(R.pick(["code"]), result.body);
      res.json(data);
    })
    .catch((err)=> {
      res.json(500, err);
    });
}

/**
 * Lists all matching airports from the Flight API.
 * @method airlines
 * @param req
 *    Body parameters:
 *      q - text based search param
 * @param res
 * @param next
 */
function airports(req, res, next) {
  var query = req.query;

  if (_.isEmpty(query)) {
    res.json(500, 'airport code is invalid');
    return;
  }

  request
    .get(endpoints.airports)
    .query({q: query.q})
    .then((result)=> {
      var data = R.map(R.pick(['airportCode', 'airportName', 'cityName']), result.body);
      res.json(data);
    })
    .catch((err)=> {
      res.json(500, err);
    });
}

/**
 * Provides a list of available flights for a single airline.
 * @param req
 *  URL parameters:
 *    airline_code - airline code from the airlines endpoint
 *  Body parameters:
 *    date departure date, YYYY-MM-DD
 *    from origin airport code, eg: SYD
 *    to destination airport code, eg: JFK
 * @param res
 * @param next
 */
function flightSearch(req, res, next) {
  var airlineCode = req.params.airlineCode;
  var query = req.query;

  if (_.isEmpty(airlineCode)) {
    res.json(500, 'airline code is invalid');
    return;
  }

  request
    .get(endpoints.flightSearch.replace(':airlineCode', airlineCode))
    .query({
      date: query.date,
      from: query.from,
      to: query.to
    })
    .then((result)=> {
      var data = R.map((flight)=>({
        airline: flight.airline,
        price: flight.price,
        start: R.pick(['airportName', 'cityName', 'dateTime'], flight.start),
        finish: R.pick(['airportName', 'cityName', 'dateTime'], flight.finish)
      }), result.body);
      res.json(data);
    })
    .catch((err)=> {
      res.json(500, err.response.text);
    });
}

// ================= PRIVATES =================
var flightPropsToPick = [
  'airline', 'price',
  'start.airportName', 'start.cityName', 'start.dateTime',
  'finish.airportName', 'finish.cityName', 'finish.dateTime'
];

var endpoints = {
  airlines: "http://node.locomote.com/code-task/airlines",
  airports: "http://node.locomote.com/code-task/airports",
  flightSearch: "http://node.locomote.com/code-task/flight_search/:airlineCode"
};

// ================= API =================
module.exports = {
  module: "flight",
  public: [
    {name: "airlines", path: "/airlines", fn: airlines, verb: "get"},
    {name: "airports", path: "/airports", fn: airports, verb: "get"},
    {name: "search", path: "/search/:airlineCode", fn: flightSearch, verb: "get"},
  ],
  private: []
};
