/**
 * Created by Glenn on 2014-11-10.
 */

const project = {

  /**
   * WGS 84 bounds literal.
   * @see http://spatialreference.org/ref/epsg/wgs-84/
   */
  bbox       : {

    /*
     * Defaulted to Dubai. ;)
     */
    left  : 55,
    bottom: 25,
    right : 56,
    top   : 25.5,

    //left  : -24.6000,
    //bottom: 63.2500,
    //right : -13.4000,
    //top   : 66.6000,
  },
  roamLayers : {
    ROAM_ASSETS          : {
      name               : 'ROAM_ASSETS',
      type               : 'ROAM_LAYER',
      visible            : true,
      clusteringSupported: true,
      serviceUrls        : {
        create: '',
        read  : 'geoposition/current',
        update: '',
        delete: '',
      },
    },
    ROAM_ASSETS_HISTORY  : {
      name               : 'ROAM_ASSETS_HISTORY',
      type               : 'ROAM_LAYER',
      visible            : true,
      clusteringSupported: true,
      serviceUrls        : {
        create: '',
        read  : 'geoposition/assetHistory',
        update: '',
        delete: '',
      },
    },
    ROAM_LOCATIONS       : {
      name       : 'ROAM_LOCATIONS',
      type       : 'ROAM_LAYER',
      visible    : false,
      serviceUrls: {
        create: 'caesarLocation/post',
        read  : 'caesarLocation/locations',
        update: '',
        delete: '',
      },
    },
    ROAM_GEOFENCES       : {
      name       : 'ROAM_GEOFENCES',
      type       : 'ROAM_LAYER',
      visible    : false,
      serviceUrls: {
        create: 'caesarGeofence/post',
        read  : 'caesarGeofence/geofences',
        update: '',
        delete: '',
      },
    },
    ROAM_ASSETS_ANIMATION: {
      name       : 'ROAM_ASSETS_ANIMATION',
      type       : 'ROAM_LAYER',
      visible    : false,
      serviceUrls: {
        create: '',
        read  : '',
        update: '',
        delete: '',
      },
    },
  },
  serviceUrls: {
    locationConfig    : {
      read: 'caesarLocation/config',
    },
    geoPositionObjects: {
      read: 'geoPositionObjects/resources',
    },
    routing           : {
      create: 'routing/create',
    },
    legend            : {
      read: 'geoposition/legend',
    },
  },
};

export { project as default, project };
