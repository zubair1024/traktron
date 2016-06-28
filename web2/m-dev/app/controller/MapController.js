Ext.define('Rms.controller.MapController', {
    extend                : 'Ext.app.Controller',
    requires              : [
        'Rms.view.map.MapView',
        'Rms.view.common.AssetListPanel',
        'Rms.view.map.MapControl',
        'Rms.store.VisibleLocationsStore',
        'Rms.controller.AssetController'
    ],
    directMapTapped       : false,
    config                : {
        refs   : {
            mapView                      : 'mapview',
            mapControlBtn                : 'mapview asset_map_panel toolbar button[text=Controls]',
            nearbyAssetsBtn              : 'mapview asset_map_panel toolbar button[text=< 1 KM]',
            nearbyAssetsListBackBtn      : 'mapview nearby_assets_list toolbar #back',
            nearbyAssetsList             : 'mapview nearby_assets_list list',
            mapControlBackBtn            : 'map_control #back',
            mapMarker                    : 'asset_map_panel map',
            mapControlMiddleShowButton   : 'map_control button[id=middleShow]',
            mapControlFirstShowButton    : 'map_control button[id=firstShow]',
            mapControlSecondShowButton   : 'map_control button[id=secondShow]',
            mapControlSegmentedButton    : 'map_control segmentedbutton[id=position]',
            mapControlDatePickerFieldFrom: 'map_control datepickerfield[name=fromDate]',
            mapControlDatePickerFieldTo  : 'map_control datepickerfield[name=toDate]',
            mapControlGeofenceField      : 'map_control textfield[id=geofenceselect]',
            mapControlGeofenceFieldButton: 'map_control segmentedbutton[id=geofenceselect]',
            mapControlGeofenceListBckBtn : 'geofence_list_map toolbar button[text=Back]',
            mapControlLocationFieldButton: 'map_control segmentedbutton[id=locationselect]',
            mapControlLocationField      : 'map_control textfield[id=locationselect]',
            mapControlLocationListBckBtn : 'locations_list toolbar button[text=Back]',
            mapControlocationList        : 'mapview locations_list list',
            mapControlGeofenceList       : 'mapview geofence_list_map list',
            nearestAsset                 : 'assetview asset_nearest_list',
            nearestAssetDtlBckBtn        : 'assetview asset_details toolbar #near',
            nearestAssetDtlAssetBckBtn   : 'assetview asset_details toolbar #assetNear',
            NearestAssetDistanceBtn      : 'assetview asset_nearest_list toolbar segmentedbutton',
            // for showing single asset on map
            assetView                    : 'assetview',
            alarmView                    : 'alarmview',
            assetDetails                 : 'asset_details',
            assetDetailsToolbar          : 'assetview asset_details toolbar',
            assetDtlBackBtn              : 'assetview asset_details toolbar #back',
            assetDtlBackBtnFromMap       : 'assetview asset_details toolbar #map',
            // Button  "View on Map"
            actionSheetMapBtn            : 'actionsheet #map',
            actionSheetMapBackBtn        : 'mapview asset_map_panel toolbar #back',
            groupMapBackBtn              : 'mapview asset_map_panel toolbar #backToGroup',
            launchApp                    : 'launchapp'
        },
        control: {
            mapControlBtn                : {
                tap: 'mapControlBtnTapped'
            },
            mapControlGeofenceListBckBtn : {
                tap: function () {
                    this.getMapView().setActiveItem(1);
                    this.getMapControlGeofenceFieldButton().setPressedButtons([]);
                }
            },
            mapControlLocationListBckBtn : {
                tap: function () {
                    this.getMapView().setActiveItem(1);
                    this.getMapControlLocationFieldButton().setPressedButtons([]);
                }
            },
            nearbyAssetsBtn              : {
                tap: function () {
                    this.getMapView().getAt(4).updateData();
                    this.getMapView().setActiveItem(4);
                }
            },
            nearbyAssetsListBackBtn      : {
                tap: function () {
                    this.getMapView().setActiveItem(0);
                }
            },
            mapControlBackBtn            : {
                tap: function () {
                    this.getMapView().setActiveItem(0);
                }
            },
            groupMapBackBtn              : {
                tap: function () {
                    this.getLaunchApp().setActiveItem(1);
                    this.getGroupMapBackBtn().setHidden(true);
                }
            },
            nearbyAssetsList             : {
                itemtap: 'showNearbyAssetDetails'
            },
            mapMarker                    : {
                maprender: 'getGmapInstance'
            },
            mapControlMiddleShowButton   : {
                tap: 'showAssetOnMap'
            },
            mapControlSegmentedButton    : {
                toggle: 'segmentedButtonToggle'
            },
            mapControlFirstShowButton    : {
                tap: 'showGeofencesOnMap'
            },
            mapControlSecondShowButton   : {
                tap: 'showLocationsOnMap'
            },
            actionSheetMapBtn            : {
                tap: 'showSingleAssetOnMap'
            },
            mapControlLocationFieldButton: {
                toggle: 'showLocationsList'
            },
            mapControlGeofenceFieldButton: {
                toggle: 'showGeofenceList'
            },
            mapControlocationList        : {
                itemtap: 'setLocationFieldValue'
            },
            mapControlGeofenceList       : {
                itemtap: 'setGeofenceFieldValue'
            },
            actionSheetMapBackBtn        : {
                tap: 'actionSheetMapBackBtnTapped'
            },

            assetDtlBackBtnFromMap: {
                tap: function () {
                    this.getAssetDtlBackBtn().setHidden(false);
                    this.getAssetDtlBackBtnFromMap().setHidden(true);
                    this.getLaunchApp().setActiveItem(0);
                    this.getAssetView().setActiveItem(0);

                }
            },
            mapView               : {
                /**
                 * Called when Map tab is activated
                 * @param thisComp
                 * @param newActive
                 * @param oldActive
                 * @param eOpts
                 */
                activate: function (thisComp, newActive, oldActive, eOpts) {
                    console.log('mapController.mapViewActivated');
                    console.log('this.directMapTapped=', this.directMapTapped);
                    //Start setting the configuration for the view-start
                        if (!App.controls.map.mapControlOption) {
                            this.getMapControlBtn().setHidden(true);
                        }
                    //End setting the configuration for the view
                    var detailsBtn = Ext.getCmp('detailsBtn');
                    //detailsBtn.setDisabled(true);
                    if (this.directMapTapped) {
                        this.removeAssetMarkersFromMap();
                        this.showAllAssetsOnMap();
                        this.getGroupMapBackBtn().setHidden(true);
                        this.getNearbyAssetsBtn().setHidden(false);
                        this.getMapView().getAt(0).getAt(0).getAt(0).setHidden(true);
                        this.getMapView().getAt(0).getAt(0).setTitle("All Assets");
                        var assetPositionsStore = Ext.getStore('assetPositionsStore');
                        assetPositionsStore.clearFilter();


                    }
                }
            },
            assetView             : {
                /**
                 * Called when assets tab is activated
                 * @param thisComp
                 * @param newActive
                 * @param oldActive
                 * @param eOpts
                 */
                activate: function (thisComp, newActive, oldActive, eOpts) {
                    var me               = this;
                    var assetStore       = Ext.getStore('assetStore');
                    console.log('mapController.assetViewActivated');
                    clearInterval(this.refreshIntervalId);
                    //thisComp.getAt(0).getAt(1).deselectAll();
                    this.directMapTapped = true;
                    this.getNearestAssetDistanceBtn().setPressedButtons([0]);
                    if (this.getNearbyAssetsBtn()) {
                        this.getNearbyAssetsBtn().setHidden(false);
                        var sto = Ext.getStore('assetPositionsStore');
                        sto.clearFilter();
                        this.getMapView().setActiveItem(0);
                        this.getGroupMapBackBtn().setHidden(true);
                        var idx = this.getAssetView().items.indexOf(this.getAssetView().getActiveItem());
                        if (idx == 9) {
                            //this.getNearestAsset().updateData();
                            this.getAssetView().setActiveItem(0);
                        }
                    }
                    assetStore.on('load', function () {
                        //Set the total count of Assets
                        Ext.getCmp('ext-assetview-1').getAt(0).getAt(1).getAt(3).applyTitle('<div style="font-size: 0.7em">'+assetStore.getCount()+' Assets</div>');
                    });
                }
            },
            alarmView             : {
                /**
                 * Called when alarms tab is activated
                 * @param thisComp
                 * @param newActive
                 * @param oldActive
                 * @param eOpts
                 */
                activate: function (thisComp, newActive, oldActive, eOpts) {
                    this.directMapTapped = true;
                }
            }
        }
    },
    /**
     * Called when < 1 KM button is tapped
     * @param list
     * @param index
     * @param target
     * @param record
     * @param e
     * @param eOpts
     */
    showNearbyAssetDetails: function (list, index, target, record, e, opts) {
        var mee               = this;
        var assetStore        = Ext.getStore("assetStore");
        assetStore.each(function (i) {
            if (i.get('name') == record.get('assetName')) {
                domainObjectType = i.get('domainObjectType');
                domainObjectId   = i.get('domainObjectId');
            }
        });
        this.domainObjectName = record.get('assetName');
        // This has been implemented to only display "short" names in the toolbar title.
        var domainDataView = 'details';

        // Fetch details for this DomainObject.
        Ext.Ajax.request({
            url    : App.config.serviceUrl + 'caesarObject/objectDataProvider3',
            method : App.config.ajaxType,
            params : {
                domainObjectId  : domainObjectId,
                domainObjectType: domainObjectType,
                domainDataView  : domainDataView
            },
            success: function (response) {
                var data = Ext.decode(response.responseText);
                mee.getAssetView().getAt(1).updateData(data, domainObjectType, domainObjectId, mee.domainObjectName);
                mee.getAssetView().setActiveItem(1);
                mee.getAssetDetailsToolbar().setTitle(Ext.util.Format.ellipsis(mee.domainObjectName, 10));
                mee.getAssetDtlBackBtn().setHidden(true);
                mee.getAssetDtlBackBtnFromMap().setHidden(false);
                mee.getLaunchApp().setActiveItem(1);
            }
        });
    },
    /**
     * Shows map control screen
     * @param btn
     */
    mapControlBtnTapped   : function (btn) {
        if (this.allAssets) {
            this.getMapControlSegmentedButton().setDisabled(true);
            this.getMapControlMiddleShowButton().setDisabled(true);
        } else {
            this.getMapControlSegmentedButton().setDisabled(false);
            this.getMapControlMiddleShowButton().setDisabled(false);
        }
        // if (this.getMapControlLocationFieldButton().getComponent(0).isPressed()){
        //this.getMapControlLocationFieldButton().setPressedButtons([]);
        //}
        this.getMapView().setActiveItem(1);
        this.getMapControlLocationFieldButton().getComponent(0)
            .setText("Locations");
        this.getMapControlGeofenceFieldButton().getComponent(0)
            .setText("Geofences");
        this.getMapControlSecondShowButton().disable();
        this.getMapControlFirstShowButton().disable();
        if (this.infowindow) {
            this.infowindow.close();
        }
    },

    /**
     * Called to show locations; Sets store for locations list on map control
     * @param thiscomp
     * @param button
     * @param ispressed
     */
    showLocationsList: function (thiscomp, button, ispressed) {
        //For resetting things
        var map            = this.gmap;
        var bounds         = this.persistantBounds;
        var totalLocations = this.totalAssetsLocations;
        Ext.Viewport.setMasked({
            xtype  : 'loadmask',
            message: 'Loading...'
        });
        if (ispressed) {
            var visibleLocationsStore = Ext.getStore('visibleLocationsStore');
            visibleLocationsStore.on('load', function (store) {
                var symbolStore = Ext.create('Ext.data.ArrayStore', {
                    fields: ['name']
                });
                symbolStore.add({
                    'name': '* All'
                });
                for (var index = 0; index < store.getCount(); index++) {
                    var name = store.getAt(index).get('name');
                    if (symbolStore.find('name', name) == -1) {
                        symbolStore.add({
                            'name': name
                        });
                    }
                }
                symbolStore.setGrouper({
                    groupFn: function (record) {
                        return record.get('name')[0].toUpperCase();
                    }
                });
                this.getMapView().getAt(2).setLocationsStore(symbolStore);
                this.getMapView().setActiveItem(2);
                Ext.Viewport.setMasked(false);
            }, this);
            visibleLocationsStore.load({
                params: {
                    view: 'name,oid,longitude,latitude,symbol'
                }
            });
        } else {
            this.removeLocationMarkersFromMap();
            this.getMapControlSecondShowButton().disable();
            Ext.Msg.confirm(
                "View Map",
                "Go to Map ?",
                function (btn) {
                    if (btn === 'yes') {
                        this.getMapView().setActiveItem(0);
                        if (totalLocations > 1) {
                            map.fitBounds(bounds);
                        }
                        else if (totalLocations == 1) {
                            map.setCenter(bounds.getCenter());
                            map.setZoom(14);
                        }
                    }
                },
                this
            );
        }
    },

    /**
     * sets the text of location field on map control screen
     * @param list
     * @param index
     * @param target
     * @param record
     * @param e
     * @param opts
     */
    setLocationFieldValue: function (list, index, target, record, e, opts) {
        this.getMapControlLocationFieldButton().getComponent(0).setText(record
            .get('name'));
        this.getMapView().setActiveItem(1);
        this.getMapControlSecondShowButton().enable();
    },

    /**
     * Sets geofence store on map control screen
     * @param thiscomp
     * @param button
     * @param ispressed
     */
    showGeofenceList: function (thiscomp, button, ispressed) {
        if (ispressed) {
            Ext.Viewport.setMasked({
                xtype  : 'loadmask',
                message: 'Loading...'
            });
            var flag = true;
            this.geofenceStore.on('load', function (store) {
                if (flag) {
                    store.add({
                        'name': '* All'
                    });
                    flag = false;
                }
                this.getMapView().getAt(3).setGeofenceStore(store);
                this.getMapView().setActiveItem(3);
                store.setGrouper({
                    groupFn: function (record) {
                        return record.get('name')[0].toUpperCase();
                    }
                });
                Ext.Viewport.setMasked(false);
            }, this);
            this.geofenceStore.load({
                params: {
                    view: 'name,configName,isActive,shapeType,fenceDescription'
                }
            });
        } else {
            this.removeAllGeofences();
            Ext.Msg.confirm(
                "View Map",
                "Go to Map ?",
                function (btn) {
                    if (btn === 'yes') {
                        this.getMapView().setActiveItem(0);
                    }
                },
                this
            );
        }
    },

    /**
     * sets the text of Geofence field on map control screen
     * @param list
     * @param index
     * @param target
     * @param record
     * @param e
     * @param opts
     */
    setGeofenceFieldValue: function (list, index, target, record, e, opts) {
        this.getMapControlGeofenceFieldButton().getComponent(0).setText(record
            .get('name'));
        this.getMapView().setActiveItem(1);
        this.getMapControlFirstShowButton().enable();
    },

    /**
     * removes location markers added on map
     */
    removeLocationMarkersFromMap: function () {
        var locationsLength = this.locationMarkersArray.length;
        for (var index = 0; index < locationsLength; index++) {
            this.locationMarkersArray[index].setMap(null);
        }
    },

    /**
     * Draws Locations on map
     * @param visibleLocationsStore
     */
    addLocationsOnMap: function (visibleLocationsStore) {
        var totalLocations = visibleLocationsStore.getCount();
        var bounds         = new google.maps.LatLngBounds();
        var symbolName     = '';
        var assets         = [];
        //Get all the markers for the assets
        var assetPositionsStore = Ext.getStore('assetPositionsStore');
        assetPositionsStore.each(function (item) {
            var latLong = new google.maps.LatLng(item.get('latitude'), item.get('longitude'));
            var marker  = new google.maps.Marker({
                position : latLong,
                assetName: item.get('assetName')
            });
            assets.push(marker);
        });
        Ext.getStore('assetPositionsStore').clearListeners();
        for (var location = 0; location < totalLocations; location++) {
            var latLong = new google.maps.LatLng(visibleLocationsStore
                    .getAt(location).get('latitude'),
                visibleLocationsStore.getAt(location).get('longitude'));
            symbolName  = visibleLocationsStore.getAt(location).get('symbol');
            var marker  = new google.maps.Marker({
                position : latLong,
                clickable: true,
                map      : this.gmap,
                icon     : '../images/maps/icons/locations/' + symbolName.replace(/ /g, '').toLowerCase() + '.png',
                title    : visibleLocationsStore.getAt(location).get('name')
            });
            this.locationMarkersArray.push(marker);
            bounds.extend(latLong);
            this.gmap.fitBounds(bounds);
            this.showLocationsInfo(assets, marker, visibleLocationsStore
                .getAt(location));
        }

        if (totalLocations > 0) {
            this.map.setMapOptions({
                center   : bounds.getCenter(),
                mapTypeId: google.maps.MapTypeId.ROADMAP
            });

            if (totalLocations == 1) {
                this.gmap.setZoom(15);
            } else {
                this.gmap.setZoom(2);
            }
        }
    },

    /**
     * On location marker click shows info pop-up
     * @param marker
     * @param record
     */
    showLocationsInfo: function (assets, marker, record) {
        var me           = this;
        var displayCount = '';
        google.maps.event.addListener(marker, 'click', function () {
            if (me.infowindow) {
                me.infowindow.close();
            }
            //Find all the nearby assets
            var count        = 0;
            var assetsNearby = "<ul>";
            for (var i = 0; i < (assets.length - 1); i++) {
                var assetLatitude     = assets[i].position.lat();
                var assetLongitude    = assets[i].position.lng();
                var locationLatitude  = record.get('latitude');
                var locationLongitude = record.get('longitude');
                //Using HARVESIAN formula to calculate the distance
                var R = 6371; // use 3959 for miles or 6371 for km
                var latitudeDifference   = (locationLatitude - assetLatitude) * Math.PI / 180;
                var longitudeDifference  = (locationLongitude - assetLongitude) * Math.PI / 180;
                var tempAssetLatitude    = assetLatitude * Math.PI / 180;
                var tempLocationLatitude = locationLatitude * Math.PI / 180;
                var a                    = Math.sin(latitudeDifference / 2) * Math.sin(latitudeDifference / 2) + Math.sin(longitudeDifference / 2) * Math.sin(longitudeDifference / 2) * Math.cos(tempAssetLatitude) * Math.cos(tempLocationLatitude);
                var c                    = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
                var distance             = R * c;
                //Getting the absolute value of the distance
                distance = Math.abs(distance);
                if (distance <= 1) {
                    ++count;
                    if (count < 16) {
                        assetsNearby += '<li>&bull;&nbsp;' + assets[i].assetName + '</li>';
                    }
                    if (count == 15) {
                        assetsNearby += '<li>.....</li>';
                    }
                }
            }
            assetsNearby += '</ul>';
            if (count != 0) {
                displayCount = count + ' asset(s) nearby (1 km radius)';
            } else {
                displayCount = '';
            }
            //InfoWindow
            me.infowindow.setContent('<div><h1>' + record.get('name') + '</h1>' + record.get('latitude') + 'N,  ' + record.get('longitude') + 'E<br>' + record.get('symbol') + '<br>' + displayCount + '<br>' + assetsNearby + '</div>');
            if (me.gmap.getStreetView().getVisible()) {
                me.infowindow.open(me.gmap.getStreetView(), this);
            } else {
                me.infowindow.open(me.gmap, marker);
            }
        });
    },

    /**
     * Plots Geofence on map depending on its shape
     * @param record
     */
    plotGeofenceOnMap: function (record) {
        var array1     = [];
        var finalArray = [];
        var fenceVal   = record.get('fenceDescription');
        var shapeType  = record.get('shapeType');
        if (shapeType == 'Rectangle' || shapeType == 'Area') {
            fenceVal   = fenceVal.slice(15, -2);
            array1     = fenceVal.split(" ");
            finalArray = refactorArray(array1);
            this.drawShape(finalArray, record);
        } else if (shapeType == 'Circle') {
            fenceVal   = fenceVal.slice(8, -1);
            array1     = fenceVal.split(" ");
            finalArray = refactorArray(array1);
            this.drawCircle(finalArray, record);
        } else if (shapeType == 'Pass') {
            fenceVal   = fenceVal.slice(42, -1);
            array1     = fenceVal.split(" ");
            finalArray = refactorArray(array1);
            this.drawPolyLine(finalArray, record);
        }

        function refactorArray(arr) {
            var i, len = arr.length;

            for (i = 0; i < len; i++) {
                if (arr[i] == '(Lat:' || arr[i] == 'Lon:'
                    || arr[i] == 'Radius:' || arr[i] == 'metre') {
                    arr.splice(i, 1);
                }
            }
            for (i in arr) {
                if (arr[i].indexOf(')') > 0) {
                    var length = arr[i].length;
                    arr[i]     = arr[i].substr(0, length - 1);
                }
            }

            return arr;
        }

    },

    /**
     * Draws Geofence any shape
     * @param arry
     * @param record
     */
    drawShape: function (arry, record) {
        var path   = [];
        var cntlat = 0, cntlng = 1;
        while (cntlat < cntlng && cntlng < arry.length) {
            path.push(new google.maps.LatLng(arry[cntlat], arry[cntlng]));
            this.geoBounds.extend(new google.maps.LatLng(arry[cntlat],
                arry[cntlng]));
            cntlat = cntlat + 2;
            cntlng = cntlng + 2;
        }
        var Path = new google.maps.Polygon({
            title        : record.get('name'),
            paths        : path,
            strokeColor  : '#ff0000',
            strokeOpacity: 1.0,
            strokeWeight : 2,
            fillColor    : '#ff0000',
            fillOpacity  : 0.35
        });
        this.geofenceArray.push(Path);
        Path.setMap(this.gmap);
        this.showGeofenceInfo(Path, arry, record, "");
    },

    /**
     * Draws geofence circle
     * @param arry
     * @param record
     */
    drawCircle: function (arry, record) {
        var lat       = arry[0];
        var lon       = arry[1];
        var radius    = arry[arry.length - 1];
        radius        = Math.floor(radius);
        this.geoBounds.extend(new google.maps.LatLng(lat, lon));
        var newCircle = new google.maps.Circle({
            center       : new google.maps.LatLng(lat, lon),
            radius       : radius,
            strokeOpacity: 0.8,
            strokeWeight : 0,
            fillColor    : '#ff0000',
            fillOpacity  : 0.35,
            title        : record.get('name')
        });
        this.geofenceArray.push(newCircle);
        newCircle.setMap(this.gmap);
        this.showGeofenceInfo(newCircle, arry, record, radius);
    },

    /**
     * Draws geofence polyline
     * @param arry
     * @param record
     */
    drawPolyLine: function (arry, record) {
        var path   = [];
        var cntlat = 0, cntlng = 1;
        while (cntlat < cntlng && cntlng < arry.length) {
            path.push(new google.maps.LatLng(arry[cntlat], arry[cntlng]));
            this.geoBounds.extend(new google.maps.LatLng(arry[cntlat],
                arry[cntlng]));
            cntlat = cntlat + 2;
            cntlng = cntlng + 2;
        }
        var Path = new google.maps.Polyline({
            path         : path,
            strokeColor  : "#00ff00",
            strokeOpacity: 1.0,
            strokeWeight : 2,
            fillOpacity  : 0.35,
            title        : record.get('name')
        });
        this.geofenceArray.push(Path);
        Path.setMap(this.gmap);
        this.showGeofenceInfo(Path, arry, record, "");
    },

    /**
     * pop-up shows geofence info on click
     * @param shape
     * @param arry
     * @param record
     * @param radius
     */
    showGeofenceInfo: function (shape, arry, record, radius) {
        var me = this;

        google.maps.event.addListener(shape, 'click', function (event) {
            if (me.infowindow) {
                me.infowindow.close();
            }

            switch (record.get('shapeType')) {
                case 'Area':
                case 'Rectangle':
                case 'Pass':
                    me.infowindow.setContent('<div><h1>' + record.get('name') + '</h1>Configuration: ' + record.get('configName') + '</div>');
                    break;
                case 'Circle':
                    me.infowindow.setContent('<div><h1>' + record.get('name') + '</h1>Configuration: ' + record.get('configName') + '<br>radius: ' + radius + '</div>');
                    break;
            }

            me.infowindow.setPosition(event.latLng);
            me.infowindow.open(me.gmap);
        });
    },

    /**
     * Remove geofences from map.
     */
    removeAllGeofences: function () {

        for (var i = 0; i < this.geofenceArray.length; i++) {
            this.geofenceArray[i].setMap(null);
        }

        this.geofenceArray = [];

        if (this.infowindow) {
            this.infowindow.close();
        }
    },

    /**
     * Called when Map control screen locations show button is tapped
     * @param btn
     */
    showGeofencesOnMap: function (btn) {
        this.geoBounds = new google.maps.LatLngBounds();
        // FIXME really?
        var geofenceVal = this.getMapControlGeofenceFieldButton().getComponent(0).getText();
        var count       = this.geofenceStore.getCount();
        // FIXME stoopid.
        if (geofenceVal == '* All') {
            for (var record = 0; record < count; record++) {
                this.plotGeofenceOnMap(this.geofenceStore.getAt(record));
            }
            this.map.setMapOptions({
                zoom     : 5,
                center   : this.geoBounds.getCenter(),
                mapTypeId: google.maps.MapTypeId.ROADMAP
            });
            // this.gmap.fitBounds(bounds);
            this.getMapView().setActiveItem(0);
        } else {
            this.removeAllGeofences();
            var selectedRecord = this.geofenceStore.findRecord('name', geofenceVal);
            this.plotGeofenceOnMap(selectedRecord);
            this.map.setMapOptions({
                zoom     : 15,
                center   : this.geoBounds.getCenter(),
                mapTypeId: google.maps.MapTypeId.ROADMAP
            });
            this.getMapView().setActiveItem(0);
        }
    },

    /**
     * Called when Map control screen locations show button is tapped
     * @param btn
     */
    showLocationsOnMap: function (btn) {
        this.removeLocationMarkersFromMap();
        var name                  = this.getMapControlLocationFieldButton().getComponent(0).getText();
        var visibleLocationsStore = Ext.getStore('visibleLocationsStore');

        // FIXME STOOPID
        if (name === "* All") {
            this.addLocationsOnMap(visibleLocationsStore);
            this.getMapView().setActiveItem(0);
        } else {
            visibleLocationsStore.filter(Ext.create('Ext.util.Filter', {
                property  : "name",
                value     : name,
                exactMatch: true
            }));
            this.addLocationsOnMap(visibleLocationsStore);
            visibleLocationsStore.clearFilter();
            this.getMapView().setActiveItem(0);
        }
    },

    /**
     * Map is initialized. Grab instance.
     * @param component
     * @param map
     */
    getGmapInstance: function (component, map) {
        this.locationMarkersArray = [];
        this.assetMarkersArray    = [];
        this.geofenceArray        = [];
        this.map                  = component;
        this.gmap                 = map;
        this.getStyler();
        this.getTotalAssetsOid();
        this.infowindow           = new google.maps.InfoWindow({
            maxWidth: 130
            //maxHeight: 100
        });
        this.geofenceStore        = Ext.create('Rms.store.GeofencesStore');

    },

    currentPositionControl: function () {
        var me   = this, position;
        position = new google.maps.LatLng(App.currentPosition.latitude, App.currentPosition.longitude);
        function CenterControl(controlDiv, map) {
            var controlUI                   = document.createElement('div');
            controlUI.style.backgroundColor = '#fff';
            controlUI.style.border          = '2px solid #fff';
            controlUI.style.borderRadius    = '3px';
            controlUI.style.boxShadow       = '0 2px 6px rgba(0,0,0,.3)';
            controlUI.style.cursor          = 'pointer';
            controlUI.style.marginBottom    = '22px';
            controlUI.style.textAlign       = 'center';
            controlUI.title                 = 'Get Current Position';
            controlDiv.appendChild(controlUI);
            var controlText                 = document.createElement('div');
            controlText.style.color         = 'rgb(25,25,25)';
            controlText.style.fontFamily    = 'Roboto,Arial,sans-serif';
            controlText.style.lineHeight    = '38px';
            controlText.style.paddingLeft   = '5px';
            controlText.style.paddingRight  = '5px';
            controlText.innerHTML           = 'Current Position';
            controlUI.appendChild(controlText);
            google.maps.event.addDomListener(controlUI, 'click', function () {
                map.setCenter(position);
                map.setZoom(15);
            });

        }

        function initializeControl() {
            var mapDiv      = document.getElementById('map-canvas'), previousControl;
            var mapOptions  = {
                zoom  : 5,
                center: position
            };
            map             = me.gmap;
            previousControl = document.getElementById('positionControlBtn')
            if (previousControl) {
                previousControl.remove();
            }
            var centerControlDiv = document.createElement('div');
            centerControlDiv.id  = 'positionControlBtn';
            var centerControl    = new CenterControl(centerControlDiv, map);

            centerControlDiv.index = 1;
            map.controls[google.maps.ControlPosition.RIGHT_BOTTOM].push(centerControlDiv);
        }

        initializeControl();
    },

    /**
     * Creates String of all asset domainObjectIds
     */
    getTotalAssetsOid: function () {
        var assetStore     = Ext.getStore('assetStore');
        var totalAssets    = assetStore.getCount();
        console.log("totalAssets " + totalAssets);
        var domainObjectId = [];
        for (var count = 0; count < totalAssets; count++) {
            domainObjectId.push(assetStore.getAt(count).get('domainObjectId'));
        }
        this.domainObjectIdString = domainObjectId.join(',');
    },

    /**
     * Remove assets from map.
     */
    removeAssetMarkersFromMap: function () {
        if (this.assetMarkersArray) {
            for (var i = 0; i < this.assetMarkersArray.length; i++) {
                this.assetMarkersArray[i].setMap(null);
            }
            this.assetMarkersArray = [];
        }
    },
    /**
     * Adds Asset markers on map
     * @param store
     * @param {boolean=} singleMode
     */
    addAssetsOnMap           : function (store, singleMode) {
        var me = this;
        if (store.getCount() == 0) {
            Ext.Msg.alert('Alert', 'There are no assets with positional co-ordinates');
            this.getLaunchApp().setActiveItem(1);
            Ext.Viewport.setMasked(false);
            return
        }
        if (!this.gmap) {
            this.getLaunchApp().setActiveItem(0);
            window.setTimeout(function () {
                me.addAssetsOnMap(store, singleMode)
            }, 500);
        }
        else {
            //this.getController('SessionController').getSettings();
            console.log('mapController.addAssetsOnMap');
            var me             = this;
            var totalLocations = store.getCount();
            var icon           = '';
            var angle          = '';
            var iconPath       = '';
            var map            = me.gmap;
            //Setting the traffic layer to the map
            var trafficLayer = new google.maps.TrafficLayer();
            trafficLayer.setMap(map);
            //if (map) {
            //    map.setTilt(45);
            //}
            console.log('totalLocations', totalLocations);
            //Adding the user to the Map
            if (navigator.geolocation) {
                var myLat, myLng;
                navigator.geolocation.getCurrentPosition(success);
                function success(position) {
                    myLat               = position.coords.latitude;
                    myLng               = position.coords.longitude;
                    var marker          = new google.maps.Marker({
                        position : new google.maps.LatLng(myLat, myLng),
                        clickable: false,
                        map      : map,
                        icon     : '../js/maps/ui/svg/current-location.svg',
                        assetName: 'me'
                    });
                    App.currentPosition = {
                        latitude : myLat,
                        longitude: myLng
                    };
                    me.currentPositionControl();
                    me.assetMarkersArray.push(marker);
                }
            }
            if (totalLocations > 0) {
                //noinspection JSUnresolvedFunction
                var bounds = new google.maps.LatLngBounds();

                switch (this.assetPositionTime) {
                    case 'current':
                        icon = '../images/maps/icons/directions/arrow-blue/';
                        break;
                    case 'history':
                        icon              = '../images/maps/icons/directions/arrow-green/';
                        break;
                }
                store.each(function (item) {
                    iconPath    = me.Styler.getDirectionIconForObject(item.raw);
                    var latLong = new google.maps.LatLng(item.get('latitude'), item.get('longitude'));
                    var marker  = new google.maps.Marker({
                        position : latLong,
                        clickable: true,
                        map      : map,
                        icon     : {url: iconPath},
                        title    : item.get('typeShort'),
                        assetName: item.get('assetName'),
                        assetID  : item.get('assetID')
                    });
                    if (me.assetMarkersArray) {
                        me.assetMarkersArray.push(marker);
                    }
                    bounds.extend(latLong);
                    me.showAssetInfo(me.assetMarkersArray, marker, item);
                });
                this.persistantBounds     = bounds;
                this.totalAssetsLocations = totalLocations;
                Ext.Viewport.setMasked(false);
                /**
                 * Check if the the map is being visited or refreshed
                 */
                //console.log(!this.refresh);
                if (!me.refresh) {
                    if (totalLocations > 1) {
                        me.gmap.fitBounds(bounds);
                    }
                    else if (totalLocations == 1) {
                        me.gmap.setCenter(bounds.getCenter());
                        me.gmap.setZoom(14);
                    }
                    me.refreshIntervalId = setInterval(function () {
                        me.refresher(store, singleMode);
                    }, 240000);
                    this.refresh         = true;
                }
            }
        }
    },
    refresher                : function (store, singleMode) {
        var me = this;
        if (this.parameters) {
            //this.removeAssetMarkersFromMap();
            store.clearListeners();
            store.load({
                params: this.parameters
            });
            store.on('load', function () {
                me.removeAssetMarkersFromMap();
                me.addAssetsOnMap(store, singleMode);
            });

        }
    },

    /**
     * Show info window on marker click
     * @param marker
     * @param record
     */
    showAssetInfo        : function (markers, marker, record) {
        var me = this;
        google.maps.event.addListener(marker, 'click', function () {
            Ext.Viewport.setMasked({
                xtype  : 'loadmask',
                message: 'Loading...'
            });
            if (me.infowindow) {
                me.infowindow.close();
            }
            //if (marker.getAnimation() != null) {
            //    marker.setAnimation(null);
            //} else {
            //    marker.setAnimation(google.maps.Animation.BOUNCE);
            //    setTimeout(function(){ marker.setAnimation(null); }, 1500);
            //}
            //Getting the number of assets nearby
            var count        = 0;
            var assetsNearby = "<ul>";
            for (i = 0; i < (markers.length - 1); i++) {
                if (((markers[i].assetName) != record.get('assetName')) && (markers[i].assetID != record.get('assetID')) && (markers[i].assetName != 'me')) {
                    var markerLatitude  = markers[i].position.lat();
                    var markerLongitude = markers[i].position.lng();
                    var assetLatitude   = record.get('latitude');
                    var assetLongitude  = record.get('longitude');
                    //Using HARVESIAN formula to calculate the distance
                    var R = 6371; // use 3959 for miles or 6371 for km
                    var latitudeDifference  = (assetLatitude - markerLatitude) * Math.PI / 180;
                    var longitudeDifference = (assetLongitude - markerLongitude) * Math.PI / 180;
                    markerLatitude          = markerLatitude * Math.PI / 180;
                    assetLatitude           = assetLatitude * Math.PI / 180;
                    var a                   = Math.sin(latitudeDifference / 2) * Math.sin(latitudeDifference / 2) + Math.sin(longitudeDifference / 2) * Math.sin(longitudeDifference / 2) * Math.cos(markerLatitude) * Math.cos(assetLatitude);
                    var c                   = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
                    var dist                = R * c;
                    //Getting the absolute value of the distance
                    dist = Math.abs(dist);
                    if (dist <= 1) {
                        ++count;
                        if (count < 16) {
                            assetsNearby += '<li>&bull;&nbsp;' + markers[i].assetName + '</li>';
                        }
                        if (count == 15) {
                            assetsNearby += '<li>.....</li>';
                        }
                    }
                }
            }
            assetsNearby += '</ul>';
            var displayCount;
            displayCount = count != 0 ? count + ' asset(s) nearby (1 km radius)' : '';
            //Getting the distance of the asset from the current position
            var myLatitude  = markers[markers.length - 1].position.lat();
            var myLongitude = markers[markers.length - 1].position.lng();
            assetLatitude   = record.get('latitude');
            assetLongitude  = record.get('longitude');
            //Using HARVESIAN formula to calculate the distance
            R = 6371; // use 3959 for miles or 6371 for km
            latitudeDifference  = (assetLatitude - myLatitude) * Math.PI / 180;
            longitudeDifference = (assetLongitude - myLongitude) * Math.PI / 180;
            myLatitude          = myLatitude * Math.PI / 180;
            assetLatitude       = assetLatitude * Math.PI / 180;
            a                   = Math.sin(latitudeDifference / 2) * Math.sin(latitudeDifference / 2) + Math.sin(longitudeDifference / 2) * Math.sin(longitudeDifference / 2) * Math.cos(myLatitude) * Math.cos(assetLatitude);
            c                   = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
            me.distance         = R * c;
            var displayDistance = 'Asset is ' + me.distance.toFixed(1) + ' km away';
            if (record.get('eventTime')) {
                var iso      = record.get('eventTime');
                var isoArray = iso.split(" ");
                //Month
                var month;
                var monthsArray = [/January/i, /February/i, /March/i, /April/i, /May/i, /June/i, /July/i, /August/i, /September/i, /October/i, /November/i, /December/i];
                for (var i = 0; i < (monthsArray.length); i++) {
                    if (monthsArray[i].test(isoArray[0])) {
                        month = i;
                    }
                }
                //Day
                var day = isoArray[1].slice(0, 2);
                //Year
                var year = isoArray[2];
                //Time
                var time = isoArray[3].slice(0, 8);
                time     = time.replace(".", "");
                //The date formatted in the ISO standard
                var isodate  = year + "-" + (month + 1) + "-" + day + "T" + time;
                var tempDate = isodate.replace('T', ' ');
                var date     = tempDate.replace(/-/g, '/');
                date         = new Date(Date.parse(date));
                date.setMinutes(date.getMinutes() + App.config.user.timeZoneOffset);
                date         = Ext.Date.format(date, App.config.user.dateTimeFormat);
            }
            //Group, Asset Status, Driver
            Ext.Ajax.request({
                async  : false,
                url    : App.config.serviceUrl + 'caesarObject/objectDataProvider3',
                method : App.config.ajaxType,
                params : {
                    domainObjectId    : record.get("assetID"),
                    domainObjectValues: JSON.stringify([
                        'driver',
                        'driverMobile',
                        'assetGroup',
                        'assetStatus'
                    ]),
                    domainObjectType  : 'canbusfleetvehicle',
                    domainDataView    : 'details'
                },
                success: function (response) {
                    var data     = Ext.decode(response.responseText);
                    me.grouptext = 'Group: ' + data.ui.items[0].items[0].items[0].displayValue;
                    if (data.ui.items[0].items[1].items[0].currentValues[0]) {
                        me.driverNametext = 'Driver: ' + data.ui.items[0].items[1].items[0].displayValue;
                    } else {
                        me.driverNametext = '';
                    }
                    if (data.ui.items[0].items[1].items[1].currentValues[0]) {
                        me.driverNumber = data.ui.items[0].items[1].items[1].currentValues[0];
                    } else {
                        me.driverNumber = '';
                    }
                    me.assetStatustext = '<br>Status: ' + ((data.ui.items[0].items[2].items[0].currentValues[0]).split('.'))[1];
                    Ext.Viewport.setMasked(false);
                }
            });
            //Adding the Content to the InfoWindow
            var container        = document.createElement('div');
            var objectInfo       = document.createElement('div');
            var mainInfo         = document.createElement('div');
            var driverInfo       = document.createElement('div');
            var breaker          = document.createElement('div');
            objectInfo.innerHTML = '<h1><span class="x-button x-button-action dom-button">' + record.get('assetName') + '</span></h1>';
            objectInfo.onclick   = function () {
                iwClick(record.get('assetName'))
            };
            container.appendChild(objectInfo);
            mainInfo.innerHTML   = '<strong>' + date + '</strong><br><small>Type: ' + record.get('typeShort') + '<br>' + me.grouptext + ((me.assetStatustext).replace(/([A-Z])/g, ' $1').replace(/^./, function (str) {
                    return str.toUpperCase();
                })) + '</small><br>' + record.get('locationReference') + '<small><br>' + displayDistance + '<br>' + displayCount + '<br>' + assetsNearby + '</small>';
            container.appendChild(mainInfo);
            //If Driver Information Exists
            if (me.driverNametext != '' || me.driverNumber != '') {
                driverInfo.innerHTML = '<small>' + me.driverNametext + '</small>';
                if (me.driverNumber != '') {
                    driverInfo.innerHTML += '<br><span class="x-button x-button-action dom-button">' + me.driverNumber + '</span>';
                    driverInfo.onclick = function () {
                        callDriver(me.driverNametext, me.driverNumber);
                    };
                }
                container.appendChild(driverInfo);

            }
            //This is needed cause the infowindow does not fit the contents well on only the first initialization
            breaker.innerHTML = '<br>';
            container.appendChild(breaker);
            me.infowindow.setContent(container);
            if (me.gmap.getStreetView().getVisible()) {
                me.infowindow.open(me.gmap.getStreetView(), this);
            } else {
                me.infowindow.open(me.gmap, marker);
            }
        });
        //Go to details page for the asset
        function iwClick(str) {
            Ext.Msg.confirm(
                "View Details",
                "Go to details page for " + str + "?",
                function (btn) {
                    if (btn === 'yes') {
                        var mee               = this;
                        assetStore            = Ext.getStore("assetStore");
                        if(!assetStore.isLoaded()){
                            Ext.Msg.alert('Alert','Information is being loaded. Please try again.');
                            return;
                        }
                        assetStore.each(function (i) {
                            if (i.get('name') == str) {
                                domainObjectType = i.get('domainObjectType');
                                domainObjectId   = i.get('domainObjectId');
                                //Tell Asset Controller which asset detail
                                Rms.app.getController('AssetController').fromMap = true;
                                Rms.app.getController('AssetController').id = domainObjectId;
                                Rms.app.getController('AssetController').object = domainObjectType;
                                Rms.app.getController('AssetController').name = i.get("name");
                            }
                        });
                        this.domainObjectName = str;
                        domainDataView        = 'details';
                        // Fetch details for this DomainObject.
                        Ext.Ajax.request({
                            url    : App.config.serviceUrl + 'caesarObject/objectDataProvider3',
                            method : App.config.ajaxType,
                            params : {
                                domainObjectId  : domainObjectId,
                                //domainObjectValues: JSON.stringify(domainObjectValues),
                                domainObjectType: domainObjectType,
                                domainDataView  : domainDataView
                            },
                            success: function (response) {
                                var data = Ext.decode(response.responseText);
                                me.getAssetView().getAt(1).updateData(data, domainObjectType, mee.domainObjectId, mee.domainObjectName);
                                me.getAssetView().setActiveItem(1);
                                me.getAssetDetailsToolbar().setTitle(Ext.util.Format.ellipsis(mee.domainObjectName, 10));
                                me.getAssetDtlBackBtn().setHidden(true);
                                me.getNearestAssetDtlBckBtn().setHidden(true);
                                me.getAssetDtlBackBtnFromMap().setHidden(false);
                                me.getNearestAssetDtlAssetBckBtn().setHidden(true);
                                me.getLaunchApp().setActiveItem(1);
                            }
                        });
                    }
                },
                this
            );
        }

        function callDriver(name, number) {
            Ext.Msg.confirm(
                "Call",
                "Are you sure you want to call " + name + " ?",
                function (btn) {
                    if (btn === 'yes') {
                        this.location.href = 'tel:' + number;
                    }
                },
                this
            );
        }
    },
    /**
     * Asset position time interval handling
     * @param thiscomp
     * @param button
     * @param ispressed
     */
    segmentedButtonToggle: function (thiscomp, button, ispressed) {
        if (button.config.text === "Interval") {
            if (ispressed == true) {
                this.getMapControlDatePickerFieldFrom().setDisabled(false);
                this.getMapControlDatePickerFieldTo().setDisabled(false);
                button.replaceCls('map-control-segmentedbutton-off',
                    'map-control-segmentedbutton-on');
                thiscomp.getComponent(0).replaceCls(
                    'map-control-segmentedbutton-on',
                    'map-control-segmentedbutton-off');
                thiscomp.getComponent(1).replaceCls(
                    'map-control-segmentedbutton-on',
                    'map-control-segmentedbutton-off');
            } else {
                button.replaceCls('map-control-segmentedbutton-on',
                    'map-control-segmentedbutton-off');
                this.getMapControlDatePickerFieldFrom().setDisabled(true);
                this.getMapControlDatePickerFieldTo().setDisabled(true);
            }
        } else if (button.config.text === "All") {
            this.getMapControlDatePickerFieldFrom().setDisabled(true);
            this.getMapControlDatePickerFieldTo().setDisabled(true);
            if (ispressed == true) {
                button.replaceCls('map-control-segmentedbutton-off',
                    'map-control-segmentedbutton-on');
                thiscomp.getComponent(0).replaceCls(
                    'map-control-segmentedbutton-on',
                    'map-control-segmentedbutton-off');
                thiscomp.getComponent(2).replaceCls(
                    'map-control-segmentedbutton-on',
                    'map-control-segmentedbutton-off');
            } else {
                button.replaceCls('map-control-segmentedbutton-on',
                    'map-control-segmentedbutton-off');
            }
        } else {
            this.getMapControlDatePickerFieldFrom().setDisabled(true);
            this.getMapControlDatePickerFieldTo().setDisabled(true);
            if (ispressed == true) {
                button.replaceCls('map-control-segmentedbutton-off',
                    'map-control-segmentedbutton-on');
                thiscomp.getComponent(1).replaceCls(
                    'map-control-segmentedbutton-on',
                    'map-control-segmentedbutton-off');
                thiscomp.getComponent(2).replaceCls(
                    'map-control-segmentedbutton-on',
                    'map-control-segmentedbutton-off');
            } else {
                button.replaceCls('map-control-segmentedbutton-on',
                    'map-control-segmentedbutton-off');
            }
        }
    },

    /**
     * shows assets depending on Latest, Interval Or All duration selected
     * @param btn
     */
    showAssetOnMap: function () {

        console.info('showAssetOnMap');
        this.removeAssetMarkersFromMap();
        var assetPositionsStore = Ext.getStore('assetPositionsStore');
        //assetPositionsStore.un('load', handlerFunction);
        assetPositionsStore.clearListeners();
        assetPositionsStore.on('load', this.addAssetsOnMap, this);

        var activeButton = this.getMapControlSegmentedButton()
            .getPressedButtons();
        if (activeButton[0].config.text === "Latest") {
            this.assetPositionTime = "current";
            this.parameters        = {
                oid        : this.singleDomainObjectId,
                historySpec: 'CURRENT',
                view       : 'assetID,typeShort,longitude,latitude,eventTime,heading,assetName,locationReference,mapCurrentSymbol'
            };
            assetPositionsStore.load({
                params: this.parameters
            });
        } else if (activeButton[0].config.text === "All") {
            this.assetPositionTime = "history";
            this.parameters        = {
                oid        : this.singleDomainObjectId,
                historySpec: 'ALL',
                view       : 'assetID,typeShort,longitude,latitude,eventTime,heading,assetName,locationReference,mapCurrentSymbol'
            };
            assetPositionsStore.load({
                params: this.parameters
            });
        } else if (activeButton[0].config.text === "Interval") {
            this.assetPositionTime = "history";
            var from               = this.getMapControlDatePickerFieldFrom().getValue();
            var to                 = this.getMapControlDatePickerFieldTo().getValue();
            var diff               = to - from;
            if (diff <= 0) {
                Ext.Msg.alert('', 'To (date,time) should be greater than From (date,time)');
            } else {
                var fromDate    = Ext.Date.format(from, "d-m-Y");
                var toDate      = Ext.Date.format(to, "d-m-Y");
                var fromTime    = from.getHours() + ":" + from.getMinutes();
                var toTime      = to.getHours() + ":" + to.getMinutes();
                this.parameters = {
                    oid        : this.singleDomainObjectId,
                    historySpec: 'INTERVAL',
                    fromDate   : fromDate,
                    fromTime   : fromTime,
                    toDate     : toDate,
                    toTime     : toTime,
                    view       : 'assetID,typeShort,longitude,latitude,eventTime,heading,assetName,locationReference,mapCurrentSymbol'
                };
                assetPositionsStore.load({
                    params: this.parameters
                });
                this.getMapView().setActiveItem(0);
            }
        }
    },

    /**
     * Called to show all assets with current position on map
     */
    showAllAssetsOnMap: function () {
        this.allAssets          = true;
        this.refresh            = false;
        var assetPositionsStore = Ext.getStore('assetPositionsStore');
        assetPositionsStore.removeAll();
        assetPositionsStore.on('load', this.addAssetsOnMap, this);
        this.assetPositionTime  = 'all';
        this.parameters         = {
            ids : 'all',
            view: 'assetID,typeShort,longitude,latitude,eventTime,heading,assetName,locationReference,mapCurrentSymbol'
        };
        assetPositionsStore.load({
            params: this.parameters
        });
    },

    /**
     * Called when actionsheet map to show single asset (Back button is tapped)
     * @param btn
     */
    actionSheetMapBackBtnTapped: function (btn) {
        console.log('mapController.actionSheetMapBackBtnTapped');
        console.log(this.alarmedAsset);
        this.removeAssetMarkersFromMap();
        this.removeLocationMarkersFromMap();
        if(this.alarmedAsset){
            this.getLaunchApp().setActiveItem(2);
            this.getAlarmView().setActiveItem(3);
            this.alarmedAsset = false;
        }else{
            this.getLaunchApp().setActiveItem(1);
            this.getAssetView().setActiveItem(1);
        }
        //this.getMapView().getAt(0).getAt(0).getAt(0).setHidden(true);
        this.getMapView().getAt(0).getAt(0).setTitle("All Assets");
        this.directMapTapped = true;
        this.getNearbyAssetsBtn().setHidden(false);

    },

    /**
     * Shows single asset on map from assets tab
     * @param btn
     */
    showSingleAssetOnMap: function (btn) {
        console.log('mapController.showSingleAssetOnMap');
        this.allAssets            = false;
        this.directMapTapped      = false;
        this.refresh              = false;
        if (this.getAssetDetails().assetOptions) {
            this.getAssetDetails().assetOptions.hide();
        }
        this.getMapView().getAt(0).getAt(0).getAt(0).setHidden(false);
        this.getNearbyAssetsBtn().setHidden(true);
        this.getMapView().getAt(0).getAt(0).setTitle('Map');
        this.removeAssetMarkersFromMap();
        this.singleDomainObjectId = this.getAssetDetails().domainObjectId;
        var assetPositionsStore   = Ext.getStore('assetPositionsStore');
        assetPositionsStore.removeAll();
        assetPositionsStore.clearListeners();
        assetPositionsStore.on('load', function (store) {
            if (store.getCount() > 0) {
                this.assetPositionTime = 'current';
                // Second param indicates that we only add ONE asset here.
                this.addAssetsOnMap(store, true);
                this.getLaunchApp().setActiveItem(0);
            } else {
                Ext.Msg.alert('', 'No valid GPS location available');
            }
            store.clearListeners();
        }, this);
        this.parameters           = {
            oid        : this.singleDomainObjectId,
            historySpec: 'CURRENT',
            view       : 'assetID,typeShort,longitude,latitude,eventTime,heading,assetName,locationReference,mapCurrentSymbol'
        };
        assetPositionsStore.load({
            params: this.parameters
        });
    },

    showSingleGroupOnMap     : function (domainObjectIdString) {
        this.allAssets          = false;
        this.directMapTapped    = false;
        this.refresh            = false;
        var assetPositionsStore = Ext.getStore('assetPositionsStore');
        assetPositionsStore.removeAll();
        this.removeAssetMarkersFromMap();
        assetPositionsStore.on('load', this.addAssetsOnMap, this);
        this.assetPositionTime  = 'current';
        this.parameters         = {
            ids : domainObjectIdString,
            view: 'assetID,typeShort,longitude,latitude,eventTime,heading,assetName,locationReference,mapCurrentSymbol'
        };
        assetPositionsStore.load({
            params: this.parameters
        });
        this.getNearbyAssetsBtn().setHidden(true);
        this.getActionSheetMapBackBtn().setHidden(true);
        this.getGroupMapBackBtn().setHidden(false);
        this.getLaunchApp().setActiveItem(0);
    },
    showSingleAlarmAssetOnMap: function (item, datetime, domainObjectType) {
        this.parameters      = false;
        var position         = item.get('position');
        this.alarmedAsset    = true;
        var me               = this;
        this.allAssets       = false;
        this.directMapTapped = false;
        this.refresh         = false;
        if (!this.gmap) {
            window.setTimeout(function () {
                me.getLaunchApp().setActiveItem(0);
                me.showSingleAlarmAssetOnMap(item, datetime, domainObjectType)
            }, 500);
        }
        else {
            if (position && position != '' && position != 'Not Available' && position != App.config.blankSign) {
                console.log('mapController.showSingleAlarmAssetOnMap');
                if (this.getAssetDetails().assetOptions) {
                    this.getAssetDetails().assetOptions.hide();
                }
                // FIXME what does this do?
                this.getMapView().getAt(0).getAt(0).getAt(0).setHidden(false);
                this.getNearbyAssetsBtn().setHidden(true);
                this.getMapView().getAt(0).getAt(0).setTitle('Map');
                this.removeAssetMarkersFromMap();
                this.singleDomainObjectId = item.get('assetID');
                var map                   = me.gmap;
                //Setting the traffic layer to the map
                var trafficLayer = new google.maps.TrafficLayer();
                trafficLayer.setMap(map);
                if (map) {
                    map.setTilt(45);
                }
                //Adding the user to the Map
                if (navigator.geolocation) {
                    var myLat, myLng;
                    navigator.geolocation.getCurrentPosition(success);
                    function success(position) {
                        myLat               = position.coords.latitude;
                        myLng               = position.coords.longitude;
                        var marker          = new google.maps.Marker({
                            position : new google.maps.LatLng(myLat, myLng),
                            clickable: false,
                            map      : map,
                            icon     : '../js/maps/ui/svg/current-location.svg',
                            assetName: 'me'
                        });
                        App.currentPosition = {
                            latitude : myLat,
                            longitude: myLng
                        };
                        me.currentPositionControl();
                        me.assetMarkersArray.push(marker);
                    }
                }
                //noinspection JSUnresolvedFunction
                var bounds = new google.maps.LatLngBounds();
                var icon   = '../images/maps/icons/directions/arrow-maroon/';
                if (domainObjectType == 'Generator') {
                    icon = '../images/maps/icons/directions/generator-arrow-maroon/';
                } else if (domainObjectType == 'Pump') {
                    icon = '../images/maps/icons/directions/pump-arrow-red/';
                }
                var angle                   = Math.round(item.get('heading') / 15) * 15;
                var iconPath                = icon + angle + '.png';
                var separatedPosition       = (item.get('position')).split(' ');
                var latLong                 = new google.maps.LatLng(separatedPosition[1], separatedPosition[3]);
                var marker                  = new google.maps.Marker({
                    position        : latLong,
                    clickable       : true,
                    map             : map,
                    icon            : iconPath,
                    assetName       : item.get('asset'),
                    assetID         : item.get('assetID'),
                    domainObjectType: domainObjectType
                });
                if (me.assetMarkersArray) {
                    me.assetMarkersArray.push(marker);
                }
                bounds.extend(latLong);
                item.data.assetName         = item.get('asset');
                item.data.eventTime         = item.get('lastUpdatedTime');
                item.data.locationReference = item.get('description');
                item.data.latitude          = separatedPosition[1];
                item.data.longitude         = separatedPosition[3];
                me.showAssetInfo(me.assetMarkersArray, marker, item);
                this.persistantBounds       = bounds;
                me.gmap.setCenter(bounds.getCenter());
                me.gmap.setZoom(14);
                this.getLaunchApp().setActiveItem(0);
                Ext.Viewport.setMasked(false);
            }
        }
    },
    getStyler                : function () {
        var me                                = this;
        console.log('Styler initialized');
        this.Styler                           = [];
        this.Styler.directionsIconsDir        = '../images/maps/icons/directions/';
        //SVG
        this.Styler.svgBaseDir = '../js/maps/ui/svg/';
        //SVG
        this.Styler.getDirectionIconForObject = function (obj) {

            var mapSymbol = obj.mapCurrentSymbol;
            if (!mapSymbol) {
                mapSymbol = obj.mapHistorySymbol;
            }
            var rotVal   = ( (obj.heading / 360) % 1) * 360;
            var rotation = Math.round(rotVal / 15) * 15;
            //SVG
            var symbolSvgMarkupTemplate = me.Styler.arrowTemplate;
            var symbolColor             = me.Styler.DirectionColors[mapSymbol];
            if (mapSymbol) {
                if (mapSymbol.match(/Generator/i)) {
                    symbolSvgMarkupTemplate = me.Styler.generatorTemplate;
                } else if (mapSymbol.match(/Pump/i)) {
                    symbolSvgMarkupTemplate = me.Styler.pumpTemplate;
                }
                return 'data:image/svg+xml;charset=UTF-8;base64,' + btoa(symbolSvgMarkupTemplate.replace('${backgroundColor}', symbolColor[0]).replace('${color}', symbolColor[1]).replace('${rotation}', rotation));
            }

            //SVG
            //return this.directionsIconsDir +
            //       me.Styler.DirectionSymbols[mapSymbol] + '/' + rotation + '.png';
        };
        this.Styler.DirectionSymbols          = { //mapping of roam symbols
            'ROAM - arrow-beige'                  : 'arrow-beige',
            'ROAM - arrow-black'                  : 'arrow-black',
            'ROAM - arrow-blue'                   : 'arrow-blue',
            'ROAM - arrow-brown'                  : 'arrow-brown',
            'ROAM - arrow-dark-blue'              : 'arrow-dark-blue',
            'ROAM - arrow-dark-green'             : 'arrow-dark-green',
            'ROAM - arrow-gray'                   : 'arrow-gray',
            'ROAM - arrow-green'                  : 'arrow-green',
            'ROAM - arrow-light-blue'             : 'arrow-light-blue',
            'ROAM - arrow-light-green'            : 'arrow-light-green',
            'ROAM - arrow-light-purple'           : 'arrow-light-purple',
            'ROAM - arrow-magenta'                : 'arrow-magenta',
            'ROAM - arrow-maroon'                 : 'arrow-maroon',
            'ROAM - arrow-orange'                 : 'arrow-orange',
            'ROAM - arrow-pink'                   : 'arrow-pink',
            'ROAM - arrow-purple'                 : 'arrow-purple',
            'ROAM - arrow-red'                    : 'arrow-red',
            'ROAM - arrow-silver'                 : 'arrow-silver',
            'ROAM - arrow-white'                  : 'arrow-white',
            'ROAM - arrow-yellow'                 : 'arrow-yellow',
            'ROAM - circle-blue'                  : 'arrow-blue',
            'ROAM - circle-green'                 : 'arrow-green',
            'ROAM - circle-orange'                : 'arrow-orange',
            'ROAM - circle-red'                   : 'arrow-red',
            'ROAM - dot-blue'                     : 'dot-blue',
            'ROAM - dot-green'                    : 'dot-green',
            'ROAM - dot-orange'                   : 'dot-orange',
            'ROAM - dot-red'                      : 'dot-red',
            'ROAM - rect-arrow-blue'              : 'arrow-blue',
            'ROAM - rect-arrow-green'             : 'arrow-green',
            'ROAM - rect-blue-circle-green-arrow' : 'arrow-blue',
            'Generator - arrow-blue'              : 'generator-arrow-blue',
            'Generator - arrow-green'             : 'generator-arrow-green',
            'Generator - arrow-dark-blue'         : 'generator-arrow-dark-blue',
            'Generator - arrow-maroon'            : 'generator-arrow-maroon',
            'Pump - arrow-brown'                  : 'pump-arrow-brown',
            'Pump - arrow-light-blue'             : 'pump-arrow-light-blue',
            'Pump - arrow-light-purple'           : 'pump-arrow-light-purple',
            'Pump - arrow-magenta'                : 'pump-arrow-magenta',
            'arrow-red'                           : 'arrow-red',
            'ROAM - rect-blue-circle-orange-arrow': 'arrow-orange'
        };

        this.Styler.DirectionColors = {
            'ROAM - arrow-beige'                  : ['#a49480', '#000000'],
            'ROAM - arrow-black'                  : ['#000000', '#ffffff'],
            'ROAM - arrow-blue'                   : ['#0000ff', '#ffffff'],
            'ROAM - arrow-brown'                  : ['#a52a2a', '#ffffff'],
            'ROAM - arrow-dark-blue'              : ['#00008b', '#ffffff'],
            'ROAM - arrow-dark-green'             : ['#006400', '#ffffff'],
            'ROAM - arrow-gray'                   : ['#808080', '#ffffff'],
            'ROAM - arrow-green'                  : ['#008000', '#ffffff'],
            'ROAM - arrow-light-blue'             : ['#add8e6', '#000000'],
            'ROAM - arrow-light-green'            : ['#90ee90', '#000000'],
            'ROAM - arrow-light-purple'           : ['#d8bfd8', '#000000'],
            'ROAM - arrow-magenta'                : ['#ff00ff', '#ffffff'],
            'ROAM - arrow-maroon'                 : ['#800000', '#ffffff'],
            'ROAM - arrow-orange'                 : ['#ffa500', '#ffffff'],
            'ROAM - arrow-pink'                   : ['#ffc0cb', '#000000'],
            'ROAM - arrow-purple'                 : ['#800080', '#ffffff'],
            'ROAM - arrow-red'                    : ['#ff0000', '#ffffff'],
            'ROAM - arrow-silver'                 : ['#c0c0c0', '#000000'],
            'ROAM - arrow-white'                  : ['#ffffff', '#000000'],
            'ROAM - arrow-yellow'                 : ['#ffff00', '#000000'],
            'ROAM - circle-blue'                  : ['#0000ff', '#ffffff'],
            'ROAM - circle-green'                 : ['#008000', '#ffffff'],
            'ROAM - circle-orange'                : ['#ffa500', '#ffffff'],
            'ROAM - circle-red'                   : ['#ff0000', '#ffffff'],
            'ROAM - dot-blue'                     : ['#0000ff', '#ffffff'],
            'ROAM - dot-green'                    : ['#008000', '#ffffff'],
            'ROAM - dot-orange'                   : ['#ffa500', '#ffffff'],
            'ROAM - dot-red'                      : ['#ff0000', '#ffffff'],
            'ROAM - rect-arrow-blue'              : ['#0000ff', '#ffffff'],
            'ROAM - rect-arrow-green'             : ['#008000', '#ffffff'],
            'ROAM - rect-blue-circle-green-arrow' : ['#0000ff', '#ffffff'],
            'ROAM - rect-blue-circle-orange-arrow': ['#ffa500', '#ffffff'],
            'Generator - arrow-blue'              : ['#0000ff', '#ffffff'],
            'Generator - arrow-green'             : ['#008000', '#ffffff'],
            'Generator - arrow-dark-blue'         : ['#00008b', '#ffffff'],
            'Generator - arrow-maroon'            : ['#800000', '#ffffff'],
            'Pump - arrow-brown'                  : ['#a52a2a', '#ffffff'],
            'Pump - arrow-light-blue'             : ['#add8e6', '#000000'],
            'Pump - arrow-light-purple'           : ['#d8bfd8', '#ffffff'],
            'Pump - arrow-magenta'                : ['#ff00ff', '#ffffff'],
            'arrow-red'                           : ['#ff0000', '#ffffff']
        };
        var xhr = new XMLHttpRequest;
        xhr.open('get','../js/maps/ui/svg/arrow.tmpl.svg',false);
        xhr.onreadystatechange = function(){
            if (xhr.readyState != 4) return;
            me.Styler.arrowTemplate = (xhr.response);
        };
        xhr.send();
        xhr.open('get','../js/maps/ui/svg/generator.tmpl.svg',false);
        xhr.onreadystatechange = function(){
            if (xhr.readyState != 4) return;
            me.Styler.generatorTemplate = (xhr.response);
        };
        xhr.send();
        xhr.open('get','../js/maps/ui/svg/pump.tmpl.svg',false);
        xhr.onreadystatechange = function(){
            if (xhr.readyState != 4) return;
            me.Styler.pumpTemplate = (xhr.response);
        };
        xhr.send();
        Ext.Ajax.request({
            url    : App.config.serviceUrl + 'caesarObject/objectDataProvider3',
            method : App.config.ajaxType,
            success: function (response) {
            }
        });
    }

});