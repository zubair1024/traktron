/**
 * Created by Glenn on 2015-08-13.
 */

import maps from 'googlemaps';
import { RoutingEngine as RoutingEngineInterface } from '../routing-engine';

/**
 *
 * @implements {RoutingEngine}
 */
const GoogleMapsRoutingEngine = stampit()
  .init(({ instance }) => {
    const { routingManager, viewer } = instance;

    /* region private properties */

    /*
     *
     */
    let placesService;

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
        const { bottom, right, top, left } =  viewer.getBoundingBox();

        placesService.textSearch({
          query,
          bounds: new google.maps.LatLngBounds(
            new google.maps.LatLng(bottom, right),
            new google.maps.LatLng(top, left)
          ),
        }, (results, status) => {

          if (status === google.maps.places.PlacesServiceStatus.OK) {
            const places = _.map(results, (item) => {
              const { geometry, name, formatted_address } = item;
              const { location } = geometry;

              return {
                icon: 'mc-icon-routing-typeaddress',
                lat : location.lat(),
                lng : location.lng(),
                name: `${name}, ${formatted_address}`,
              };
            });

            defer.resolve(places);
          } else {
            defer.reject({ message: status });
          }
        });

        return defer.promise();
      },

      /**
       *
       * @returns {Promise}
       */
      calculateRoute() {
        const defer     = $.Deferred();
        const waypoints = routingManager.getValidWaypoints();
        const start     = waypoints.shift();
        const end       = waypoints.pop();
        const { tollroad, motorway, boatFerry }  = routingManager.getRouteFeatures();
        const request   = {
          avoidTolls   : (tollroad < 0),
          avoidHighways: (motorway < 0),
          avoidFerries : (boatFerry < 0),
          travelMode   : google.maps.TravelMode.DRIVING,
          origin       : new google.maps.LatLng(start.lat, start.lng),
          destination  : new google.maps.LatLng(end.lat, end.lng),
          waypoints    : _.map(waypoints, (waypoint) => ({
            location: new google.maps.LatLng(waypoint.lat, waypoint.lng),
            stopover: true,
          })),
        };

        routingService.route(request, (response, status) => {

          if (status === google.maps.DirectionsStatus.OK) {
            const route         = response.routes[0];
            const routingResult = {
              path     : [],
              legs     : [],
              summary  : {},
              maneuvers: [],
            };
            const { path, legs, summary, maneuvers } = routingResult;

            _.forEach(route.legs, (leg) => {
              const { distance, duration } = leg;

              legs.push({
                firstPointIndex: path.length,
                length         : distance.value,
                traveltime     : duration.value,
              });

              _.forEach(leg.steps, (step) => {
                const { instructions, maneuver } = step;

                maneuvers.push({
                  instruction  : instructions,
                  baseCssAction: 'adp-maneuver',
                  action       : maneuver,
                });

                _.forEach(step.path, (latLng) => {
                  path.push({
                    lat: parseFloat(latLng.lat().toFixed(8)),
                    lng: parseFloat(latLng.lng().toFixed(8)),
                  });
                });
              });
            });

            _.assign(summary, _.transform(legs, (result, leg) => {
              const { traveltime, length } = leg;

              result.duration = result.duration + traveltime;
              result.distance = result.distance + length;
            }), { duration: 0, distance: 0 });

            defer.resolve(routingResult);
          } else {
            defer.reject({ message: status });
          }
        });

        return defer.promise();
      },
    });

    /* endregion privileged methods */

    /* region init code */

    placesService = new google.maps.places.PlacesService(viewer.getNativeObject());

    routingService = new google.maps.DirectionsService();

    /* endregion init code */
  });

const RoutingEngine = stampit.compose(RoutingEngineInterface, GoogleMapsRoutingEngine);

export { RoutingEngine as default, RoutingEngine };
