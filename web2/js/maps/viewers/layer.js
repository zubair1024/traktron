/**
 * Created by Glenn on 2015-06-28.
 */

/**
 *
 * @abstract
 */
const Layer = stampit()
  .props({

    /**
     *
     */
    viewer         : undefined,
    /**
     *
     */
    name           : '', // -> layerName
    layerProperties: undefined,
  })
  .methods({

    /**
     *
     */
    getNativeObject() {
      throw new Error('.getNativeObject() method not implemented.');
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
     */
    isVisible() {
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
    getObjects() {
      throw new Error('.getObjects() method not implemented.');
    },

    /**
     *
     * @param mapObjects
     */
    add(mapObjects) {
      throw new Error('.add() method not implemented.');
    },

    /**
     *
     * @param mapObjects
     */
    remove(mapObjects) {
      throw new Error('.remove() method not implemented.');
    },

    /**
     *
     */
    clear() {
      throw new Error('.clear() method not implemented.');
    },

    /**
     *
     */
    getBounds() {
      throw new Error('.getBounds() method not implemented.');
    },

    /**
     *
     * @returns {*}
     */
    getLabels() {
      return _(this.getObjects())
        .map((mapObject) => {
          let label;

          if (mapObject.isVisible(true)) {
            label = mapObject.getLabel();
          }

          return label;
        })
        .compact()
        .value();
    },

    /**
     *
     * @returns {*}
     */
    isLabelsVisible() {
      return this.getData('labelsVisible');
    },

    /**
     *
     * @param visible
     */
    setLabelsVisible(visible) {
      this.setData('labelsVisible', visible);

      _.forEach(this.getLabels(), label => label.setVisible(visible));
    },

    /**
     *
     */
    updateLabelsPosition() {

      _.forEach(this.getLabels(), label => label.updatePosition());
    },

    /**
     *
     * @returns {boolean}
     */
    isClusteringSupported() {
      return false;
    },

    /**
     *
     * @returns {boolean}
     */
    isClusteringEnabled() {
      return Boolean(this.getData('clusteringEnabled'));
    },

    /**
     *
     * @param enabled
     */
    setClusteringEnabled(enabled) {

      if (this.isClusteringSupported()) {
        const clusteringStatusChanged = (this.isClusteringEnabled() !== enabled);

        /*
         * Since .modifyClusterCalculations() usually is an
         * expensive call (it needs to set up the clustering
         * engine again from the scratch), do this call only if
         * the clustering status is *really* changed
         * (enabled -> disabled / disabled -> enabled).
         */

        if (clusteringStatusChanged) {
          this.setData('clusteringEnabled', enabled);
          this.performClustering();

          /*
           * Force running automatic labels placement
           * algorithm by triggering `mapviewchangeend` event.
           */
          this.viewer.refresh();
        }
      }
    },

    /**
     *
     * @returns {*}
     */
    resolveClustering() {
      return $.Deferred().resolve().promise();
    },
  });

export { Layer as default, Layer };
