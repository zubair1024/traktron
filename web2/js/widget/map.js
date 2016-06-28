/**
 * Created by Michael on 23.09.13.
 */
App.widget.Map = App.widget.Base.extend({
    elCanvas  : null,
    elControls: null,
    splitter  : null,

    init: function (config) {
        'use strict';

        var me = this;

        me.config = $.extend({}, config);
        me.setWidgetData();
        var mapProject = me.getMapProject(me.widgetData.viewType);

        /*
         * Hackers gonnna hack. =()
         */
        var mapViewer = mapProject.mapViewer;
        if (mapViewer.match(/googlemap/i)) {
            mapViewer = 'googlemaps';
        }

        var options = {
            mapViewer                  : mapViewer,
            viewerName                 : mapProject.name,
            domainObjectId             : me.config.domainObjectId,
            domainObjectType           : me.config.objectType,
            eventIds                   : me.config.ids || null,
            createRouteFromIds         : me.config.createRouteFromIds || false,
            autoRefresh                : false,
            autoFocus                  : true,
            rememberLastViewportEnabled: false,
            lazyLoadingEnabled         : true
        };

        /*
         * REVIEW: In some rare cases, `mapViewer` is an empty string. The reason
         * why this is so, remains a mystery =() -- more investigations needed.
         * This causes an error to be thrown in the Kendo Splitter. Simply put
         * an "if-guard" for now.
         */
        if (options.mapViewer) {

            // mapCanvas is needed by the MapInitializer
            me.elCanvas = $('<div>', {
                'class': 'map-canvas'
            });

            // mapControls is also needed by the MapInitializer
            me.elControls = $('<div>', {
                'class': 'map-controls'
            });

            // Add canvas and control divs to mapViewer div - but empty it beforehand.
            me.config.el
              .empty()
              .addClass('map-display')
              .append(me.elCanvas)
              .append(me.elControls);

            options.mapDisplay = me.config.el;

            // Add splitter. It works out of the box, since the divs are visible.
            //noinspection JSUnresolvedFunction
            me.splitter = me.config.el.kendoSplitter({
                orientation: 'horizontal',
                panes      : [
                    {
                        collapsible: false
                    },
                    {
                        collapsible: true,
                        size       : 250,
                        collapsed  : me.config.displayMini
                    }
                ],
                resize     : function () {

                    if (me.controller) {
                        me.controller.onResize();
                    }
                }
            }).data('kendoSplitter');

            var MapInitializer = require('maps-initializer'),
                mapDebugger    = require('maps-debugger');

            var mapInitializer = MapInitializer.create({options: options});

            try {
                var mapDisplay     = options.mapDisplay,
                    mapControls    = mapDisplay.children('.map-controls'),
                    toggleSplitter = function (pane, expand) {

                        if (pane.data('pane')) {
                            me.splitter.toggle(pane, expand);
                        }
                    };

                toggleSplitter(mapControls, false);

                kendo.ui.progress(mapDisplay, true);
                mapDebugger.time('Map initialization time');
                mapInitializer.startInitialization(function (controller) {
                    console.info('Map has been initialized.');
                    mapDebugger.timeEnd('Map initialization time');
                    kendo.ui.progress(mapDisplay, false);

                    me.controller = controller;

                    mapControls.children('.mc-panelbar')
                               .kendoPanelBar({
                                   expandMode: 'multiple'
                               });

                    toggleSplitter(mapControls, !me.config.displayMini);

                    if (!controller.viewer.currentObject) {
                        controller.onLayerZoomingRequested();
                    }
                });

            } catch (e) {
                console.error(e.stack);
            }
        }

    },

    load: function () {
        // var me = this;
    },

    onDrop: function () {
        'use strict';

        switch (this.config.location) {
            case App.config.locationSideBar:
                this.splitter.collapse('.map-controls');
                break;
            default:
                this.splitter.expand('.map-controls');
        }

        // If we have some eventIds, then this widget has a fixed location. Remember that here.
        if (this.config.ids) {
            App.config.locationAlarmMap = this.config.location;
        }
    },

    resize: function () {
        'use strict';

        // FIXME is it still needed?
        kendo.resize(this.config.el);
    },

    destroy: function () {
        'use strict';

        $(window).off('resize', this.resize);
        if (this.controller) {
            this.controller.onDestroy();
        }
    }
});
