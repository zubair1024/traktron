/**
 * Created by Glenn on 2015-02-08.
 */

const arrowSvgMarkupTemplate     = require('./ui/svg/arrow.tpl');
const dotSvgMarkupTemplate       = require('./ui/svg/dot.tpl');
const generatorSvgMarkupTemplate = require('./ui/svg/generator.tpl');
const pumpSvgMarkupTemplate      = require('./ui/svg/pump.tpl');

/* region private properties */

const iconsBaseDir = 'images/maps/icons/';
const iconsDirs    = _.map(
  ['directions', 'cluster', 'locations', 'geofences'], dirname => `${iconsBaseDir}${dirname}/`);
const [directionIconsDir, clusterIconsDir, locationIconsDir, geofenceIconsDir] = iconsDirs;

/*
 * Mapping of ROAM direction symbols.
 */
const directionSymbols = {
  'ROAM - arrow-beige'                  : 'arrow-beige',
  'ROAM - arrow-black'                  : 'arrow-black',
  'ROAM - arrow-blue'                   : 'arrow-blue',
  'ROAM - arrow-brown'                  : 'arrow-brown',
  'ROAM - arrow-dark-blue'              : 'arrow-dark-blue',
  'ROAM - arrow-dark-green'             : 'arrow-dark-green',
  'ROAM - arrow-gray'                   : 'arrow-gray',
  'ROAM - arrow-green'                  : 'arrow-green',
  'ROAM - arrow-light-blue'             : 'arrow-light-blue',
  'ROAM - arrow-light-green'            : 'arrow-light-green',
  'ROAM - arrow-light-purple'           : 'arrow-light-purple',
  'ROAM - arrow-magenta'                : 'arrow-magenta',
  'ROAM - arrow-maroon'                 : 'arrow-maroon',
  'ROAM - arrow-orange'                 : 'arrow-orange',
  'ROAM - arrow-pink'                   : 'arrow-pink',
  'ROAM - arrow-purple'                 : 'arrow-purple',
  'ROAM - arrow-red'                    : 'arrow-red',
  'ROAM - arrow-silver'                 : 'arrow-silver',
  'ROAM - arrow-white'                  : 'arrow-white',
  'ROAM - arrow-yellow'                 : 'arrow-yellow',
  'ROAM - circle-blue'                  : 'arrow-blue',
  'ROAM - circle-green'                 : 'arrow-green',
  'ROAM - circle-orange'                : 'arrow-orange',
  'ROAM - circle-red'                   : 'arrow-red',
  'ROAM - dot-blue'                     : 'dot-blue',
  'ROAM - dot-green'                    : 'dot-green',
  'ROAM - dot-orange'                   : 'dot-orange',
  'ROAM - dot-red'                      : 'dot-red',
  'ROAM - rect-arrow-blue'              : 'arrow-blue',
  'ROAM - rect-arrow-green'             : 'arrow-green',
  'ROAM - rect-blue-circle-green-arrow' : 'arrow-blue',
  'ROAM - rect-blue-circle-orange-arrow': 'arrow-orange',
  'Generator - arrow-blue'              : 'generator-arrow-blue',
  'Generator - arrow-green'             : 'generator-arrow-green',
  'Generator - arrow-dark-blue'         : 'generator-arrow-dark-blue',
  'Generator - arrow-maroon'            : 'generator-arrow-maroon',
  'Pump - arrow-brown'                  : 'pump-arrow-brown',
  'Pump - arrow-light-blue'             : 'pump-arrow-light-blue',
  'Pump - arrow-light-purple'           : 'pump-arrow-light-purple',
  'Pump - arrow-magenta'                : 'pump-arrow-magenta',
  'arrow-red'                           : 'arrow-red',
};

