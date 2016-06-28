/**
 * Created by Glenn on 2015-06-19.
 */

import maps from 'googlemaps';
import { project as mapsProject } from '../../project';
import { Viewer as AbstractViewer } from '../viewer';
import { Layer as GoogleMapsLayer } from './layer';
import { ClusteringLayer as GoogleMapsClusteringLayer } from './clustering-layer';
import { MapObject as GoogleMapsMapObject } from './map-object';
import { RoutingEngine as GoogleMapsRoutingEngine } from './routing-engine';

const google = { maps };

const defaultBoundingBox = mapsProject.bbox;

/**
 *
 * @extends {Viewer}
 */
const GoogleMapsViewer = stampit()
  .init(({ instance }) => {
    const { container } = instance;

    /* region private properties */

    /*
     *
     */
    let map;

    /*
     *
     */
    const eventTypes = {
      click           : 'click',
      dragstart       : 'dragstart',
      drag            : 'drag',
      dragend         : 'dragend',
      mousedown       : 'click',
      mouseup         : 'click',
      mouseenter      : 'mouseover',
      mouseleave      : 'mouseout',
      mousemove       : 'mousemove',
      mapviewchange   : 'bounds_changed',
      mapviewchangeend: 'idle',
    };

    /*
     *
     */
    let overlay;
    let canvasProjection;

    /* endregion private properties */

    /* region privileged methods */

    _.assign(instance, {

      /**
       * To be used necessarily with caution:
       * Force this object to give up its secret (`map` object),
       * since it is used in `.setMap()` method in Google Maps.
       * @returns {*}
       */
      getNativeObject() {
        return map;
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

        listener.mapsEventListener =
          google.maps.event.addListener(map, eventType, listener);
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

        google.maps.event.removeListener(listener.mapsEventListener);
      },

      /**
       *
       * @param type
       * @param listener
       */
      onceEventListener(type, listener) {
        const eventType = eventTypes[type];

        if (!_.isString(eventType)) {
          throw new Error(`Invalid event type: ${type}.`);
        }

        listener.mapsEventListener =
          google.maps.event.addListenerOnce(map, eventType, listener);
      },

      /**
       *
       * @param overlay
       */
      addOverlay(overlay) {
        overlay.getNativeObject().setMap(map);
      },

      /**
       *
       * @param mapObjects
       */
      addObjects(mapObjects) {

        _.forEach(mapObjects, mapObject => mapObject.getNativeObject().setMap(map));
      },

      /**
       *
       * @param mapObjects
       */
      removeObjects(mapObjects) {

        _.forEach(mapObjects, (mapObject) => {
          const nativeObject = mapObject.getNativeObject();

          /*
           * Clean up listeners; prevent memory leak.
           */
          const editModeClickListener = nativeObject.get('editModeClickListener');

          if (editModeClickListener) {
            instance.removeEventListener('click', editModeClickListener);
          }

          google.maps.event.clearInstanceListeners(nativeObject);
          nativeObject.setMap(undefined);
        });
      },

      /**
       *
       * @returns {*}
       */
      getLayerFactory() {
        return GoogleMapsLayer;
      },

      /**
       *
       * @returns {*}
       */
      getClusteringLayerFactory() {
        return GoogleMapsClusteringLayer;
      },

      /**
       *
       * @returns {*}
       */
      getMapObjectFactory() {
        return GoogleMapsMapObject;
      },

      /**
       *
       * @returns {*}
       */
      getRoutingEngineFactory() {
        return GoogleMapsRoutingEngine;
      },

      /**
       *
       * @param pixel
       * @returns {*}
       */
      pixelToGeo(pixel) {
        return canvasProjection.fromContainerPixelToLatLng(
          new google.maps.Point(pixel.x, pixel.y));
      },

      /**
       *
       * @param geo
       */
      geoToPixel(geo) {
        return canvasProjection.fromLatLngToContainerPixel(
          new google.maps.LatLng(geo.lat, geo.lng));
      },

      /**
       *
       * @returns {Object} bbox
       */
      getBoundingBox() {
        const bounds = map.getBounds();
        const ne     = bounds.getNorthEast();
        const sw     = bounds.getSouthWest();

        return {
          left           : ne.lng(),
          bottom         : sw.lat(),
          right          : sw.lng(),
          top            : ne.lat(),
          getNativeBounds: _.constant(bounds),
        };
      },

      /**
       *
       * @param {Object} bbox
       */
      setBoundingBox(bbox) {

        if (bbox) {
          const { bottom, right, top, left } = bbox;
          const bounds = new google.maps.LatLngBounds(
            new google.maps.LatLng(bottom, right),
            new google.maps.LatLng(top, left)
          );

          map.fitBounds(bounds);
        }
      },

      /**
       *
       * @returns {{lat: *, lng: *}}
       */
      getCenter() {
        const center = map.getCenter();

        return {
          lat: center.lat(),
          lng: center.lng(),
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
          map.setZoom(zoom);
        }
      },

      /**
       *
       */
      refresh() {
        google.maps.event.trigger(map, 'idle');
      },

      /**
       *
       */
      resize() {
        google.maps.event.trigger(map, 'resize');
      },

      /**
       *
       */
      shake() {
        instance.refresh();
      },

      /**
       *
       * @returns {*}
       */
      resolveProjection() {
        return defer.promise();
      },
    });

    /* endregion privileged methods */

    /* region init code */

    /* region Google Maps initialization */

    // Initialize the platform object.
    map = new google.maps.Map(container[0]);

    /**
     * Reposition default native map controls so that they don't
     * collide with the DRS extension positioning: since 3.22.
     * @see https://developers.google.com/maps/articles/v322-controls-diff
     */
    const { RIGHT_CENTER } = google.maps.ControlPosition;
    const { ROADMAP, SATELLITE } = google.maps.MapTypeId;
    map.setOptions({
      mapTypeId               : App.config.map.defaultMapTypeSatelliteEnabled ?
                                SATELLITE : ROADMAP,
      streetViewControlOptions: {
        position: RIGHT_CENTER,
      },
      zoomControlOptions      : {
        position: RIGHT_CENTER,
      },
    });

    /*
     * Setup default event listeners:
     * - add event listeners related to map info box positioning,
     * - add event listeners to map "extensions".
     */
    instance.addEventListener('click', instance.createDefaultClickListener());
    instance.addEventListener('mapviewchangeend', instance.createDefaultMapViewChangeEndListener());
    instance.addEventListener('mousemove', instance.createDefaultMouseMoveListener());

    /**
     * Get the proper projection of the map viewer. Uuuuugeleeeeey!
     * @see http://qfox.nl/notes/116
     * @type {google.maps.OverlayView}
     */
    overlay = new google.maps.OverlayView();
    const defer = $.Deferred();
    _.assign(overlay, {
      onAdd() {

        /**
         * The projection is not initialized until onAdd is
         * called by the API.
         * @see https://developers.google.com/maps/documentation/javascript/3.exp/reference#OverlayView
         */
        canvasProjection = overlay.getProjection();
        defer.resolve();
      },

      onRemove: _.noop,
      draw    : _.noop,
    }).setMap(map);

    /* endregion Google Maps initialization */

    instance.setBoundingBox(defaultBoundingBox);

    /* endregion init code */
  });

const Viewer = stampit.compose(AbstractViewer, GoogleMapsViewer);

export { Viewer as default, Viewer };
