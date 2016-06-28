/**
 * Created by Glenn on 2015-07-30.
 */

import maps from 'googlemaps';
import { MapObject as AbstractMapObject } from '../map-object';
import { Styler } from '../../styler';

const google = { maps };

const styler = Styler.getInstance();

/**
 * Concrete factory for creating map object using Google Maps JS API.
 * The created map object will act as an adapter for the corresponding
 * native Google Maps map object, implementing the "abstract" methods
 * specified in the more abstract map object.
 * @extends {MapObject}
 */
const GoogleMapsMapObject = stampit()
  .init(({ instance }) => {
    const { roamObject, viewer } = instance;
    let { objectModel } = instance;

    /* region private properties */

    /*
     *
     */
    let nativeObject;

    /*
     *
     */
    const eventTypes = {
      click           : 'click',
      dragstart       : 'dragstart',
      drag            : 'drag',
      dragend         : 'dragend',
      mousedown       : 'mousedown',
      mouseup         : 'mouseup',
      mouseenter      : 'mouseover',
      mouseleave      : 'mouseout',
      mousemove       : 'mousemove',
      visibilitychange: 'visible_changed',
      mapchange       : 'map_changed',
    };

    /* endregion private properties */

    /* region privileged methods */

    _.assign(instance, {

      /**
       *
       * @returns {*}
       */
      getNativeObject() {
        return nativeObject;
      },

      /**
       *
       * @param type
       * @param listener
       */
      addEventListener(type, listener) {
        const eventType = eventTypes[type];

        if (!_.isString(eventType)) {
          throw new Error(`Invalid event type: ${type}.`);
        }

        listener.mapsEventListener =
          google.maps.event.addListener(nativeObject, eventType, listener);
      },

      /**
       *
       * @param type
       * @param listener
       */
      removeEventListener(type, listener) {
        const eventType = eventTypes[type];

        if (!_.isString(eventType)) {
          throw new Error(`Invalid event type: ${type}.`);
        }

        google.maps.event.removeListener(listener.mapsEventListener);
      },

      /**
       *
       * @param key
       * @returns {*}
       */
      getData(key) {
        return nativeObject.get(key);
      },

      /**
       *
       * @param key
       * @param value
       */
      setData(key, value) {

        if (_.isPlainObject(key)) {
          nativeObject.setValues(key);
        } else {
          nativeObject.set(key, value);
        }
      },

      /**
       *
       * @param effective
       * @returns {*}
       */
      isVisible(effective) {
        let visible = nativeObject.getVisible();

        if (effective) {
          visible = visible && Boolean(nativeObject.getMap());
        }

        return visible;
      },

      /**
       *
       * @param visible
       */
      setVisible(visible) {
        nativeObject.setVisible(visible);
      },

      /**
       *
       * @returns {boolean}
       */
      isWithinViewBounds() {
        const nativeBounds   = viewer.getBoundingBox().getNativeBounds();
        let withinViewBounds = false;

        if (nativeObject instanceof google.maps.Marker) {
          withinViewBounds = nativeBounds.contains(nativeObject.getPosition());
        } else {

          if (_.isFunction(nativeObject.getBounds)) {
            withinViewBounds = nativeBounds.intersects(nativeObject.getBounds());
          } else {
            withinViewBounds = _.some(nativeObject.getPath().getArray(),
              latLng => nativeBounds.contains(latLng));
          }
        }

        return withinViewBounds;
      },
    });

    /* endregion privileged methods */

    /* region init code */

    objectModel = instance.objectModel = objectModel || instance.createDefaultObjectModel();
    objectModel.options = { ...objectModel.options };

    /*
     * Create the native Google Maps object.
     */
    const factoryMethod = instance.getFactoryMethod(objectModel.shapeType);
    nativeObject        = factoryMethod(objectModel, viewer);

    /* region setup wrapper methods */

    /*
     * Enrich this map object with type-specific adapter methods.
     */
    if (nativeObject instanceof google.maps.Marker) {

      /*
       * Marker.
       */
      _.assign(instance, {

        /**
         *
         * @returns {*}
         */
        getPosition() {
          const position = nativeObject.getPosition();

          return {
            lat: position.lat(),
            lng: position.lng(),
          };
        },

        /**
         *
         * @param position
         */
        setPosition(position) {
          const { lat, lng } = position;

          objectModel.coordinates = [lat, lng];

          const oldPosition = nativeObject.getPosition();
          const newPosition = new google.maps.LatLng(lat, lng);

          if (!newPosition.equals(oldPosition)) {
            nativeObject.setPosition(newPosition);
          }
        },

        /**
         *
         * @returns {*}
         */
        getIcon() {
          return nativeObject.getIcon();
        },

        /**
         *
         * @param icon
         */
        setIcon(icon) {
          const { model, options } = icon;
          let url = model;

          /*
           * See the below comment in .createMarker() method.
           */
          if (url.match(/<svg/i)) {
            url = `data:image/svg+xml;charset=UTF-8;base64,${btoa(url)}`;
          }

          nativeObject.setIcon({
            url,
            ...options,
          });
        },

        /**
         *
         */
        updateIcon() {
          instance.setData('originalIcon', instance.getIcon());
          instance.setIcon({
            model: styler.getRoamIcon(
              instance.roamObject, !kendo.support.browser.msie),
          });

          /*
           * Add a nice animation's lick. =p
           */
          instance.bounce();
        },

        /**
         *
         */
        revertIcon() {
          const originalIcon = instance.getData('originalIcon');

          if (originalIcon) {
            instance.setIcon({
              model: originalIcon.url,
            });
          }
        },

        /**
         *
         * @param opacity
         */
        setOpacity(opacity) {
          nativeObject.setOpacity(opacity);
        },

        /**
         *
         */
        bounce() {
          const bounceDuration = 3000; // in milliseconds

          nativeObject.setAnimation(google.maps.Animation.BOUNCE);
          setTimeout(() => nativeObject.setAnimation(undefined), bounceDuration);
        },
      });

    } else {

      /*
       * Spatial geoshape.
       */
      if (nativeObject instanceof google.maps.Circle) {

        /*
         * Circle.
         */
        _.assign(instance, {

          /**
           *
           * @param center
           */
          setCenter(center) {
            const { lat, lng } = center;

            objectModel.coordinates[0] = lat;
            objectModel.coordinates[1] = lng;

            const oldCenter = nativeObject.getCenter();
            const newCenter = new google.maps.LatLng(lat, lng);

            if (!newCenter.equals(oldCenter)) {
              nativeObject.setCenter(newCenter);
            }
          },

          /**
           *
           * @param radius
           */
          setRadius(radius) {
            objectModel.coordinates[2] = radius;

            if (radius !== nativeObject.getRadius()) {
              nativeObject.setRadius(radius);
            }
          },
        });

      } else {

        /*
         * - Polyline,
         * - Polygon,
         * - Rectangle.
         */
        _.assign(instance, {

          /**
           *
           * @returns {Object} bbox
           */
          getBounds() {
            let bounds = new google.maps.LatLngBounds();

            if (_.isFunction(nativeObject.getBounds)) {
              bounds = nativeObject.getBounds();
            } else {
              const path = nativeObject.getPath();

              _.forEach(path.getArray(), latLng => bounds.extend(latLng));
            }

            const ne = bounds.getNorthEast();
            const sw = bounds.getSouthWest();

            return {
              left  : ne.lng(),
              bottom: sw.lat(),
              right : sw.lng(),
              top   : ne.lat(),
            };
          },

          /**
           *
           * @returns {{lat: number, lng: number}}
           */
          getCenterBounds() {
            const { right, left, top, bottom } = instance.getBounds();
            const deltaX = (right - left) / 2;
            const deltaY = (top - bottom) / 2;

            return {
              lat: bottom + deltaY,
              lng: left + deltaX,
            };
          },
        });

        if (nativeObject instanceof google.maps.Rectangle) {

          /*
           * Rectangle.
           */
          _.assign(instance, {

            /**
             *
             * @param bounds
             */
            setBounds(bounds) {
              const { right, left, top, bottom } = bounds;
              objectModel.coordinates = [top, left, bottom, right];

              const oldBounds = nativeObject.getBounds();
              const newBounds = new google.maps.LatLngBounds(
                new google.maps.LatLng(bottom, right),
                new google.maps.LatLng(top, left)
              );

              if (!newBounds.equals(oldBounds)) {
                nativeObject.setBounds(newBounds);
              }
            },
          });

        } else {

          /*
           * - Polyline,
           * - Polygon.
           */
          _.assign(instance, {

            /**
             *
             * @param coordinates
             */
            setCoordinates(coordinates) {
              objectModel.coordinates = coordinates;

              const oldPath          = nativeObject.getPath();
              let coordinatesChanged = true;

              if (oldPath) {
                const oldCoordinates = oldPath.getArray();

                coordinatesChanged = _.some(coordinates,
                  (coordinate, i) => (coordinate !== oldCoordinates[i]));
              }

              if (coordinatesChanged) {
                nativeObject.setPath(
                  viewer
                    .getMapObjectFactory()
                    .toPoints(coordinates));
              }
            },
          });
        }
      }
    }

    /* endregion setup wrapper methods */

    if (roamObject) {

      // Setup default ROAM data.
      instance.setData(instance.createDefaultRoamData());

      // Setup default event listeners.
      instance.addEventListener('click', instance.createDefaultClickListener());
      instance.addEventListener('mouseenter', instance.createDefaultMouseEnterListener());
      instance.addEventListener('mouseleave', instance.createDefaultMouseLeaveListener());

      // Bind label's visibility to object's visibility.
      const visibilityChangedListener = instance.createDefaultVisibilityChangedListener();
      instance.addEventListener('visibilitychange', visibilityChangedListener);
      instance.addEventListener('mapchange', visibilityChangedListener);
    }

    instance.setData('wrapper', instance);

    /* endregion init code */
  })
  .static({

    /**
     *
     * @param objectModel
     * @param viewer
     * @returns {*}
     */
    createMarker(objectModel, viewer) {
      const { coordinates, options } = objectModel;
      const { label, icon, editable, draggable } = options;
      let { lat, lng } = objectModel;

      if (!(_.isFinite(lat) && _.isFinite(lng))) {
        [lat, lng] = coordinates;
      }

      const marker = new google.maps.Marker({
        //animation: options.editable ? null : google.maps.Animation.BOUNCE,
        //animation: options.editable ? null : google.maps.Animation.DROP,
        label,
        position: new google.maps.LatLng(lat, lng),
      });

      if (icon && icon.model) {
        let url = icon.model;

        /**
         * Darn. Gotta do this for passing SVG DOM object as icon.
         * @see https://code.google.com/p/gmaps-api-issues/issues/detail?id=6505
         */
        if (url.match(/svg/i)) {
          url = `data:image/svg+xml;charset=UTF-8;base64,${btoa(url)}`;
        }

        marker.setIcon({
          url,
          ...options,
        });
      }

      const editManager = viewer.getEditManager();

      if (draggable) {
        marker.setDraggable(true);

        google.maps.event.addListener(marker, 'drag', ({ latLng }) => {
          const lat         = latLng.lat();
          const lng         = latLng.lng();
          const coordinates = [lat, lng];

          marker.get('wrapper').setPosition({
            lat,
            lng,
          });

          if (editable) {
            editManager.setEditableObjectCoordinates(coordinates);
          }
        });
      }

      if (editable) {
        function editModeClickListener({ latLng }) {
          editManager.setEditableObjectCoordinates([latLng.lat(), latLng.lng()]);
        }

        marker.set('editModeClickListener', editModeClickListener);
        viewer.addEventListener('click', editModeClickListener);
      }

      return marker;
    },

    /**
     *
     * @param objectModel
     * @param viewer
     * @returns {*}
     */
    createPolyline(objectModel, viewer) {
      const { coordinates, options } = objectModel;
      const { draggable, editable, styleName } = options;
      const mapObjectFactory = viewer.getMapObjectFactory();

      let polyline = new google.maps.Polyline({
        draggable,
        path: mapObjectFactory.toPoints(coordinates),
      });

      if (editable) {
        polyline = mapObjectFactory.toEditablePolyShape(polyline, objectModel, viewer);
      }

      if (styleName) {
        const style = mapObjectFactory.createNormalizedShapeStyle(styleName, viewer);
        const { strokeColor, strokeOpacity, strokeWeight, fillColor, fillOpacity, icons } = style;

        polyline.setOptions({
          strokeColor,
          strokeOpacity,
          strokeWeight,
          fillColor,
          fillOpacity,
          icons,
        });
      }

      return polyline;
    },

    /**
     *
     * @param objectModel
     * @param viewer
     * @returns {*}
     */
    createPolygon(objectModel, viewer) {
      const { coordinates, options } = objectModel;
      const { draggable, editable, styleName } = options;
      const mapObjectFactory = viewer.getMapObjectFactory();

      let polygon = new google.maps.Polygon({
        draggable,
        paths: mapObjectFactory.toPoints(coordinates),
      });

      if (editable) {
        polygon = mapObjectFactory.toEditablePolyShape(polygon, objectModel, viewer);
      }

      if (styleName) {
        const style = mapObjectFactory.createNormalizedShapeStyle(styleName, viewer);
        const { strokeColor, strokeWeight, fillColor, fillOpacity } = style;

        polygon.setOptions({
          strokeColor,
          strokeWeight,
          fillColor,
          fillOpacity,
        });
      }

      return polygon;
    },

    /**
     *
     * @param polyShape
     * @param objectModel
     * @param viewer
     * @returns {*}
     */
    toEditablePolyShape(polyShape, objectModel, viewer) {
      const { coordinates } = objectModel;
      const mapObjectFactory = viewer.getMapObjectFactory();
      const editManager      = viewer.getEditManager();
      const pointCount       = _.floor(coordinates.length / 2);

      /*
       * Incremental creation of a poly-* generally starts
       * with a single point.
       */
      if (pointCount === 1) {
        polyShape = mapObjectFactory.createMarker(objectModel, viewer);

        /*
         * Remove leftover click listener of editable marker
         * object type. At this point, `polyShape` is actually
         * a marker.
         */
        viewer.removeEventListener('click', polyShape.get('editModeClickListener'));
      } else {
        polyShape.setEditable(true);

        /*
         * Here, the polyshape is already a polyline or polygon.
         */
        const path = polyShape.getPath();

        function editingEventListener() {
          editManager.setEditableObjectCoordinates(
            mapObjectFactory.toCoordinates(polyShape.getPath()));
        }

        google.maps.event.addListener(path, 'insert_at', editingEventListener);
        google.maps.event.addListener(path, 'remove_at', editingEventListener);
        google.maps.event.addListener(path, 'set_at', editingEventListener);
      }

      function editModeClickListener({ latLng }) {
        const coordinates_ = editManager.getEditableObjectCoordinates();
        let editableObject = editManager.getEditableObject();
        const nativeObject = editableObject.getNativeObject();

        coordinates_.push(latLng.lat(), latLng.lng());

        if (nativeObject instanceof google.maps.Marker) {
          const { objectModel } = editableObject;

          /*
           * Transform from marker to poly-* shape.
           */
          editableObject = mapObjectFactory.create({
            viewer,
            objectModel: { ...objectModel, coordinates: coordinates_ },
          });

          editManager.setEditableObject(editableObject);
        } else {
          editManager.setEditableObjectCoordinates(coordinates_);
        }
      }

      polyShape.set('editModeClickListener', editModeClickListener);
      viewer.addEventListener('click', editModeClickListener);

      return polyShape;
    },

    /**
     *
     * @param objectModel
     * @param viewer
     */
    createRectangle(objectModel, viewer) {
      const { coordinates, options } = objectModel;
      const { draggable, editable, styleName } = options;
      const mapObjectFactory = viewer.getMapObjectFactory();

      const points = mapObjectFactory.toPoints(coordinates);
      const [point1, point2] = points;
      const bounds = new google.maps.LatLngBounds(
        new google.maps.LatLng(point1.lat, point1.lng));

      if (point2) {
        bounds.extend(new google.maps.LatLng(point2.lat, point2.lng));
      }

      const rectangle = new google.maps.Rectangle({
        bounds,
        draggable,
      });

      if (editable) {
        rectangle.setEditable(true);

        const editManager = viewer.getEditManager();
        const ne          = bounds.getNorthEast();
        const distance    = editManager.getEditableObjectBufferDistance() || 10000;
        const heading     = 135;
        /*
         * Default south-west corner of editable rectangle.
         */
        const sw = google.maps
                         .geometry.spherical
                         .computeOffset(ne, distance, heading);

        coordinates.push(sw.lat(), sw.lng());
        bounds.extend(sw);

        google.maps.event.addListener(rectangle, 'bounds_changed', () => {
          const bounds_     = rectangle.getBounds();
          const ne          = bounds_.getNorthEast();
          const sw          = bounds_.getSouthWest();
          const coordinates = [ne.lat(), ne.lng(), sw.lat(), sw.lng()];

          editManager.setEditableObjectCoordinates(coordinates);
        });
      }

      if (styleName) {
        const style = mapObjectFactory.createNormalizedShapeStyle(styleName, viewer);
        const { strokeColor, strokeWeight, fillColor, fillOpacity } = style;

        rectangle.setOptions({
          strokeColor,
          strokeWeight,
          fillColor,
          fillOpacity,
        });
      }

      return rectangle;
    },

    /**
     *
     * @param objectModel
     * @param viewer
     */
    createCircle(objectModel, viewer) {
      const { coordinates, options } = objectModel;
      const { draggable, editable, styleName } = options;
      const mapObjectFactory = viewer.getMapObjectFactory();

      const circle = new google.maps.Circle({
        draggable,
        center: new google.maps.LatLng(coordinates[0], coordinates[1]),
        radius: coordinates[2],
      });

      if (editable) {
        circle.setEditable(true);

        const editManager = viewer.getEditManager();
        /*
         * Default radius of editable circle.
         */
        const radius = editManager.getEditableObjectBufferDistance() || 10000;

        coordinates[2] = radius;
        circle.setRadius(radius);

        function editingEventListener() {
          const center      = circle.getCenter();
          const radius      = circle.getRadius();
          const coordinates = [center.lat(), center.lng(), radius];

          editManager.setEditableObjectCoordinates(coordinates);
          editManager.setEditableObjectBufferDistance(radius);
        }

        google.maps.event.addListener(circle, 'radius_changed', editingEventListener);
        google.maps.event.addListener(circle, 'center_changed', editingEventListener);
      }

      if (styleName) {
        const style = mapObjectFactory.createNormalizedShapeStyle(styleName, viewer);
        const { strokeColor, strokeWeight, fillColor, fillOpacity } = style;

        circle.setOptions({
          strokeColor,
          strokeWeight,
          fillColor,
          fillOpacity,
        });
      }

      return circle;
    },

    /**
     *
     * @param style
     * @returns {{}}
     */
    normalizeShapeStyle(style) {
      const defaultStyle    = {
        strokeColor  : '#0055aa',
        strokeOpacity: 0.6,
        strokeWeight : 2,
        fillColor    : '#0055aa',
        fillOpacity  : 0.4,
      };
      const normalizedStyle = { ...defaultStyle, ...style };

      /**
       *
       * @see https://developers.google.com/maps/documentation/javascript/3.exp/reference#IconSequence
       * @see https://developers.google.com/maps/documentation/javascript/3.exp/reference#Symbol
       */
      const { arrows } = normalizedStyle;

      if (arrows) {
        const defaultIconSequence = {
          icon  : {
            path : google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
            scale: 1.2 * 1.6,

            //strokeColor  : '#000000',
            //strokeColor  : '#ffffff',
            strokeColor  : '#0055aa',
            strokeOpacity: 0.5,
            strokeWeight : 0.5,
            fillColor    : '#ffffff',

            //fillColor    : '#000000',
            fillOpacity: 0.75,
          },
          repeat: '5%',
        };

        const { length, width, fillColor, fillOpacity, frequency } = arrows;

        const arrowStyle = {
          icon  : {
            fillColor,
            fillOpacity,
            scale: (_.isFinite(length) && _.isFinite(width)) ? (length * width) : undefined,
          },
          repeat: _.isFinite(frequency) ? `${frequency}%` : undefined,
        };

        normalizedStyle.icons = [_.merge({}, defaultIconSequence, arrowStyle)];
      }

      return normalizedStyle;
    },
  });

const MapObject = stampit.compose(AbstractMapObject, GoogleMapsMapObject);

export { MapObject as default, MapObject };
