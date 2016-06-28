/**
 * Created by glenn on 30/11/15.
 */

import App from 'app';
import { project as mapsProject } from './project';
import { mapsDebugger } from './debugger';
import { LayerManager } from './viewers/manager/layer-manager';

const { ROAM_ASSETS, ROAM_ASSETS_HISTORY } = LayerManager.ROAM_LAYERS;

const LayerDataFetcher = stampit()
  .props({

    /**
     *
     */
    serviceUrl      : App.config.serviceUrl,
    /**
     *
     */
    domainObjectType: '',
    domainObjectId  : '',
    alarmEventIds   : undefined,
  })
  .methods({

    /**
     *
     * @param domainObjectType
     * @returns {boolean}
     */
    testIsSingleAssetModeEnabled(domainObjectType) {
      return !_.includes(
        ['customer', 'group', 'location', 'geofence'],
        domainObjectType);
    },

    /**
     *
     * @param layerName
     * @returns {boolean}
     */
    testIsPositionLayerName(layerName) {
      return (layerName === ROAM_ASSETS || layerName === ROAM_ASSETS_HISTORY);
    },
  })
  .init(({ instance }) => {
    const { serviceUrl, domainObjectType, domainObjectId, alarmEventIds } = instance;

    /* region private properties */

    let workingLayersProps = [];
    let dataUrls           = [];
    let requestPromises    = [];

    /* endregion private properties */

    /* region privileged methods */

    _.assign(instance, {

      /**
       *
       * @returns {Array}
       */
      getWorkingLayersProperties() {
        return workingLayersProps;
      },

      /**
       *
       * @param dataUrl
       */
      addDataUrl(dataUrl) {
        dataUrls.push(dataUrl);
      },

      /**
       *
       * @returns {Array}
       */
      getRequestPromises() {
        return requestPromises;
      },

      /**
       *
       */
      prefetch() {
        dataUrls = _(instance.getWorkingLayersProperties())
          .map(layerProps => layerProps.serviceUrls.read)
          .compact()
          .value();

        instance.fetch();
      },

      /**
       *
       * @returns {*|Array}
       */
      fetch() {
        mapsDebugger.time('Map data ajax requests time');
        requestPromises = _.map(dataUrls,
          dataUrl => $.ajax({
            url : serviceUrl + dataUrl,
            data: {
              domainObjectType,
              domainObjectId,
              eventIds: JSON.stringify(alarmEventIds),
            },

            beforeSend(jqXHR) {
              let dataType = '';

              if (dataUrl.match(/locations/i)) {
                //mapsDebugger.time('Locations data ajax request time');
                dataType = 'location';
              } else if (dataUrl.match(/geofences/i)) {
                //mapsDebugger.time('Geofences data ajax request time');
                dataType = 'geofence';
              } else {
                //mapsDebugger.time('Asset positions data ajax request time');
                dataType = 'assetmessageevent';
              }

              jqXHR.dataType = dataType;
            },

            success(data, textStatus, jqXHR) {
              //let dataType = jqXHR.dataType;
              //
              //if (dataType === 'location') {
              //    mapsDebugger.timeEnd('Locations data ajax request time');
              //} else if (dataType === 'geofence') {
              //    mapsDebugger.timeEnd('Geofences data ajax request time');
              //} else {
              //    mapsDebugger.timeEnd('Asset positions data ajax request time');
              //}
            },
          })
        );

        $.when(...requestPromises)
         .always(() => mapsDebugger.timeEnd('Map data ajax requests time'));

        return instance.getRequestPromises();
      },
    });

    /* endregion privileged methods */

    /* region init code */

    const positionLayerName =
            instance.testIsSingleAssetModeEnabled(domainObjectType) ?
            ROAM_ASSETS_HISTORY : ROAM_ASSETS;

    workingLayersProps = _.filter(mapsProject.roamLayers,
      (layerProps, layerName) => (layerName === positionLayerName ||
                                  (!instance.testIsPositionLayerName(layerName))));

    /* endregion init code */
  });

export { LayerDataFetcher as default, LayerDataFetcher };