const directionColors = {
  'ROAM - arrow-beige'                  : ['#a49480', '#000000'],
  'ROAM - arrow-black'                  : ['#000000', '#ffffff'],
  'ROAM - arrow-blue'                   : ['#0000ff', '#ffffff'],
  'ROAM - arrow-brown'                  : ['#a52a2a', '#ffffff'],
  'ROAM - arrow-dark-blue'              : ['#00008b', '#ffffff'],
  'ROAM - arrow-dark-green'             : ['#006400', '#ffffff'],
  'ROAM - arrow-gray'                   : ['#808080', '#ffffff'],
  'ROAM - arrow-green'                  : ['#008000', '#ffffff'],
  'ROAM - arrow-light-blue'             : ['#add8e6', '#000000'],
  'ROAM - arrow-light-green'            : ['#90ee90', '#000000'],
  'ROAM - arrow-light-purple'           : ['#d8bfd8', '#000000'],
  'ROAM - arrow-magenta'                : ['#ff00ff', '#ffffff'],
  'ROAM - arrow-maroon'                 : ['#800000', '#ffffff'],
  'ROAM - arrow-orange'                 : ['#ffa500', '#ffffff'],
  'ROAM - arrow-pink'                   : ['#ffc0cb', '#000000'],
  'ROAM - arrow-purple'                 : ['#800080', '#ffffff'],
  'ROAM - arrow-red'                    : ['#ff0000', '#ffffff'],
  'ROAM - arrow-silver'                 : ['#c0c0c0', '#000000'],
  'ROAM - arrow-white'                  : ['#ffffff', '#000000'],
  'ROAM - arrow-yellow'                 : ['#ffff00', '#000000'],
  'ROAM - circle-blue'                  : ['#0000ff', '#ffffff'],
  'ROAM - circle-green'                 : ['#008000', '#ffffff'],
  'ROAM - circle-orange'                : ['#ffa500', '#ffffff'],
  'ROAM - circle-red'                   : ['#ff0000', '#ffffff'],
  'ROAM - dot-blue'                     : ['#0000ff', '#ffffff'],
  'ROAM - dot-green'                    : ['#008000', '#ffffff'],
  'ROAM - dot-orange'                   : ['#ffa500', '#ffffff'],
  'ROAM - dot-red'                      : ['#ff0000', '#ffffff'],
  'ROAM - rect-arrow-blue'              : ['#0000ff', '#ffffff'],
  'ROAM - rect-arrow-green'             : ['#008000', '#ffffff'],
  'ROAM - rect-blue-circle-green-arrow' : ['#0000ff', '#ffffff'],
  'ROAM - rect-blue-circle-orange-arrow': ['#ffa500', '#ffffff'],
  'Generator - arrow-blue'              : ['#0000ff', '#ffffff'],
  'Generator - arrow-green'             : ['#008000', '#ffffff'],
  'Generator - arrow-dark-blue'         : ['#00008b', '#ffffff'],
  'Generator - arrow-maroon'            : ['#800000', '#ffffff'],
  'Pump - arrow-brown'                  : ['#a52a2a', '#ffffff'],
  'Pump - arrow-light-blue'             : ['#add8e6', '#000000'],
  'Pump - arrow-light-purple'           : ['#d8bfd8', '#ffffff'],
  'Pump - arrow-magenta'                : ['#ff00ff', '#ffffff'],
  'arrow-red'                           : ['#ff0000', '#ffffff'],
};

const shapeStyles = {
  geofence         : {
    fillOpacity : 0.5,
    strokeWeight: 2,
  },
  geofenceExclusive: {
    fillColor  : '#ff0000',
    strokeColor: '#dd2222',
  },
  geofenceInclusive: {
    fillColor  : '#00dd00',
    strokeColor: '#22dd22',
  },
  geofenceWaypoint : {
    fillColor  : '#0000ff',
    strokeColor: '#000000',
  },
  geofenceUnknown  : {
    fillColor  : '#f9ef0c',
    strokeColor: '#f9870c',
  },
  eventsConnector  : {
    strokeWeight: 4,
    arrows      : {
      fillColor  : '#ffffff',
      fillOpacity: 0.75,
    },
  },
  animationPath    : {
    fillColor   : '#ff0000',
    strokeColor : '#0000ff',
    strokeWeight: 3,
  },
  editableObject   : {
    fillColor   : '#dddddd',
    fillOpacity : 0.4,
    strokeColor : '#666666',
    strokeWeight: 2,
  },
  routeLine        : {
    strokeColor  : '#0000dd',
    strokeOpacity: 0.63,
    strokeWeight : 5,
    arrows       : {
      frequency: 4,
      length   : 1.6,
      width    : 1.0,
    },
  },
};

/* endregion private properties */

/**
 *
 * @singleton
 */
