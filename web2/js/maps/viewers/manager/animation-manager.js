/**
 * Created by Glenn on 2015-07-02.
 */

import { LayerManager } from './layer-manager';

const { ROAM_ASSETS_ANIMATION, ROAM_ASSETS_HISTORY } = LayerManager.ROAM_LAYERS;

const AnimationManager = stampit()
  .init(({ instance }) => {

    /* region private properties */

    /*
     *
     */
    let viewer;

    /*
     *
     */
    let currentStep = 0;
    let maxStep     = 0;

    /*
     *
     */
    let animationInfo = '';

    /*
     *
     */
    let animationId = NaN;
    let lapse       = 500;
    let trailLength = 3;

    /*
     *
     */
    let wasAutoRefresh;

    /*
     *
     */
    let dataSourceLayer;
    let animationLayer;

    /*
     *
     */
    let animationObjects = [];
    let currentAnimationObject;
    let currentAnimationObjectLabel;
    let animationPathLineObject;

    /* endregion private properties */

    /* region private methods */

    /**
     *
     * @param visibility
     */
    function swapAnimationLayerVisibility(visibility) {
      const layerManager = viewer.getLayerManager();

      layerManager.setLayerVisibility(dataSourceLayer.name, !visibility);
      layerManager.setLayerVisibility(animationLayer.name, visibility);
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
       */
      loadAnimationObjects() {
        const layerManager = viewer.getLayerManager();

        animationLayer  = layerManager.getLayer(ROAM_ASSETS_ANIMATION);
        dataSourceLayer = layerManager.getLayer(ROAM_ASSETS_HISTORY);

        /*
         * Copy marker objects from data source layer (ROAM_ASSETS_HISTORY)
         * to animation layer (ROAM_ASSETS_ANIMATION).
         */
        layerManager.copyObjects(animationLayer.name, dataSourceLayer.name);

        instance.setAnimationObjects(animationLayer.getObjects());

        instance.stopAnimation();
      },

      /**
       *
       * @param objects
       */
      setAnimationObjects(objects) {

        if (_.isArray(objects)) {
          animationObjects = objects;
          instance.setMaxStep(objects.length);
        }
      },

      /**
       *
       * @param step
       */
      setCurrentStep(step) {
        currentStep = step;

        viewer.getControls().onAnimationCurrentStepChanged(step);
      },

      /**
       *
       * @returns {number}
       */
      getMaxStep() {
        return maxStep;
      },

      /**
       *
       * @param step
       */
      setMaxStep(step) {
        maxStep = step;

        viewer.getControls().onAnimationMaxStepChanged(step);
      },

      /**
       *
       */
      setAnimationInfo(info) {
        animationInfo = info;

        viewer.getControls().onAnimationInfoChanged(info);
      },

      /**
       *
       * @param speed
       */
      setAnimationSpeed(speed) {
        const min = 0.1;

        /*
         * No animation with lapse under 100 ms.
         */
        if (speed <= min) {
          speed = min;
        }

        lapse = speed * 1000;

        if (instance.isAnimating()) {
          instance.pauseAnimation();
          instance.startAnimation();
        }

        viewer.getControls().onAnimationSpeedChanged(speed);
      },

      /**
       *
       * @param length
       */
      setTrailLength(length) {

        if (length >= 0) {
          trailLength = length;

          viewer.getControls().onAnimationTrailLengthChanged(length);
        }
      },

      /**
       *
       */
      doStep() {
        currentAnimationObject = animationObjects[currentStep - 1];

        /*
         * Black magic for interpolating visibility based on the
         * trail length.
         */
        const maxStep = instance.getMaxStep();

        for (let i = 0; i <= trailLength; i++) {
          const c = i + 1;
          const a = currentStep - c;

          if (a >= 0 && a < maxStep) {
            const animationObject = animationObjects[a];
            const opacity         = (trailLength - i) / trailLength;

            animationObject.setVisible(opacity > 0);
            /*
             * P.S. In HERE Maps, there is this hidden call
             * to `.setVisibility(opacity > 0)` inside the
             * asynchronous callback method `img.onload`.
             * This is yet another black magic since setting
             * opacity of map object in HERE Maps API is not
             * really straight-forward as in Google Maps.
             */
            animationObject.setOpacity(opacity);
          }
        }

        const currentObjectPosition = currentAnimationObject.getPosition();

        //instance.drawAnimationPathLineObject(currentObjectPosition);

        if (viewer.isAutoFocus()) {

          /*
           * TODO: Implement a proper auto-focus behavior.
           */
          viewer.setCenter(currentObjectPosition);
        }

        currentAnimationObjectLabel
          .setMapObject(currentAnimationObject)
          .setText(instance.getCurrentAnimationObjectInfo())
          .updatePosition()
          .setVisible(true);
      },

      /**
       *
       * @param step
       */
      stepTo(step) {

        if (step > 0 && step <= maxStep) {
          instance.setCurrentStep(step);

          if (!instance.isAnimating()) {
            instance.beforeAnimation();
          }

          instance.doStep();
          instance.setAnimationInfo(instance.getCurrentAnimationObjectInfo());
        } else {
          instance.stopAnimation();
        }
      },

      /**
       *
       */
      step() {
        instance.stepTo(currentStep + 1);
      },

      /**
       *
       * @returns {*}
       */
      isAnimating() {
        return _.isFinite(animationId);
      },

      /**
       *
       */
      pauseAnimation() {
        clearInterval(animationId);
        animationId = NaN;
        viewer.getControls().onAnimationStateChanged(
          AnimationManager.ANIMATION_STATES.PAUSE);
      },

      /**
       *
       */
      stopAnimation() {

        if (_.isBoolean(wasAutoRefresh)) {
          viewer.setAutoRefresh(wasAutoRefresh);
          wasAutoRefresh = undefined;
        }

        if (instance.isAnimating()) {
          clearInterval(animationId);
          animationId = NaN;
        }

        instance.afterAnimation();
        viewer.getControls().onAnimationStateChanged(
          AnimationManager.ANIMATION_STATES.STOP);
      },

      /**
       *
       */
      startAnimation() {

        if (_.isUndefined(wasAutoRefresh)) {

          /*
           * Prevent polling when animating.
           */
          wasAutoRefresh = viewer.isAutoRefresh();
          viewer.setAutoRefresh(false);
        }

        if (!instance.isAnimating()) {
          instance.beforeAnimation();

          animationId = setInterval(() => {
            instance.step();
          }, lapse);
        }

        viewer.getControls().onAnimationStateChanged(
          AnimationManager.ANIMATION_STATES.START);
      },

      /**
       *
       */
      beforeAnimation() {
        viewer.getLayerManager().setAllObjectsVisibility(animationLayer.name, false);
        swapAnimationLayerVisibility(true);

        if (!currentAnimationObjectLabel) {
          currentAnimationObjectLabel = viewer.getMapObjectLabelFactory().create();
        }

        currentAnimationObjectLabel.setVisible(false);
      },

      /**
       *
       */
      afterAnimation() {
        instance.setCurrentStep(0);
        swapAnimationLayerVisibility(false);

        if (currentAnimationObjectLabel) {
          currentAnimationObjectLabel.setVisible(false);
        }

        instance.setAnimationInfo((instance.getMaxStep() > 0) ? 'Ready.' : 'Inactive.');

        //instance.removeAnimationPathLineObject();
      },

      /**
       *
       */
      getCurrentAnimationObjectInfo() {
        let info = '';

        if (currentAnimationObject) {
          info = currentAnimationObject.getData('description');
        }

        return info;
      },

      /**
       *
       * @param position
       */
      drawAnimationPathLineObject(position) {
        let coordinates = [];

        if (!animationPathLineObject) {
          const position0 = animationObjects[0].getPosition();

          coordinates = [
            position0.longitude, position0.latitude,
            position.longitude, position.latitude,
          ];

          animationPathLineObject =
            viewer
              .getMapObjectFactory()
              .create({
                objectModel: {
                  coordinates,
                  shapeType: 'line',
                  options  : {
                    styleName: 'animationPath',
                  },
                },
              });

          viewer.addObject(animationPathLineObject);

        } else {

          /*
           * Update the path line.
           */
          coordinates = animationPathLineObject.objectModel.coordinates;
          coordinates.push(position.latitude, position.longitude);
          animationPathLineObject.setCoordinates(coordinates);
        }
      },

      /**
       *
       */
      removeAnimationPathLineObject() {

        if (animationPathLineObject) {
          viewer.removeObject(animationPathLineObject);
          animationPathLineObject = undefined;
        }
      },
    });

    /* endregion privileged methods */
  })
  .static({

    /**
     *
     * @constant
     */
    ANIMATION_STATES: {
      PAUSE: 0,
      STOP : 1,
      START: 2,
    },
  });

export { AnimationManager as default, AnimationManager };
