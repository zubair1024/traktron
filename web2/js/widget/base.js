/**
 * holds configuration of widget,
 * updates, loads data
 * @type {void|*|extend}
 */
App.widget.Base = kendo.Class.extend({

    /**
     * Widget configuration
     */
    config    : {},
    /**
     * contains widget specific configuration
     */
    widgetData: {},
    /**
     * Contains the jQuery element of the widget.
     * @type {*|jQuery}
     */
    el        : null,

    /**
     * when set to true, don't reload every time.
     */
    isPersistent: false,

    /**
     * contains widget configs
     */
    items: [],

    /**
     * contains the object that is returned by a load() or refresh() call
     * @type {jqXHR|null}
     */
    jqXHR: null,

    /**
     * Timestamp of last refresh.
     * Will be set on first successful load and any call of refresh().
     * Update with Date.now();
     * @type {number|null}
     */
    lastRefresh: null,

    /**
     * true if there is currently a request running, otherwise false.
     * @type {boolean}
     */
    isRefreshing: false,

    init: function (config) {
        'use strict';

        this.config = $.extend({
            /**
             * insert default config stuff
             */
            widgetData: []
        }, config);
    },

    load: function () {
    },

    // This function is only available if widget supports export.
    //exportData: function () {
    //    "use strict";
    //},

    refresh: function () {
        // eg. reload data for grid: this.grid.dataSource.read(); return this.jqXHR;
        // or: return this.load();
    },

    /**
     * This method should destroy this.el and cancel all current requests.
     */
    destroy: function () {
    },

    onDrop: function () {
    },

    /**
     * Set widget specific configuration here in this.widgetData. Decode if necessary.
     */
    setWidgetData: function () {

        // Look at the !== 'null' ... yes, there is sometimes a string in it.
        if (this.config && this.config.widgetData && this.config.widgetData !== 'null') {
            if (typeof this.config.widgetData === 'object') {
                this.widgetData = this.config.widgetData;
            } else {
                this.widgetData = $.parseJSON(this.config.widgetData);
            }
        }
    },

    /**
     * Returns the mapProject configuration by id.
     * @param projectId
     * @returns {{id: string|null, name: string, mapViewer: string, mapUrl: string, datumName: string}}
     */
    getMapProject: function (projectId) {
        var result = {
            id       : null,
            name     : '',
            mapViewer: '',
            mapUrl   : '',
            datumName: ''
        };

        if (projectId && App.config.map.projects[projectId]) {
            result = App.config.map.projects[projectId];
        } else if (App.config.map.projects[App.config.map.defaultId]) {
            result = App.config.map.projects[App.config.map.defaultId];
        }

        return result;
    }
});
