(function (window, document, $, moment, undefined) {
  "use strict";

  // cache common elements
  var $win = $(window);
  var $doc = $(document);
  var $body = $('body');

  // endpoint base url
  var baseUrl = "http://localhost:3000/api/v1/public/flight/"; // the script where you handle the form input.

  // Site Preloader
  // -----------------------------------
  NProgress.start();

  $(function () {
    NProgress.done();
    $body.addClass('site-loaded');
  });

  //
  // Search
  //
  /**
   * get a single deferred
   * @param flighSearchUrl
   * @param params
   * @returns {*}
   */
  var deferFlightSearch = function (flighSearchUrl, params) {
    return $.get(flighSearchUrl, params);
  };

  /**
   * Build all flight searchs for the given departure date, airlines, origins and destinations
   * @param urlBase
   * @param departureDate
   * @param airlines
   * @param origins
   * @param destinations
   * @returns {*}
   */
  var buildFlightSearchs = function (urlBase, departureDate, airlines, origins, destinations) {
    var flightRequests = [];

    airlines.map(function (airline) {
      var flighSearchUrl = urlBase + airline.code;

      return origins.map(function (origin) {
        return destinations.map(function (destination) {
          var params = {
            date: departureDate,
            from: origin.airportCode,
            to: destination.airportCode,
          };

          flightRequests.push(deferFlightSearch(flighSearchUrl, params));
        })
      })
    });

    return flightRequests;
  };

  /**
   * exec call for the given departure date
   */
  var execFlightSearchs = function (urlFlightSearchBase, departureDate, airlines, origins, destinations) {
    var flightsInDepartureDay = buildFlightSearchs(urlFlightSearchBase, departureDate, airlines, origins, destinations);
    $.when.all(flightsInDepartureDay)
      .then(function (results) {
        results.map(function (result) {
          var flight = JSON.parse(result[0]);
          console.log(flight);
        });
      });
  }

  /**
   * exec the all flight searchs, +-2 days from departure day
   * @param urlFlightSearchBase
   * @param departureDate
   * @param airlines
   * @param origins
   * @param destinations
   */
  var execAllFlightSearchs = function (urlFlightSearchBase, departureDate, airlines, origins, destinations) {
    var twoDaysBefore = moment(departureDate, 'YYYY-MM-DD').add('days', -2).format('YYYY-MM-DD');
    var oneDayBefore = moment(departureDate, 'YYYY-MM-DD').add('days', -1).format('YYYY-MM-DD');
    var oneDayAfter = moment(departureDate, 'YYYY-MM-DD').add('days', 1).format('YYYY-MM-DD');
    var twoDaysAfter = moment(departureDate, 'YYYY-MM-DD').add('days', 2).format('YYYY-MM-DD');

    execFlightSearchs(urlFlightSearchBase, departureDate, airlines, origins, destinations);
    execFlightSearchs(urlFlightSearchBase, oneDayBefore, airlines, origins, destinations);
    execFlightSearchs(urlFlightSearchBase, twoDaysBefore, airlines, origins, destinations);
    execFlightSearchs(urlFlightSearchBase, oneDayAfter, airlines, origins, destinations);
    execFlightSearchs(urlFlightSearchBase, twoDaysAfter, airlines, origins, destinations);
  }

  /**
   * Flight search submit form
   */
  $("#form-search").submit(function (e) {
    var urlAirlines = baseUrl + 'airlines',
      urlAirport = baseUrl + 'airports',
      originAirport = $('#origin-airport').val(),
      destinationAirport = $('#destination-airport').val(),
      urlFlightSearchBase = baseUrl + 'search/',
      departureDate = moment($('#departure-date').val()).format('YYYY-MM-DD');

    // get all airlines & airports based on origin and destination inputs
    $.when(
      $.get(urlAirlines),
      $.get(urlAirport, {q: originAirport}),
      $.get(urlAirport, {q: destinationAirport})
    ).then(function (airlines, origins, destinations) {
      airlines = JSON.parse(airlines[0]);
      origins = JSON.parse(origins[0]);
      destinations = JSON.parse(destinations[0]);

      execAllFlightSearchs(urlFlightSearchBase, departureDate, airlines, origins, destinations);
    });

    e.preventDefault(); // avoid to execute the actual submit of the form.
  });

  // jQuery resolve all promises
  if (jQuery.when.all === undefined) {
    jQuery.when.all = function (deferreds) {
      var deferred = new jQuery.Deferred();
      $.when.apply(jQuery, deferreds).then(
        function () {
          deferred.resolve(Array.prototype.slice.call(arguments));
        },
        function () {
          deferred.fail(Array.prototype.slice.call(arguments));
        });

      return deferred;
    }
  }

})
(window, document, window.jQuery, moment);
