/**
 * Created by Glenn on 2015-07-02.
 */

import App from 'app';
import H from 'heremaps';
import { project as mapsProject } from '../../project';
import { Viewer as AbstractViewer } from '../viewer';
import { Layer as HereMapsLayer } from './layer';
import { ClusteringLayer as HereMapsClusteringLayer } from './clustering-layer';
import { MapObject as HereMapsMapObject } from './map-object';
import { RoutingEngine as HereMapsRoutingEngine } from './routing-engine';

const { appId, appCode } = App.config.map;
const defaultBoundingBox = mapsProject.bbox;

/**
 *
 * @extends {Viewer}
 */
const HereMapsViewer = stampit()
  .init(({ instance }) => {
    const { container } = instance;

    /* region private properties */

    /*
     *
     */
    let platform;
    let baseLayers;
    let map;
    let behavior;
    let ui;

    /*
     *
     */
    const eventTypes = {
      click           : 'tap',
      dragstart       : 'dragstart',
      drag            : 'drag',
      dragend         : 'dragend',
      mousedown       : 'pointerdown',
      mouseup         : 'pointerup',
      mouseenter      : 'pointerenter',
      mouseleave      : 'pointerleave',
      mousemove       : 'pointermove',
      mapviewchange   : 'mapviewchange',
      mapviewchangeend: 'mapviewchangeend',
    };

    /* endregion private properties */

    /* region privileged methods */

    _.assign(instance, {

      /**
       *
       * @returns {*}
       */
      getPlatform() {
        return platform;
      },

      /**
       *
       * @param type
       * @param listener
       */
      addEventListener(type, listener) {
        const eventType = eventTypes[type];

        if (!_.isString(eventType)) {
          throw new Error(`Invalid event type: ${type}.`);
        }

        map.addEventListener(eventType, listener);
      },

      /**
       *
       * @param type
       * @param listener
       */
      removeEventListener(type, listener) {
        const eventType = eventTypes[type];

        if (!_.isString(eventType)) {
          throw new Error(`Invalid event type: ${type}.`);
        }

        /*
         * Workaround for .onceEventListener() requires me to
         * do this.
         */
        if (_.isFunction(listener.wrapper)) {
          map.removeEventListener(eventType, listener.wrapper);
        }

        map.removeEventListener(eventType, listener);
      },

      /**
       * Workaround for .onceEventListener() that is currently broken
       * in HERE Maps v3.x. Thanks to Zubair for pointing out this
       * workaround.
       * @see http://stackoverflow.com/questions/30871127/here-maps-js-api-v3-x-onceeventlistener-method-bug
       * @param type
       * @param listener
       */
      onceEventListener(type, listener) {
        const wrapper = (e) => {
          instance.removeEventListener(type, wrapper);
          listener(e);
        };

        listener.wrapper = wrapper;
        instance.addEventListener(type, wrapper);
      },

      /**
       *
       * @param overlay
       */
      addOverlay(overlay) {

        if (overlay.isClusteringSupported()) {
          instance.addLayer(overlay.getNativeObject());
        } else {
          instance.addObject(overlay);
        }
      },

      /**
       *
       * @param mapObjects
       */
      addObjects(mapObjects) {
        map.addObjects(_.map(mapObjects, (mapObject) => mapObject.getNativeObject()));
      },

      /**
       *
       * @param mapObjects
       */
      removeObjects(mapObjects) {
        const nativeObjects = _.map(mapObjects, (mapObject) => mapObject.getNativeObject());

        map.removeObjects(nativeObjects);

        /*
         * Clean up listeners.
         */
        _.forEach(nativeObjects, (nativeObject) => {
          const listeners = nativeObject.getData().editModeListeners;

          if (listeners) {
            _.forOwn(listeners, (listener, type) => {

              if (listener) {
                instance.removeEventListener(type, listener);
              }
            });
          }

          /**
           * Prevent memory leak when removing object.
           * @see https://developer.here.com/javascript-apis/documentation/v3/maps/topics_api_nlp/h-map-object.html#h-map-object__addeventlistener
           */
          nativeObject.dispose();
        });
      },

      /**
       *
       * @param layer
       */
      addLayer(layer) {
        map.addLayer(layer);
      },

      /**
       *
       * @param layer
       */
      removeLayer(layer) {
        map.removeLayer(layer);
      },

      /**
       *
       * @returns {*}
       */
      getLayerFactory() {
        return HereMapsLayer;
      },

      /**
       *
       * @returns {*}
       */
      getClusteringLayerFactory() {
        return HereMapsClusteringLayer;
      },

      /**
       *
       * @returns {*}
       */
      getMapObjectFactory() {
        return HereMapsMapObject;
      },

      /**
       *
       * @returns {*}
       */
      getRoutingEngineFactory() {
        return HereMapsRoutingEngine;
      },

      /**
       *
       * @param pixel
       * @returns {*}
       */
      pixelToGeo(pixel) {
        const { x, y } = pixel;

        return map.screenToGeo(x, y);
      },

      /**
       *
       * @param geo
       * @returns {*}
       */
      geoToPixel(geo) {
        return map.geoToScreen(geo);
      },

      /**
       *
       * @returns {Object} bbox
       */
      getBoundingBox() {
        const viewBounds = map.getViewBounds();

        return {
          left           : viewBounds.getLeft(),
          bottom         : viewBounds.getBottom(),
          right          : viewBounds.getRight(),
          top            : viewBounds.getTop(),
          getNativeBounds: _.constant(viewBounds),
        };
      },

      /**
       *
       * @param {Object} bbox
       */
      setBoundingBox(bbox) {

        if (bbox) {
          const { top, left, bottom, right } = bbox;

          map.setViewBounds(new H.geo.Rect(top, left, bottom, right), true);
        }
      },

      /**
       *
       * @returns {{lat: *, lng: *}}
       */
      getCenter() {
        const { lat, lng } = map.getCenter();

        return {
          lat,
          lng,
        };
      },

      /**
       *
       * @param center
       */
      setCenter(center) {
        map.setCenter(center);
      },

      /**
       *
       * @returns {*}
       */
      getZoom() {
        return map.getZoom();
      },

      /**
       *
       * @param zoom
       */
      zoomToLevel(zoom) {

        if (zoom >= 0) {
          map.setZoom(zoom, true);
        }
      },

      /**
       *
       */
      refresh() {
        map.dispatchEvent('mapviewchangeend');
      },

      /**
       *
       */
      resize() {
        map.getViewPort().resize();
      },
    });

    /* endregion privileged methods */

    /* region init code */

    /* region HERE Maps initialization */

    // Initialize the platform object.
    platform = new H.service.Platform({
      app_id  : appId,
      app_code: appCode,

      // Indicates whether HTTPS should be used.
      //useHTTPS: Boolean(window.location.protocol.match(/https/i))
      useHTTPS: true,  // force HTTPS
    });

    // Obtain the default map types from the platform object.
    baseLayers = platform.createDefaultLayers();

    // Instantiate (and display) a map object:
    const { normal, satellite } = baseLayers;
    map = new H.Map(container[0], App.config.map.defaultMapTypeSatelliteEnabled ?
                                  satellite.map : normal.map);

    behavior = new H.mapevents.Behavior(new H.mapevents.MapEvents(map));
    ui       = new H.ui.UI.createDefault(map, baseLayers);
    ui.getControl('mapsettings').setAlignment(
      H.ui.LayoutAlignment.TOP_RIGHT);

    /*
     * Enable the proper drag behavior for a marker object.
     */
    instance.addEventListener('dragstart', (e) => {

      if (e.target instanceof H.map.Marker) {
        behavior.disable();
      }
    });

    instance.addEventListener('dragend', (e) => {

      if (e.target instanceof H.map.Marker) {
        behavior.enable();
      }
    });

    /*
     * Setup default event listeners:
     * - add event listeners related to map info box positioning,
     * - add event listeners to map "extensions".
     */
    instance.addEventListener('click', instance.createDefaultClickListener());
    instance.addEventListener('mapviewchangeend', instance.createDefaultMapViewChangeEndListener());
    instance.addEventListener('mousemove', instance.createDefaultMouseMoveListener());

    /* endregion HERE Maps initialization */

    instance.setBoundingBox(defaultBoundingBox);

    /* endregion init code */
  });

const Viewer = stampit.compose(AbstractViewer, HereMapsViewer);

export { Viewer as default, Viewer };
