/**
 * Created by Glenn on 2015-07-02.
 */

const RoutingManager = stampit()
  .init(({ instance }) => {

    /* region private properties */

    /*
     *
     */
    let viewer;

    /*
     * View
     */
    let routingControls;

    /*
     *
     */
    const places    = [];
    const waypoints = [];
    const route     = {
      routingType  : 'fastest',
      transportMode: 'car',
      trafficMode  : 'default',
      features     : {
        tollroad : 0,
        motorway : 0,
        boatFerry: 0,
        tunnel   : 0,
        dirtRoad : 0,
        park     : 0,
      },
      path         : [],
      line         : undefined,
      legs         : [],
      summary      : {
        duration: NaN,
        distance: NaN,
      },
      maneuvers    : [],
    };

    /*
     *
     */
    let router;

    /*
     *
     */
    let routingLayer;

    /* endregion private properties */

    /* region privileged methods */

    _.assign(instance, {

      /**
       *
       * @returns {*}
       */
      getViewerModuleName() {
        return viewer.moduleName;
      },

      /**
       *
       * @param mapViewer
       */
      setViewer: _.once(mapViewer => viewer = mapViewer),

      /**
       *
       * @returns {*}
       */
      getRoutingControls() {
        return routingControls;
      },

      /**
       *
       * @param routingView
       */
      setRoutingControls(routingView) {
        routingControls = routingView;
      },

      /**
       *
       */
      initRoutingEngine: _.once(() => {
        router = viewer
          .getRoutingEngineFactory()
          .create({
            viewer,
            routingManager: instance,
          });

        routingLayer = viewer
          .getLayerFactory()
          .create({
            viewer,
          });
        viewer.addOverlay(routingLayer);
      }),

      /* region Places operations */

      /**
       *
       * @returns {Array}
       */
      getPlaces() {
        return places;
      },

      /**
       *
       * @param placesData
       */
      addPlaces(placesData) {
        places.push(...placesData);
        routingControls.onPlacesChanged(places);
      },

      /**
       *
       */
      clearPlaces() {
        _.pull(places, ...places);  // Fancy way for emptying array.
        routingControls.onPlacesChanged(places);
      },

      /**
       *
       * @param query
       * @returns {*}
       */
      searchPlaces(query) {
        return router.searchPlaces(query);
      },

      /* endregion Places operations */

      /* region Waypoint view-model operations */

      /**
       *
       * @param waypoint
       * @returns {boolean}
       */
      isWaypointValid(waypoint) {
        return Boolean(
          waypoint && _.isFinite(waypoint.lat) && _.isFinite(waypoint.lng));
      },

      /**
       *
       * @returns {*}
       */
      getValidWaypoints() {
        return _.filter(instance.getWaypoints(), instance.isWaypointValid);
      },

      /**
       *
       * @returns {Array}
       */
      getWaypoints() {
        return waypoints;
      },

      /**
       *
       * @param waypoint
       * @param [index]
       */
      addWaypoint(waypoint, index) {
        const len = waypoints.length;
        const i   = _.isFinite(index) ? index : len;

        waypoints.splice(i, 0, waypoint);

        waypoint.pin = instance.createWaypointPin(waypoint);
        instance.addWaypointPin(waypoint.pin);
        instance.updateWaypointLabels();

        routingControls.onWaypointAdded(waypoint, i);
      },

      /**
       *
       * @param waypoint
       * @param index
       */
      updateWaypoint(waypoint, index) {
        const updatedWaypoint = _.assign(waypoints[index], waypoint);

        waypoints.splice(index, 1, updatedWaypoint);

        instance.updateWaypointPin(updatedWaypoint);

        routingControls.onWaypointChanged(updatedWaypoint);
      },

      /**
       *
       * @param fromIndex
       * @param toIndex
       */
      reorderWaypoint(fromIndex, toIndex) {
        const waypoint = waypoints.splice(fromIndex, 1)[0];

        waypoints.splice(toIndex, 0, waypoint);

        instance.updateWaypointLabels();

        routingControls.onWaypointReordered(waypoint, toIndex);
      },

      /**
       *
       * @param index
       */
      removeWaypoint(index) {
        const waypoint = waypoints.splice(index, 1)[0];

        instance.removeWaypointPin(waypoint.pin);
        instance.updateWaypointLabels();

        routingControls.onWaypointRemoved(waypoint);
      },

      /**
       *
       */
      updateWaypointLabels() {
        const len = waypoints.length;

        _.forEach(waypoints, (waypoint, i) => {

          if (i === 0) {
            waypoint.label = 'A';
          } else if (i === len - 1) {
            waypoint.label = 'B';
          } else {
            waypoint.label = i.toString();
          }

          instance.updateWaypointPin(waypoint);
        });

        routingControls.onWaypointsLabelChanged(waypoints);
      },

      /**
       *
       * @param waypoint
       */
      createWaypointPin(waypoint) {
        let pin;

        if (instance.isWaypointValid(waypoint)) {
          const { lat, lng, label } = waypoint;

          pin = viewer
            .getMapObjectFactory()
            .create({
              viewer,
              objectModel: {
                shapeType  : 'marker',
                coordinates: [lat, lng],
                options    : {
                  label,
                },
              },
            });
        }

        return pin;
      },

      /**
       *
       * @param waypointPin
       */
      addWaypointPin(waypointPin) {

        if (waypointPin) {
          routingLayer.add(waypointPin);
        }
      },

      /**
       *
       * @param waypoint
       */
      updateWaypointPin(waypoint) {
        instance.removeWaypointPin(waypoint.pin);
        waypoint.pin = instance.createWaypointPin(waypoint);
        instance.addWaypointPin(waypoint.pin);
      },

      /**
       *
       * @param waypointPin
       */
      removeWaypointPin(waypointPin) {

        if (waypointPin) {
          routingLayer.remove(waypointPin);
        }
      },

      /* endregion Waypoint view-model operations */

      /* region Routing mode operations */

      /**
       *
       * @returns {string}
       */
      getRoutingType() {
        return route.routingType;
      },

      /**
       *
       * @returns {string}
       */
      getTransportMode() {
        return route.transportMode;
      },

      /**
       *
       * @returns {string}
       */
      getTrafficMode() {
        return route.trafficMode;
      },

      /**
       *
       * @returns {route.features|{tollroad, motorway, boatFerry, tunnel, dirtRoad, park}}
       */
      getRouteFeatures() {
        return route.features;
      },

      /**
       *
       * @param featureName
       * @param avoided
       */
      setRouteFeatureAvoided(featureName, avoided) {
        route.features[featureName] = avoided ? -1 : 0;

        routingControls.onRouteFeatureChanged(featureName, avoided);
      },

      /* endregion Routing mode operations */

      /* region Routing operations */

      /**
       *
       * @returns {boolean}
       */
      routeExists() {
        return (route.path.length >= 2);
      },

      /**
       *
       * @returns {boolean}
       */
      canCalculateRoute() {
        return (instance.getValidWaypoints().length >= 2);
      },

      /**
       *
       * @returns {*}
       */
      calculateRoute() {
        const defer = $.Deferred();
        let promise = defer.promise();

        if (instance.canCalculateRoute()) {
          promise = router.calculateRoute();
        } else {
          const routingResult = {
            path     : [],
            legs     : [],
            summary  : {},
            maneuvers: [],
          };

          defer.resolve(routingResult);
        }

        return promise;
      },

      /**
       *
       * @param result
       */
      setRoutingResult({ path, legs, summary, maneuvers }) {
        instance.setRoutePath(path);
        instance.setRouteLegs(legs);
        instance.setRouteSummary(summary);
        instance.setRouteManeuvers(maneuvers);
      },

      /**
       *
       * @param path
       */
      setRoutePath(path) {
        route.path = path;

        instance.redrawRouteLine();
      },

      /**
       *
       */
      redrawRouteLine() {
        const mapObjectFactory = viewer.getMapObjectFactory();

        instance.clearRouteLine();

        if (instance.routeExists()) {
          const line = mapObjectFactory.create({
            viewer,
            objectModel: {
              shapeType  : 'line',
              coordinates: mapObjectFactory.toCoordinates(route.path),
              options    : {
                styleName: 'routeLine',
              },
            },
          });

          route.line = line;
          routingLayer.add(line);
        }

        viewer.setBoundingBox(routingLayer.getBounds());
      },

      /**
       *
       */
      clearRouteLine() {
        const { line } = route;

        if (line) {
          route.line = undefined;
          routingLayer.remove(line);
        }
      },

      /**
       *
       * @param legs
       */
      setRouteLegs(legs) {
        route.legs = legs;
      },

      /**
       *
       * @param summary
       */
      setRouteSummary(summary) {
        route.summary = summary;

        routingControls.onRouteSummaryChanged(summary);
      },

      /**
       *
       * @param maneuvers
       */
      setRouteManeuvers(maneuvers) {
        route.maneuvers = maneuvers;

        routingControls.onManeuversChanged(maneuvers);
      },

      /**
       *
       * @returns {{start: *, end: *, maneuvers: Array}}
       */
      getRouteDirections() {
        return {
          startingPoint: _.first(waypoints).name,
          destination  : _.last(waypoints).name,
          maneuvers    : route.maneuvers,
        };
      },

      /**
       *
       * @returns {{}}
       */
      yieldSaveRouteRequestData() {
        const data = {
          path     : [],
          waypoints: [],
        };

        if (instance.routeExists()) {
          const { path, legs } = route;
          const validWaypoints = _.filter(waypoints, instance.isWaypointValid);

          _.assign(data, {
            path: _.map(path, point => `${point.lat},${point.lng}`),

            /*
             * Create waypoint data from each leg.
             * Number of legs = number of waypoints - 1.
             */
            waypoints: _.map(legs, (leg, i) => {
              const { name, domainObjectType, domainObjectId } = validWaypoints[i];
              const { firstPointIndex, length, traveltime } = leg;

              return {
                name,
                length,
                traveltime,
                domainObjectType: domainObjectType || undefined,
                domainObjectId  : domainObjectId || undefined,
                index           : firstPointIndex,
              };
            }),
          });

          /*
           * Do not forget to push the last waypoint
           * (destination) to the list.
           */
          const lastWaypoint = _.last(validWaypoints);
          const { name, domainObjectType, domainObjectId } = lastWaypoint;

          data.waypoints.push({
            name,
            domainObjectType: domainObjectType || undefined,
            domainObjectId  : domainObjectId || undefined,
            index           : path.length - 1,
            length          : 0,
            traveltime      : 0,
          });
        }

        return data;
      },

      /* endregion Routing operations */
    });

    /* endregion privileged methods */
  });

export { RoutingManager as default, RoutingManager };
