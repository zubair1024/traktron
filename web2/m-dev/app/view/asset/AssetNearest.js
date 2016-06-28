Ext.define('Rms.view.asset.AssetNearest', {
    extend    : 'Ext.Panel',
    alias     : 'widget.asset_nearest_list',
    requires  : [
        'Rms.model.AssetModel',
        'Ext.plugin.ListPaging',
        'Ext.dataview.List',
        'Ext.field.Search'
    ],
    config    : {
        layout: 'fit',
        store : null,
        items : {
            xtype : 'toolbar',
            docked: 'top',
            items : [
                {
                    xtype: 'button',
                    id   : 'nearest_AssetBckBtn',
                    text : 'back',
                    ui   : 'back'
                },
                {
                    xtype: 'spacer'
                },
                {
                    //Segmented Button for Sorting
                    xtype        : 'segmentedbutton',
                    pack         : 'center',
                    id           : 'nearestGrouper',
                    allowMultiple: false,
                    margin       : '0 10 0 10',
                    items        : [
                        {
                            text   : 'None',
                            pressed: true,
                            handler: function () {
                                var list = Ext.getCmp('nearestAssetList');
                                list.getStore().setGrouper({
                                    groupFn: function () {
                                        return '';
                                    }
                                });
                                list.setGrouped(false);
                                list.setIndexBar(false);
                                list.refresh();
                            }
                        },
                        {
                            text   : 'Group',
                            handler: function () {
                                var list  = Ext.getCmp('nearestAssetList');
                                var store = Ext.getStore('assetPositionsStore');
                                //Resetting the grouper
                                list.getStore().setGrouper({
                                    groupFn: function () {
                                        return '';
                                    }
                                });
                                list.setGrouped(false);
                                //Setting the grouper
                                store.setGrouper({
                                    groupFn: function (record) {
                                        return record.raw.assetGroupName.toUpperCase();
                                    }
                                });
                                list.setGrouped(true);
                                list.setIndexBar(true);
                            }
                        }
                    ]
                },
                {
                    xtype        : 'segmentedbutton',
                    pack         : 'center',
                    allowMultiple: false,
                    id           : 'distance',
                    items        : [
                        {
                            text   : '&#x25B2;',
                            pressed: true,
                            handler: function () {
                                var sorters3            = [{
                                    property : 'distance',
                                    direction: 'DESC',
                                    sorterFn : function (o1, o2) {
                                        var v1 = Number(o1.data.distance);
                                        var v2 = Number(o2.data.distance);
                                        return v1 > v2 ? -1 : (v1 < v2 ? 1 : 0);
                                    }
                                }];
                                var assetPositionsStore = Ext.getStore('assetPositionsStore');
                                //Reset
                                assetPositionsStore.setSorters([]);
                                //Add
                                assetPositionsStore.sort(sorters3);
                            }
                        },
                        {
                            text   : '&#x25BC;',
                            handler: function () {
                                var sorters4            = [{
                                    property : 'distance',
                                    direction: 'ASC',
                                    sorterFn : function (o1, o2) {
                                        var v1 = Number(o1.data.distance);
                                        var v2 = Number(o2.data.distance);
                                        return v1 < v2 ? 1 : (v1 > v2 ? -1 : 0);
                                    }
                                }];
                                var assetPositionsStore = Ext.getStore('assetPositionsStore');
                                //Reset
                                assetPositionsStore.setSorters([]);
                                //Add
                                assetPositionsStore.sort(sorters4);
                            }
                        }
                    ]

                }
            ]
        }
    },
    updateData: function (data) {
        if(!this.count){
            this.count = 0;
        }
        this.count++;
        (Ext.getCmp('nearestGrouper')).setPressedButtons([0]);
        Ext.Viewport.setMasked({
            xtype  : 'loadmask',
            message: 'Calculating the distance...'
        });
        var distanceSegmentedButton = Ext.getCmp('distance');
        distanceSegmentedButton.setPressedButtons([0]);
        var totalToolbar            = Ext.getCmp('nearAssetsTotal');
        if (totalToolbar) {
            totalToolbar.destroy();
        }
        var me = this;
        if (data || App.currentPosition) {
            var assetPositionsStore = Ext.getStore('assetPositionsStore');
            assetPositionsStore.on('load', function (store) {
                store.each(function (item) {
                    var myLatitude     = data ? parseFloat((data[0].split(','))[0]) : App.currentPosition.latitude;
                    var myLongitude    = data ? parseFloat((data[0].split(','))[1]) : App.currentPosition.longitude;
                    var assetLatitude  = item.get('latitude');
                    var assetLongitude = item.get('longitude');
                    //Using HARVESIAN formula to calculate the distance
                    var R = 6371; // use 3959 for miles or 6371 for km
                    var latitudeDifference  = (assetLatitude - myLatitude) * Math.PI / 180;
                    var longitudeDifference = (assetLongitude - myLongitude) * Math.PI / 180;
                    myLatitude              = myLatitude * Math.PI / 180;
                    assetLatitude           = assetLatitude * Math.PI / 180;
                    var a                   = Math.sin(latitudeDifference / 2) * Math.sin(latitudeDifference / 2) + Math.sin(longitudeDifference / 2) * Math.sin(longitudeDifference / 2) * Math.cos(myLatitude) * Math.cos(assetLatitude);
                    var c                   = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
                    var distance            = R * c;
                    item.data.distance      = distance.toFixed(2);
                    item.data.assetGroup    = item.raw.assetGroupName;
                });
                var sorters3 = [{
                    property : 'distance',
                    direction: 'DESC',
                    sorterFn : function (o1, o2) {
                        var v1 = Number(o1.data.distance);
                        var v2 = Number(o2.data.distance);
                        return v1 > v2 ? -1 : (v1 < v2 ? 1 : 0);
                    }
                }];
                Ext.getCmp('nearAssetsTotal').setTitle('<div style="font-size: 0.7em">' + store.getCount() + ' Assets</div>');
                assetPositionsStore.sort(sorters3);
                Ext.Viewport.setMasked(false);
            }, this);
            assetPositionsStore.load({
                params: {
                    ids        : 'all',
                    historySpec: 'ALL',
                    view       : 'assetID,longitude,latitude,eventTime,assetName,assetGroupName'
                }
            });
            me.setItems(
                [{
                    xtype           : 'list',
                    store           : 'assetPositionsStore',
                    id              : 'nearestAssetList',
                    emptyText       : 'No Assets...',
                    infinite        : true,
                    onItemDisclosure: true,
                    variableHeights : true,
                    //scrollToTopOnRefresh: false,
                    itemTpl         : Ext.create('Ext.XTemplate',
                        '<span><b>{assetName}</b><br><span>{[this.formatDateTime(values.eventTime)]}</span> | <b>{distance} KM</b><br>{assetGroup}</span>', {
                            formatDateTime: function (isodate) {
                                // FIXME Backend needs to return a ISO dateformat =(
                                var isoArray = isodate.split(" ");
                                //Month
                                var monthsArray = [/January/i, /February/i, /March/i, /April/i, /May/i, /June/i, /July/i, /August/i, /September/i, /October/i, /November/i, /December/i];
                                for (var i = 0; i < (monthsArray.length); i++) {
                                    if (monthsArray[i].test(isoArray[0])) {
                                        var month = i;
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
                                var isoDate  = year + "-" + (month + 1) + "-" + day + "T" + time;
                                var tempDate = isoDate.replace('T', ' ');
                                var date     = tempDate.replace(/-/g, '/');
                                date         = new Date(Date.parse(date));
                                date.setMinutes(date.getMinutes() + App.config.user.timeZoneOffset);
                                return Ext.Date.format(date, App.config.user.dateTimeFormat);
                            }
                        }
                    )
                }, {
                    xtype : 'toolbar',
                    id    : 'nearAssetsTotal',
                    docked: 'bottom'
                }]);
            //assetPositionsStore.setGrouper({
            //    groupFn: function (record) {
            //        return record.raw.assetGroupName.toUpperCase();
            //    }
            //});
        }
        else {
            if (navigator.geolocation) {
                Ext.Viewport.setMasked({
                    xtype  : 'loadmask',
                    message: 'Calculating the distance...'
                });
                var geo = Ext.create('Ext.util.Geolocation', {
                    autoUpdate: false,
                    listeners : {
                        locationupdate: function (geo) {
                            var assetPositionsStore = Ext.getStore('assetPositionsStore');
                            assetPositionsStore.on('load', function (store) {
                                store.each(function (item) {
                                    var myLatitude      = geo.getLatitude();
                                    var myLongitude     = geo.getLongitude();
                                    var assetLatitude   = item.get('latitude');
                                    var assetLongitude  = item.get('longitude');
                                    App.currentPosition = {
                                        latitude : geo.getLatitude(),
                                        longitude: geo.getLongitude()
                                    };
                                    //Using HARVESIAN formula to calculate the distance
                                    var R = 6371; // use 3959 for miles or 6371 for km
                                    var latitudeDifference  = (assetLatitude - myLatitude) * Math.PI / 180;
                                    var longitudeDifference = (assetLongitude - myLongitude) * Math.PI / 180;
                                    myLatitude              = myLatitude * Math.PI / 180;
                                    assetLatitude           = assetLatitude * Math.PI / 180;
                                    var a                   = Math.sin(latitudeDifference / 2) * Math.sin(latitudeDifference / 2) + Math.sin(longitudeDifference / 2) * Math.sin(longitudeDifference / 2) * Math.cos(myLatitude) * Math.cos(assetLatitude);
                                    var c                   = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
                                    var distance            = R * c;
                                    item.data.distance      = distance.toFixed(2);
                                    item.data.assetGroup    = item.raw.assetGroupName;
                                });
                                var sorters3 = [{
                                    property : 'distance',
                                    direction: 'DESC',
                                    sorterFn : function (o1, o2) {
                                        var v1 = Number(o1.data.distance);
                                        var v2 = Number(o2.data.distance);
                                        return v1 > v2 ? -1 : (v1 < v2 ? 1 : 0);
                                    }
                                }];
                                Ext.getCmp('nearAssetsTotal').setTitle('<div style="font-size: 0.7em">' + store.getCount() + ' Assets</div>');
                                //me.getAt(2).removeAll();
                                //me.getAt(2).add([
                                //    {
                                //        xtype: 'spacer'
                                //    },
                                //    {
                                //        xtype: 'title',
                                //        title: '<div style="font-size: 0.7em">'+(Ext.getStore('assetStore')).getCount()+' Assets</div>'
                                //    }
                                //]);
                                assetPositionsStore.sort(sorters3);
                                Ext.Viewport.setMasked(false);
                            }, this);
                            assetPositionsStore.load({
                                params: {
                                    ids        : 'all',
                                    historySpec: 'CURRENT',
                                    view       : 'assetID,longitude,latitude,eventTime,assetName,assetGroupName'
                                }
                            });
                            me.setItems(
                                [{
                                    xtype           : 'list',
                                    store           : 'assetPositionsStore',
                                    emptyText       : 'No Assets...',
                                    id              : 'nearestAssetList',
                                    infinite        : true,
                                    onItemDisclosure: true,
                                    variableHeights : true,
                                    //scrollToTopOnRefresh: false,
                                    itemTpl         : Ext.create('Ext.XTemplate',
                                        '<span><b>{assetName}</b><br><span>{[this.formatDateTime(values.eventTime)]}</span> | <b>{distance} KM</b><br>{assetGroup}</span>', {
                                            formatDateTime: function (isodate) {
                                                // FIXME Backend needs to return a ISO dateformat =(
                                                var isoArray = isodate.split(" ");
                                                //Month
                                                var monthsArray = [/January/i, /February/i, /March/i, /April/i, /May/i, /June/i, /July/i, /August/i, /September/i, /October/i, /November/i, /December/i];
                                                for (var i = 0; i < (monthsArray.length); i++) {
                                                    if (monthsArray[i].test(isoArray[0])) {
                                                        var month = i;
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
                                                var isoDate  = year + "-" + (month + 1) + "-" + day + "T" + time;
                                                var tempDate = isoDate.replace('T', ' ');
                                                var date     = tempDate.replace(/-/g, '/');
                                                date         = new Date(Date.parse(date));
                                                date.setMinutes(date.getMinutes() + App.config.user.timeZoneOffset);
                                                return Ext.Date.format(date, App.config.user.dateTimeFormat);
                                            }
                                        }
                                    )
                                }, {
                                    xtype : 'toolbar',
                                    id    : 'nearAssetsTotal',
                                    docked: 'bottom'
                                }]);
                        },
                        locationerror : function (geo,
                                                  bTimeout,
                                                  bPermissionDenied,
                                                  bLocationUnavailable,
                                                  message) {
                            Ext.Viewport.setMasked(false);
                            if (bTimeout) {
                                Ext.Msg.alert('Aw, Snap!', 'Timeout occurred');
                            } else {
                                Ext.Msg.alert('Aw, Snap!', 'An Error occurred<br>' + message);
                            }
                        }
                    }
                });
                geo.updateLocation();
            }

        }
        //if(!Ext.getCmp('infoToolbar')){
        //    me.setItems([
        //        {
        //            xtype    : 'toolbar',
        //            id: 'infoToolbar',
        //            docked   : 'top',
        //            minHeight: '1.7em',
        //            title    : '<div style="font-size: 0.5em">Based On Distance</div>'
        //        }
        //    ]);
        //}
        var nearestAssetList    = Ext.getCmp('nearestAssetList');
        if(nearestAssetList){
            nearestAssetList.getStore().setGrouper({
                groupFn: function () {
                    return '';
                }
            });
            nearestAssetList.setGrouped(false);
        }
        var sorters3            = [{
            property : 'distance',
            direction: 'DESC',
            sorterFn : function (o1, o2) {
                var v1 = Number(o1.data.distance);
                var v2 = Number(o2.data.distance);
                return v1 > v2 ? -1 : (v1 < v2 ? 1 : 0);
            }
        }];
        var assetPositionsStore = Ext.getStore('assetPositionsStore');
        //Reset
        assetPositionsStore.setSorters([]);
        //Add
        assetPositionsStore.sort(sorters3);
    }
});