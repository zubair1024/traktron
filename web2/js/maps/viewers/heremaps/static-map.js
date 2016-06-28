/**
 * Created by Glenn on 2015-07-02.
 */

/**
 *
 * @see https://developer.here.com/rest-apis/documentation/enterprise-map-image/
 */
import App from 'app';
import { Styler } from '../../styler';

const styler = Styler.getInstance();

const { appId, appCode } = App.config.map;

/* region private properties */

const protocol = Boolean(window.location.protocol.match(/https/i)) ? 'http' : 'https';
const baseUrl  = `${protocol}://image.maps.cit.api.here.com/mia/1.6/`;

/* endregion private properties */

/**
 *
 * @singleton
 */
const staticMap = {

  /**
   *
   * @param container
   * @param url
   * @param dimensions
   * @param roamObject
   * @param options
   */
  show(container, url, dimensions, roamObject, options) {

    if (roamObject) {
      staticMap.renderIcon(container, roamObject, dimensions, options);
    }

    $('<img>')
      .addClass('map-image')
      .attr('src', url)
      .appendTo(container);
  },

  /**
   *
   * @param container
   * @param roamObject
   * @param dimensions
   * @param options
   */
  renderIcon(container, roamObject, dimensions, options = {}) {

    if (!options.noCentralIcon) {
      const icon = $('<img>')
        .attr({
          src  : styler.getRoamIcon(roamObject),
          title: roamObject.name,
        })
        .appendTo(container);

      const { left, top } = options;
      const [w, h] = dimensions;

      icon.css({
        position: 'absolute',
        left    : left || (w - icon.width()) / 2,
        top     : top || (h - icon.height()) / 2,
      });
    }
  },

  /**
   *
   * @param coordinates - Coordinates in [lng, lat, ...] format.
   * @returns {string} - Stringified LatLng in "lat,lng,..." format.
   */
  toLatLngString(coordinates) {
    return []
      .concat(coordinates)
      .reverse()
      .join();
  },

  /**
   *
   * @param container
   * @param coordinates
   * @param dimensions
   * @param zoom
   * @param roamObject
   * @param options
   */
  showStaticMap(container, coordinates, dimensions, zoom, roamObject, options) {
    coordinates = staticMap.toLatLngString(coordinates);

    const [w, h] = dimensions;
    const params = {
      w,
      h,
      app_id  : appId,
      app_code: appCode,
      c       : coordinates,
      ctr     : coordinates,
      nodot   : true,
      z       : zoom,
    };
    const url    = `${baseUrl}mapview?${$.param(params)}`;

    staticMap.show(container, url, dimensions, roamObject, options);
  },

  /**
   *
   * @param container
   * @param coordinates
   * @param dimensions
   * @param roamGeofence
   */
  showStaticGeofenceMap(container, coordinates, dimensions, roamGeofence) {
    coordinates = staticMap.toLatLngString(coordinates);

    /*
     *
     */
    const shapeStyles = styler.getShapeStyles();
    const fenceStyles = {
      ...shapeStyles.geofence,
      ...shapeStyles[`geofence${roamGeofence.fenceType}`],
    };
    const { strokeColor, strokeWeight } = fenceStyles;
    const fillColor   = fenceStyles.fillColor.replace('#', '');
    const lineColor   = strokeColor.replace('#', '');
    const lineWidth   = strokeWeight;
    const [w, h] = dimensions;

    const params = {
      w,
      h,
      app_id  : appId,
      app_code: appCode,
      a       : coordinates,
      sb      : 'mk',
      t       : 2,   // terrain.day

      //z       : 12,

      /*
       * In argb format.
       */
      fc: `33${fillColor}`,
      lc: `ff${lineColor}`,
      lw: lineWidth,
    };

    const url = `${baseUrl}region?${$.param(params)}`;

    staticMap.show(container, url);
  },

  /**
   *
   * @deprecated Unused method in web2/js/widget/overviewmap.js?
   * @param container
   * @param coordinates
   * @param dimensions
   * @param options
   */
  showStaticRegionMap(container, coordinates, dimensions, options) {
    const [w, h] = dimensions;
    const params = {
      w,
      h,
      app_id  : appId,
      app_code: appCode,
      nodot   : true,
    };

    if (coordinates) {
      params.bbox = staticMap.toLatLngString(coordinates);
    }

    if (options && options.center) {
      params.ctr = staticMap.toLatLngString(options.center);
    }

    const url = `${baseUrl}mapview?${$.param(params)}`;

    staticMap.show(container, url, dimensions, null, options);
  },

  /**
   *
   * @deprecated Unused method in web2/js/widget/overviewmap.js?
   * @param container
   * @param roamGeofence
   * @param roamAssets
   * @param dimensions
   * @param bbox - WGS84 Bounds -> [left, bottom, right, top]
   */
  showStaticAssetGroupMap(container, roamGeofence, roamAssets, dimensions, bbox) {
    const [w, h] = dimensions;
    const params = {
      w,
      h,
      app_id  : appId,
      app_code: appCode,
      sb      : 'mk',
      t       : 2,   // terrain.day
    };

    /*
     *
     */
    const coordinates = staticMap.toLatLngString(roamGeofence.coordinates);
    /*
     *
     */
    const shapeStyles = styler.getShapeStyles();
    const fenceStyles = {
      ...shapeStyles.geofence,
      ...shapeStyles[`geofence${roamGeofence.fenceType}`],
    };
    const { strokeColor, strokeWeight } = fenceStyles;

    const fillColor = fenceStyles.fillColor.replace('#', '');
    const lineColor = strokeColor.replace('#', '');
    const lineWidth = strokeWeight;

    _.assign(params, {
      a0: coordinates,

      /*
       * In argb format.
       */
      fc0: `33${fillColor}`,
      lc0: `ff${lineColor}`,
      lw0: lineWidth,

      //, tx0: center.lat + ',' + center.lng + ';' + roamGeofence.name +
      //     ';ff000000;ffffffff;8'
      //, txc0: 'ffff0000'
      //, txs0: 15
    });

    _.forEach(roamAssets, (roamAsset, i) => {
      i = i + 1;

      const { latitude, longitude } = roamAsset;

      params[`a${i}`]   = `${latitude}, ${longitude}`;
      params[`rad${i}`] = 500;

      //params['tx' + i]  = lat + ',' + lng + ';' + roamAsset.name +
      //                    ';ff000000;ffffffff;8'
    });

    const url = `${baseUrl}region?${$.param(params)}`;

    staticMap.show(container, url);
  },
};

const StaticMap = {
  getInstance() {
    return staticMap;
  },
};

export { StaticMap as default, StaticMap };
