/**
 * Created by Glenn on 2014-11-10.
 */

import App from 'app';
import { project as mapsProject } from './project';
import { mapsDebugger } from './debugger';

const { util, config } = App;
const layersConfig = mapsProject.roamLayers;
const { serviceUrls } = mapsProject;

/*
 * Let's go for the "fat models, skinny controllers" approach, meaning
 * "the Controller" gets whittled down to simple router; it listens to
 * the view and instructs the model to update its state. It handles any
 * errors thrown by the model, while domain logic and validations get
 * largely shifted to the model. The controller also acts as a service
 * layer for accessing the backend via jQuery.ajax().
 */
const Controller = stampit()
  .props({

    /**
     * View
     */
    controls: undefined,
    /**
     * Model
     */
    viewer  : undefined,
  })
  .init(({ instance }) => {
    const { controls, viewer } = instance;

    /* region privileged methods */

    _.assign(instance, {

      /**
       *
       * @param customErrorMessage
       * @param e
       */
      logError(customErrorMessage, e) {
        console.error(`${customErrorMessage} > ${e.stack}`);
      },

      /**
       *
       * @param options
       * @param onMapReady
       */
      onMapMvcComponentsInitialized(options, onMapReady) {
        const layerDataFetcher = viewer.getLayerDataFetcher();
        const layerManager     = viewer.getLayerManager();
        const initRoamLayers   = () => {

          /*
           * Load asset position layer that matches
           * the map viewer mode, and all other
           * non-asset position layers (loading order is
           * not guaranteed):
           * - ROAM_ASSETS OR ROAM_ASSETS_HISTORY,
           * - ROAM_LOCATIONS,
           * - ROAM_GEOFENCES,
           * - ROAM_ASSETS_ANIMATION.
           */
          _.forEach(layerDataFetcher.getWorkingLayersProperties(),
            layerProps => layerManager.addLayer(layerProps));

          const requestPromises  = layerDataFetcher.getRequestPromises();
          const rqPromiseLen     = requestPromises.length;
          let doneRqPromiseCount = 0;
          const layersDataDefer  = $.Deferred();

          _.forEach(requestPromises, (requestPromise) => {

            /**
             * Possibility of multi-threading
             * (parallel execution of code) for
             * loading asset position, location,
             * and geofence objects. Unfortunately
             * JS will remain single-threaded
             * for the moment ("web workers"
             * is not stable yet).
             * @see https://github.com/caolan/async#paralleltasks-callback
             * @see http://codersblock.com/blog/multi-threaded-javascript-with-web-workers/
             */
            requestPromise.done((data, textStatus, jqXHR) => {

              if (doneRqPromiseCount === 0) {
                mapsDebugger.time('Map data loading time');
              }

              data.dataType = jqXHR.dataType;
              instance.onObjectsDataFetchingSucceeded(data);

              doneRqPromiseCount = doneRqPromiseCount + 1;

              if (doneRqPromiseCount === rqPromiseLen) {
                mapsDebugger.timeEnd('Map data loading time');
                layersDataDefer.resolve();
              }
            });
          });

          return layersDataDefer.promise();
        };

        const initMapViewerDefaultState = () => {
          mapsDebugger.time('Map default state initialization time');

          /* region Map view panel */

          const { autoRefresh, autoFocus, rememberLastViewportEnabled } = options;
          viewer.setViewBehavior({
            autoRefresh,
            autoFocus,
            rememberLastViewportEnabled,
          });

          controls.setAutoLabelingCheckboxHidden(
            config.map.autoLabelingCheckboxHidden);

          /* endregion Map view panel */

          /* region Intervals panel */

          /**
           * A global injection function for adjusting
           * the "now" time reference based on current
           * user's timezone setting.
           *
           * The reason why it is put here instead in the
           * `defaults` is rather related to "some" backend
           * reason.
           * @returns {Date}
           */
          App.config.map.now = () => {
            const originalNow = config.map.originalNow;
            const utcNow      = new Date(
              originalNow.getTime() + originalNow.getTimezoneOffset() * 60000);

            return util.dateFromGMT(utcNow);
          };

          const today    = viewer.selectIntervalRange('TODAY');
          const tomorrow = {

            /*
             * tomorrow.min = tomorrow 12:00 AM
             * (12 midnight).
             */
            min: new Date((new Date(today.min))
              .setDate(today.min.getDate() + 1)),
          };
          const last24H  = viewer.selectIntervalRange('LAST_24H');

          controls.setDateTimePickerMaxDate(tomorrow.min);
          viewer.updateDataSelectionOptions({
            latest: true,
            from  : last24H.min,
            to    : last24H.max,
          });

          /* endregion Intervals panel */

          /* region Navigation panel */

          const viewerName          = viewer.name;
          const positionLayerConfig = layersConfig[layerManager.getPositionLayerName()];
          let useClustersActivated  = positionLayerConfig.clusteringSupported;

          /*
           * Enable use clusters option to `false` depending
           * on the viewer name property that comes from
           * the server. Should match strings like:
           * "HereMapsNoClusters", "HereMapsNo_Clusters",
           * "HereMapsNo-Clusters", "GoogleMapsV3_No_Clusters",
           * and all that.
           */
          const noClustersRegex = /no([^A-Za-z0-9])?cluster/i;

          if (viewerName && viewerName.match(noClustersRegex)) {
            useClustersActivated = false;
          }

          /*
           * As you can see, this is why I differentiate
           * between the jargon "enabled" and "activated".
           */
          controls.setUseClustersCheckboxEnabled(useClustersActivated);
          viewer.setUseClustersActivated(useClustersActivated);

          ///*
          // * TODO: TO BE REMOVED ONCE THE BACKEND IS READY.
          // * Currently served as simulation for randomly assigning
          // * asset status to `assetmessageevent` object.
          // */
          //const assetStatuses = ['Loaded', 'Unloaded', 'Unknown'];
          //const lm            = layerManager;
          //
          //_(lm.getObjectsByLayer(lm.getPositionLayerName()))
          //    .map('roamObject')
          //    .forEach(roamObject => roamObject.assetStatus = _.sample(assetStatuses));

          //controls.setAssetStatusFiltersVisible(App.config.map.assetStatusFilters);

          controls.setAssetStatusFiltersValues(viewer.getUniqueAssetStatusFiltersValues());

          /* endregion Navigation panel */

          /*
           * "Current object" [sic.], a term that can only
           * be understood in non-asset related map realm.
           * It is considering the fact that objects like
           * locations or geofences can have a map, too.
           */
          const { currentObject } = viewer;

          if (currentObject) {
            const { domainObjectType, domainObjectTypeId } = currentObject;
            const layerName = layerManager.getLayerName(domainObjectType);

            layerManager.addObject(layerName, currentObject);
            viewer.zoomToObject(layerName, domainObjectTypeId);
          }

          const { domainObjectType, domainObjectId } = viewer;

          return $.ajax({
            url : `${config.serviceUrl}${serviceUrls.locationConfig.read}`,
            data: {
              domainObjectType,
              domainObjectId,
            },

            success(data) {
              controls.setLocationConfigNames(
                _.map(data.data, (locationType) => ({
                    text : locationType,
                    value: locationType,
                  })
                ));
              mapsDebugger.timeEnd('Map default state initialization time');
            },
          });
        };

        try {

          /*
           * Adjust map viewer mode (multi-/single- asset).
           * Customer, asset group, location, geofence type
           * falls into multi-asset category.
           */
          viewer.setSingleAssetModeEnabled(
            layerDataFetcher.testIsSingleAssetModeEnabled(viewer.domainObjectType));

          /**
           * Promises, promises.
           * @see https://spring.io/understanding/javascript-promises
           * @see http://api.jquery.com/Types/#Promise
           * @see http://api.jquery.com/deferred.promise/
           */
          viewer
            .resolveProjection()
            .then(initRoamLayers, (jqXHR, textStatus, errorThrown) =>
              logError('Error resolving map projection.', new Error(errorThrown)))
            .then(initMapViewerDefaultState, (jqXHR, textStatus, errorThrown) =>
              logError('Error initializing ROAM layers.', new Error(errorThrown)))
            .then(onMapReady, (jqXHR, textStatus, errorThrown) =>
              logError('Error initializing default state of map viewer.', new Error(errorThrown)));
        } catch (e) {
          logError('Error initializing map.', e);
        }
      },

      /**
       *
       * @param data
       */
      onObjectsDataFetchingSucceeded(data) {
        const layerManager = viewer.getLayerManager();

        try {
          const { dataType, latestPositionEventId, currentObject } = data;
          const layerName = layerManager.getLayerName(dataType);
          const objects   = data.data;

          if (latestPositionEventId) {
            layerManager.markLatestPositionRoamObject(
              objects, latestPositionEventId);
          }

          layerManager.loadObjects(dataType, objects);
          layerManager.setAllObjectsVisibility(
            layerName, layerManager.getLayerVisibility(layerName));

          if (viewer.isAutoFocus() &&
              layerManager.testIsPositionLayerName(layerName)) {

            if (objects.length === 1) {
              viewer.zoomToObject(layerName, _.first(objects).domainObjectTypeId);
            } else {
              viewer.zoomToLayer(layerName);
            }
          }

          if (currentObject) {
            viewer.currentObject = currentObject;
          }

          const metadata = data.metadata || {};

          if (metadata && layerManager.testIsPositionLayerName(layerName)) {

            /*
             * Couldn't care less. Most parts of the app are hacks already.
             */
            App.config.map.assetStatusFilters = metadata.assetStatusAvailable;

            if (viewer.isAssetStatusFiltersEnabled()) {

              ///*
              // * TODO: TO BE REMOVED ONCE THE BACKEND IS READY.
              // * Currently served as simulation for randomly assigning
              // * asset status to `assetmessageevent` object.
              // */
              //const assetStatuses = ['Loaded', 'Unloaded', 'Unknown'];
              //const lm            = layerManager;
              //
              //_(lm.getObjectsByLayer(lm.getPositionLayerName()))
              //    .map('roamObject')
              //    .forEach(roamObject => roamObject.assetStatus = _.sample(assetStatuses));

              controls.setAssetStatusFiltersVisible(true);

              controls.setAssetStatusFiltersValues(
                viewer.getUniqueAssetStatusFiltersValues());

              instance.onAssetStatusFiltersChanged(
                viewer.getSelectedAssetStatusFilters());
            }
          }

        } catch (e) {
          logError('Error loading ROAM objects.', e);
        }
      },

      /**
       *
       * @param checked
       */
      onAutoRefreshToggled(checked) {

        try {
          viewer.setAutoRefresh(checked);
        } catch (e) {
          logError('Error toggling auto-refresh state.', e);
        }
      },

      /**
       *
       * @param positionLayerName
       * @param polling
       */
      onPositionsFetchingRequested(positionLayerName, polling) {

        try {
          const dataSelectionOptions = viewer.getDataSelectionOptions();
          const requestData          = {};

          /*
           * Only consider `interval` selection mode when the
           * positions fetching is *not* meant to do a poll.
           */
          if (!polling) {

            if (!dataSelectionOptions.latest) { // -> interval

              /*
               * Copy objects, in order to keep the internal
               * attributes timezone free.
               */
              let from = new Date(dataSelectionOptions.from);
              let to   = new Date(dataSelectionOptions.to);

              from = kendo.toString(util.dateToGMT(from), config.dateTimeFormat);
              to   = kendo.toString(util.dateToGMT(to), config.dateTimeFormat);

              _.assign(requestData, {
                from,
                to,
              });
            }
          }

          const layerProperties = layersConfig[positionLayerName];
          const { domainObjectType, domainObjectId, alarmEventIds } = viewer;
          const dateRangeSlider = viewer.getDateRangeSlider();

          $.ajax({
            url : `${config.serviceUrl}${layerProperties.serviceUrls.read}`,
            data: _.assign(requestData, {
              domainObjectType,
              domainObjectId,
              eventIds: JSON.stringify(alarmEventIds),
            }),

            beforeSend() {

              if (dateRangeSlider) {
                dateRangeSlider.setEnabled(false);
              } else {
                controls.setProgressOverlayEnabled(true);
              }
            },

            success(data) {
              data.dataType = 'assetmessageevent';
              instance.onObjectsDataFetchingSucceeded(data);

              if (viewer.isSingleAssetModeEnabled()) {

                if (viewer.isAnimationFeatureActivated()) {
                  instance.onAnimationPositionsLoadingRequested();
                }

                if (viewer.isConnectHistoryPositionsActivated()) {
                  const positions = data.data;

                  instance.onEventsConnectorDrawingRequested(positions);
                }
              }
            },

            error(jqXHR, textStatus, errorThrown) {
              logError('Error fetching asset positions.',
                new Error(errorThrown));
            },

            complete() {

              if (dateRangeSlider) {
                dateRangeSlider.setEnabled(true);
              } else {
                controls.setProgressOverlayEnabled(false);
              }

              viewer.refresh();
            },
          });
        } catch (e) {
          logError('Error fetching asset positions.', e);
        }
      },

      /**
       *
       * @param checked
       */
      onAutoFocusToggled(checked) {

        try {
          viewer.setAutoFocus(checked);
        } catch (e) {
          logError('Error toggling auto-focus state.', e);
        }
      },

      /**
       *
       * @param checked
       */
      onAutoLabelingToggled(checked) {

        try {
          viewer.setAutoLabelingActivated(checked);
        } catch (e) {
          logError('Error toggling auto-labeling state.', e);
        }
      },

      /**
       *
       * @param bbox
       */
      onViewportSaved(bbox) {

        try {
          localStorage.setItem('USER_BBOX', JSON.stringify(bbox));

          App.view.toast.showNotificationSimple(
            'Info',
            App.translate(''),
            App.translate('The viewport has been successfully saved.')
          );
        } catch (e) {
          logError('Error saving viewport to local storage.', e);
        }
      },

      /**
       *
       * @param bboxText
       */
      onViewportRestored(bboxText) {

        try {
          viewer.setBoundingBox(JSON.parse(bboxText));

          App.view.toast.showNotificationSimple(
            'Info',
            App.translate(''),
            App.translate('The viewport has been successfully restored.')
          );
        } catch (e) {
          logError('Error restoring viewport from local storage.', e);
        }
      },

      /**
       *
       * @param scale
       */
      onScaleZoomingSelected(scale) {

        try {
          viewer.zoomToScale(_.parseInt(scale));
        } catch (e) {
          logError('Error zooming to selected scale.', e);
        }
      },

      /**
       *
       * @param level
       */
      onLevelZoomingSelected(level) {

        try {
          viewer.zoomToLevel(_.parseInt(level));
        } catch (e) {
          logError('Error zooming to selected level.', e);
        }
      },

      /**
       *
       * @param options
       */
      onDataSelectionOptionsUpdated(options) {

        try {
          viewer.updateDataSelectionOptions(options);
        } catch (e) {
          logError('Error updating data selection options.', e);
        }
      },

      /**
       *
       * @param layerName
       * @param objectId
       */
      onObjectZoomingRequested(layerName, objectId) {

        try {

          if (viewer.lazyLoadingEnabled) {
            const layerManager = viewer.getLayerManager();

            if (!layerManager.testIsPositionLayerName(layerName)) {
              layerManager.addObject(
                layerName, layerManager.getCachedRoamObject(objectId));
            }
          }

          viewer.zoomToObject(layerName, objectId);
        } catch (e) {
          logError('Error zooming to map object.', e);
        }
      },

      /**
       *
       * @param [layerName]
       */
      onLayerZoomingRequested(layerName) {
        const layerManager = viewer.getLayerManager();

        try {
          layerName = layerName || layerManager.getPositionLayerName();
          viewer.zoomToLayer(layerName);
        } catch (e) {
          logError('Error zooming to layer.', e);
        }
      },

      /**
       *
       * @param layerName
       * @param objectIds
       * @param checked
       */
      onObjectsVisibilityToggled(layerName, objectIds, checked) {
        const layerManager = viewer.getLayerManager();

        try {
          const positionLayerNameMatched = layerManager.testIsPositionLayerName(layerName);

          if (positionLayerNameMatched) {

            // Clear the asset status filters.
            //this.onAssetStatusFiltersChanged([]);
            viewer.setSelectedAssetStatusFilters([]);
          }

          if (viewer.lazyLoadingEnabled) {

            if (!positionLayerNameMatched) {
              const cachedRoamObjects = layerManager.getCachedRoamObjects(objectIds);

              layerManager.addObjects(layerName, cachedRoamObjects);
            }
          }

          layerManager.setObjectsVisibility(layerName, objectIds, checked);
        } catch (e) {
          logError('Error toggling objects visibility.', e);
        }
      },

      /**
       *
       * @param layerName
       * @param checked
       */
      onObjectLabelsVisibilityToggled(layerName, checked) {
        const layerManager = viewer.getLayerManager();

        try {
          layerManager.setObjectLabelsVisibility(layerName, checked);
        } catch (e) {
          logError('Error toggling object labels visibility.', e);
        }
      },

      /**
       *
       * @param objectId
       * @param selected
       */
      onPositionSelectionToggled(objectId, selected) {
        const layerManager = viewer.getLayerManager();

        try {
          layerManager.setPositionHighlighted(objectId, selected);
        } catch (e) {
          logError('Error toggling selected position highlight.', e);
        }
      },

      /**
       *
       * @param checked
       */
      onUseClustersStatusToggled(checked) {

        try {
          viewer.setUseClustersActivated(checked);
        } catch (e) {
          logError('Error toggling "Use clusters" status.', e);
        }
      },

      /**
       *
       * @param positions
       */
      onEventsConnectorDrawingRequested(positions) {
        const layerManager = viewer.getLayerManager();

        try {
          layerManager.drawEventsConnector(positions);
        } catch (e) {
          logError('Error drawing the events connector.', e);
        }
      },

      /**
       *
       * @param checked
       */
      onConnectHistoryPositionsStatusToggled(checked) {

        try {
          viewer.setConnectHistoryPositionsActivated(checked);
        } catch (e) {
          logError('Error toggling "Connect history positions" status.', e);
        }
      },

      /**
       *
       * @param filters
       */
      onAssetStatusFiltersChanged(filters) {
        const layerManager = viewer.getLayerManager();

        try {
          const layerName = layerManager.getPositionLayerName();

          controls.setProgressOverlayEnabled(true);

          if (!_.isEmpty(filters)) {
            const parts = _(layerManager.getObjectsByLayer(layerName))
              .map('roamObject')
              .partition((position) => {
                //return _.includes(filters, position.assetStatus);

                /*
                 * Jawad says in the (near) future, an
                 * `assetmessageevent` position may have
                 * multiple assetStatus values (Ghana?).
                 * So, better make these code lines below
                 * future-proof while it's still easy.
                 */
                const { assetStatus } = position;
                let assetStatuses = [];

                if (_.isArray(position.assetStatus)) {
                  assetStatuses = assetStatus;
                } else {
                  assetStatuses = [assetStatus];
                }

                return assetStatuses.some(value => _.includes(filters, value));
              })
              .map(part => _.map(part, 'domainObjectTypeId'))
              .value();

            layerManager.setObjectsVisibility(layerName, parts[0], true);

            layerManager.setObjectsVisibility(layerName, parts[1], false);
          } else {
            layerManager.setAllObjectsVisibility(layerName, true);
          }

          controls.setProgressOverlayEnabled(false);

          viewer.setSelectedAssetStatusFilters(filters);
        } catch (e) {
          logError('Error filtering assets based on status.', e);
        }
      },

      /**
       *
       */
      onAnimationPositionsLoadingRequested() {

        try {
          viewer.setAnimationFeatureActivated(true);
        } catch (e) {
          logError('Error loading animation objects.', e);
        }
      },

      /**
       *
       */
      onAnimationPaused() {
        const animationManager = viewer.getAnimationManager();

        try {
          animationManager.pauseAnimation();
        } catch (e) {
          logError('Error pausing animation.', e);
        }
      },

      /**
       *
       */
      onAnimationStopped() {
        const animationManager = viewer.getAnimationManager();

        try {
          animationManager.stopAnimation();
        } catch (e) {
          logError('Error stopping animation.', e);
        }
      },

      /**
       *
       */
      onAnimationStarted() {
        const animationManager = viewer.getAnimationManager();

        try {
          animationManager.startAnimation();
        } catch (e) {
          logError('Error starting animation.', e);
        }
      },

      /**
       *
       * @param step
       */
      onAnimationStepSelected(step) {
        const animationManager = viewer.getAnimationManager();

        try {
          animationManager.stepTo(step);
        } catch (e) {
          logError('Error doing step-to animation.', e);
        }
      },

      /**
       *
       * @param animationSpeed
       */
      onAnimationSpeedSelected(animationSpeed) {
        const animationManager = viewer.getAnimationManager();

        try {
          animationManager.setAnimationSpeed(animationSpeed);
        } catch (e) {
          logError('Error setting animation speed.', e);
        }
      },

      /**
       *
       * @param trailLength
       */
      onAnimationTrailLengthSelected(trailLength) {
        const animationManager = viewer.getAnimationManager();

        try {
          animationManager.setTrailLength(trailLength);
        } catch (e) {
          logError('Error setting animation trail length.', e);
        }
      },

      /**
       *
       */
      onEditModeDeactivated() {
        const editManager = viewer.getEditManager();

        try {
          editManager.destroy();
        } catch (e) {
          logError('Error destroying edit manager.', e);
        }
      },

      /**
       *
       * @param objectType
       */
      onEditableObjectTypeSelected(objectType) {
        const editManager = viewer.getEditManager();

        try {
          editManager.setEditableObjectType(objectType);
        } catch (e) {
          logError('Error setting edit object type.', e);
        }
      },

      /**
       *
       * @param shapeType
       */
      onEditableObjectShapeTypeSelected(shapeType) {
        const editManager = viewer.getEditManager();

        try {
          editManager.setEditableObjectShapeType(shapeType);
        } catch (e) {
          logError('Error setting edit object shape type.', e);
        }
      },

      /**
       *
       * @param latLng
       */
      onEditableObjectLatLngEntered(latLng) {
        const editManager = viewer.getEditManager();

        try {
          const coordinates = _.map(latLng.split(','),
            coordinate => parseFloat(parseFloat(coordinate).toFixed(8)));
          const [lat, lng] = coordinates;

          if (_.isFinite(lat) && _.isFinite(lng)) {
            editManager.setEditableObjectLatLng(lat, lng);
          }
        } catch (e) {
          logError('Error setting edit object coordinates.', e);
        }
      },

      /**
       *
       * @param bufferDistance
       */
      onEditableObjectBufferDistanceEntered(bufferDistance) {
        const editManager = viewer.getEditManager();

        try {
          const distance = parseFloat(bufferDistance);

          if (_.isFinite(distance)) {
            editManager.setEditableObjectBufferDistance(distance);
          }
        } catch (e) {
          logError('Error setting edit object buffer distance.', e);
        }
      },

      /**
       *
       * @param objectName
       */
      onEditableObjectNameEntered(objectName) {
        const editManager = viewer.getEditManager();

        try {
          editManager.setEditableObjectName(objectName);
        } catch (e) {
          logError('Error setting edit object name.', e);
        }
      },

      /**
       *
       * @param configName
       */
      onEditableObjectConfigNameSelected(configName) {
        const editManager = viewer.getEditManager();

        try {
          editManager.setEditableObjectConfigName(configName);
        } catch (e) {
          logError('Error setting edit object config name.', e);
        }
      },

      /**
       *
       * @param layerName
       * @param objectProperties
       */
      onObjectCreationRequested(layerName, objectProperties) {
        const layerManager = viewer.getLayerManager();

        try {
          const { domainObjectType, domainObjectId } = viewer;

          $.ajax({
            url : `${config.serviceUrl}${layersConfig[layerName].serviceUrls.create}`,
            type: 'POST',
            data: {
              ...objectProperties,
              domainObjectType,
              domainObjectId,
            },

            success(data) {
              const object = _.first(data.data);

              layerManager.addObject(layerName, object);

              if (viewer.lazyLoadingEnabled &&
                  (!layerManager.testIsPositionLayerName(layerName))) {

                layerManager.addCachedRoamObject(object);
              }

              layerManager.setObjectVisibility(
                layerName, object.domainObjectTypeId, true);
            },

            error(jqXHR) {
              const errorMessage = _.first(jqXHR.responseJSON.messages);

              App.view.toast.showNotificationSimple(
                'Error',
                App.translate('The object creation failed.'),
                errorMessage
              );

              logError('Error creating ROAM object.', new Error(errorMessage));
            },

            complete: () => {
              instance.onEditModeDeactivated();
            },
          });
        } catch (e) {
          logError('Error creating ROAM object.', e);
        }
      },

      /**
       *
       * @param index
       */
      onWaypointItemAdditionRequested(index) {
        const routingManager = viewer.getRoutingManager();

        try {
          routingManager.addWaypoint({}, index);
        } catch (e) {
          logError('Error adding waypoint item.', e);
        }
      },

      /**
       *
       * @param index
       */
      onWaypointItemRemovalRequested(index) {
        const routingManager = viewer.getRoutingManager();

        try {
          routingManager.removeWaypoint(index);
        } catch (e) {
          logError('Error removing waypoint item.', e);
        }
      },

      /**
       *
       * @param fromIndex
       * @param toIndex
       */
      onWaypointItemReorderingRequested(fromIndex, toIndex) {
        const routingManager = viewer.getRoutingManager();

        try {
          routingManager.reorderWaypoint(fromIndex, toIndex);
        } catch (e) {
          logError('Error reordering waypoint item.', e);
        }
      },

      /**
       *
       * @param waypoint
       * @param index
       */
      onWaypointItemSelected(waypoint, index) {
        const routingManager = viewer.getRoutingManager();

        try {
          routingManager.updateWaypoint(waypoint, index);
        } catch (e) {
          logError('Error setting waypoint item.', e);
        }
      },

      /**
       *
       * @param query
       */
      onPlacesSearchRequested(query) {
        const routingManager = viewer.getRoutingManager();

        try {
          const routingControls = routingManager.getRoutingControls();

          routingControls.setProgressOverlayEnabled(true);
          routingManager.clearPlaces();

          /*
           * Fetch places data from native map viewer's
           * places service API.
           */
          routingManager
            .searchPlaces(query)
            .done(places => routingManager.addPlaces(places))
            .fail((e) => {
              logError(
                `Could not retrieve nearby places from ${viewer.getFriendlyName()} service.`,
                new Error(e.message));
            })
            .always(() => routingControls.setProgressOverlayEnabled(false));

          const { domainObjectType, domainObjectId } = viewer;

          /**
           * Fetch geoposition objects (the ones that have
           * longitude and latitude - currently: locations and
           * assets) which have been persisted in our system.
           */
          $.ajax({
            url : `${config.serviceUrl}${serviceUrls.geoPositionObjects.read}`,
            type: 'GET',
            data: {
              domainObjectType,
              domainObjectId,
              name: query,
            },

            success(data) {
              routingManager.addPlaces(
                _.map(data.results, (geoPositionObject) => {
                  const { latitude, longitude,
                          name, domainObjectType, id, } = geoPositionObject;

                  return {
                    name,
                    domainObjectType,
                    icon          : `mc-icon-routing-type${domainObjectType}`,
                    lat           : latitude,
                    lng           : longitude,
                    domainObjectId: id,
                  };
                }));
            },

            error(jqXHR, textStatus, errorThrown) {
              logError(
                `Could not retrieve geo position objects from ROAM Caesar service.`,
                new Error(errorThrown));
            },

            complete() {
              routingControls.setProgressOverlayEnabled(false);
            },
          });
        } catch (e) {
          logError('Error retrieving place suggestions.', e);
        }
      },

      /**
       *
       * @param featureName
       * @param checked
       */
      onRouteFeatureToggled(featureName, checked) {
        const routingManager = viewer.getRoutingManager();

        try {
          routingManager.setRouteFeatureAvoided(featureName, !checked);
        } catch (e) {
          logError('Error toggling route feature.', e);
        }
      },

      /**
       *
       */
      onRouteCalculationRequested() {
        const routingManager = viewer.getRoutingManager();

        try {
          const routingControls = routingManager.getRoutingControls();

          routingControls.expandRoutingPanel();
          routingControls.setProgressOverlayEnabled(true);

          routingManager
            .calculateRoute()
            .done(result => routingManager.setRoutingResult(result))
            .fail((e) => {
              logError(
                `${viewer.getFriendlyName()} routing service could not calculate route.`,
                new Error(e.message));
            })
            .always(() => {
              routingControls.setProgressOverlayEnabled(false);
              routingControls.updateSaveRouteButton();
              routingControls.duckPunchWaypoints();
            });
        } catch (e) {
          App.view.toast.showNotificationSimple(
            'Error',
            App.translate('The routing failed.'),
            e.message
          );

          logError('Error calculating route.', e);
        }
      },

      /**
       *
       */
      onRouteSavingRequested() {
        const routingManager = viewer.getRoutingManager();

        $.when(App.dialog.input({
          title   : App.translate('Save Route'),
          message : App.translate('Choose a name for this new route:'),
          labelOK : App.translate('Save Route'),
          required: true,
        })).done((response) => {

          if (response.button === 'OK') {
            const routeData = routingManager.yieldSaveRouteRequestData();

            /*
             * Safety first. Do we really have a valid route here?
             */
            if (routeData.waypoints.length >= 2) {
              const { domainObjectType, domainObjectId } = viewer;

              /*
               * Save the route.
               */
              $.ajax({
                url : config.serviceUrl +
                      serviceUrls.routing.create,
                data: {
                  domainObjectType,
                  domainObjectId,
                  name : response.input,
                  route: JSON.stringify(routeData),
                },

                success() {
                  App.view.toast.showNotificationSimple(
                    'Info',
                    App.translate(''),
                    App.translate('The route has been successfully saved.')
                  );
                },

                error(jqXHR, textStatus, errorThrown) {
                  logError('Error saving the route.', new Error(errorThrown));
                },
              });
            }
          }
        });
      },

      /**
       *
       * @param directionsIncluded
       */
      onMapsPrintRequested(directionsIncluded) {

        try {
          viewer.print(directionsIncluded ?
                       viewer.getRoutingManager().getRouteDirections() :
                       undefined);
        } catch (e) {
          logError('Error printing the maps.', e);
        }
      },

      /**
       *
       */
      onResize() {

        try {
          viewer.resize();
        } catch (e) {
          logError('Error resizing the map viewer.', e);
        }
      },

      /**
       *
       */
      onDestroy() {

        try {
          const mapInfoBox = viewer.getMapInfoBox();

          if (controls) {
            controls.destroy();
          }

          if (mapInfoBox) {
            mapInfoBox.destroy();
          }

          if (viewer.rememberLastViewportEnabled) {
            instance.onViewportSaved(viewer.getBoundingBox());
          }

          viewer.container.empty();
        } catch (e) {
          logError('Error destroying the controller.', e);
        }
      },
    });

    /* endregion privileged methods */

    /* region init code */

    const { logError } = instance;

    /* endregion init code */
  });

export { Controller as default, Controller };
