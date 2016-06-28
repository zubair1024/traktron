/**
 * Created by Glenn on 2015-07-30.
 */

import maps from 'googlemaps';
import MarkerClusterer from 'marker-clusterer';
import { Layer as AbstractLayer } from '../layer';
import { Styler } from '../../styler';

const google = { maps };

const styler = Styler.getInstance();

/**
 *
 * @extends {Layer}
 */
const GoogleMapsClusteringLayer = stampit()
  .init(({ instance }) => {
    const { viewer } = instance;

    /* region private properties */

    /*
     *
     */
    let markerClusterer;

    /*
     *
     */
    let data = {};

    /*
     *
     */
    let mapObjectList = {};

    /*
     *
     */
    const defaultClusteringOptions = {
      gridSize          : 60,
      maxZoom           : Infinity,
      zoomOnClick       : true,
      averageCenter     : false,
      minimumClusterSize: 3,
      ignoreHidden      : true,
      imagePath         : `${styler.getClusterIconsDir()}m`,
    };

    /*
     *
     */
    let clusteringDefer = $.Deferred();

    /* endregion private properties */

    /* region privileged methods */

    _.assign(instance, {

      /**
       *
       * @returns {*}
       */
      getNativeObject() {
        return markerClusterer;
      },

      /**
       *
       * @param key
       * @returns {*}
       */
      getData(key) {
        return data[key];
      },

      /**
       *
       * @param key
       * @param value
       */
      setData(key, value) {

        if (_.isPlainObject(key)) {
          _.assign(data, key);
        } else {
          data[key] = value;
        }
      },

      /**
       *
       * @returns {boolean}
       */
      isVisible() {
        return Boolean(instance.getData('visible'));
      },

      /**
       *
       * @param visible
       */
      setVisible(visible) {
        instance.setData('visible', visible);

        const map = visible ? viewer.getNativeObject() : undefined;

        /*
         * `markerClusterer.setMap(null)` unclusters the clusters
         * instead of setting the OverlayView's map to `null`.
         * And, with that, comes this below awkward line.
         */
        markerClusterer.activeMap_ = map;
        markerClusterer.setMap(map);
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

        const markers = _.map(mapObjects, (mapObject) => {
          mapObjectList[mapObject.id] = mapObject;

          return mapObject.getNativeObject();
        });

        markerClusterer.addMarkers(markers);
      },

      /**
       *
       * @param mapObjects
       */
      remove(mapObjects) {

        const markers = _.map(mapObjects, (mapObject) => {
          delete mapObjectList[mapObject.id];

          return mapObject.getNativeObject();
        });

        markerClusterer.removeMarkers(markers);
      },

      /**
       *
       */
      clear() {
        mapObjectList = {};

        markerClusterer.clearMarkers();
      },

      /**
       *
       * @returns {{top: (*|Number), right: (*|Number), bottom: (*|Number), left: (*|Number)}}
       */
      getBounds() {
        const markers = markerClusterer.getMarkers();
        let bbox;

        if (markers.length > 0) {
          const bounds = new google.maps.LatLngBounds();

          _.forEach(markers, marker => bounds.extend(marker.getPosition()));

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

      /**
       *
       * @returns {boolean}
       */
      isClusteringSupported() {
        return true;
      },

      /**
       *
       * @param [clusteringOptions]
       */
      performClustering(clusteringOptions) {
        clusteringDefer = $.Deferred();

        let markers = [];

        if (markerClusterer) {
          markers = markerClusterer.getMarkers();
          markerClusterer.clearMarkers();
        }

        const clusteringEnabled = instance.isClusteringEnabled();
        const mcOptions         = _.merge(
          {},
          defaultClusteringOptions,
          { minimumClusterSize: clusteringEnabled ? undefined : Infinity },
          clusteringOptions
        );

        instance.setData('clustered',
          _.isFinite(mcOptions.minimumClusterSize));

        markerClusterer = new MarkerClusterer(
          viewer.getNativeObject(), markers, mcOptions);

        google.maps.event.addListenerOnce(
          markerClusterer, 'clusteringend', () => clusteringDefer.resolve());
      },

      /**
       *
       * @returns {*}
       */
      resolveClustering() {
        return clusteringDefer.promise();
      },
    });

    /* endregion privileged methods */

    /* region init code */

    viewer.addEventListener('mapviewchangeend', () => {

      if (instance.isClusteringEnabled()) {
        const clustered = instance.getData('clustered');

        if (viewer.getZoom() >= 20) {

          if (clustered) {
            instance.performClustering({ minWeight: Infinity });
          }
        } else {

          if (!clustered) {
            instance.performClustering();
          }
        }
      }
    });

    // Enable clustering by default.
    instance.setClusteringEnabled(true);

    instance.setVisible(true);
    instance.setData('wrapper', instance);

    /* endregion init code */
  });

const ClusteringLayer = stampit.compose(AbstractLayer, GoogleMapsClusteringLayer);

export { ClusteringLayer as default, ClusteringLayer };
