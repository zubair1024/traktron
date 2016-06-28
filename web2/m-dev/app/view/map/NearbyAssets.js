Ext.define('Rms.view.map.NearbyAssets', {
    extend: 'Ext.Panel',
    alias: 'widget.nearby_assets_list',
    requires: [
        'Rms.model.AssetModel',
        'Rms.store.AssetStore',
        'Ext.dataview.List',
        'Ext.form.Panel',
        'Ext.Label'
    ],
    config: {
        layout: 'fit',
        store: null,
        items: {
            xtype: 'toolbar',
            docked: 'top',
            cls: 'toolbar-title-font',
            items: [
                {
                    text: 'Back',
                    ui: 'back',
                    itemId: 'back'
                }
            ]
        }
    },
    updateData: function () {
        // please wait - async op
        Ext.Viewport.setMasked({
            xtype: 'loadmask',
            message: 'Calculating the distance...'
        });
        // preserve scope for callback
        var me = this;
        //Caching the value for iPhone
        if(App.currentPosition){
            var assetPositionsStore = Ext.getStore('assetPositionsStore');
            assetPositionsStore.filterBy(function (record) {
                var myLatitude = App.currentPosition.latitude;
                var myLongitude = App.currentPosition.longitude;
                var assetLatitude = record.get('latitude');
                var assetLongitude = record.get('longitude');
                //Using HARVESIAN formula to calculate the distance
                var R = 6371; // use 3959 for miles or 6371 for km
                var latitudeDifference = (assetLatitude - myLatitude) * Math.PI / 180;
                var longitudeDifference = (assetLongitude - myLongitude) * Math.PI / 180;
                myLatitude = myLatitude * Math.PI / 180;
                assetLatitude = assetLatitude * Math.PI / 180;
                var a = Math.sin(latitudeDifference / 2) * Math.sin(latitudeDifference / 2) + Math.sin(longitudeDifference / 2) * Math.sin(longitudeDifference / 2) * Math.cos(myLatitude) * Math.cos(assetLatitude);
                var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
                var distance = R * c;
                //getting an error using record.set()
                if (distance < 1) {
                    record.data.distance = distance.toFixed(2);
                    return true;
                }
                else {
                    return false;
                }
            });
            me.setItems(
                {
                    xtype: 'list',
                    id: 'nearbyAssetList',
                    store: assetPositionsStore,
                    emptyText: 'No Assets Nearby..',
                    plugins: [
                        {
                            xclass: 'Ext.ux.touch.PullRefreshFn',
                            pullText: 'Pull down to refresh the Asset Groups list!',
                            refreshFn: function () {
                                var store = this.getList().getStore();
                                store.currentPage = 1;
                                store.load();
                                Ext.Viewport.setMasked(false);

                            }
                        }
                    ],
                    infinite: true,
                    onItemDisclosure: true,
                    variableHeights: true,
                    itemTpl: Ext.create('Ext.XTemplate',
                        '<span><b>{assetName}</b><br><span>{[this.formatDateTime(values.eventTime)]}</span> | <b>{distance}</b>KM</span>', {
                            formatDateTime: function (isodate) {
                                // FIXME Backend needs to return a ISO dateformat =(
                                var isoArray = isodate.split(" ");
                                //Month
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
                                time = time.replace(".", "");
                                //The date formatted in the ISO standard
                                isodate = year + "-" + (month + 1) + "-" + day + "T" + time;
                                var tempDate = isodate.replace('T', ' ');
                                var date = tempDate.replace(/-/g, '/');
                                date = new Date(Date.parse(date));
                                date.setMinutes(date.getMinutes() + App.config.user.timeZoneOffset);
                                return Ext.Date.format(date, App.config.user.dateTimeFormat);
                            }
                        }
                    )
                });
            Ext.Viewport.setMasked(false);
        }else{
            var geo = Ext.create('Ext.util.Geolocation', {
                autoUpdate: false,
                listeners: {
                    locationupdate: function (geo) {
                        // calculate distance to target
                        var assetPositionsStore = Ext.getStore('assetPositionsStore');
                        assetPositionsStore.filterBy(function (record) {
                            var myLatitude = geo.getLatitude();
                            var myLongitude = geo.getLongitude();
                            var assetLatitude = record.get('latitude');
                            var assetLongitude = record.get('longitude');
                            App.currentPosition={
                                latitude:geo.getLatitude(),
                                longitude: geo.getLongitude()
                            };
                            //Using HARVESIAN formula to calculate the distance
                            var R = 6371; // use 3959 for miles or 6371 for km
                            var latitudeDifference = (assetLatitude - myLatitude) * Math.PI / 180;
                            var longitudeDifference = (assetLongitude - myLongitude) * Math.PI / 180;
                            myLatitude = myLatitude * Math.PI / 180;
                            assetLatitude = assetLatitude * Math.PI / 180;
                            var a = Math.sin(latitudeDifference / 2) * Math.sin(latitudeDifference / 2) + Math.sin(longitudeDifference / 2) * Math.sin(longitudeDifference / 2) * Math.cos(myLatitude) * Math.cos(assetLatitude);
                            var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
                            var distance = R * c;
                            //getting an error using record.set()
                            if (distance < 1) {
                                record.data.distance = distance.toFixed(2) + 'KM';
                                return true;
                            }
                            else {
                                return false;
                            }
                        });
                        me.setItems(
                            {
                                xtype: 'list',
                                id: 'nearbyAssetList',
                                store: assetPositionsStore,
                                emptyText: 'No Assets Nearby..',
                                plugins: [
                                    {
                                        xclass: 'Ext.ux.touch.PullRefreshFn',
                                        pullText: 'Pull down to refresh the Asset Groups list!',
                                        refreshFn: function () {
                                            var store = this.getList().getStore();
                                            store.currentPage = 1;
                                            store.load();
                                        }
                                    }
                                ],
                                infinite: true,
                                onItemDisclosure: true,
                                variableHeights: true,
                                itemTpl: Ext.create('Ext.XTemplate',
                                    '<span><b>{assetName}</b><br><span>{[this.formatDateTime(values.eventTime)]}</span> | <b>{distance}</b></span>', {
                                        formatDateTime: function (isodate) {
                                            // FIXME Backend needs to return a ISO dateformat =(
                                            var isoArray = isodate.split(" ");
                                            //Month
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
                                            time = time.replace(".", "");
                                            //The date formatted in the ISO standard
                                            isodate = year + "-" + (month + 1) + "-" + day + "T" + time;
                                            var tempDate = isodate.replace('T', ' ');
                                            var date = tempDate.replace(/-/g, '/');
                                            date = new Date(Date.parse(date));
                                            date.setMinutes(date.getMinutes() + App.config.user.timeZoneOffset);
                                            return Ext.Date.format(date, App.config.user.dateTimeFormat);
                                        }
                                    }
                                )
                            });
                        Ext.Viewport.setMasked(false);
                    }
                    ,
                    locationerror: function (geo,
                                             bTimeout,
                                             bPermissionDenied,
                                             bLocationUnavailable,
                                             message) {
                        Ext.Viewport.setMasked(false);
                        if (bTimeout) {
                            Ext.Msg.alert('Aw, Snap!', 'Timeout occurred');
                        } else {
                            Ext.Msg.alert('Aw, Snap!', 'An Error occurred<br>'+message);
                        }
                    }
                }
            });
// run once
            geo.updateLocation();
        }
        //initialize sorting function
        var sorter = [{
            sorterFn : function (o1, o2) {
                var v1 = Number(o1.data.distance);
                var v2 = Number(o2.data.distance);
                return v1 < v2 ? -1 : (v1 > v2 ? 1 : 0);
            }
        }];
        //sort by distance
        assetPositionsStore.sort(sorter);
    }
});