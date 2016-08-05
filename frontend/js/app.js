(function (window, document, $, moment, undefined) {
  "use strict";

  // cache common elements
  var $win = $(window);
  var $doc = $(document);
  var $body = $('body');
  var searchFilters = {from: '', to: '', date: ''};

  // endpoint base url
  var baseUrl = "http://localhost:3000/api/v1/public/flight/"; // the script where you handle the form input.

  // Flight data tables
  var flightDayMinus2 = $('#table-flight-day-minus2').dataTable(),
    flightDayMinus1 = $('#table-flight-day-minus1').dataTable(),
    flightDay = $('#table-flight-day').dataTable(),
    flightDayPlus1 = $('#table-flight-day-plus1').dataTable(),
    flightDayPlus2 = $('#table-flight-day-plus2').dataTable();

  // Flight data
  var flightDataDayMinus2 = [],
    flightDataDayMinus1 = [],
    flightDataDay = [],
    flightDataDayPlus1 = [],
    flightDataDayPlus2 = [];

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
      autoSelectFirst: true,
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
   * Build all flight searchs for the given departure date, airlines
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
    return $.when.all(flightsInDepartureDay);
  }

  /**
   * Clear all datasources before to load the new data
   */
  var clearDataSources = function () {
    flightDataDayMinus2 = [];
    flightDataDayMinus1 = [];
    flightDataDay = [];
    flightDataDayPlus1 = [];
    flightDataDayPlus2 = [];

    flightDayMinus2.fnClearTable();
    flightDayMinus1.fnClearTable();
    flightDay.fnClearTable();
    flightDayPlus1.fnClearTable();
    flightDayPlus2.fnClearTable();
  };

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

    clearDataSources();

    execFlightSearchs(urlFlightSearchBase, departureDate, airlines)
      .then(function (results) {
        results.map(function (result) {
          var flight = JSON.parse(result[0]);
          flightDataDay = flightDataDay.concat(flight);
        });
      }).always(function () {
      flightDay.fnAddData(flightDataDay);
      $("#content-wrapper").removeClass('whirl');
      $("#tab-flight-day-minus1").addClass('whirl');
      $("#tab-flight-day-minus2").addClass('whirl');
      $("#tab-flight-day-plus1").addClass('whirl');
      $("#tab-flight-day-plus2").addClass('whirl');
    });

    execFlightSearchs(urlFlightSearchBase, oneDayBefore, airlines)
      .then(function (results) {
        results.map(function (result) {
          var flight = JSON.parse(result[0]);
          flightDataDayMinus1 = flightDataDayMinus1.concat(flight);
        });
      }).always(function () {
      flightDayMinus1.fnAddData(flightDataDayMinus1);
      $("#tab-flight-day-minus1").removeClass('whirl');
    });

    execFlightSearchs(urlFlightSearchBase, twoDaysBefore, airlines)
      .then(function (results) {
        results.map(function (result) {
          var flight = JSON.parse(result[0]);
          flightDataDayMinus2 = flightDataDayMinus2.concat(flight);
        });
      }).always(function () {
      flightDayMinus2.fnAddData(flightDataDayMinus2);
      $("#tab-flight-day-minus2").removeClass('whirl');
    });

    execFlightSearchs(urlFlightSearchBase, oneDayAfter, airlines)
      .then(function (results) {
        results.map(function (result) {
          var flight = JSON.parse(result[0]);
          flightDataDayPlus1 = flightDataDayPlus1.concat(flight);
        });
      }).always(function () {
      flightDayPlus1.fnAddData(flightDataDayPlus1);
      $("#tab-flight-day-plus1").addClass('whirl');
    });

    execFlightSearchs(urlFlightSearchBase, twoDaysAfter, airlines)
      .then(function (results) {
        results.map(function (result) {
          var flight = JSON.parse(result[0]);
          flightDataDayPlus2 = flightDataDayPlus2.concat(flight);
        });
      }).always(function () {
      flightDayPlus2.fnAddData(flightDataDayPlus2);
      $("#tab-flight-day-plus2").removeClass('whirl');
    });
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
