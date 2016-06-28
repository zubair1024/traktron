/**
 * Created by Glenn on 2015-06-29.
 */

import H from 'heremaps';
import { MapObject as AbstractMapObject } from '../map-object';
import { Styler } from '../../styler';

const standardMarkerSvgMarkupTemplate = require('../../ui/svg/standardmarker.tpl');

const styler = Styler.getInstance();

/**
 * Concrete factory for creating map object using HERE Maps JS API.
 * The created map object will act as an adapter for the corresponding
 * native HERE Maps map object, implementing the "abstract" methods
 * specified in the more abstract map object.
 * @extends {MapObject}
 */
const HereMapsMapObject = stampit()
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
      click           : 'tap',
      dragstart       : 'dragstart',
      drag            : 'drag',
      dragend         : 'dragend',
      mousedown       : 'pointerdown',
      mouseup         : 'pointerup',
      mouseenter      : 'pointerenter',
      mouseleave      : 'pointerleave',
      mousemove       : 'pointermove',
      visibilitychange: 'visibilitychange',
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

        nativeObject.addEventListener(eventType, listener);
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

        nativeObject.removeEventListener(eventType, listener);
      },

      /**
       *
       * @param key
       * @returns {*}
       */
      getData(key) {
        return nativeObject.getData()[key];
      },

      /**
       *
       * @param key
       * @param value
       */
      setData(key, value) {
        let props = {};

        if (_.isPlainObject(key)) {
          props = key;
        } else {
          props[key] = value;
        }

        nativeObject.setData({ ...nativeObject.getData(), ...props });
      },

      /**
       *
       * @param effective
       * @returns {boolean}
       */
      isVisible(effective) {
        return nativeObject.getVisibility(effective);
      },

      /**
       *
       * @param visible
       */
      setVisible(visible) {
        nativeObject.setVisibility(visible);
      },

      /**
       *
       * @returns {boolean}
       */
      isWithinViewBounds() {
        const nativeBounds   = viewer.getBoundingBox().getNativeBounds();
        let withinViewBounds = false;

        if (nativeObject instanceof H.map.Marker) {
          withinViewBounds = nativeBounds.containsPoint(nativeObject.getPosition());
        } else {
          withinViewBounds = nativeBounds.containsRect(nativeObject.getBounds());
        }

        return withinViewBounds;
      },
    });

    /* endregion privileged methods */

    /* region init code */

    objectModel = instance.objectModel = (objectModel || instance.createDefaultObjectModel());
    objectModel.options = { ...objectModel.options };

    /*
     * Create the native HERE Maps object.
     */
    const factoryMethod = instance.getFactoryMethod(objectModel.shapeType);
    nativeObject        = factoryMethod(objectModel, viewer);

    /* region setup wrapper methods */

    const factory = viewer.getMapObjectFactory();

    /*
     * Enrich this map object with type-specific adapter methods.
     */
    if (nativeObject instanceof H.map.Marker) {

      /*
       * Marker.
       */
      _.assign(instance, {

        /**
         *
         * @returns {*}
         */
        getPosition() {
          return nativeObject.getPosition();
        },

        /**
         *
         * @param position
         */
        setPosition(position) {
          const { lat, lng } = position;

          objectModel.coordinates = [lat, lng];
          nativeObject.setPosition(position);
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

          nativeObject.setIcon(new H.map.Icon(model, options));
        },

        /**
         *
         */
        updateIcon() {
          instance.setData('originalIcon', instance.getIcon());
          instance.setIcon({
            model: styler.getRoamIcon(instance.roamObject, true),
          });

          instance.bounce();
        },

        /**
         *
         */
        revertIcon() {
          const originalIcon = instance.getData('originalIcon');

          if (originalIcon) {
            instance.setIcon({
              model: originalIcon.getBitmap(),
            });
          }
        },

        /**
         *
         * @param opacity
         */
        setOpacity(opacity) {

          /**
           * IEs wrongly throw "IE: SCRIPT5022: SecurityError"
           * when calling `.toDataURL()` and `.getImageData()`
           * even though the image icon drawn to the canvas is
           * from the same domain (the server).
           * @see http://simonsarris.com/blog/480-understanding-the-html5-canvas-image-security-rules
           * @see https://html.spec.whatwg.org/multipage/scripting.html#security-with-canvas-elements
           */
          if (!kendo.support.browser.msie) {
            const icon               = instance.getIcon();
            const canvas             = icon.getBitmap();
            let originalImageDataUrl = instance.getData('originalImageDataUrl');

            if (!originalImageDataUrl) {
              originalImageDataUrl = canvas.toDataURL();
              instance.setData('originalImageDataUrl', originalImageDataUrl);
            }

            /*
             * Don't mess up with the original image data URL,
             * manipulate the canvas context of its cloning instead.
             */
            const img  = new Image();
            img.src    = originalImageDataUrl;
            img.onload = () => {
              const ctx = canvas.getContext('2d');
              const { width, height } = canvas;

              ctx.clearRect(0, 0, width, height);
              ctx.save();
              ctx.globalAlpha = opacity;
              ctx.drawImage(img, 0, 0);
              ctx.restore();

              instance.setVisible(opacity > 0);
            };
          }
        },

        /**
         *
         */

        bounce() {

          if (!instance.getData('bouncing')) {
            const bounceCount      = 3;
            const position         = instance.getPosition();
            const { lat, lng } = position;
            const origin           = {
              lat,
              lng,
            };
            const pixel            = $(viewer.geoToPixel(position));
            const verticalDistance = 80; // in pixel
            const stepFn = (now, tween) => {
              instance.setPosition(viewer.pixelToGeo(tween.elem));
            };

            instance.setData('bouncing', true);

            _.times(bounceCount, (n) => {
              pixel
                .animate({ y: `-=${verticalDistance}` }, {
                  step: stepFn,
                })
                .animate({ y: `+=${verticalDistance}` }, {
                  step    : stepFn,
                  complete: () => {
                    instance.setPosition(origin);

                    if (n === bounceCount - 1) {
                      instance.setData('bouncing', false);
                    }
                  },
                });
            });
          }
        },
      });

    } else {

      /*
       * Spatial geoshape.
       */
      if (nativeObject instanceof H.map.Circle) {

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

            nativeObject.setCenter(center);
          },

          /**
           *
           * @param radius
           */
          setRadius(radius) {
            objectModel.coordinates[2] = radius;

            nativeObject.setRadius(radius);
          },
        });

      } else {

        /*
         * - Polygon,
         * - Polyline,
         * - Rectangle.
         */
        _.assign(instance, {

          /**
           *
           * @returns {Object} bbox
           */
          getBounds() {
            const bounds = nativeObject.getBounds();

            return {
              left  : bounds.getLeft(),
              bottom: bounds.getBottom(),
              right : bounds.getRight(),
              top   : bounds.getTop(),
            };
          },

          /**
           *
           * @returns {*}
           */
          getCenterBounds() {
            return nativeObject.getBounds().getCenter();
          },
        });

        if (nativeObject instanceof H.map.Rect) {

          /*
           * Rectangle.
           */
          _.assign(instance, {

            /**
             *
             * @param bounds
             */
            setBounds(bounds) {
              const { top, left, bottom, right } = bounds;

              objectModel.coordinates = [top, left, bottom, right];

              const oldBounds = nativeObject.getBounds();
              const newBounds = H.geo.Rect.coverPoints(
                factory.toPoints(objectModel.coordinates));

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

              const oldStrip         = nativeObject.getStrip();
              let coordinatesChanged = true;

              if (oldStrip) {
                const oldCoordinates = factory.fromStrip(oldStrip);

                coordinatesChanged = _.some(coordinates,
                  (coordinate, i) => (coordinate !== oldCoordinates[i]));
              }

              if (coordinatesChanged) {
                nativeObject.setStrip(H.geo.Strip.fromLatLngArray(coordinates));
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
      instance.addEventListener('visibilitychange',
        instance.createDefaultVisibilityChangedListener());
    }

    instance.setData('wrapper', instance);

    /* endregion init code */
  })
  .static({

    /**
     *
     * @param objectModel
     * @param viewer
     * @returns {*|C|m}
     */
    createMarker(objectModel, viewer) {
      const { coordinates, options } = objectModel;
      const { label, icon, draggable, editable } = options;
      let { lat, lng } = objectModel;

      if (!(_.isFinite(lat) && _.isFinite(lng))) {
        [lat, lng] = coordinates;
      }

      const marker = new H.map.Marker({
        lat,
        lng,
      }, { data: {} });

      if (label) {

        /**
         * And, by the way, #foxyeah. (See below)
         * @see http://stackoverflow.com/questions/29274941/nokia-here-v3-how-to-put-text-in-standard-marker
         */
        marker.setIcon(
          new H.map.Icon(
            standardMarkerSvgMarkupTemplate.replace('${text}', label)));
      }

      if (icon && icon.model) {
        marker.setIcon(new H.map.Icon(icon.model, icon.options));
      }

      const markerData          = marker.getData();
      const editManager         = viewer.getEditManager();
      let dragListener          = _.noop;
      let editModeClickListener = _.noop;

      if (draggable) {

        /**
         * This actually doesn't simply  make the marker draggable.
         * A drag listener must be added to the map viewer for the
         * marker to be able to be dragged. Woot!
         * @see https://developer.here.com/api-explorer/maps-js/markers/draggable-marker
         */
        marker.draggable = true;

        dragListener = (e) => {
          const { target } = e;

          if (target instanceof H.map.Marker) {
            const targetData  = target.getData();
            const { viewportX, viewportY } = e.currentPointer;
            const point       = viewer.pixelToGeo({
              x: viewportX,
              y: viewportY,
            });
            const { lat, lng } = point;
            const coordinates = [lat, lng];

            targetData.wrapper.setPosition(point);

            if (editable) {

              if (!targetData.auxObject) {
                editManager.setEditableObjectCoordinates(coordinates);
              }
            }
          }
        };

        markerData.dragListener = dragListener;
        viewer.addEventListener('drag', dragListener);
      }

      if (editable) {
        editModeClickListener = (e) => {
          const { viewportX, viewportY } = e.currentPointer;
          const point       = viewer.pixelToGeo({
            x: viewportX,
            y: viewportY,
          });
          const { lat, lng } = point;
          const coordinates = [lat, lng];

          editManager.setEditableObjectCoordinates(coordinates);
        };

        markerData.editModeListeners = {
          click: editModeClickListener,
          drag : dragListener,
        };
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
      const mapObjectFactory = viewer.getMapObjectFactory();

      let polyline = new H.map.Polyline(H.geo.Strip.fromLatLngArray(
        mapObjectFactory.toPaddedCoordinates(coordinates, 4)), { data: {} });

      if (options.editable) {
        polyline = mapObjectFactory.toEditablePolyShape(
          polyline, objectModel, viewer);
      }

      const { styleName } = options;

      if (styleName && _.isFunction(polyline.setStyle)) {
        const style = mapObjectFactory.createNormalizedShapeStyle(styleName, viewer);

        polyline.setStyle(style);
        polyline.setArrows(style.arrows);
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
      const mapObjectFactory = viewer.getMapObjectFactory();

      let polygon = new H.map.Polygon(H.geo.Strip.fromLatLngArray(
        mapObjectFactory.toPaddedCoordinates(coordinates, 6)), { data: {} });

      if (options.editable) {
        polygon = mapObjectFactory.toEditablePolyShape(
          polygon, objectModel, viewer);
      }

      const { styleName } = options;

      if (styleName && _.isFunction(polygon.setStyle)) {
        const style = mapObjectFactory.createNormalizedShapeStyle(styleName, viewer);

        polygon.setStyle(style);
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

      const polyShapeData = polyShape.getData();
      let { editModeListeners } = polyShapeData;
      editModeListeners   = polyShapeData.editModeListeners = { ...editModeListeners };

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
        editModeListeners = polyShape.getData().editModeListeners;
        viewer.removeEventListener('click', editModeListeners.click);
      } else {

        /*
         * Here, the polyshape is already a polyline or polygon.
         */
        polyShape.addEventListener('stripchange', (e) => {
          const strip       = e.currentTarget.getStrip();
          const coordinates = mapObjectFactory.fromStrip(strip);

          editManager.setEditableObjectCoordinates(coordinates);
        });
      }

      function editModeClickListener(e) {
        const { viewportX, viewportY } = e.currentPointer;
        const point = viewer.pixelToGeo({
          x: viewportX,
          y: viewportY,
        });

        let editableObject = editManager.getEditableObject();
        const nativeObject = editableObject.getNativeObject();
        const coordinates_ = editManager.getEditableObjectCoordinates();
        const { lat, lng } = point;

        coordinates_.push(lat, lng);

        if (nativeObject instanceof H.map.Marker) {
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

      editModeListeners.click = editModeClickListener;
      viewer.addEventListener('click', editModeClickListener);

      return polyShape;
    },

    /**
     *
     * @param objectModel
     * @param viewer
     */
    createRectangle(objectModel, viewer) {
      const { coordinates, options }      = objectModel;
      const mapObjectFactory = viewer.getMapObjectFactory();

      let rectangle;
      let points = mapObjectFactory.toPoints(coordinates);

      if (points.length >= 2) {
        rectangle = new H.map.Rect(H.geo.Rect.coverPoints(points), { data: {} });
      }

      if (options.editable) {
        const auxObjects = mapObjectFactory.createAuxObjects(
          objectModel, viewer, mapObjectFactory.createRectangle);

        points = [auxObjects[0].getPosition(), auxObjects[1].getPosition()];

        rectangle = new H.map.Rect(
          H.geo.Rect.coverPoints(points), {
            data: {
              auxObjects,
            },
          });

        rectangle.addEventListener('stripchange', (e) => {
          const bounds       = e.currentTarget.getBounds();
          const coordinates_ = [
            bounds.getTop(),
            bounds.getLeft(),
            bounds.getBottom(),
            bounds.getRight(),
          ];

          viewer.getEditManager().setEditableObjectCoordinates(coordinates_);
        });
      }

      const { styleName } = options;

      if (styleName) {

        if (rectangle) {
          const style = mapObjectFactory.createNormalizedShapeStyle(styleName, viewer);

          rectangle.setStyle(style);
        }
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
      const mapObjectFactory = viewer.getMapObjectFactory();

      const points = mapObjectFactory.toPoints(coordinates);
      let circle;
      let center   = NaN;
      let radius   = NaN;

      if (points.length === 3) {
        center = {
          lat: coordinates[0],
          lng: coordinates[1],
        };

        radius = coordinates[2];

        circle = new H.map.Circle(center, radius, { data: {} });
      }

      if (options.editable) {
        const auxObjects = mapObjectFactory.createAuxObjects(
          objectModel, viewer, mapObjectFactory.createRectangle);

        center = auxObjects[0].getPosition();
        radius = center.distance(auxObjects[1].getPosition());

        circle = new H.map.Circle(
          center, radius, {
            data: {
              auxObjects,
            },
          });

        circle.addEventListener('stripchange', (e) => {
          const circle_     = e.currentTarget;
          const center_     = circle_.getCenter();
          const radius_     = circle_.getRadius();
          const { lat, lng } = center_;
          const coordinates = [lat, lng, radius_];
          const editManager = viewer.getEditManager();

          editManager.setEditableObjectCoordinates(coordinates);
          editManager.setEditableObjectBufferDistance(radius_);
        });
      }

      const { styleName } = options;

      if (styleName) {

        if (circle) {
          const style = mapObjectFactory.createNormalizedShapeStyle(styleName, viewer);

          circle.setStyle(style);
        }
      }

      return circle;
    },

    /**
     *
     * @param objectModel
     * @param viewer
     */
    createAuxObjects(objectModel, viewer) {
      const { coordinates } = objectModel;
      const mapObjectFactory = viewer.getMapObjectFactory();
      const editManager      = viewer.getEditManager();

      const auxPoint1 = H.geo.Point.fromIPoint({
        lat: coordinates[0],
        lng: coordinates[1],
      });
      const bearing   = 135;
      const distance  = editManager.getEditableObjectBufferDistance() || 10000;
      const auxPoint2 = auxPoint1.walk(bearing, distance);

      if (objectModel.shapeType.match(/rectangle/i)) {
        coordinates.push(auxPoint2.lat, auxPoint2.lng);
      } else {
        coordinates.push(distance); // distance = circle's radius
      }

      const auxObjectProps = {
        viewer,
        objectModel: {
          shapeType  : 'point',
          coordinates: [],
          options    : {
            icon     : {
              model  : `${styler.getIconsBaseDir()}arrow_out.png`,
              options: {
                anchor: { x: 8, y: 8 },
              },
            },
            draggable: true,
            editable : false,
          },
        },
      };

      const auxObject1 = mapObjectFactory.create(
        _.merge({}, auxObjectProps, {
          objectModel: {
            coordinates: [auxPoint1.lat, auxPoint1.lng],
          },
        }), viewer);

      const auxObject2 = mapObjectFactory.create(
        _.merge({}, auxObjectProps, {
          objectModel: {
            coordinates: [auxPoint2.lat, auxPoint2.lng],
          },
        }), viewer);

      const auxObjects = [auxObject1, auxObject2];

      function dragEndListener() {
        const pos1           = auxObject1.getPosition();
        const pos2           = auxObject2.getPosition();
        const editableObject = editManager.getEditableObject();
        const nativeObject   = editableObject.getNativeObject();
        const coordinates_   = [pos1.lat, pos1.lng];

        if (nativeObject instanceof H.map.Circle) {
          coordinates_.push(pos1.distance(pos2));
        } else {
          coordinates_.push(pos2.lat, pos2.lng);
        }

        editManager.setEditableObjectCoordinates(coordinates_);
      }

      _.forEach(auxObjects, (auxObject) => {
        auxObject.setData('auxObject', true);
        auxObject.addEventListener('dragend', dragEndListener);
      });

      return auxObjects;
    },

    /**
     *
     * @param style
     * @returns {{}}
     */
    normalizeShapeStyle(style) {
      const normalizedStyle = { ...style };
      const { fillColor, fillOpacity,
              strokeColor, strokeOpacity, strokeWeight, } = style;

      normalizedStyle.lineWidth = strokeWeight;

      if (fillColor && fillOpacity) {
        normalizedStyle.fillColor = styler.hexToRgba(fillColor, fillOpacity);
      }

      if (strokeColor && strokeOpacity) {
        normalizedStyle.strokeColor = styler.hexToRgba(strokeColor, strokeOpacity);
      }

      const { arrows } = normalizedStyle;

      if (arrows) {
        const arrowsColor   = arrows.fillColor;
        const arrowsOpacity = arrows.fillOpacity;

        if (arrowsColor && arrowsOpacity) {
          arrows.fillColor = styler.hexToRgba(arrowsColor, arrowsOpacity);
        }
      }

      return normalizedStyle;
    },

    /**
     *
     * @param strip
     * @returns {*}
     */
    fromStrip(strip) {
      return _.filter(strip.getLatLngAltArray(), (el, i) => {
        const n = i + 1;

        // Leave the altitudes out!
        return (n % 3 !== 0);
      });
    },

    /**
     *
     * @param coordinates
     * @param paddingLength
     * @returns {*}
     */
    toPaddedCoordinates(coordinates, paddingLength) {
      const padding         = _.takeRight(coordinates, 2);
      let paddedCoordinates = coordinates.slice();

      while (paddedCoordinates.length < paddingLength) {
        paddedCoordinates = paddedCoordinates.concat(padding);
      }

      return paddedCoordinates;
    },
  });

const MapObject = stampit.compose(AbstractMapObject, HereMapsMapObject);

export { MapObject as default, MapObject };
