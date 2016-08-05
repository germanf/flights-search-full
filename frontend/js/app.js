(function (window, document, $, moment, undefined) {
  "use strict";

  // cache common elements
  var $win = $(window);
  var $doc = $(document);
  var $body = $('body');
  var searchFilters = {from: '', to: '', date: ''};

  // endpoint base url
  var baseUrl = "http://localhost:3000/api/v1/public/flight/"; // the script where you handle the form input.

  // Site Preloader
  // -----------------------------------
  NProgress.start();

  $(function () {
    NProgress.done();
    $body.addClass('site-loaded');
  });

  // Autocomplete
  //
  function setAutocomplete(idElement, cbk) {
    $(idElement).autocomplete({
      minChars: 3,
      serviceUrl: baseUrl + 'airports',
      paramName: 'q',
      transformResult: function (response) {
        return {
          suggestions: $.map(JSON.parse(response), function (data) {
            return {value: data.airportName, data: data.airportCode};
          })
        };
      },
      onSelect: cbk
    });
  }

  setAutocomplete('#origin-airport', function (suggestion) {
    searchFilters.from = suggestion.data
  });
  setAutocomplete('#destination-airport', function (suggestion) {
    searchFilters.to = suggestion.data
  });

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
  var buildFlightSearchs = function (urlBase, departureDate, airlines) {
    var flightRequests = [];

    airlines.map(function (airline) {
      var flighSearchUrl = urlBase + airline.code;
      searchFilters.date = departureDate;
      flightRequests.push(deferFlightSearch(flighSearchUrl, searchFilters));
    });

    return flightRequests;
  };

  /**
   * exec call for the given departure date
   */
  var execFlightSearchs = function (urlFlightSearchBase, departureDate, airlines) {
    var flightsInDepartureDay = buildFlightSearchs(urlFlightSearchBase, departureDate, airlines);
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
  var execAllFlightSearchs = function (urlFlightSearchBase, departureDate, airlines) {
    var twoDaysBefore = moment(departureDate, 'YYYY-MM-DD').add(-2, 'days').format('YYYY-MM-DD');
    var oneDayBefore = moment(departureDate, 'YYYY-MM-DD').add(-1, 'days').format('YYYY-MM-DD');
    var oneDayAfter = moment(departureDate, 'YYYY-MM-DD').add(1, 'days').format('YYYY-MM-DD');
    var twoDaysAfter = moment(departureDate, 'YYYY-MM-DD').add(2, 'days').format('YYYY-MM-DD');

    execFlightSearchs(urlFlightSearchBase, departureDate, airlines);
    execFlightSearchs(urlFlightSearchBase, oneDayBefore, airlines);
    execFlightSearchs(urlFlightSearchBase, twoDaysBefore, airlines);
    execFlightSearchs(urlFlightSearchBase, oneDayAfter, airlines);
    execFlightSearchs(urlFlightSearchBase, twoDaysAfter, airlines);
  }

  /**
   * Flight search submit form
   */
  $("#form-search").submit(function (e) {
    var urlAirlines = baseUrl + 'airlines',
      urlFlightSearchBase = baseUrl + 'search/',
      departureDate = moment($('#departure-date').val()).format('YYYY-MM-DD');

    $("#content-wrapper").addClass('whirl');

    $.get(urlAirlines)
      .done(function (airlines) {
        airlines = JSON.parse(airlines);

        execAllFlightSearchs(urlFlightSearchBase, departureDate, airlines);
        $("#content-wrapper").removeClass('whirl');
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
