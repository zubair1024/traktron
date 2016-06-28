/**
 * Created by Glenn on 2014-11-10.
 */

import App from 'app';
import { LayerDataFetcher } from './layer-data-fetcher';
import { ViewerFactory as MapViewerFactory } from './viewer-factory';
import { Controls as MapControls } from './ui/controls';
import { Controller as MapController } from './controller';
import { RoutingControls } from './ui/routing';
import { Legend } from './ui/exts/legend';
import { DateRangeSlider } from './ui/exts/date-range-slider';
import { CoordinatesDisplay } from './ui/exts/coordinates-display';
import { mapsDebugger } from './debugger';

const Initializer = stampit()
  .props({

    /**
     *
     */
    options: undefined,
  })
  .init(({ instance }) => {
    const { options } = instance;

    /* region private properties */

    /*
     * Model
     */
    let viewerFactory;

    /*
     * Well, you might as well argue the map viewer is
     * our so-called "ViewModel".
     */
    let viewer;

    /*
     * View
     */
    let controls;

    /*
     * Controller
     */
    let controller;

    /* endregion private properties */

    /* region privileged methods */

    _.assign(instance, {

      /**
       *
       * @param onMapInitialized
       */
      startInitialization(onMapInitialized) {

        /*
         * Prefetch map layers data.
         */
        const { domainObjectType, domainObjectId, eventIds } = options;
        const layerDataFetcher = LayerDataFetcher.create({
          domainObjectType,
          domainObjectId,
          alarmEventIds: eventIds,
        });

        options.layerDataFetcher = layerDataFetcher;
        layerDataFetcher.prefetch();

        mapsDebugger.time('Map MVC components initialization time');

        /*
         * Bootstrap map MVC components.
         */
        viewerFactory = MapViewerFactory.create();
        viewerFactory.createViewer(options, (mapViewer) => {
          const controlsView = options.mapDisplay.children('.map-controls');

          viewer   = mapViewer;
          controls = MapControls.create({
            controlsView,
            viewer,
          });

          controller = MapController.create({
            controls,
            viewer,
          });

          /*
           * Please stick to this MVC implementation:
           *
           * - Controller listens to the View for UI events.
           * - View listens to the Model for change events.
           *
           * - View may query state of the Model.
           * - Controller updates state of the Model.
           * - Controller may update the View.
           */
          controls.setController(controller);
          viewer.setControls(controls);
          mapsDebugger.timeEnd('Map MVC components initialization time');

          controller.onMapMvcComponentsInitialized(options, () => {
            mapsDebugger.time('Map extensions installation time');

            /*
             * Install map extensions here.
             * 1) Legend
             * 2) Routing
             * 3) Date range slider
             * 4) Coordinates display
             */
            const legend = Legend.create({
              viewer,
            });
            legend.setController(controller);
            viewer.setLegend(legend);

            if (App.config.map.routing) {
              const routingManager  = viewer.getRoutingManager();
              const routingControls = RoutingControls.create({
                controlsView,
                routingManager,
              });

              routingControls.setController(controller);
              routingManager.setRoutingControls(routingControls);
              routingManager.initRoutingEngine();

              /*
               * Add initial waypoints for routing and
               * instantly calculate route if possible.
               */
              const { reconstructingWaypoints } = options;
              let initialWaypoints = [{}, {}];

              if (_.isArray(reconstructingWaypoints) &&
                  reconstructingWaypoints.length >= 2) {

                initialWaypoints = reconstructingWaypoints;
              }

              _.forEach(initialWaypoints, (waypoint, i) => {
                controller.onWaypointItemAdditionRequested();
                controller.onWaypointItemSelected(waypoint, i);
              });

              if (routingManager.canCalculateRoute()) {
                controller.onRouteCalculationRequested();
              }
            }

            if (App.config.map.dateRangeSlider) {

              if (viewer.isModernBrowser()) {
                const dateRangeSlider = DateRangeSlider.create({
                  viewer,
                });
                dateRangeSlider.setController(controller);
                viewer.setDateRangeSlider(dateRangeSlider);
              }
            }

            if (App.config.map.coordinatesDisplay) {
              const coordinatesDisplay = CoordinatesDisplay.create({
                viewer,
              });
              coordinatesDisplay.setController(controller);
              viewer.setCoordinatesDisplay(coordinatesDisplay);
            }

            mapsDebugger.timeEnd('Map extensions installation time');

            onMapInitialized(controller);
          });
        });
      },
    });

    /* endregion privileged methods */
  });

export { Initializer as default, Initializer };
