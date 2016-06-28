/**
 * Created by Glenn on 2015-07-02.
 */

import { Styler } from '../../styler';

const styler = Styler.getInstance();

const EditManager = stampit()
  .init(({ instance }) => {

    /* region private properties */

    /*
     *
     */
    let viewer;

    /*
     *
     */
    let editableObjectType;

    /*
     * TODO: Not quite an elegant solution for mimicking two-way
     * data binding between the view and the model because, here,
     * the default state of the properties is assumed rather than
     * bound to the view.
     *
     * Could have been much easier if we used Angular.
     */
    const editableObjectPropertiesList = {
      location: {
        objectName : '',
        configName : 'Bank',
        latitude   : NaN,
        longitude  : NaN,
        /*
         *
         */
        shapeType  : 'POINT',
        coordinates: [],
      },
      geofence: {
        objectName     : '',
        configName     : 'Exclusive Security',
        type           : '',
        geometry       : '',
        /*
         *
         */
        shapeType      : 'POLYGON',
        coordinates    : [],
        bufferDistances: {
          CIRCLE: 10000,
          PASS  : 100,
        },
      },
    };

    /*
     *
     */
    let editableObject;
    let editModeLabel;

    /*
     *
     */
    let clickListener;

    /*
     *
     */
    const editableObjectPropertyValidationActions = {
      coordinates(coordinates) {
        const shapeType                 = instance.getEditableObjectShapeType();
        const shapeTypeValidationAction = shapeTypeValidationActions[shapeType];
        let validity;

        if (!_.isFunction(shapeTypeValidationAction)) {
          validity = {
            valid      : false,
            invalidText: `Invalid shape type: ${shapeType}.`,
          };

        } else {
          let argument = coordinates;

          if (shapeType !== 'POINT') {
            argument = _.floor(coordinates.length / 2);
          }

          validity = shapeTypeValidationAction(argument);
        }

        return validity;
      },

      bufferDistance(bufferDistance) {
        return {

          /*
           * For shapes other than circle or pass,
           * `undefined` is a valid buffer distance value.
           */
          valid: _.isUndefined(bufferDistance) || (bufferDistance > 10),
        };
      },

      objectName(objectName) {
        return {
          valid: (objectName.length >= 3),
        };
      },
    };

    const shapeTypeValidationActions = {
      POINT(coordinates) {
        const latLng      = coordinates.join(',');
        /**
         * Regex for validating lat/lon with lil' bit modifications.
         * @see http://stackoverflow.com/a/18690202/2013891
         */
        const latPart     = /^([-]?([1-8]?\d(\.\d+)?|90(\.0+)?)),\s*/;
        const lngPart     = /([-]?(180(\.0+)?|((1[0-7]\d)|([1-9]?\d))(\.\d+)?))$/;
        const latLngRegex = new RegExp(`${latPart.source}${lngPart.source}`);

        return {
          valid: Boolean(latLng.match(latLngRegex)),
        };
      },

      POLYGON(pointCount) {
        return {
          valid      : (pointCount >= 3),
          invalidText: 'Polygon needs at least 3 points.',
        };
      },

      RECTANGLE(pointCount) {
        return {
          valid      : (pointCount === 2),
          invalidText: 'Rectangle needs 2 points.',
        };
      },

      CIRCLE(pointCount) {
        return {
          valid      : (pointCount === 1),
          invalidText: 'Circle needs a pair of coordinates.',
        };
      },

      PASS(pointCount) {
        return {
          valid      : (pointCount >= 2),
          invalidText: 'Pass needs at least 2 points.',
        };
      },

    };

    /*
     *
     */
    const wildcatTypes = {  // The Cat is getting wild!! :)
      POLYGON  : 'Wildcat.GeoArea',
      RECTANGLE: 'Wildcat.GeoRectangle',
      CIRCLE   : 'Wildcat.GeoCircle',
      PASS     : 'Wildcat.GeoPass',
    };

    /* endregion private properties */

    /* region private methods */

    /**
     *
     * @param shapeType
     * @param coordinates
     * @returns {*}
     */
    function createEditableObject(shapeType, coordinates) {

      /**
       *
       * @see `.getFactoryMethod()` method in
       * web2/js/maps/viewers/map-object.js
       */
      if (shapeType.match(/rectangle|circle/i)) {
        shapeType = `${shapeType}2`;
      } else if (shapeType.match(/pass/i)) {
        shapeType = 'line';
      }

      const mapObject = viewer
        .getMapObjectFactory()
        .create({
          viewer,
          objectModel: {
            coordinates,
            shapeType: shapeType.toLowerCase(),
            options  : {
              draggable: true,
              editable : true,
              icon     : {
                model: styler.getLocationIcon({ locationType: 'missing' }),
              },
              styleName: 'editableObject',
            },
          },
        });

      return mapObject;
    }

    /**
     *
     * @param name
     * @param value
     * @returns {{valid: boolean, invalidText: string}}
     */
    function createEditableObjectPropertyValidity(name, value) {
      const editableObjectPropertyValidationAction =
              editableObjectPropertyValidationActions[name];

      if (!_.isFunction(editableObjectPropertyValidationAction)) {
        throw new Error(`Invalid property name: ${name}.`);
      }

      return editableObjectPropertyValidationAction(value);
    }

    /**
     * A lot of strange formatting stuffs below as this is how
     * the server wants it, so do not blame me. :)
     * @param coordinates
     * @param bufferDistance
     * @returns {string}
     */
    function toGeometryStringParam(coordinates, bufferDistance) {
      let geometry = _(coordinates)
        .map((coordinate, i) => {
          const n = i + 1;
          let latLng;

          if (n % 2 === 0) {
            latLng = `${coordinates[i - 1].toFixed(8)},${coordinates[i].toFixed(8)}`;
          }

          return latLng;
        })
        .compact()
        .join(';');

      if (bufferDistance) {
        geometry = `${geometry};@${bufferDistance}`;

        if (instance.getEditableObjectShapeType() === 'CIRCLE') {
          geometry = geometry.replace(';@', ',');
        }
      }

      return geometry;
    }

    /* endregion private methods */

    /* region privileged methods */

    _.assign(instance, {

      /**
       *
       * @param mapViewer
       */
      setViewer: _.once(mapViewer => viewer = mapViewer),

      /**
       *
       * @returns {*}
       */
      getEditableObject() {
        return editableObject;
      },

      /**
       *
       * @param mapObject
       */
      setEditableObject(mapObject) {

        /*
         * Model.
         */
        instance.setEditableObjectCoordinates(mapObject.objectModel.coordinates);

        /*
         * View listens to model.
         */
        if (editableObject) {
          viewer.removeObject(editableObject);
        }

        editableObject = mapObject;
        viewer.addObject(editableObject);
      },

      /**
       *
       * @returns {string}
       */
      getEditableObjectType() {
        return editableObjectType;
      },

      /**
       *
       * @param type
       */
      setEditableObjectType(type) {

        /*
         * Model.
         */
        editableObjectType = type;

        /*
         * View listens to model.
         */
        if (!editModeLabel) {
          editModeLabel = $('<span>')
            .addClass('label label-primary editor-label')
            .css({
              position: 'absolute',
              left    : 4,
              top     : 4,
            })
            .appendTo(viewer.container);
        }

        if (type) {
          editModeLabel.text(`Edit Mode: ${editableObjectType.toUpperCase()}`);
        }

        editModeLabel.toggleClass('hidden', !type);

        viewer.getControls().onEditableObjectTypeChanged(type);
      },

      /**
       *
       * @returns {*}
       */
      getTargetLayerName() {
        return viewer.getLayerManager().getLayerName(editableObjectType);
      },

      /**
       *
       * @returns {*}
       */
      getEditableObjectProperties() {
        const editableObjectProperties =
                editableObjectPropertiesList[editableObjectType];

        if (!_.isPlainObject(editableObjectProperties)) {
          throw new Error(`Edit mode for ${editableObjectType.toUpperCase()} object not supported`);
        }

        return editableObjectProperties;
      },

      /**
       *
       */
      getSanitizedEditableObjectProperties() {
        const editableObjectProperties = instance.getEditableObjectProperties();
        const shapeType                = instance.getEditableObjectShapeType();
        const coordinates              = instance.getEditableObjectCoordinates();

        const wildcatType = wildcatTypes[shapeType];
        if (wildcatType) {
          const bufferDistance = instance.getEditableObjectBufferDistance();
          const geometry       = toGeometryStringParam(coordinates, bufferDistance);

          if (geometry) {
            _.assign(editableObjectProperties, {
              geometry,
              type: wildcatType,
            });
          }

        } else {    // Assumed to be a point.
          const [latitude, longitude] = coordinates;

          _.assign(editableObjectProperties, {
            latitude,
            longitude,
          });
        }

        const sanitizedEditableObjectProperties = { ...editableObjectProperties };

        delete sanitizedEditableObjectProperties.shapeType;
        delete sanitizedEditableObjectProperties.coordinates;
        delete sanitizedEditableObjectProperties.bufferDistances;

        return sanitizedEditableObjectProperties;
      },

      /**
       *
       * @returns {boolean}
       */
      isEditableObjectPropertiesValid() {
        const coordinates    = instance.getEditableObjectCoordinates();
        const bufferDistance = instance.getEditableObjectBufferDistance();
        const objectName     = instance.getEditableObjectName();

        /*
         * Properties to be checked for validity.
         */
        const properties = {
          coordinates,
          bufferDistance,
          objectName,
        };
        let valid        = true;

        _.forOwn(properties, (value, name) => {
          const validity = createEditableObjectPropertyValidity(name, value);

          valid = valid & validity.valid;

          viewer.getControls().onEditableObjectPropertyValidityChanged(name, validity);
        });

        return valid;
      },

      /**
       *
       * @returns {string}
       */
      getEditableObjectShapeType() {
        return instance.getEditableObjectProperties().shapeType;
      },

      /**
       *
       * @param shapeType
       */
      setEditableObjectShapeType(shapeType) {

        /*
         * Model.
         */
        const editableObjectProperties     = instance.getEditableObjectProperties();
        editableObjectProperties.shapeType = shapeType;

        /*
         * View listens to model.
         */
        instance.reset();

        clickListener = (e) => {
          const { currentPointer, latLng } = e;
          let point;

          if (currentPointer) {
            const { viewportX, viewportY } = currentPointer;

            point = viewer.pixelToGeo({
              x: viewportX,
              y: viewportY,
            });

          } else if (latLng) {
            point = {
              lat: latLng.lat(),
              lng: latLng.lng(),
            };
          }

          const coordinates = [point.lat, point.lng];
          const shapeType   = instance.getEditableObjectShapeType();

          const mapObject = createEditableObject(shapeType, coordinates);
          instance.setEditableObject(mapObject);

          const auxObjects = mapObject.getData('auxObjects');
          if (auxObjects) {
            viewer.addObjects(auxObjects);
          }
        };

        viewer.onceEventListener('click', clickListener);

        viewer.getControls().onEditableObjectShapeTypeChanged(shapeType);
      },

      /**
       *
       * @returns {*}
       */
      getEditableObjectCoordinates() {
        return instance.getEditableObjectProperties().coordinates;
      },

      /**
       *
       * @param coordinates
       */
      setEditableObjectCoordinates(coordinates) {

        coordinates = _.map(coordinates, (coordinate) => {

          if (_.isFinite(coordinate)) {
            coordinate = parseFloat(coordinate.toFixed(8));
          }

          return coordinate;
        });

        /*
         * Model.
         */
        const editableObjectProperties       = instance.getEditableObjectProperties();
        editableObjectProperties.coordinates = coordinates;

        /*
         * View listens to model.
         */
        if (editableObject) {

          /*
           * A bit lazy to make a mapping here. Back to that
           * classic if-else statement. Determine object type
           * by duck-typing check.
           */
          if (_.isFunction(editableObject.setPosition)) {
            const [lat, lng] = coordinates;

            // Marker/point.
            editableObject.setPosition({
              lat,
              lng,
            });
          } else if (_.isFunction(editableObject.setCoordinates)) {

            // Polyline, polygon...
            editableObject.setCoordinates(coordinates);
          } else if (_.isFunction(editableObject.setBounds)) {
            const [top, left, bottom, right] = coordinates;

            // Rectangle.
            editableObject.setBounds({
              left,
              bottom,
              right,
              top,
            });
          } else if (_.isFunction(editableObject.setRadius)) {
            const [lat, lng, radius] = coordinates;

            // Circle.
            editableObject.setCenter({
              lat,
              lng,
            });
            editableObject.setRadius(radius);
          }
        }

        const controls = viewer.getControls();
        controls.onEditableObjectCoordinatesChanged(coordinates);
        controls.onEditableObjectPropertyValidityChanged(
          'coordinates', createEditableObjectPropertyValidity('coordinates', coordinates));
      },

      /**
       *
       */
      resetEditableObjectCoordinates() {

        /*
         * Model.
         */
        const editableObjectProperties       = instance.getEditableObjectProperties();
        editableObjectProperties.coordinates = [];

        /*
         * View listens to model.
         */
        if (editableObject) {
          const auxObjects = editableObject.getData('auxObjects');
          if (auxObjects) {
            viewer.removeObjects(auxObjects);
          }

          viewer.removeObject(editableObject);
          editableObject = undefined;
        }

        const controls = viewer.getControls();
        controls.onEditableObjectCoordinatesChanged([]);
        controls.onEditableObjectPropertyValidityChanged(
          'coordinates', { valid: true });

        /*
         * When resetting object coordinates, make sure buffer
         * distance parameter of that particular shape type is
         * back to its previous state accordingly.
         */
        const bufferDistance = instance.getEditableObjectBufferDistance();
        if (bufferDistance) {
          controls.onEditableObjectBufferDistanceChanged(bufferDistance);
          controls.onEditableObjectPropertyValidityChanged(
            'bufferDistance', { valid: true });
        }
      },

      /**
       *
       * @param lat
       * @param lng
       */
      setEditableObjectLatLng(lat, lng) {
        const coordinates = [lat, lng];

        if (!editableObject) {
          instance.setEditableObject(createEditableObject('POINT', coordinates));
        } else {
          instance.setEditableObjectCoordinates(coordinates);
        }
      },

      /**
       *
       * @returns {number}
       */
      getEditableObjectBufferDistance() {
        const { bufferDistances } = instance.getEditableObjectProperties();
        const shapeType = instance.getEditableObjectShapeType();
        let bufferDistance;

        if (bufferDistances && bufferDistances[shapeType]) {
          bufferDistance = bufferDistances[shapeType];
        }

        return bufferDistance;
      },

      /**
       *
       * @param bufferDistance
       */
      setEditableObjectBufferDistance(bufferDistance) {
        bufferDistance = parseFloat(bufferDistance.toFixed(8));

        /*
         * Model.
         */
        const editableObjectProperties = instance.getEditableObjectProperties();
        const shapeType                = instance.getEditableObjectShapeType();

        editableObjectProperties.bufferDistances[shapeType] = bufferDistance;

        /*
         * View listens to model.
         */
        if (editableObject && shapeType === 'CIRCLE') {
          editableObject.setRadius(bufferDistance);
        }

        const controls = viewer.getControls();
        controls.onEditableObjectBufferDistanceChanged(bufferDistance);
        controls.onEditableObjectPropertyValidityChanged(
          'bufferDistance', createEditableObjectPropertyValidity('bufferDistance', bufferDistance));
      },

      /**
       *
       * @returns {*}
       */
      getEditableObjectName() {
        return instance.getEditableObjectProperties().objectName;
      },

      /**
       *
       * @param objectName
       */
      setEditableObjectName(objectName) {

        /*
         * Model.
         */
        const editableObjectProperties      = instance.getEditableObjectProperties();
        editableObjectProperties.objectName = objectName;

        /*
         * View listens to model.
         */
        const controls = viewer.getControls();
        controls.onEditableObjectNameChanged(objectName);
        controls.onEditableObjectPropertyValidityChanged(
          'objectName', createEditableObjectPropertyValidity('objectName', objectName));
      },

      /**
       *
       * @param configName
       */
      setEditableObjectConfigName(configName) {

        /*
         * Model.
         */
        const editableObjectProperties      = instance.getEditableObjectProperties();
        editableObjectProperties.configName = configName;

        /*
         * View listens to model.
         */
        viewer.getControls().onEditableObjectConfigNameChanged(configName);
      },

      /**
       *
       */
      reset() {
        instance.resetEditableObjectCoordinates();

        if (clickListener) {
          viewer.removeEventListener('click', clickListener);
          clickListener = undefined;
        }
      },

      /**
       *
       */
      destroy() {
        instance.reset();
        instance.setEditableObjectType(undefined);
      },
    });

    /* endregion privileged methods */
  });

export { EditManager as default, EditManager };
