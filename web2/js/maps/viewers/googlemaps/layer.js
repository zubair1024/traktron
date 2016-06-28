/**
 * Created by Glenn on 2015-07-30.
 */

import maps from 'googlemaps';
import { Layer as AbstractLayer } from '../layer';

const google = { maps };

/**
 *
 * @extends {Layer}
 */
const GoogleMapsLayer = stampit()
  .init(({ instance }) => {
    const { viewer } = instance;

    /* region private properties */

    /**
     * Layer implementation in Google Maps is actually, well,
     * an "OverlayView".
     * @type {google.maps.OverlayView}
     */
    const overlay = new google.maps.OverlayView();

    /*
     *
     */
    let mapObjectList = {};

    /* endregion private properties */

    /* region privileged methods */

    _.assign(instance, {

      /**
       *
       * @returns {google.maps.OverlayView}
       */
      getNativeObject() {
        return overlay;
      },

      /**
       *
       * @param key
       * @returns {*}
       */
      getData(key) {
        return overlay.get(key);
      },

      /**
       *
       * @param key
       * @param value
       */
      setData(key, value) {

        if (_.isPlainObject(key)) {
          overlay.setValues(key);
        } else {
          overlay.set(key, value);
        }
      },

      /**
       *
       * @returns {boolean}
       */
      isVisible() {
        return Boolean(overlay.getMap());
      },

      /**
       *
       * @param visible
       */
      setVisible(visible) {
        const map = visible ? viewer.getNativeObject() : undefined;

        overlay.setMap(map);

        _.forOwn(mapObjectList, mapObject => mapObject.getNativeObject().setMap(map));
      },

      /**
       *
       * @returns {*}
       */
      getObjects() {
        return _(mapObjectList)
          .map()
          .compact()
          .value();
      },

      /**
       *
       * @param mapObjects
       */
      add(mapObjects) {
        mapObjects = _.isArray(mapObjects) ? mapObjects : [mapObjects];

        _.forEach(mapObjects, (mapObject) => {
          mapObjectList[mapObject.id] = mapObject;

          mapObject
            .getNativeObject()
            .setMap(viewer.getNativeObject());
        });
      },

      /**
       *
       * @param mapObjects
       */
      remove(mapObjects) {
        mapObjects = _.isArray(mapObjects) ? mapObjects : [mapObjects];

        _.forEach(mapObjects, (mapObject) => {
          delete mapObjectList[mapObject.id];

          const nativeObject = mapObject.getNativeObject();

          nativeObject.setMap(undefined);

          // Prevent memory leak.
          google.maps.event.clearInstanceListeners(nativeObject);
        });
      },

      /**
       *
       */
      clear() {
        instance.remove(
          _(mapObjectList)
            .map()
            .compact()
            .value());

        mapObjectList = {};
      },

      /**
       *
       * @returns {*}
       */
      getBounds() {
        const mapObjects = instance.getObjects();
        let bbox;

        if (mapObjects.length > 0) {
          const nativeObject = mapObjects[0].getNativeObject();
          const bounds       = new google.maps.LatLngBounds();

          // Bounds calculation for position or location layer.
          if (nativeObject instanceof google.maps.Marker) {

            _.forEach(mapObjects, mapObject =>
              bounds.extend(mapObject.getNativeObject().getPosition()));

          } else { // For geofence layer.

            _.forEach(mapObjects, (mapObject) => {
              const { bottom, right, top, left } = mapObject.getBounds();
              const other = new google.maps.LatLngBounds(
                new google.maps.LatLng(bottom, right),
                new google.maps.LatLng(top, left)
              );

              bounds.union(other);
            });
          }

          const ne = bounds.getNorthEast();
          const sw = bounds.getSouthWest();

          bbox = {
            left  : ne.lng(),
            bottom: sw.lat(),
            right : sw.lng(),
            top   : ne.lat(),
          };
        }

        return bbox;
      },
    });

    /* endregion privileged methods */

    /* region init code */

    _.assign(overlay, {
      draw    : _.noop,
      onAdd   : _.noop,
      onRemove: _.noop,
    }).setMap(viewer.getNativeObject());

    instance.setVisible(true);
    instance.setData('wrapper', instance);

    /* endregion init code */
  });

const Layer = stampit.compose(AbstractLayer, GoogleMapsLayer);

export { Layer as default, Layer };