const styler = {

  /**
   *
   * @param roamObject
   * @param [asSvg]
   * @returns {*}
   */
  getRoamIcon(roamObject, asSvg) {
    const type       = roamObject.domainObjectType;
    const iconAction = iconActions[type];

    if (!_.isFunction(iconAction)) {
      throw new Error(`Invalid ROAM object type: ${type}.`);
    }

    return iconAction(roamObject, asSvg);
  },

  /**
   *
   * @returns {string}
   */
  getIconsBaseDir() {
    return iconsBaseDir;
  },

  /**
   *
   * @param roamObject
   * @param asSvg
   * @returns {*}
   */
  getDirectionIcon(roamObject, asSvg) {
    const { mapCurrentSymbol, mapHistorySymbol,
            isAlertEvent, isLatestEvent, highlighted, heading, } = roamObject;
    let symbolName = mapCurrentSymbol || mapHistorySymbol;

    /*
     * Force red arrows for alarmed position events.
     */
    if (isAlertEvent) {
      symbolName = 'ROAM - arrow-red';
    }

    /*
     * Force blue arrow for latest position event.
     */
    if (isLatestEvent) {
      symbolName = 'ROAM - arrow-blue';
    }

    /*
     * Force orange arrow for highlighted (selected) position event.
     */
    if (highlighted) {
      symbolName = 'ROAM - arrow-orange';
    }

    let rotation = heading;

    /*
     * Do rotation adjustment only when in bitmap icon.
     */
    if (!asSvg) {

      if (rotation >= 360) {
        rotation = rotation % 360;
      }

      /*
       * Only allow for 15 degrees intervals rotation.
       */
      rotation = Math.round(rotation / 15) * 15;
    }

    return asSvg ?
           styler.getDirectionSvgIcon(symbolName, rotation) :
           styler.getDirectionBitmapIcon(symbolName, rotation);
  },

  /**
   *
   * @param symbolName
   * @param rotation
   * @returns {*}
   */
  getDirectionSvgIcon(symbolName, rotation) {
    const symbolColor           = directionColors[symbolName];
    let symbolSvgMarkupTemplate = arrowSvgMarkupTemplate;

    if (symbolName.match(/dot/i)) {
      symbolSvgMarkupTemplate = dotSvgMarkupTemplate;
    } else if (symbolName.match(/generator/i)) {
      symbolSvgMarkupTemplate = generatorSvgMarkupTemplate;
    } else if (symbolName.match(/pump/i)) {
      symbolSvgMarkupTemplate = pumpSvgMarkupTemplate;
    }

    return symbolSvgMarkupTemplate
      .replace('${backgroundColor}', symbolColor[0])
      .replace('${color}', symbolColor[1])
      .replace('${rotation}', rotation);
  },

  /**
   *
   * @param symbolName
   * @param rotation
   * @returns {string}
   */
  getDirectionBitmapIcon(symbolName, rotation) {
    const symbolDir = `${directionSymbols[symbolName]}/`;
    const iconName  = rotation;

    return `${directionIconsDir}${symbolDir}${iconName}.png`;
  },

  /**
   *
   * @param roamObject
   * @returns {string}
   */
  getObjectCategoryIcon(roamObject) {
    const { locationType, fenceType } = roamObject;
    let iconPath = '';

    if (locationType) {
      iconPath = styler.getLocationIcon(roamObject);
    } else if (fenceType) {
      iconPath = styler.getGeofenceIcon(roamObject);
    }

    return iconPath;
  },

  /**
   *
   * @returns {string}
   */
  getClusterIconsDir() {
    return clusterIconsDir;
  },

  /**
   *
   * @param roamObject
   * @returns {string}
   */
  getLocationIcon(roamObject) {
    const { locationType } = roamObject;
    const iconName = locationType.replace(/ /g, '').toLowerCase();

    return `${locationIconsDir}${iconName}.png`;
  },

  /**
   *
   * @param roamObject
   * @returns {string}
   */
  getGeofenceIcon(roamObject) {
    const { fenceType } = roamObject;
    const iconName = fenceType.replace(/ /g, '').toLowerCase();

    return `${geofenceIconsDir}${iconName}.png`;
  },

  /**
   *
   * @returns {*}
   */
  getShapeStyles() {
    return shapeStyles;
  },

  /**
   *
   * @param color
   * @param opacity
   * @returns {string}
   */
  hexToRgba(color, opacity) {

    /**
     *
     * @see http://docs.telerik.com/kendo-ui/api/javascript/kendo#methods-parseColor
     * @see http://docs.telerik.com/kendo-ui/api/javascript/color
     */
    const { r, g, b } = kendo.parseColor(color).toRGB();

    return kendo.Color
                .fromRGB(r, g, b, opacity)
                .toCssRgba();
  },
};

const { getDirectionIcon, getLocationIcon, getGeofenceIcon } = styler;
const iconActions = {
  assetmessageevent: getDirectionIcon,
  location         : getLocationIcon,
  geofence         : getGeofenceIcon,
};

const Styler = {
  getInstance() {
    return styler;
  },
};

export { Styler as default, Styler };
