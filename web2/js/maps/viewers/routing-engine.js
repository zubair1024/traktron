/**
 * Created by Glenn on 2015-08-13.
 */

/**
 *
 * @interface
 */
const RoutingEngine = stampit()
  .props({

    /**
     *
     */
    routingManager: undefined,
    viewer        : undefined,
  })
  .methods({

    /**
     *
     */
    searchPlaces(query) {
      throw new Error('.searchPlaces() method not implemented.');
    },

    /**
     *
     */
    calculateRoute() {
      throw new Error('.calculateRoute() method not implemented.');
    },
  });

export { RoutingEngine as default, RoutingEngine };
