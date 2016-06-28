/**
 * Created by Glenn on 2015-01-16.
 */

const ViewerFactory = stampit()
  .init(({ instance }) => {

    /* region private properties */

    /*
     *
     */
    let viewer;

    /* endregion private properties */

    /* region private methods */

    /**
     *
     * @param mapViewerFactory
     * @param options
     * @param onMapViewerCreated
     */
    function handleCreation(mapViewerFactory, options, onMapViewerCreated) {
      const { viewerModuleName, viewerName, mapDisplay,
              domainObjectType, domainObjectId, eventIds,
              autoRefresh, autoFocus,
              rememberLastViewportEnabled, lazyLoadingEnabled,
              layerDataFetcher, } = options;

      viewer = mapViewerFactory.create({
        domainObjectType,
        domainObjectId,
        moduleName                 : viewerModuleName,
        name                       : viewerName,
        container                  : mapDisplay.children('.map-canvas'),
        alarmEventIds              : eventIds,
        autoRefresh                : Boolean(autoRefresh),
        autoFocus                  : Boolean(autoFocus),
        rememberLastViewportEnabled: Boolean(rememberLastViewportEnabled),
        lazyLoadingEnabled         : Boolean(lazyLoadingEnabled),
      });

      viewer.setLayerDataFetcher(layerDataFetcher);

      onMapViewerCreated(viewer);
    }

    /**
     * Define a split point for each of our maps viewers.
     * @see http://webpack.github.io/docs/code-splitting.html
     * @see https://github.com/petehunt/webpack-howto#9-async-loading
     */
    const factoryActions = {
      heremaps(options, onMapViewerCreated) {
        require.ensure([], () => {

          if (!window.H) {
            require('lib/heremaps/mapsjs-core');
            require('lib/heremaps/mapsjs-service');
            require('lib/heremaps/mapsjs-mapevents');
            require('lib/heremaps/mapsjs-ui.css');
            require('lib/heremaps/mapsjs-ui.js');
            require('lib/heremaps/mapsjs-clustering');
            require('lib/heremaps/mapsjs-places');
          }

          handleCreation(
            require('heremaps/viewer').default, options, onMapViewerCreated);
        }, 'heremaps');
      },

      googlemaps(options, onMapViewerCreated) {
        require.ensure([], () => {
          window.__google_maps_callback__ = () => {
            require('lib/googlemaps/markerclustererplus.min');

            handleCreation(
              require('googlemaps/viewer').default, options, onMapViewerCreated);
          };

          if (!(window.google && window.google.maps)) {
            const params = {
              v        : '3.23',
              client   : 'gme-roamworks',
              libraries: 'geometry,places',
              callback : '__google_maps_callback__',
            };

            $.getScript(`https://maps.googleapis.com/maps/api/js?${$.param(params)}`);
          } else {
            handleCreation(
              require('googlemaps/viewer').default, options, onMapViewerCreated);
          }
        }, 'googlemaps');
      },
    };

    /* endregion private methods */

    /* region privileged methods */

    _.assign(instance, {

      /**
       *
       * @param options
       * @param onMapViewerCreated
       */
      createViewer(options, onMapViewerCreated) {
        const viewerModuleName = options.viewerModuleName = options.mapViewer.toLowerCase();
        const factoryAction = factoryActions[viewerModuleName];

        if (!_.isFunction(factoryAction)) {
          throw new Error(`Invalid viewer module name: ${viewerModuleName}.`);
        }

        factoryAction(options, onMapViewerCreated);
      },
    });

    /* endregion privileged methods */
  });

export { ViewerFactory as default, ViewerFactory };
