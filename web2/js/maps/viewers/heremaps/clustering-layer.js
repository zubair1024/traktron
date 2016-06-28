/**
 * Created by Glenn on 2015-06-29.
 */

import H from 'heremaps';
import { Layer as AbstractLayer } from '../layer';

/**
 *
 * @extends {Layer}
 */
const HereMapsClusteringLayer = stampit()
  .init(({ instance }) => {
    const { viewer } = instance;

    /* region private properties */

    /*
     *
     */
    let clusteringLayer;

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
    let dataPoints        = [];
    let visibleDataPoints = [];
    let clusteringProvider;

    /*
     *
     */
    const defaultClusteringOptions = {
      eps      : 60,
      minWeight: 3,
      strategy : H.clustering.Provider.Strategy.FASTGRID,
    };

    /*
     *
     */
    let clusteringDefer = $.Deferred();

    /* endregion private properties */

    /* region private methods */

    /**
     *
     */
    function updateClusteringDataPoints() {

      /*
       * Consider only the data point which has visible
       * map object to be in a cluster.
       */
      visibleDataPoints = _.filter(dataPoints,
        dataPoint => dataPoint.data.getVisibility());

      clusteringProvider.setDataPoints(visibleDataPoints);
    }

    /**
     *
     */
    const updateNoiseVisibility = _.debounce(() => {

      _.forEach(instance.getObjects(),
        mapObject => mapObject.getNativeObject().updateVisibility());

      clusteringDefer.resolve();
    }, 2);

    /* endregion private methods */

    /* region privileged methods */

    _.assign(instance, {

      /**
       *
       * @returns {*}
       */
      getNativeObject() {
        return clusteringLayer;
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

        if (visible) {
          viewer.addLayer(clusteringLayer);
        } else {
          viewer.removeLayer(clusteringLayer);
        }
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

        _(mapObjects)
          .map((mapObject) => {
            mapObjectList[mapObject.id] = mapObject;

            return mapObject.getNativeObject();
          })
          .forEach((marker) => {
            const { lat, lng } = marker.getPosition();

            /*
             * Attach .getNoiseVisibility() method to retrieve
             * noise marker visibility by taking the "min zoom"
             * variable into account.
             */
            marker.getNoiseVisibility = () => {
              const { minZoom } = marker.getData();

              /*
               * `minZoom` should always be a number and less
               * than or equal to the current supported max
               * zoom value of the map zoom control, i.e. 20.
               */
              const min             = (_.isNumber(minZoom) && minZoom <= 20) ?
                                      minZoom : 20;
              const zoom            = viewer.getZoom();
              const noiseVisibility = (min <= zoom);

              return noiseVisibility;
            };

            /*
             * Modify map object's .getVisibility() and .setVisibility()
             * methods to conform clustering behavior. Store
             * these original methods and make use of them.
             */
            const defaultGetVisibilityMethod = marker.getVisibility;
            const defaultSetVisibilityMethod = marker.setVisibility;

            marker.getVisibility = (effective) => {
              const { objectVisibility } = marker.getData();
              let visibility = _.isBoolean(objectVisibility) ?
                               objectVisibility : instance.isVisible();

              if (effective) {
                visibility = visibility &&
                             defaultGetVisibilityMethod.call(marker, effective);
              }

              return Boolean(visibility);
            };

            marker.setVisibility = (visibility) => {
              marker.getData().objectVisibility = visibility;

              defaultSetVisibilityMethod.call(
                marker, visibility && marker.getNoiseVisibility());
            };

            marker.updateVisibility = () =>
              marker.setVisibility(marker.getVisibility());

            /*
             * Adjust default map object's visibility in this
             * clustering layer by refreshing its visibility.
             */
            marker.updateVisibility();

            dataPoints.push(new H.clustering.DataPoint(lat, lng, 1, marker));
          });

        updateClusteringDataPoints();
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

        _.remove(dataPoints, (dataPoint) => {
          const noiseMarker = dataPoint.data;

          return _.includes(markers, noiseMarker);
        });

        updateClusteringDataPoints();
      },

      /**
       *
       */
      clear() {
        mapObjectList = {};
        dataPoints    = [];

        updateClusteringDataPoints();
      },

      /**
       *
       * @returns {{top: (*|Number), right: (*|Number), bottom: (*|Number), left: (*|Number)}}
       */
      getBounds() {
        const bounds = H.geo.Rect.coverPoints(dataPoints);
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

        if (clusteringLayer) {
          viewer.removeLayer(clusteringLayer);
        }

        /*
         * Setup clustering options.
         */
        const clusteringEnabled = instance.isClusteringEnabled();
        const options           = {
          clusteringOptions: _.merge(
            {},
            defaultClusteringOptions,
            { minWeight: clusteringEnabled ? undefined : Infinity },
            clusteringOptions
          ),
        };

        instance.setData('clustered',
          _.isFinite(options.clusteringOptions.minWeight));

        /*
         * Prepare some black magic.
         */
        let processedNoisePointCount = 0;
        const processNoisePoint      = (noisePoint) => {
          const noiseMarker     = noisePoint.getData();
          const minZoom         = noisePoint.getMinZoom();
          const noiseMarkerData = noiseMarker.getData();

          noiseMarkerData.minZoom = minZoom;

          processedNoisePointCount = processedNoisePointCount + 1;

          /*
           * Since there is no native `clusteringend` event
           * that we can listen to, we gotta do this kinda
           * old-school way to determine whether the clustering
           * has ended or not.
           */
          const clusteringEnded = (processedNoisePointCount >=
                                   visibleDataPoints.length);

          if (clusteringEnded) {
            updateNoiseVisibility();
          }
        };

        /*
         * Create clustering provider and customize the theme.
         */
        clusteringProvider = new H.clustering.Provider([], options);
        const defaultTheme = clusteringProvider.getTheme();
        const customTheme  = {

          /**
           *
           * @param cluster
           * @returns {*}
           */
          getClusterPresentation(cluster) {
            const clusterMarker = defaultTheme
              .getClusterPresentation.call(defaultTheme, cluster);

            clusterMarker.addEventListener('tap', () => {
              const bounds = cluster.getBounds();

              viewer.setBoundingBox({
                left  : bounds.getLeft(),
                bottom: bounds.getBottom(),
                right : bounds.getRight(),
                top   : bounds.getTop(),
              });
            });

            cluster.forEachEntry((entry) => {

              if (!entry.isCluster()) {
                processNoisePoint(entry);
              }
            });

            return clusterMarker;
          },

          /**
           *
           * @param noisePoint
           * @returns {*}
           */
          getNoisePresentation(noisePoint) {
            const noiseMarker = noisePoint.getData();

            processNoisePoint(noisePoint);

            return noiseMarker;
          },
        };
        clusteringProvider.setTheme(customTheme);

        updateClusteringDataPoints();

        /*
         * Create clustering layer and add it to the viewer.
         */
        clusteringLayer = new H.map.layer.ObjectLayer(clusteringProvider);
        viewer.addLayer(clusteringLayer);
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
          } else {
            clusteringDefer = $.Deferred();
            updateNoiseVisibility();
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

const ClusteringLayer = stampit.compose(AbstractLayer, HereMapsClusteringLayer);

export { ClusteringLayer as default, ClusteringLayer };
