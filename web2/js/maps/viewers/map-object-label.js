/**
 * Created by Glenn on 2015-08-10.
 */

/**
 * Separate dedicated stamp for map object's label. Things may get more
 * complicated sooner or later; "Winter is coming."
 * @see https://jira.roamworks.com/browse/AI-232
 */
const MapObjectLabel = stampit()
  .props({

    /**
     *
     */
    mapObject: undefined,
  })
  .init(({ instance }) => {
    let object = instance.mapObject;

    /* region private properties */

    /*
     *
     */
    let label;

    /* endregion private properties */

    /* region privileged methods */

    _.assign(instance, {

      /**
       *
       * @returns {*}
       */
      getNativeObject() {
        return label;
      },

      /**
       *
       * @param mapObject
       * @returns {*}
       */
      setMapObject(mapObject) {
        object = instance.mapObject = mapObject;

        return instance;
      },

      /**
       *
       * @param text
       * @returns {*}
       */
      setText(text) {
        label.text(text);

        return instance;
      },

      /**
       *
       * @returns {*}
       */
      getPosition() {
        return label.data('position');
      },

      /**
       *
       * @param x
       * @param y
       * @returns {*}
       */
      setPosition(x, y) {
        label
          .css({
            left: x,
            top : y,
          })
          .data('position', {
            x,
            y,
          });

        return instance;
      },

      /**
       *
       * @param direction
       * @param magnitude
       * @returns {*}
       */
      shiftPosition(direction, magnitude) {
        const labelData = label.data();

        labelData.shiftDirection = direction;

        if (object) {
          const { viewer, getPosition } = object;
          const geo = _.isFunction(getPosition) ?
                      object.getPosition() : object.getCenterBounds();

          labelData.origin = viewer.geoToPixel(geo);
        }

        const { x, y } = labelData.origin;
        const x0               = x;
        const y0               = y;
        const m                = magnitude || 8;
        const directionActions = {
          E: () => instance.setPosition(x0 + m, y0),

          //SE: () => instance.setPosition(x0 + m, y0 + m),
          //S : () => instance.setPosition(x0, y0 + m),
          //SW: () => instance.setPosition(x0 - m, y0 + m),
          //W : () => instance.setPosition(x0 - m, y0),
          //NW: () => instance.setPosition(x0 - m, y0 - m),
          //N : () => instance.setPosition(x0, y0 - m),
          //NE: () => instance.setPosition(x0 + m, y0 - m),
        };

        const directionAction = directionActions[direction];

        if (!_.isFunction(directionAction)) {
          throw new Error(`Invalid direction: ${shapeType}.`);
        }

        directionAction();

        return instance;
      },

      /**
       *
       * @returns {*}
       */
      updatePosition() {
        instance.shiftPosition(label.data('shiftDirection'));

        return instance;
      },

      /**
       *
       * @returns {boolean}
       */
      isWithinMapBounds() {
        let withinMapBounds = false;

        if (object) {
          const { x, y }  = instance.getPosition();
          const { clientWidth, clientHeight } = object.viewer.container[0];

          withinMapBounds = (x > 0 &&
                             y > 0 &&
                             x < clientWidth &&
                             y < clientHeight);
        }

        return withinMapBounds;
      },

      /**
       *
       * @returns {boolean}
       */
      isVisible() {
        return label.data('visible');
      },

      /**
       *
       * @param visible
       * @returns {*}
       */
      setVisible(visible) {
        //label.detach();

        /**
         * Appending/removing DOM element (label element) has to
         * be very efficient here. Use native browser operations
         * in favour of jQuery.
         * @see http://youmightnotneedjquery.com/
         */
        const elem = label[0];
        let { parentNode } = elem;

        if (visible && object && object.isVisible(true)) {
          const { viewer } = object;

          parentNode = viewer.container[0];
          parentNode.appendChild(elem);

          /*
           * Cache the offset values of the label because when
           * the label is not visible (removed from the DOM
           * tree), the offset values can't be measured => 0.
           * Only compute and cache them at the first time.
           */
          if (viewer.isAutoLabelingActivated() && (!elem.dimensionCached)) {
            const { offsetWidth, offsetHeight } = elem;

            elem.dimensionCached = true;
            elem.cachedWidth     = offsetWidth;
            elem.cachedHeight    = offsetHeight;
          }
        } else {

          if (parentNode) {
            parentNode.removeChild(elem);
          }
        }

        label.data('visible', visible);

        return instance;
      },

      /**
       *
       */
      destroy() {
        label.remove();
      },
    });

    /* endregion privileged methods */

    /* region init code */

    label = $('<span>')

    /*
     * Use Bootstrap Labels.
     * There are also styles like "label-primary",
     * "label-success", "label-info", "label-warning" and
     * "label-danger".
     */
      .addClass('label label-default')
      .css({ position: 'absolute' })
      .text(object ? object.getData('description') : '')
      .data({
        origin        : {
          x: 0,
          y: 0,
        },
        position      : {
          x: 0,
          y: 0,
        },
        shiftDirection: 'E',
        visible       : false,
      });

    // Set default position to the "East" of the object.
    instance.shiftPosition(label.data('shiftDirection'));

    /* endregion init code */
  })
  .static({

    /**
     *
     * @param labels
     */
    runAutomaticLabelPlacement(labels) {
      const isColliding = (label, other) => {
        const l1 = label.getNativeObject()[0];
        const p1 = label.getPosition();
        const x1 = p1.x;
        const y1 = p1.y;
        const w1 = l1.cachedWidth;
        const h1 = l1.cachedHeight;

        const l2 = other.getNativeObject()[0];
        const p2 = other.getPosition();
        const x2 = p2.x;
        const y2 = p2.y;
        const w2 = l2.cachedWidth;
        const h2 = l2.cachedHeight;

        /**
         *
         * @see https://developer.mozilla.org/en-US/docs/Games/Techniques/2D_collision_detection
         * @see http://stackoverflow.com/questions/2440377/javascript-collision-detection
         */
        return ((x1 < x2 + w2) && (y1 < y2 + h2) &&
                (x2 < x1 + w1) && (y2 < y1 + h1));
      };

      let wrapped = _(labels)
        .chain()
        .orderBy(['mapObject.roamObject.id'], ['desc'])
        .forEach(label => label.setVisible(false))
        .filter(label => label.mapObject.isWithinViewBounds())
        .commit();

      /*
       * Give no threshold, and push to the limit (for now).
       * "To infinity and beyond!" –Buzz Lightyear
       */
      const threshold = Infinity;

      if (wrapped.size().value() > threshold) {
        wrapped = wrapped
          .sample(threshold)
          .commit();
      }

      wrapped
        .forEach((label) => {
          const canPosition = wrapped
            .every((other) => {
              let colliding = false;

              if ((other !== label) &&
                  label.isWithinMapBounds() &&
                  other.isVisible()) {

                colliding = isColliding(label, other);
              }

              return !colliding;
            })
            .value();

          if (canPosition) {
            label.setVisible(true);
          }
        })
        .value();
    },
  });

export { MapObjectLabel as default, MapObjectLabel };
