'use strict';

System.register(['lodash', './types/queryAttributes', './types/aggregations', './types/intervals'], function (_export, _context) {
  "use strict";

  var _, convertFilterValueToProperType, ATTRIBUTE, AGGREGATION, QUERY_INTERVAL, _createClass, BitmovinAnalyticsDatasource;

  function _classCallCheck(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
      throw new TypeError("Cannot call a class as a function");
    }
  }

  return {
    setters: [function (_lodash) {
      _ = _lodash.default;
    }, function (_typesQueryAttributes) {
      convertFilterValueToProperType = _typesQueryAttributes.convertFilterValueToProperType;
      ATTRIBUTE = _typesQueryAttributes.ATTRIBUTE;
    }, function (_typesAggregations) {
      AGGREGATION = _typesAggregations.AGGREGATION;
    }, function (_typesIntervals) {
      QUERY_INTERVAL = _typesIntervals.QUERY_INTERVAL;
    }],
    execute: function () {
      _createClass = function () {
        function defineProperties(target, props) {
          for (var i = 0; i < props.length; i++) {
            var descriptor = props[i];
            descriptor.enumerable = descriptor.enumerable || false;
            descriptor.configurable = true;
            if ("value" in descriptor) descriptor.writable = true;
            Object.defineProperty(target, descriptor.key, descriptor);
          }
        }

        return function (Constructor, protoProps, staticProps) {
          if (protoProps) defineProperties(Constructor.prototype, protoProps);
          if (staticProps) defineProperties(Constructor, staticProps);
          return Constructor;
        };
      }();

      _export('BitmovinAnalyticsDatasource', BitmovinAnalyticsDatasource = function () {
        function BitmovinAnalyticsDatasource(instanceSettings, $q, backendSrv, templateSrv) {
          _classCallCheck(this, BitmovinAnalyticsDatasource);

          this.type = instanceSettings.type;
          this.url = instanceSettings.url;
          this.name = instanceSettings.name;
          this.q = $q;
          this.backendSrv = backendSrv;
          this.templateSrv = templateSrv;
          this.withCredentials = instanceSettings.withCredentials;

          this.headers = {
            'Content-Type': 'application/json',
            'X-Api-Key': instanceSettings.jsonData.apiKey
          };

          var tenantOrgId = instanceSettings.jsonData.tenantOrgId;
          if (typeof tenantOrgId === 'string' && tenantOrgId.length > 0) {
            this.headers['X-Tenant-Org-Id'] = tenantOrgId;
          }

          if (typeof instanceSettings.basicAuth === 'string' && instanceSettings.basicAuth.length > 0) {
            this.headers['Authorization'] = instanceSettings.basicAuth;
          }
        }

        _createClass(BitmovinAnalyticsDatasource, [{
          key: 'query',
          value: function query(options) {
            var _this = this;

            var query = this.buildQueryParameters(options);
            query.targets = query.targets.filter(function (t) {
              return !t.hide;
            });

            if (query.targets.length <= 0) {
              return this.q.when({ data: [] });
            }

            if (this.templateSrv.getAdhocFilters) {
              query.adhocFilters = this.templateSrv.getAdhocFilters(this.name);
            } else {
              query.adhocFilters = [];
            }

            var targetResponsePromises = _.map(query.targets, function (target) {
              target.metric = target.metric || AGGREGATION.COUNT;
              target.dimension = target.dimension || ATTRIBUTE.IMPRESSION_ID;
              target.resultFormat = target.resultFormat || 'time_series';
              target.interval = target.interval || QUERY_INTERVAL.HOUR;

              var data = {
                licenseKey: target.license,
                dimension: target.dimension,
                start: options.range.from.toISOString(),
                end: options.range.to.toISOString(),
                filters: _.map(target.filter, function (filter) {
                  return {
                    name: filter.name,
                    operator: filter.operator,
                    value: convertFilterValueToProperType(filter)
                  };
                })
              };

              if (target.metric === 'percentile') {
                data['percentile'] = target.percentileValue;
              }

              if (target.resultFormat === 'time_series') {
                data['interval'] = target.interval;
              } else if (target.resultFormat === 'table') {
                data['groupBy'] = target.groupBy;
                data['limit'] = target.limit;
              }

              return _this.doRequest({
                url: _this.url + '/analytics/queries/' + target.metric,
                data: data,
                method: 'POST',
                resultTarget: target.alias || target.refId,
                resultFormat: target.resultFormat
              });
            });

            return Promise.all(targetResponsePromises).then(function (targetResponses) {
              return {
                data: _.map(targetResponses, function (response) {
                  var datapoints = _.map(response.data.data.result.rows, function (row) {
                    return [row[1], row[0]]; // value, timestamp
                  });

                  if (response.config.resultFormat === 'time_series') {
                    datapoints = _.orderBy(datapoints, [1], 'asc');
                  }

                  return {
                    target: response.config.resultTarget,
                    datapoints: datapoints
                  };
                })
              };
            });
          }
        }, {
          key: 'testDatasource',
          value: function testDatasource() {
            return this.getLicenses().then(function (response) {
              if (response.status === 200) {
                return { status: "success", message: "Data source is working", title: "Success" };
              }
            });
          }
        }, {
          key: 'annotationQuery',
          value: function annotationQuery(options) {}
        }, {
          key: 'metricFindQuery',
          value: function metricFindQuery(query) {}
        }, {
          key: 'doRequest',
          value: function doRequest(options) {
            options.withCredentials = this.withCredentials;
            options.headers = this.headers;

            return this.backendSrv.datasourceRequest(options);
          }
        }, {
          key: 'buildQueryParameters',
          value: function buildQueryParameters(options) {
            return options;
          }
        }, {
          key: 'getLicenses',
          value: function getLicenses() {
            return this.doRequest({
              url: this.url + '/analytics/licenses',
              method: 'GET'
            });
          }
        }]);

        return BitmovinAnalyticsDatasource;
      }());

      _export('BitmovinAnalyticsDatasource', BitmovinAnalyticsDatasource);
    }
  };
});
//# sourceMappingURL=datasource.js.map