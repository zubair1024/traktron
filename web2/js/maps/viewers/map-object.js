/**
 * Created by Glenn on 2015-06-29.
 */

import App from 'app';
import { LayerManager } from './manager/layer-manager';
import { Styler } from '../styler';

const { ROAM_ASSETS_HISTORY, ROAM_ASSETS_ANIMATION } = LayerManager.ROAM_LAYERS;
const styler = Styler.getInstance();

/**
 * Abstract factory for creating abstract map object.
 * @abstract
 */
const MapObject = stampit()
  .props({

    /**
     *
     */
    objectModel: undefined,
    viewer     : undefined,
    /**
     *
     */
    id         : '', // -> layerName-domainObjectTypeId
    layerName  : '',
    roamObject : undefined,
  })
  .methods({

    /**
     *
     * @returns {*}
     */
    getFactory() {
      return this.viewer.getMapObjectFactory();
    },

    /**
     *
     * @returns {*}
     */
    getFactoryMethod(shapeType) {
      const factory        = this.getFactory();
      const { createMarker, createPolygon,
              createRectangle, createCircle, createPolyline, } = factory;
      const factoryMethods = {
        /*
         * For reading (rendering) map object from the backend.
         */
        marker    : createMarker,
        area      : createPolygon,
        rectangle : createPolygon,
        circle    : createPolygon,
        pass      : createPolygon,
        /*
         * For creating (editing) map object in the frontend.
         */
        point     : createMarker,
        polygon   : createPolygon,
        rectangle2: createRectangle,
        circle2   : createCircle,
        line      : createPolyline,
      };

      const factoryMethod = factoryMethods[shapeType];

      if (!_.isFunction(factoryMethod)) {
        throw new Error(`Invalid shape type: ${shapeType}.`);
      }

      return factoryMethod;
    },

    /**
     *
     */
    getNativeObject() {
      throw new Error('.getNativeObject() method not implemented.');
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
     * @returns {*}
     */
    createDefaultObjectModel() {
      const { roamObject }  = this;
      const shapeType   = (roamObject.shapeType || 'marker').toLowerCase();
      const objectModel = {
        shapeType,
      };
      const markerTyped = (shapeType === 'marker');
      const { latitude, longitude } = roamObject;

      if (markerTyped) {
        _.assign(objectModel, {
          lat    : latitude,
          lng    : longitude,
          options: {
            icon: {
              model: styler.getRoamIcon(roamObject,

                /**
                 * .png fallback enabled for GM in IE.
                 * "It seems that Google Maps doesn't
                 * really support using SVG images for
                 * markers at the moment. This fact is
                 * easy to overlook, because it turns
                 * out that SVG marker images do actually
                 * work in, eg. Chrome and Opera."
                 * @see http://stackoverflow.com/a/26608307/2013891
                 */
                !(this.viewer.moduleName.match(/googlemaps/i) &&
                  kendo.support.browser.msie)),
            },
          },
        });

      } else {
        const fenceType = roamObject.fenceType || 'Unknown';

        _.assign(objectModel, {
          coordinates: this.getFactory()
                           .toLatLngArray(roamObject.coordinates),
          options    : {
            styleName: `geofence${fenceType}`,
          },
        });
      }

      return objectModel;
    },

    /**
     *
     * @returns {*}
     */
    createDefaultRoamData() {
      const { roamObject, layerName }  = this;
      const { asset }  = roamObject;
      let name        = asset ? asset.name : roamObject.name;
      let description = name;

      if (layerName === ROAM_ASSETS_HISTORY ||
          layerName === ROAM_ASSETS_ANIMATION) {

        name        = `${asset.name} ${roamObject.name}`;
        description = `${roamObject.name} ${App.util.format.dateTime(roamObject.eventTime)}`;
      }

      const { fenceType } = roamObject;
      if (fenceType) {
        description = `${name} [${fenceType}]`;
      }

      const { domainObjectType, domainObjectTypeId, id } = roamObject;
      return {
        domainObjectType,
        domainObjectTypeId,
        name,
        description,
        layerName,
        domainObjectId: id,
      };
    },

    /**
     *
     * @returns {Function}
     */
    createDefaultClickListener() {

      return (e) => {
        e.stopPropagation = e.stopPropagation || e.stop;
        e.stopPropagation();

        let position;

        if (_.isFunction(this.getPosition)) {
          position = this.getPosition();
        } else {
          position = this.getCenterBounds();
        }

        const { viewer } = this;
        const px = viewer.geoToPixel(position);
        const { x, y } = px;

        viewer.createMapInfoBox({
            parentElement   : viewer.container,
            position        : {
              top : y,
              left: x,
            },
            domainObjectType: this.getData('domainObjectType'),
            domainObjectId  : this.getData('domainObjectId'),
            objectName      : this.getData('name'),
          },
          (mapInfoBox) => {
            mapInfoBox.setGeoPosition(position);
            mapInfoBox.show();
          });
      };
    },

    /**
     *
     * @returns {Function}
     */
    createDefaultMouseEnterListener() {

      return () => {
        let hoverLabel = this.getData('hoverLabel');

        if (!hoverLabel) {
          hoverLabel = this.viewer
                           .getMapObjectLabelFactory()
                           .create({ mapObject: this });
          hoverLabel.setText(this.getData('name'));
          this.setData('hoverLabel', hoverLabel);
        } else {
          hoverLabel.updatePosition();
        }

        hoverLabel.setVisible(true);
      };
    },

    /**
     *
     * @returns {Function}
     */
    createDefaultMouseLeaveListener() {

      return () => {
        const hoverLabel = this.getData('hoverLabel');

        if (hoverLabel) {
          hoverLabel.setVisible(false);
        }
      };
    },

    /**
     *
     * @returns {Function}
     */
    createDefaultVisibilityChangedListener() {

      return () => {
        const { viewer, layerName } = this;
        const labelsVisibilityEnabled =
                viewer
                  .getLayerManager()
                  .getObjectLabelsVisibility(layerName);

        this.setLabelVisible(labelsVisibilityEnabled);
      };
    },

    /**
     *
     * @param key
     */
    getData(key) {
      throw new Error('.getData() method not implemented.');
    },

    /**
     *
     * @param key
     * @param value
     */
    setData(key, value) {
      throw new Error('.setData() method not implemented.');
    },

    /**
     *
     * @param effective
     */
    isVisible(effective) {
      throw new Error('.isVisible() method not implemented.');
    },

    /**
     *
     * @param visible
     */
    setVisible(visible) {
      throw new Error('.setVisible() method not implemented.');
    },

    /**
     *
     * @returns {*}
     */
    getLabel() {
      return this.getData('objectLabel');
    },

    /**
     *
     * @returns {boolean}
     */
    isLabelVisible() {
      const label = this.getLabel();

      return Boolean(label && label.isVisible());
    },

    /**
     *
     * @param visible
     */
    setLabelVisible(visible) {
      let label = this.getLabel();

      if (!label) {
        label = this.viewer
                    .getMapObjectLabelFactory()
                    .create({ mapObject: this });
        this.setData('objectLabel', label);
      } else {
        this.updateLabelPosition();
      }

      label.setVisible(visible);
    },

    /**
     *
     */
    updateLabelPosition() {
      const label = this.getLabel();

      if (label) {
        label.updatePosition();
      }
    },

    /**
     *
     */
    destroyLabel() {
      const label = this.getLabel();

      if (label) {
        label.destroy();
        this.setData('objectLabel', undefined);
      }
    },

    /**
     *
     */
    isWithinViewBounds() {
      throw new Error('.isWithinViewBounds() method not implemented.');
    },
  })
  .static({

    /**
     *
     * @param objectModel
     * @param viewer
     */
    createMarker(objectModel, viewer) {
      throw new Error('.createMarker() method not implemented.');
    },

    /**
     *
     * @param objectModel
     * @param viewer
     */
    createPolyline(objectModel, viewer) {
      throw new Error('.createPolyline() method not implemented.');
    },

    /**
     *
     * @param objectModel
     * @param viewer
     */
    createPolygon(objectModel, viewer) {
      throw new Error('.createPolygon() method not implemented.');
    },

    /**
     *
     * @param objectModel
     * @param viewer
     */
    createRectangle(objectModel, viewer) {
      throw new Error('.createRectangle() method not implemented.');
    },

    /**
     *
     * @param objectModel
     * @param viewer
     */
    createCircle(objectModel, viewer) {
      throw new Error('.createCircle() method not implemented.');
    },

    /**
     *
     * @param styleName
     * @param viewer
     */
    createNormalizedShapeStyle(styleName, viewer) {
      const shapeStyles = styler.getShapeStyles();
      let style         = { ...shapeStyles[styleName] };

      if (styleName.match(/geofence/i)) {
        _.assign(style, shapeStyles.geofence);
      }

      style = viewer
        .getMapObjectFactory()
        .normalizeShapeStyle(style);

      return style;
    },

    /**
     *
     * @param style
     */
    normalizeShapeStyle(style) {
      throw new Error('.normalizeShapeStyle() method not implemented.');
    },

    /**
     *
     * @param lngLats
     * @returns {*}
     */
    toLatLngArray(lngLats) {

      return _.map(lngLats, (el, i, arr) => {
        const n        = i + 1;
        let coordinate = arr[i + 1];

        if (n % 2 === 0) {
          coordinate = arr[i - 1];
        }

        return coordinate;
      });
    },

    /**
     *
     * @param latLngs
     * @returns {*}
     */
    toPoints(latLngs) {

      return _(latLngs)
        .map((coordinate, i) => {
          const n = i + 1;
          let point;

          if (n % 2 === 0) {
            const lat = latLngs[i - 1];
            const lng = latLngs[i];

            point = {
              lat,
              lng,
            };
          }

          return point;
        })
        .compact()
        .value();
    },

    /**
     *
     * @param points
     * @returns {Array}
     */
    toCoordinates(points) {

      return _.transform(points, (coordinates, point) => {
        let { lat, lng } = point;
        lat = _.isFinite(parseFloat(lat)) ? lat : point.lat();
        lng = _.isFinite(parseFloat(lng)) ? lng : point.lng();

        coordinates.push(lat, lng);
      });
    },
  });

export { MapObject as default, MapObject };
