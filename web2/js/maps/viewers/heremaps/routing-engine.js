/**
 * Created by Glenn on 2015-08-13.
 */

import H from 'heremaps';
import { RoutingEngine as RoutingEngineInterface } from '../routing-engine';

/**
 *
 * @implements {RoutingEngine}
 */
const HereMapsRoutingEngine = stampit()
  .init(({ instance }) => {
    const { routingManager, viewer } = instance;

    /* region private properties */

    /*
     *
     */
    let placesService;
    let placesServiceWrapper;

    /*
     *
     */
    let routingService;

    /* endregion private properties */

    /* region privileged methods */

    _.assign(instance, {

      /**
       *
       * @param query
       * @returns {Promise}
       */
      searchPlaces(query) {
        const defer = $.Deferred();
        const { left, bottom, right, top } = viewer.getBoundingBox();

        placesServiceWrapper.request(
          { q: query },
          {
            'X-Map-Viewport': `${left},${bottom},${right},${top}`,
          },
          (result) => {
            const places = _.map(result.results.items,
              (item) => {
                const { position, title, vicinity } = item;

                return {
                  icon: 'mc-icon-routing-typeaddress',
                  lat : position[0],
                  lng : position[1],

                  /*
                   * Replace the line breaks to render it
                   * in a more compact and nicer way.
                   */
                  name: `${title}, ${vicinity.replace(/<br\/>/g, ', ')}`,
                };
              });

            defer.resolve(places);
          },

          error => defer.reject(error)
        );

        return defer.promise();
      },

      /**
       *
       * @returns {Promise}
       */
      calculateRoute() {
        const defer                = $.Deferred();
        const calculateRouteParams = {

          /**
           * To retrieve the shape of the route we choose
           * the route representation mode 'display'.
           * @see https://developer.here.com/rest-apis/documentation/routing/topics/resource-calculate-route.html
           */
          representation    : 'display',
          routeAttributes   : 'summary',
          legAttributes     : 'indices,length,travelTime',
          maneuverAttributes: 'action',
        };

        /**
         *
         * @see https://developer.here.com/rest-apis/documentation/routing/topics/resource-param-type-routing-mode.html
         */
        const [p0, p1, p2, p3] = [
          routingManager.getRoutingType(),
          routingManager.getTransportMode(),
          `traffic:${routingManager.getTrafficMode()}`,
          JSON.stringify(routingManager.getRouteFeatures()).replace(/["{}]/g, ''),
        ];

        /**
         * "Dammit - so by default template strings preserve leading whitespace
         * like heredoc in PHP (which is kind of a memory I'd buried)."
         * @see https://muffinresearch.co.uk/removing-leading-whitespace-in-es6-template-strings/
         */
        calculateRouteParams.mode = `${p0};${p1};${p2};${p3}`;

        _.forEach(routingManager.getValidWaypoints(),
          (waypoint, i) => {
            calculateRouteParams[`waypoint${i}`] = `${waypoint.lat},${waypoint.lng}`;
          });

        routingService.calculateRoute(
          calculateRouteParams,
          (result) => {
            const { response } = result;

            if (response) {
              const route = response.route[0];
              const { shape, summary, leg } = route;
              const { travelTime, distance } = summary;

              const routingResult = {
                path     : _.map(shape,
                  (pointString) => {
                    const coordinates = pointString.split(',');
                    const [lat, lng] = coordinates;

                    return {
                      lat,
                      lng,
                    };
                  }),
                legs     : [],
                summary  : {
                  duration: travelTime,
                  distance: distance,
                },
                maneuvers: [],
              };

              routingResult.legs = _.map(leg,
                (leg) => {
                  const { maneuver, firstPoint, lastPoint,
                          length, travelTime, } = leg;

                  routingResult.maneuvers =
                    routingResult.maneuvers.concat(
                      _.map(maneuver, (maneuver) => {
                        const { instruction, action } = maneuver;

                        return {
                          instruction  : instruction,
                          baseCssAction: 'arrow',
                          action       : action,
                        };
                      })
                    );

                  return {
                    firstPointIndex: firstPoint,
                    lastPointIndex : lastPoint,
                    length         : length,
                    traveltime     : travelTime,
                  };
                });

              defer.resolve(routingResult);
            } else {
              defer.reject({ message: result.details });
            }
          },

          error => defer.reject(error)
        );

        return defer.promise();
      },
    });

    /* endregion privileged methods */

    /* region init code */

    const platform = viewer.getPlatform();

    placesService        = platform.getPlacesService();
    placesServiceWrapper = new H.places.Search(placesService);

    routingService = platform.getRoutingService();

    /* endregion init code */
  });

const RoutingEngine = stampit.compose(RoutingEngineInterface, HereMapsRoutingEngine);

export { RoutingEngine as default, RoutingEngine };
