/**
 * Created by Glenn on 2015-06-28.
 */

import H from 'heremaps';
import { Layer as AbstractLayer } from '../layer';

/**
 *
 * @extends {Layer}
 */
const HereMapsLayer = stampit()
  .init(({ instance }) => {

    /* region private properties */

    /**
     * Layer implementation in HERE Maps is actually, well, a "Group".
     * @type {H.map.Group}
     */
    const group = new H.map.Group({ data: {} });

    /*
     *
     */
    let mapObjectList = {};

    /* endregion private properties */

    /* region privileged methods */

    _.assign(instance, {

      /**
       *
       * @returns {H.map.Group}
       */
      getNativeObject() {
        return group;
      },

      /**
       *
       * @param key
       * @returns {*}
       */
      getData(key) {
        return group.getData()[key];
      },

      /**
       *
       * @param key
       * @param value
       */
      setData(key, value) {
        let props = {};

        if (_.isPlainObject(key)) {
          props = key;
        } else {
          props[key] = value;
        }

        group.setData({ ...group.getData(), ...props });
      },

      /**
       *
       * @returns {boolean}
       */
      isVisible() {
        return group.getVisibility();
      },

      /**
       *
       * @param visible
       */
      setVisible(visible) {
        group.setVisibility(visible);
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

        group.addObjects(_.map(mapObjects, (mapObject) => {
          mapObjectList[mapObject.id] = mapObject;

          const nativeObject = mapObject.getNativeObject();
          nativeObject.dispatchEvent('visibilitychange');

          return nativeObject;
        }));
      },

      /**
       *
       * @param mapObjects
       */
      remove(mapObjects) {
        mapObjects = _.isArray(mapObjects) ? mapObjects : [mapObjects];

        const nativeObjects = _.map(mapObjects, (mapObject) => {
          delete mapObjectList[mapObject.id];

          const nativeObject = mapObject.getNativeObject();
          nativeObject.dispatchEvent('visibilitychange');

          return nativeObject;
        });

        group.removeObjects(nativeObjects);

        // Clean up listeners (prevent memory leak).
        _.forEach(nativeObjects, nativeObject => nativeObject.dispose());
      },

      /**
       *
       */
      clear() {
        instance.remove(_(mapObjectList)
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
        const bounds = group.getBounds();
        let bbox;

        if (bounds) {
          bbox = {
            left  : bounds.getLeft(),
            bottom: bounds.getBottom(),
            right : bounds.getRight(),
            top   : bounds.getTop(),
          };
        }

        return bbox;
      },
    });

    /* endregion privileged methods */

    /* region init code */

    instance.setVisible(true);
    instance.setData('wrapper', instance);

    /* endregion init code */
  });

const Layer = stampit.compose(AbstractLayer, HereMapsLayer);

export { Layer as default, Layer };
