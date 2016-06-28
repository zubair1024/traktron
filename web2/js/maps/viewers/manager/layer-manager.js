/**
 * Created by Glenn on 2015-06-28.
 */

const LayerManager = stampit()
  .init(({ instance, stamp }) => {
    const { ROAM_LOCATIONS, ROAM_GEOFENCES } = stamp.ROAM_LAYERS;

    /* region private properties */

    /*
     *
     */
    let viewer;

    /*
     *
     */
    const layerList       = {};
    const mapObjectList   = {};
    const roamObjectCache = {};

    /*
     *
     */
    let positionLayerName = '';
    let lastSelectedPositionObject;

    /*
     *
     */
    const domainObjectTypeActions = {
      assetmessageevent() {
        return positionLayerName;
      },

      location() {
        return ROAM_LOCATIONS;
      },

      geofence() {
        return ROAM_GEOFENCES;
      },
    };

    /*
     *
     */
    const objectTypes = {
      [ROAM_LOCATIONS]: 'location',
      [ROAM_GEOFENCES]: 'geofence',
    };

    /*
     *
     */
    let eventsConnector;

    /* endregion private properties */

    /* region private methods */

    /**
     *
     * @param layerName
     * @param roamObject
     * @returns {*}
     */
    function createMapObject(layerName, roamObject) {

      /*
       * Combine `layerName` and `domainObjectTypeId` to form
       * `mapObjectId`, because DOTI itself is not unique
       * enough when the same ROAM objects used in multiple
       * layer (overlay).
       * e.g.
       * ROAM_ASSETS/ROAM_ASSETS_HISTORY vs.
       * ROAM_ASSETS_ANIMATION.
       */
      const mapObjectId = `${layerName}-${roamObject.domainObjectTypeId}`;

      return viewer.getMapObjectFactory().create({
        layerName,
        roamObject,
        viewer,
        id: mapObjectId,
      });
    }

    /* endregion private methods */

    /* region privileged methods */

    _.assign(instance, {

      /**
       *
       * @param mapViewer
       */
      setViewer: _.once(mapViewer => viewer = mapViewer),

      /* region Layer operations */

      /**
       *
       * @returns {*}
       */
      getLayers() {
        return _.map(layerList);
      },

      /**
       *
       * @param layerName
       * @returns {*}
       */
      getLayer(layerName) {
        return layerList[layerName];
      },

      /**
       *
       * @param layerProperties
       */
      addLayer(layerProperties) {
        const layerId = layerProperties.name;
        let layer     = instance.getLayer(layerId);

        if (!layer) {
          let layerFactory = viewer.getLayerFactory();

          /*
           * Clustering layer is treated a bit differently,
           * and thus, has its own factory.
           */
          if (layerProperties.clusteringSupported) {
            layerFactory = viewer.getClusteringLayerFactory();
          }

          layer = layerFactory.create({
            layerProperties,
            viewer,
            name: layerId,
          });

          layerList[layerId] = layer;

          viewer.addOverlay(layer);
        }
      },

      /**
       *
       * @returns {boolean}
       */
      getLayerVisibility(layerName) {
        const layer = instance.getLayer(layerName);

        return Boolean(layer && layer.isVisible());
      },

      /**
       *
       * @param layerName
       * @param visibility
       */
      setLayerVisibility(layerName, visibility) {
        const layer = instance.getLayer(layerName);

        if (layer) {
          layer.setVisible(visibility);
        }
      },

      /**
       *
       * @returns {string}
       */
      getPositionLayerName() {
        return positionLayerName;
      },

      /**
       *
       * @param layerName
       */
      setPositionLayerName(layerName) {
        positionLayerName = layerName;
      },

      /**
       *
       * @param layerName
       * @returns {boolean}
       */
      testIsPositionLayerName(layerName) {
        return viewer.getLayerDataFetcher().testIsPositionLayerName(layerName);
      },

      /**
       *
       * @param type
       * @returns {*}
       */
      getLayerName(type) {
        const domainObjectTypeAction = domainObjectTypeActions[type];

        if (!_.isFunction(domainObjectTypeAction)) {
          throw new Error(`Invalid ROAM object type: ${type}.`);
        }

        return domainObjectTypeAction();
      },

      /* endregion Layer operations */

      /* region Map object operations */

      /**
       *
       * @param layerName
       * @param objectId
       * @returns {*}
       */
      getObject(layerName, objectId) {
        return mapObjectList[`${layerName}-${objectId}`];
      },

      /**
       *
       * @param layerName
       * @param objectIds
       * @returns {*}
       */
      getObjects(layerName, objectIds) {

        return _(objectIds)
          .map(objectId => instance.getObject(layerName, objectId))
          .compact()
          .value();
      },

      /**
       *
       * @param layerName
       * @returns {*}
       */
      getObjectsByLayer(layerName) {
        return layerList[layerName].getObjects();
      },

      /**
       *
       * @param objectId
       * @returns {*}
       */
      getCachedRoamObject(objectId) {
        return roamObjectCache[objectId];
      },

      /**
       *
       * @param objectIds
       * @returns {*}
       */
      getCachedRoamObjects(objectIds) {
        return _.map(objectIds, objectId => roamObjectCache[objectId]);
      },

      /**
       *
       * @param layerName
       * @returns {*}
       */
      getCachedRoamObjectsByLayer(layerName) {
        const objectType = objectTypes[layerName] || 'assetmessageevent';

        return _(roamObjectCache)
          .filter(['domainObjectType', objectType])
          .compact()
          .value();
      },

      /**
       *
       * @param roamObject
       */
      addCachedRoamObject(roamObject) {
        roamObjectCache[roamObject.domainObjectTypeId] = roamObject;
      },

      /**
       *
       * @param roamObjects
       * @param latestPositionId
       */
      markLatestPositionRoamObject(roamObjects, latestPositionId) {

        _.forEach(roamObjects, (roamObject) => {

          if (roamObject.id.toString() ===
              latestPositionId.toString()) {

            roamObject.isLatestEvent = true;
            return false;
          }
        });
      },

      /**
       *
       * @param type
       * @param roamObjects
       */
      loadObjects(type, roamObjects) {
        const layerName = instance.getLayerName(type);
        const layer     = instance.getLayer(layerName);

        if (layer) {

          /*
           * Handle loaded objects and
           * lazy loading mechanics.
           */
          const shouldCacheUsed = viewer.lazyLoadingEnabled &&
                                  (!instance.testIsPositionLayerName(layerName));

          instance.clearObjects(layerName);

          if (shouldCacheUsed) {
            console.info(`Lazy loading for ${layerName} activated.`);

            /*
             * Do not add objects at load time in lazy
             * loading mode; instead, store them in the
             * cache for later addition.
             */
            _.forEach(roamObjects, roamObject => instance.addCachedRoamObject(roamObject));
          } else {
            const mapObjects = _(roamObjects)
              .map(roamObject => createMapObject(layerName, roamObject))
              .compact()
              .forEach(mapObject => mapObjectList[mapObject.id] = mapObject);

            layer.add(mapObjects);
          }

          viewer.getControls().onObjectsLoaded(layerName, roamObjects);
        }
      },

      /**
       *
       * @param layerName
       * @param roamObject
       */
      addObject(layerName, roamObject) {
        instance.addObjects(layerName, [roamObject]);
      },

      /**
       *
       * @param layerName
       * @param roamObjects
       */
      addObjects(layerName, roamObjects) {
        const layer = instance.getLayer(layerName);

        if (layer) {
          const mapObjects = _(roamObjects)
            .map((roamObject) => {
              let mapObject = undefined;

              /*
               * Consider only object that hasn't been
               * added yet (make sure no duplicate).
               */
              if (!instance.getObject(layerName,
                  roamObject.domainObjectTypeId)) {

                mapObject = createMapObject(layerName, roamObject);
              }

              return mapObject;
            })
            .compact()
            .forEach(mapObject => mapObjectList[mapObject.id] = mapObject);

          layer.add(mapObjects);

          /*
           * Currently map controls only supports for
           * efficiently adding one (user-created) map object
           * at a time.
           */
          if (mapObjects.length === 1) {
            viewer.getControls().onObjectAdded(
              layerName, mapObjects[0].roamObject);
          }
        }
      },

      /**
       *
       * @param layerName
       * @param roamObject
       */
      removeObject(layerName, roamObject) {
        instance.removeObject(layerName, [roamObject]);
      },

      /**
       *
       * @param layerName
       * @param roamObjects
       */
      removeObjects(layerName, roamObjects) {
        const layer = instance.getLayer(layerName);

        if (layer) {
          const mapObjects = _(roamObjects)
            .map(roamObject => instance.getObject(layerName, roamObject.domainObjectTypeId))
            .compact()
            .forEach((mapObject) => {
              delete mapObjectList[mapObject.id];

              mapObject.destroyLabel();
            });

          layer.remove(mapObjects);

          /*
           * Same as `.addObjects()` method above;
           * `.onObjectRemoved()` method in `controls.js` even
           * hasn't been implemented yet. Being mentioned here
           * just for the sake of maintaining consistency.
           */
          if (mapObjects.length === 1) {
            viewer.getControls().onObjectRemoved(
              layerName, mapObjects[0].roamObject);
          }
        }
      },

      /**
       *
       * @param layerName
       */
      clearObjects(layerName) {
        const layer = instance.getLayer(layerName);

        if (layer) {
          _(instance.getObjectsByLayer(layerName))
            .compact()
            .forEach((mapObject) => {
              delete mapObjectList[mapObject.id];

              mapObject.destroyLabel();
            });

          layer.clear();

          viewer.getControls().onObjectsLoaded(layerName, []);
        }
      },

      /**
       *
       * @param destLayerName
       * @param srcLayerName
       */
      copyObjects(destLayerName, srcLayerName) {
        const roamObjects = _.map(
          instance.getObjectsByLayer(srcLayerName), 'roamObject');

        instance.clearObjects(destLayerName);
        instance.addObjects(destLayerName, roamObjects);
      },

      /**
       *
       * @param layerName
       * @param objectId
       * @param effective
       * @returns {boolean}
       */
      getObjectVisibility(layerName, objectId, effective) {
        const mapObject = instance.getObject(layerName, objectId);

        return Boolean(mapObject && mapObject.isVisible(effective));
      },

      /**
       *
       * @param layerName
       * @param objectId
       * @param visibility
       */
      setObjectVisibility(layerName, objectId, visibility) {
        instance.setObjectsVisibility(layerName, [objectId], visibility);
      },

      /**
       *
       * @param layerName
       * @param objectIds
       * @param visibility
       */
      setObjectsVisibility(layerName, objectIds, visibility) {
        const layer = instance.getLayer(layerName);

        if (layer) {
          const mapObjects = _(objectIds)
            .map(objectId => instance.getObject(layerName, objectId))
            .compact()
            .value();

          _.forEach(mapObjects, mapObject => mapObject.setVisible(visibility));

          if (layer.isClusteringSupported()) {

            /*
             * HACK: Have to do this in order to prevent
             * `.performClustering()` being called twice
             * during initialization time.
             */
            if (!layer.initTimeGuard) {
              layer.initTimeGuard = true;
            } else {
              layer.performClustering();
            }
          }

          instance.setObjectLabelsVisibility(layerName,
            instance.getObjectLabelsVisibility(layerName));

          viewer.getControls().onObjectsVisibilityChanged(
            layerName, objectIds, visibility);
        }
      },

      /**
       *
       * @param layerName
       * @param visibility
       */
      setAllObjectsVisibility(layerName, visibility) {
        const layer = instance.getLayer(layerName);

        if (layer) {
          const objectIds = _.map(
            instance.getObjectsByLayer(layerName), 'roamObject.domainObjectTypeId');

          instance.setObjectsVisibility(layerName, objectIds, visibility);
        }
      },

      /**
       *
       * @param layerName
       * @param objectId
       * @param highlighted
       */
      setObjectHighlighted(layerName, objectId, highlighted) {

        /*
         * Currently support for highlighting asset position
         * object only.
         */
        if (instance.testIsPositionLayerName(layerName)) {
          const mapObject = instance.getObject(layerName, objectId);

          if (mapObject) {
            const { roamObject } = mapObject;

            if (highlighted) {

              if (!roamObject.highlighted) {
                roamObject.highlighted = true;

                mapObject.updateIcon();
              }
            } else {
              delete roamObject.highlighted;

              mapObject.revertIcon();
            }
          }

          if (lastSelectedPositionObject &&
              (lastSelectedPositionObject !== mapObject)) {

            delete lastSelectedPositionObject.roamObject.highlighted;

            lastSelectedPositionObject.revertIcon();
          }

          lastSelectedPositionObject = mapObject;

          viewer.getControls().onPositionHighlightChanged(objectId, highlighted);
        }
      },

      /**
       *
       * @param objectId
       * @param highlighted
       */
      setPositionHighlighted(objectId, highlighted) {
        instance.setObjectHighlighted(
          instance.getPositionLayerName(), objectId, highlighted);
      },

      /* endregion Map object operations */

      /* region Label operations */

      /**
       *
       * @param layerName
       * @returns {boolean}
       */
      getObjectLabelsVisibility(layerName) {
        const layer = instance.getLayer(layerName);

        return Boolean(layer && layer.isLabelsVisible());
      },

      /**
       *
       * @param layerName
       * @param visibility
       */
      setObjectLabelsVisibility(layerName, visibility) {
        const layer = instance.getLayer(layerName);

        if (layer) {
          const labelsVisibilityListenerAdded =
                  layer.getData('labelsVisibilityListenerAdded');

          const enhanceLabelsPlacement = () => {

            if (viewer.isAutoLabelingActivated() && layer.isLabelsVisible()) {

              /*
               * Make sure the clustering process is
               * done first before running the
               * automatic labels placement algorithm.
               * For non-clustering layer, the defer
               * object is always resolved.
               */
              layer.resolveClustering()
                   .done(() => viewer
                     .getMapObjectLabelFactory()
                     .runAutomaticLabelPlacement(layer.getLabels()));
            }
          };

          if (!labelsVisibilityListenerAdded) {

            /**
             * REVIEW: Should watch out for this. Practically
             * prefer `mapviewchangeend` event to `mapviewchange`.
             * @see https://developer.here.com/javascript-apis/documentation/v3/maps/topics/best-practices.html
             */
            viewer.addEventListener('mapviewchange',

              /**
               * Mitigate excessively updating the
               * position while panning.
               * @see https://lodash.com/docs#throttle
               */
              _.throttle(() => layer.updateLabelsPosition(), 20));

            viewer.addEventListener('mapviewchangeend',
              () => _.defer(() => {
                layer.setLabelsVisible(layer.isLabelsVisible());
                enhanceLabelsPlacement();
              }));

            layer.setData('labelsVisibilityListenerAdded', true);
          }

          layer.setLabelsVisible(visibility);
          enhanceLabelsPlacement();

          viewer.getControls().onObjectLabelsVisibilityChanged(
            layerName, visibility);
        }
      },

      /* endregion Label operations */

      /**
       *
       * @param layerName
       * @param enabled
       */
      setClusteringEnabled(layerName, enabled) {
        const layer = instance.getLayer(layerName);

        if (layer && layer.isClusteringSupported()) {
          layer.setClusteringEnabled(enabled);
        }
      },

      /**
       *
       * @param visibility
       */
      setEventsConnectorVisibility(visibility) {
        let drawingSucceeded = true;

        if (!eventsConnector) {
          const positions = _.map(
            instance.getObjectsByLayer(instance.getPositionLayerName()), 'roamObject');

          drawingSucceeded = instance.drawEventsConnector(positions);
        }

        if (drawingSucceeded) {
          eventsConnector.setVisible(visibility);
        }
      },

      /**
       *
       * @param positions
       */
      drawEventsConnector(positions) {
        const drawable = (positions.length >= 2);

        if (drawable) {
          const mapObjectFactory = viewer.getMapObjectFactory();
          const coordinates      = mapObjectFactory.toCoordinates(
            _.map(positions, ({ latitude, longitude }) => ({
                lat: latitude,
                lng: longitude,
              })
            ));

          if (!eventsConnector) {
            eventsConnector = mapObjectFactory
              .create({
                viewer,
                objectModel: {
                  coordinates,
                  shapeType: 'line',
                  options  : {
                    styleName: 'eventsConnector',
                  },
                },
              });
          } else {
            eventsConnector.setCoordinates(coordinates);
          }

          viewer.addObject(eventsConnector);

        } else {

          if (eventsConnector) {
            viewer.removeObject(eventsConnector);
            eventsConnector = undefined;
          }
        }

        return drawable;
      },
    });

    /* endregion privileged methods */
  })
  .static({

    /**
     *
     * @constant
     */
    ROAM_LAYERS: {
      ROAM_ASSETS          : 'ROAM_ASSETS',
      ROAM_ASSETS_HISTORY  : 'ROAM_ASSETS_HISTORY',
      ROAM_ASSETS_ANIMATION: 'ROAM_ASSETS_ANIMATION',
      ROAM_LOCATIONS       : 'ROAM_LOCATIONS',
      ROAM_GEOFENCES       : 'ROAM_GEOFENCES',
      ROAM_GEOREFERENCES   : 'ROAM_GEOREFERENCES',
    },
  });

export { LayerManager as default, LayerManager };
