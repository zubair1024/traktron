/**
 * Shows a small overview map with markers in it.
 */
App.widget.OverviewMap = App.widget.Base.extend({

    init: function (config) {
        'use strict';

        var me = this;

        me.config               = $.extend({}, config);
        me.el                   = me.config.el;
        me.setWidgetData();
        var mapProject          = me.getMapProject(me.widgetData.viewType),
            mapViewerModuleName = mapProject.mapViewer.toLowerCase() || 'heremaps';

        /*
         * ;|
         */
        if (mapViewerModuleName.match(/googlemap/i)) {
            mapViewerModuleName = 'googlemaps';
        }

        var container = $('<div>')
            .css({
                position: 'relative',
                left    : 0,
                right   : 0
            });

        var zoomLevel      = me.config.zoomLevel || 10,
            imageDimension = [me.el.width(), me.el.height()],
            url            = '';

        // OR: this.showStaticAssetGroupMap(container);
        switch (me.config.objectType) {
            case 'location':
                url = 'caesarLocation/locations';
                break;
            case 'geofence':
                url = 'caesarGeofence/geofences';
                break;
            default:
                url = 'geoposition/current';
        }

        $.ajax({
            url    : App.config.serviceUrl + url,
            data   : {
                domainObjectType: me.config.objectType,
                domainObjectId  : me.config.domainObjectId
            },
            error  : function () {
                App.log.error(App.translate('Could not load static map for {0}, {1}', me.config.objectType, me.config.domainObjectId), me.config, true);
            },
            success: function (response) {
                var data = response.data[0];

                var staticMap = require(mapViewerModuleName + '-static').getInstance();

                if (me.config.objectType === 'geofence') {
                    staticMap.showStaticGeofenceMap(
                        container,
                        data.coordinates,
                        imageDimension,
                        data
                    );
                } else {
                    staticMap.showStaticMap(
                        container,
                        [data.longitude, data.latitude],
                        imageDimension,
                        zoomLevel,
                        data
                    );
                }
            }
        });

        me.el.append(container);
    },

    /**
     * HelperFunction for loading other things in the overviewmap.
     * Have to align this with the above... since maybe it is interesting to show always some assets around a location or geofence?
     * @param parentElement
     */
    showStaticAssetGroupMap: function (parentElement) {
        var me                  = this,
            url                 = '',
            mapProject          = me.getMapProject(me.widgetData.viewType),
            mapViewerModuleName = mapProject.mapViewer.toLowerCase() || 'heremaps',
            imageDimension      = [me.el.width(), me.el.height()];

        /*
         * ;|
         */
        if (mapViewerModuleName.match(/googlemap/i)) {
            mapViewerModuleName = 'googlemaps';
        }

        if (me.config.objectType === 'geofence' || me.config.objectType === 'location') {

            switch (me.config.objectType) {
                case 'location':
                    url = 'caesarLocation/containedAssets';
                    break;
                case 'geofence':
                    url = 'caesarGeofence/containedAssets';
                    break;
            }

            $.ajax({
                url    : App.config.serviceUrl + url,
                data   : {
                    domainObjectType: me.config.objectType,
                    domainObjectId  : me.config.domainObjectId
                },
                error  : function () {
                    App.log.error(App.translate('Could not load static map for {0}, {1}', me.config.objectType, me.config.domainObjectId), me.config, true);
                },
                success: function (response) {
                    var assets      = response.data,
                        location    = response.location,
                        geofence    = response.geofence,
                        coordinates = null,
                        bbox        = null,
                        scaledBbox  = null;

                    if (geofence) {
                        var scale = 1.05;

                        /*
                         * TODO: Rewrite. What does the below code do? =s
                         */
                        coordinates = geofence.coordinates;
                        bbox        = App.maps.GeoUtils.minMax(coordinates);
                        scaledBbox  = App.maps.GeoUtils.scale(scale, bbox);
                    }

                    var staticMap = require(mapViewerModuleName + '-static').getInstance();

                    if (geofence && assets && assets.length > 0) {
                        staticMap.showStaticRegionMap(
                            parentElement,
                            geofence,
                            assets,
                            imageDimension,
                            scaledBbox
                        );

                    } else if (geofence) {
                        staticMap.showStaticGeofenceMap(
                            parentElement,
                            coordinates,
                            imageDimension,
                            geofence
                        );

                    } else if (location) {
                        staticMap.showStaticRegionMap(
                            parentElement,
                            scaledBbox,
                            imageDimension,
                            {
                                zoom  : 12,
                                center: [location.longitude, location.latitude]
                            }
                        );
                    }

                    if (location) {
                        staticMap.renderIcon(
                            parentElement,
                            location,
                            imageDimension,
                            {
                                objectType: 'location'
                            }
                        );
                    }
                }
            });

        } else {
            console.error('Could not display contained assets. DomainObjectType must be location or geofence.');
        }
    },
    load                   : function () {
        // console.log('OverviewMap loaded');
    },
    refresh                : function () {
        // console.log('Refresh handler for OverviewMap called.');
    }
    //resize                 : function () {
    //    // console.log('Resize handler for OverviewMap called.');
    //},
    //destroy                : function () {
    //    'use strict';
    //
    //    $(window).off('resize', this.resize);
    //}
});
