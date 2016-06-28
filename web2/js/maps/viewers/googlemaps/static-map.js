/**
 * Created by Glenn on 2015-07-30.
 */

/**
 *
 * @see https://developers.google.com/maps/documentation/staticmaps/intro
 */
import { Styler } from '../../styler';

const styler = Styler.getInstance();

/* region private properties */

const baseUrl = 'https://maps.googleapis.com/maps/api/staticmap?';

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
   * @returns {string} - Stringified LatLng in "lat,lng|lat,lng..." format.
   */
  toLatLngString(coordinates) {
    return []
      .concat(coordinates)
      .reverse()
      .join()
      /**
       * Ninja? o)
       * @see http://www.regular-expressions.info/floatingpoint.html
       * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/replace
       */
      .replace(/([-+]?[0-9]*\.?[0-9]+,[-+]?[0-9]*\.?[0-9]+),/g, '$1|');
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
    const params = {
      zoom,
      center: `${coordinates[1]},${coordinates[0]}`,
      size  : `${dimensions[0]}x${dimensions[1]}`,
    };
    const url    = `${baseUrl}${$.param(params)}`;

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

    /*
     *
     */
    const coordinates_ = staticMap.toLatLngString(coordinates);
    /*
     *
     */
    const shapeStyles = styler.getShapeStyles();
    const fenceStyles = {
      ...shapeStyles.geofence,
      ...shapeStyles[`geofence${roamGeofence.fenceType}`],
    };
    const { strokeColor, strokeWeight } = fenceStyles;
    const color       = strokeColor.replace('#', '0x');
    const { fillColor } = fenceStyles.fillColor.replace('#', '0x');
    const weight      = strokeWeight;
    /*
     *
     */
    const params = {
      path: `color:${color}|fillcolor:${fillColor}|weight:${weight}|${coordinates_}`,
      size: `${dimensions[0]}x${dimensions[1]}`,
    };
    const url    = `${baseUrl}${$.param(params)}`;

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
    _.noop();
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
    _.noop();
  },
};

const StaticMap = {
  getInstance() {
    return staticMap;
  },
};

export { StaticMap as default, StaticMap };
