/**
 * Created by Glenn on 2015-06-28.
 */

import App from 'app';
import { LayerManager } from './manager/layer-manager';
import { AnimationManager } from './manager/animation-manager';
import { EditManager } from './manager/edit-manager';
import { RoutingManager } from './manager/routing-manager';
import { MapObjectLabel } from './map-object-label';

const { config, widget } = App;
const printTemplate = require('../ui/tpl/print.tpl');
const { ROAM_ASSETS, ROAM_ASSETS_HISTORY, } = LayerManager.ROAM_LAYERS;

/**
 *
 * @abstract
 */
const Viewer = stampit()
  .props({

    /**
     *
     */
    moduleName                 : '',
    /**
     *
     */
    name                       : '',
    /**
     *
     */
    container                  : undefined,
    domainObjectType           : '',
    domainObjectId             : '',
    /**
     *
     */
    alarmEventIds              : undefined,
    /**
     *
     */
    autoRefresh                : false,
    autoFocus                  : false,
    /**
     *
     */
    rememberLastViewportEnabled: false,
    /**
     *
     */
    lazyLoadingEnabled         : false,
  })
  .methods({

    /**
     * Transform `moduleName` to some human-friendly name, like:
     * 'heremaps' -> 'Here Maps'
     * 'googlemaps' -> 'Google Maps'
     * @returns {string}
     */
    getFriendlyName() {
      return _.startCase(this.moduleName.replace(/maps/i, ' maps'));
    },

    /**
     *
     * @returns {string}
     */
    getLogo() {
      return `images/maps/logos/${this.moduleName.replace(/maps/i, '')}-logo.png`;
    },

    /**
     *
     * @param type
     * @param listener
     */
    addEventListener(type, listener) {
      throw new Error('.addEventListener() method not implemented.');
    },

    /**
     *
     * @param type
     * @param listener
     */
    removeEventListener(type, listener) {
      throw new Error('.removeEventListener() method not implemented.');
    },

    /**
     *
     * @param type
     * @param listener
     */
    onceEventListener(type, listener) {
      throw new Error('.onceEventListener() method not implemented.');
    },

    /**
     *
     * @returns {Function}
     */
    createDefaultClickListener() {

      return () => {
        const mapInfoBox = this.getMapInfoBox();

        if (mapInfoBox && mapInfoBox.isVisible()) {
          mapInfoBox.hide();
        }
      };
    },

    /**
     *
     * @returns {Function}
     */
    createDefaultMapViewChangeEndListener() {

      return () => {
        const mapInfoBox = this.getMapInfoBox();

        if (mapInfoBox && mapInfoBox.isVisible()) {
          const { x, y } = this.geoToPixel(mapInfoBox.getGeoPosition());
          const { top, left } = this.container.offset();

          mapInfoBox.setPosition({
            top : y + top,
            left: x + left,
          });
        }
      };
    },

    /**
     *
     * @returns {Function}
     */
    createDefaultMouseMoveListener() {

      const listener = (e) => {
        const coordinatesDisplay = this.getCoordinatesDisplay();

        if (coordinatesDisplay) {
          const { currentPointer, latLng } = e;
          const { viewportX, viewportY } = currentPointer;
          let point;

          if (currentPointer) {
            point = this.pixelToGeo({
              x: viewportX,
              y: viewportY,
            });

          } else if (latLng) {
            _.assign(point, {
              lat: latLng.lat(),
              lng: latLng.lng(),
            });
          }

          const { lat, lng } = point;

          coordinatesDisplay.setCoordinates(lng, lat);

        } else {
          this.removeEventListener('mousemove', listener);
        }
      };

      return listener;
    },

    /**
     *
     * @param overlay
     */
    addOverlay(overlay) {
      throw new Error('.addOverlay() method not implemented.');
    },

    /**
     *
     * @param mapObject
     */
    addObject(mapObject) {
      this.addObjects([mapObject]);
    },

    /**
     *
     * @param mapObjects
     */
    addObjects(mapObjects) {
      throw new Error('.addObjects() method not implemented.');
    },

    /**
     *
     * @param mapObject
     */
    removeObject(mapObject) {
      this.removeObjects([mapObject]);
    },

    /**
     *
     * @param mapObjects
     */
    removeObjects(mapObjects) {
      throw new Error('.removeObjects() method not implemented.');
    },

    /**
     *
     */
    getLayerFactory() {
      throw new Error('.getLayerFactory() method not implemented.');
    },

    /**
     *
     */
    getClusteringLayerFactory() {
      throw new Error('.getClusteringLayerFactory() method not implemented.');
    },

    /**
     *
     */
    getMapObjectFactory() {
      throw new Error('.getMapObjectFactory() method not implemented.');
    },

    /**
     *
     * @returns {MapObjectLabel}
     */
    getMapObjectLabelFactory() {
      return MapObjectLabel;
    },

    /**
     *
     */
    getRoutingEngineFactory() {
      throw new Error('.getRoutingEngineFactory() method not implemented.');
    },

    /**
     *
     * @param pixel
     */
    pixelToGeo (pixel) {
      throw new Error('.pixelToGeo() method not implemented.');
    },

    /**
     *
     * @param geo
     */
    geoToPixel(geo) {
      throw new Error('.geoToPixel() method not implemented.');
    },

    /**
     *
     */
    getBoundingBox() {
      throw new Error('.getBoundingBox() method not implemented.');
    },

    /**
     *
     * @param bbox
     */
    setBoundingBox(bbox) {
      throw new Error('.setBoundingBox() method not implemented.');
    },

    /**
     *
     * @returns {*[]}
     */
    getCenter() {
      throw new Error('.getCenter() method not implemented.');
    },

    /**
     *
     * @param center
     */
    setCenter(center) {
      throw new Error('.setCenter() method not implemented.');
    },

    /**
     *
     */
    getZoom() {
      throw new Error('.getZoom() method not implemented.');
    },

    /**
     *
     */
    getScale() {
      const zoom = (this.getZoom() > 19) ? 19 : this.getZoom();

      return _.round(this.getScales()[zoom]);
    },

    /**
     *
     * @param zoom
     */
    zoomToLevel(zoom) {
      throw new Error('.zoomToLevel() method not implemented.');
    },

    /**
     *
     * @param scale
     */
    zoomToScale(scale) {

      if (scale >= 0) {
        const zoom = _.findIndex(this.getScales(), s => (s <= scale));

        this.zoomToLevel(zoom);
      }
    },

    /**
     *
     * @param layerName
     */
    zoomToLayer(layerName) {
      const layer = this.getLayerManager().getLayer(layerName);

      if (layer) {
        this.setBoundingBox(layer.getBounds());
      }
    },

    /**
     *
     * @param layerName
     * @param objectId
     */
    zoomToObject(layerName, objectId) {
      const layerManager = this.getLayerManager();
      const mapObject    = layerManager.getObject(layerName, objectId);

      if (mapObject) {
        this.onceEventListener('mapviewchangeend', () => {

          if (!layerManager.testIsPositionLayerName(layerName) ||
              this.isAssetCategoryFilterEnabled()) {

            layerManager.setObjectVisibility(layerName, objectId, true);
          } else {

            /*
             * The implementation of the asset position
             * objects without asset category filter (classic
             * list) suggests partially showing/hiding them
             * doesn't make sense: it is either you "show or
             * hide them _all_". =)
             */
            layerManager.setAllObjectsVisibility(layerName, true);
          }
        });

        if (_.isFunction(mapObject.getPosition)) {
          const { lat, lng }           = mapObject.getPosition();
          const preferredZoomLevel = _.parseInt(
            localStorage.getItem('SINGLE_ASSET_PREFERRED_ZOOM_LEVEL'));
          const zoomLevel          = preferredZoomLevel || 16;

          this.panTo(lng, lat);
          this.zoomToLevel(zoomLevel);
        } else {
          this.setBoundingBox(mapObject.getBounds());
        }

        if (_.isFunction(this.shake)) {
          this.shake();
        }
      }
    },

    /**
     *
     */
    zoomToAll() {
      throw new Error('.zoomToAll() method not implemented.');
    },

    /**
     *
     * @param lng
     * @param lat
     */
    panTo(lng, lat) {
      this.setCenter({ lat, lng });
    },

    /**
     *
     * @param x
     * @param y
     */
    panBy(x, y) {
      const s  = this.geoToPixel(this.getCenter());
      const px = {
        x: s.x + x,
        y: s.y + y,
      };

      this.setCenter(this.pixelToGeo(px));
    },

    /**
     *
     */
    refresh() {
      throw new Error('.refresh() method not implemented.');
    },

    /**
     *
     */
    resize() {
      throw new Error('.resize() method not implemented.');
    },

    /**
     * The projection promise is fulfilled by default, but in Google
     * Maps viewer, this is another story.
     * @returns {*}
     * @see web2/js/maps/viewers/googlemaps/viewer.js
     */
    resolveProjection() {
      return $.Deferred().resolve().promise();
    },

    /**
     *
     * @param [directions]
     */
    print(directions) {
      const { title } = document;
      const body            = $('body');
      const backgroundColor = body.css('background-color');
      const printContent    = $(printTemplate);

      document.title = `${this.getFriendlyName()} Print`;

      body
        .css('background-color', 'transparent')
        .prepend(printContent);

      const logo            = $('.mp-logo');
      const screenshot      = $('.mp-screenshot');
      const logoDefer       = $.Deferred();
      const directionsDefer = $.Deferred();

      logo
        .attr('src', this.getLogo())
        .on('load error', () => logoDefer.resolve());

      if (directions) {

        _.forEach($('.mp-directions'),
          (elem) => {
            const mapDirection = $(elem);
            const compiled     = _.template(_.unescape(mapDirection.html()));

            mapDirection
              .html(compiled({
                directions,
              }))
              .toggleClass('hidden', false);
          });

        const maneuverIcons  = $('.mp-maneuver-icon');
        let loadedIconsCount = 0;

        _.forEach(maneuverIcons,
          (elem) => {
            const maneuverIcon = $(elem);

            maneuverIcon
              .attr('src', maneuverIcon.data('iconpath'))
              .on('load error', (e) => {

                if (e.type === 'error') {
                  $(this).remove();
                }

                loadedIconsCount = loadedIconsCount + 1;

                if (loadedIconsCount === maneuverIcons.length) {
                  directionsDefer.resolve();
                }
              });
          });
      } else {
        directionsDefer.resolve();
      }

      $
        .when(logoDefer, directionsDefer)
        .then(() => {
          const mapCanvas                  = this.container;
          const mapCanvasContainer         = mapCanvas.parent();
          const toggleExtensionsVisibility = (visibility) => {

            _(this.getExtensions())
              .compact()
              .forEach(extension => extension.setVisible(visibility));
          };

          screenshot
            .height(mapCanvas.height())
            .append(mapCanvas);

          toggleExtensionsVisibility(false);

          /*
           * Heads up this line below! Detaching main part of
           * the document body, temporarily replace it by the
           * print template, and attach it back after printing.
           * An extreme approach for supporting IE. x
           */
          const content = body
            .children()
            .not('script')
            .not(printContent)
            .detach();

          /**
           * Make Bootstrap like Google Maps a bit more when printing ;)
           * @see http://stackoverflow.com/a/11742716/2013891
           */
          const patchedStyle = $('<style>')
            .attr('media', 'print')
            .text(`
              img { max-width: none !important; }
              a[href]:after { content: ""; }
              `)
            .appendTo('head');

          window.print();

          /*
           * Revert document title, background color of the
           * body, and the main content to its original state.
           */
          document.title = title;

          body
            .css('background-color', backgroundColor)
            .prepend(content);

          mapCanvasContainer.prepend(mapCanvas);
          toggleExtensionsVisibility(true);

          printContent.remove();
          patchedStyle.remove();
        });
    },

    /**
     *
     * @returns {boolean}
     */
    isModernBrowser() {
      const msIE              = document.documentMode;
      const evergreenBrowsers = !msIE;

      /*
       * The 'evergreen' browsers (non-IE):
       * Chrome, Safari, Firefox and Opera.
       */
      return (evergreenBrowsers || msIE >= 11);
    },
  })
  .init(({ instance }) => {

    /* region private properties */

    /*
     * View
     */
    let controls;

    /*
     * Model managers.
     */
    const layerManager     = LayerManager.create();
    const animationManager = AnimationManager.create();
    const editManager      = EditManager.create();
    const routingManager   = RoutingManager.create();

    /*
     *
     */
    let layerDataFetcher;

    /*
     *
     */
    let singleAssetModeEnabled = false;
    /*
     *
     */
    let pollId = NaN;
    /*
     *
     */
    let autoLabelingActivated = false;

    /**
     * The scales for each zoom level.
     * @see http://gis.stackexchange.com/questions/7430/what-ratio-scales-do-google-maps-zoom-levels-correspond-to
     */
    const scales = [
      591657550.500000,
      295828775.300000,
      147914387.600000,
      73957193.820000,
      36978596.910000,
      18489298.450000,
      9244649.227000,
      4622324.614000,
      2311162.307000,
      1155581.153000,
      577790.576700,
      288895.288400,
      144447.644200,
      72223.822090,
      36111.911040,
      18055.955520,
      9027.977761,
      4513.988880,
      2256.994440,
      1128.497220,
    ];

    /*
     *
     */
    const dataSelectionOptions = {
      latest: true,
      from  : undefined,
      to    : undefined,
    };

    const presetIntervalActions = {
      TODAY(min, max) {
        min.setHours(0, 0, 0, 0);
        max.setHours(23, 59, 0, 0);
      },

      YESTERDAY(min, max) {
        min.setDate(max.getDate() - 1);
        min.setHours(0, 0, 0, 0);
        max.setDate(max.getDate() - 1);
        max.setHours(23, 59, 0, 0);
      },

      LAST_24H(min, max) {
        min.setDate(max.getDate() - 1);
      },

      LAST_48H(min, max) {
        min.setDate(max.getDate() - 2);
      },
    };

    /*
     *
     */
    let useClustersActivated             = false;
    let connectHistoryPositionsActivated = false;

    /*
     *
     */
    let assetStatusFilters = [];

    /*
     *
     */
    let animationFeatureActivated = false;

    /*
     *
     */
    let mapInfoBox;

    /*
     * Extensions.
     */
    let legend;
    let dateRangeSlider;
    let coordinatesDisplay;

    /* endregion private properties */

    /* region privileged methods */

    _.assign(instance, {

      /**
       *
       * @returns {*}
       */
      getLayerManager() {
        return layerManager;
      },

      /**
       *
       * @returns {*}
       */
      getAnimationManager() {
        return animationManager;
      },

      /**
       *
       * @returns {*}
       */
      getEditManager() {
        return editManager;
      },

      /**
       *
       * @returns {*}
       */
      getRoutingManager() {
        return routingManager;
      },

      /**
       *
       * @returns {*}
       */
      getControls() {
        return controls;
      },

      /**
       *
       * @param mapControls
       */
      setControls(mapControls) {
        controls = mapControls;
      },

      /**
       *
       * @param listener
       */
      setListener(listener) {
        instance.setControls(listener);
      },

      /**
       *
       * @returns {*}
       */
      getLayerDataFetcher() {
        return layerDataFetcher;
      },

      /**
       *
       * @param mapLayerDataFetcher
       */
      setLayerDataFetcher(mapLayerDataFetcher) {
        layerDataFetcher = mapLayerDataFetcher;
      },

      /**
       *
       * @returns {*}
       */
      getMapInfoBox() {
        return mapInfoBox;
      },

      /**
       *
       * @returns {*}
       */
      createMapInfoBox(options, onMapInfoBoxInitialized) {

        if (!mapInfoBox) {
          mapInfoBox = new widget.MapInfo(options, onMapInfoBoxInitialized);
        } else {
          mapInfoBox.init(options, onMapInfoBoxInitialized);
        }
      },

      /**
       *
       * @returns {*}
       */
      getLegend() {
        return legend;
      },

      /**
       *
       * @param mapLegend
       */
      setLegend(mapLegend) {
        legend = mapLegend;
      },

      /**
       *
       * @returns {*}
       */
      getDateRangeSlider() {
        return dateRangeSlider;
      },

      /**
       *
       * @param mapDateRangeSlider
       */
      setDateRangeSlider(mapDateRangeSlider) {
        dateRangeSlider = mapDateRangeSlider;
      },

      /**
       *
       * @returns {*}
       */
      getCoordinatesDisplay() {
        return coordinatesDisplay;
      },

      /**
       *
       * @param mapCoordinatesDisplay
       */
      setCoordinatesDisplay(mapCoordinatesDisplay) {
        coordinatesDisplay = mapCoordinatesDisplay;
      },

      /**
       *
       * @returns {*[]}
       */
      getExtensions() {
        return [legend, dateRangeSlider, coordinatesDisplay];
      },

      /**
       *
       * @returns {boolean}
       */
      isSingleAssetModeEnabled() {
        return singleAssetModeEnabled;
      },

      /**
       *
       * @param enabled
       */
      setSingleAssetModeEnabled(enabled) {
        singleAssetModeEnabled = enabled;

        const positionLayerName = singleAssetModeEnabled ?
                                  ROAM_ASSETS_HISTORY : ROAM_ASSETS;

        layerManager.setPositionLayerName(positionLayerName);

        controls.onSingleAssetModeStatusChanged(enabled);
      },

      /**
       *
       * @param viewBehavior
       */
      setViewBehavior({ autoRefresh, autoFocus, rememberLastViewportEnabled }) {
        instance.setAutoRefresh(autoRefresh);
        instance.setAutoFocus(autoFocus);
        instance.setRememberLastViewportEnabled(rememberLastViewportEnabled);
      },

      /**
       *
       * @returns {boolean}
       */
      isAutoRefresh() {
        return instance.autoRefresh;
      },

      /**
       *
       * @param activated
       */
      setAutoRefresh(activated) {
        instance.autoRefresh = activated;

        instance.setPollingActivated(activated);

        controls.onAutoRefreshChanged(activated);
      },

      /**
       *
       * @param activated
       */
      setPollingActivated(activated) {

        if (activated) {

          if (!_.isFinite(pollId)) {
            pollId = setInterval(() => {
              console.info('.polling()...');
              controls.onPositionsFetchingRequested(true);
            }, config.pollInterval);
          }

        } else {
          clearInterval(pollId);
          pollId = NaN;
        }
      },

      /**
       *
       * @returns {boolean}
       */
      isAutoFocus() {
        return instance.autoFocus;
      },

      /**
       *
       * @param activated
       */
      setAutoFocus(activated) {
        instance.autoFocus = activated;

        if (activated) {
          instance.zoomToLayer(layerManager.getPositionLayerName());
        }

        controls.onAutoFocusChanged(activated);
      },

      /**
       *
       * @returns {boolean}
       */
      isAutoLabelingActivated() {
        return autoLabelingActivated;
      },

      /**
       *
       * @param activated
       */
      setAutoLabelingActivated(activated) {
        autoLabelingActivated = activated;

        _.forEach(layerManager.getLayers(), layer =>
          layerManager.setObjectLabelsVisibility(
            layer.name, layer.isLabelsVisible())
        );

        controls.onAutoLabelingStatusChanged(activated);
      },

      /**
       *
       * @param enabled
       */
      setRememberLastViewportEnabled(enabled) {
        instance.rememberLastViewportEnabled = enabled;

        if (enabled) {
          instance.setBoundingBox(JSON.parse(localStorage.getItem('USER_BBOX')));
        } else {
          localStorage.removeItem('USER_BBOX');
        }
      },

      /**
       *
       * @returns {number[]}
       */
      getScales() {
        return scales;
      },

      /**
       *
       * @returns {{latest: boolean, from: null, to: null}}
       */
      getDataSelectionOptions() {
        return dataSelectionOptions;
      },

      /**
       *
       * @param options
       */
      updateDataSelectionOptions(options) {
        _.assign(dataSelectionOptions, options);

        if (dateRangeSlider) {
          dateRangeSlider.onDataSelectionOptionsChanged(dataSelectionOptions);
        }

        controls.onDataSelectionOptionsChanged(dataSelectionOptions);
      },

      /**
       *
       * @param intervalRange
       * @returns {string}
       */
      selectPresetInterval(intervalRange) {
        const now    = new Date(config.map.now());
        const today  = {
          min: new Date((new Date(now)).setHours(0, 0, 0, 0)),
          max: new Date((new Date(now)).setHours(23, 59, 0, 0)),
        };
        const oneDay = 86400000;
        const { min, max } = intervalRange;

        const from         = min;
        const to           = max;
        let presetInterval = '-';

        if (from.getTime() === today.min.getTime() &&
            to.getTime() === today.max.getTime()) {

          presetInterval = 'TODAY';

        } else if ((today.max - to) === oneDay &&
                   (today.min - from) === oneDay) {

          presetInterval = 'YESTERDAY';

        } else if (to.getTime() === now.getTime() &&
                   (to - from) === oneDay) {

          presetInterval = 'LAST_24H';

        } else if (to.getTime() === now.getTime() &&
                   (to - from) === 2 * oneDay) {

          presetInterval = 'LAST_48H';
        }

        return presetInterval;
      },

      /**
       *
       * @param presetInterval
       * @returns {{min: Date, max: Date}}
       */
      selectIntervalRange(presetInterval) {
        const presetIntervalAction = presetIntervalActions[presetInterval];

        if (!_.isFunction(presetIntervalAction)) {
          throw new Error(`Invalid preset interval: ${presetInterval}.`);
        }

        const intervalRange = {
          min: new Date(config.map.now()),
          max: new Date(config.map.now()),
        };
        const { min, max } = intervalRange;

        presetIntervalAction(min, max);

        return intervalRange;
      },

      /**
       *
       * @param activated
       */
      setUseClustersActivated(activated) {
        useClustersActivated = activated;

        layerManager.setClusteringEnabled(
          layerManager.getPositionLayerName(), activated);

        controls.onUseClustersStatusChanged(activated);
      },

      /**
       *
       * @returns {boolean}
       */
      isConnectHistoryPositionsActivated() {
        return connectHistoryPositionsActivated;
      },

      /**
       *
       * @param activated
       */
      setConnectHistoryPositionsActivated(activated) {
        connectHistoryPositionsActivated = activated;

        layerManager.setEventsConnectorVisibility(activated);

        controls.onConnectHistoryPositionsStatusChanged(activated);
      },

      /**
       *
       */
      getUniqueAssetStatusFiltersValues() {

        return _(layerManager.getObjectsByLayer(layerManager.getPositionLayerName()))
          .map('roamObject')

          //.map('assetStatus')
          /*
           * Future-proofing (@see: `onAssetStatusFiltersChanged()`
           * method in `controller.js`). And, btw, wow, the
           * `flatMap()` method from lodash is smart enough!
           */
          .flatMap('assetStatus')
          .uniq()
          .sortBy()
          .value();
      },

      /**
       *
       * @returns {Array}
       */
      getSelectedAssetStatusFilters() {
        return assetStatusFilters;
      },

      /**
       *
       * @param selectedFilters
       */
      setSelectedAssetStatusFilters(selectedFilters) {
        assetStatusFilters = selectedFilters;

        controls.onAssetStatusFiltersChanged(selectedFilters);
      },

      /**
       *
       * @returns {boolean}
       */
      isAnimationFeatureActivated() {
        return animationFeatureActivated;
      },

      /**
       *
       * @param activated
       */
      setAnimationFeatureActivated(activated) {
        animationFeatureActivated = activated;

        if (activated) {
          animationManager.loadAnimationObjects();
        }

        controls.onAnimationFeatureStatusChanged(activated);
      },

      /**
       *
       * @returns {boolean}
       */
      isAssetCategoryFilterEnabled() {
        return (config.map.assetCategoryFilter &&
                (!instance.isSingleAssetModeEnabled()));
      },

      /**
       *
       * @param layerName
       * @returns {boolean|*}
       */
      testIsAssetConfigurationFilterEnabled(layerName) {
        return (App.config.map.assetConfigurationFilter &&
                (!this.isSingleAssetModeEnabled()) &&
                layerManager.testIsPositionLayerName(layerName));
      },

      /**
       *
       * @returns {boolean}
       */
      isAssetStatusFiltersEnabled() {
        return (App.config.map.assetStatusFilters &&
                (!this.isSingleAssetModeEnabled()));
      },
    });

    /* endregion privileged methods */

    /* region init code */

    layerManager.setViewer(instance);
    animationManager.setViewer(instance);
    editManager.setViewer(instance);
    routingManager.setViewer(instance);

    /* endregion init code */
  });

export { Viewer as default, Viewer };
