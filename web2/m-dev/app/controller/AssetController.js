Ext.define(
    'Rms.controller.AssetController', {
        extend  : 'Ext.app.Controller',
        requires: [
            'Rms.view.asset.AssetView',
            'Rms.view.asset.AssetDetails',
            'Rms.view.common.AssetListPanel',
            'Rms.store.AssetGroupStore',
            'Rms.view.statistics.StatisticsView',
            'Rms.view.statistics.StatisticsList'
        ],

        config                  : {
            refs   : {
                launchApp                 : 'launchapp',
                assetView: 'assetview',
                assetList: 'assetview asset_list list',
                assetGrouping: 'assetview asset_list toolbar button[text=Group List]',
                assetGroupList: 'asset_groups_list',
                assetGroupListtotalToolbar: 'asset_groups_list toolbar[id=totalToolbarGroups]',
                assetGroupListBackBtn     : 'asset_groups_list toolbar #back',
                assetDetails              : 'asset_details',
                assetDetailView           : 'assetview asset_details',
                assetDetailsToolbar       : 'assetview asset_details toolbar',
                assetDtlBackBtn           : 'assetview asset_details toolbar #back',
                assetOptionsBtn           : 'assetview asset_details toolbar button[text=Options]',
                assetDtlNavBtn            : 'assetview asset_details toolbar button[text=Navigate To Asset]',
                assetDtlSMSBtn            : 'assetview asset_details toolbar button[text=Navigate To Me]',
                assetGroupListTap         : 'assetview asset_groups_list list',
                assetsInGroupListBackBtn  : 'assetview assets_in_group toolbar #back',
                assetInGroup              : 'assets_in_group',
                assetsInGroupList         : 'assets_in_group list',
                assetsInGrouptotalToolbar : 'assets_in_group toolbar[id=totalToolbarInGroup]',
                assetListSearch           : 'assetview asset_list searchfield',
                groupListSearch           : 'assetview asset_groups_list searchfield',
                assetInGroupListSearch    : 'assetview assets_in_group searchfield',
                nearestAsset              : 'assetview asset_nearest_list',
                nearestAssetList          : 'assetview asset_nearest_list list',
                nearestAssetBtn           : 'assetview asset_list toolbar button[id=nearest_Asset]',
                nearestAssetBckBtn        : 'assetview asset_nearest_list toolbar button[id=nearest_AssetBckBtn]',
                nearestAssetDtlBckBtn     : 'assetview asset_details toolbar #near',
                nearestAssetDtlAssetBckBtn: 'assetview asset_details toolbar #assetNear',
                groupOnMapBtn             : 'assetview assets_in_group toolbar button[id=groupOnMap]',
                assetDtlBackBtnFromMap    : 'assetview asset_details toolbar #map',
                //Statistics
                statisticsView            : 'statistics_view',
                statisticsList            : 'statistics_view statistics_list list',
                statisticsBarView         : 'statistics_view statistics_bar',
                statisticsPieView         : 'statistics_view statistics_pie',
                statisticsBarViewBackBtn  : 'statistics_view statistics_bar button[id=statisticsBarBckBtn]',
                statisticsPieViewBackBtn  : 'statistics_view statistics_pie button[id=statisticsPieBckBtn]',
                statisticsLineViewBackBtn : 'statistics_view statistics_line button[id=statisticsLineBckBtn]'
            },
            control: {
                statisticsList            : {
                    show   : function () {
                        //Stop Map refresher if exists
                        if (Rms.app.getController('MapController').refresh) {
                            Rms.app.getController('MapController').refresh = false;
                            clearInterval(Rms.app.getController('MapController').refreshIntervalId);
                        }
                    },
                    itemtap: function (list, index, target, record, e, opts) {
                        this.directStatsTapped = true;
                        if (record.raw.supportedViewTypes[0] == 'bar') {
                            this.getStatisticsView().setActiveItem(1);
                            this.getStatisticsBarView().updateData(record);
                        }
                        else if (record.raw.supportedViewTypes[0] == 'pie') {
                            this.getStatisticsView().setActiveItem(3);
                            this.getStatisticsPieView().updateData(record, App.config.rootDomainObjectId);
                        }
                        else if (record.raw.supportedViewTypes[0] == 'line') {
                            this.getStatisticsView().setActiveItem(2);
                            this.getStatisticsPieView().updateData(App.config.rootDomainObjectId, record.get('id'));
                        }
                        else {
                            Ext.Msg.alert('Alert', 'Sorry, we do not support the graph type right now.');
                        }
                    }
                },
                statisticsBarViewBackBtn: {
                    tap: function () {
                        this.getStatisticsView().setActiveItem(0);
                    }
                },
                statisticsPieViewBackBtn: {
                    tap: function () {
                        this.getStatisticsView().setActiveItem(0);
                    }
                },
                statisticsLineViewBackBtn: {
                    tap: function () {
                        //this.getLaunchApp().setActiveItem(1);
                        this.getStatisticsView().setActiveItem(0);
                    }
                },
                nearestAssetDtlAssetBckBtn: {
                    tap: function () {
                        console.log('nearestAssetDtlAssetBckBtn');
                        this.getAssetView().setActiveItem(9);
                        if (this.nearestAssetBtnTapped) {
                            this.showNearestAsset();
                        } else {
                            this.getNearestAsset().updateData(this.nearestAssetToAsset);
                        }
                    }
                },
                //temp stop
                groupOnMapBtn             : {
                    tap: function () {
                        var domainObjectId     = [];
                        var assetsInGroupStore = Ext.getStore('assetsInGroupStore');
                        assetsInGroupStore.each(function (item) {
                            domainObjectId.push(item.get('domainObjectId'));
                        });
                        var domainObjectIdString = domainObjectId.join(',');
                        Rms.app.getController('MapController').showSingleGroupOnMap(domainObjectIdString);
                    }
                },
                nearestAssetDtlBckBtn     : {
                    tap: function () {
                        console.log('nearestAssetDtlBckBtn');
                        if (this.nearestAssetBtnTapped) {
                            this.showNearestAsset();
                            this.id = false;
                        }
                        else {
                            this.getAssetView().setActiveItem(9);
                            this.getNearestAsset().updateData();
                        }
                    }
                },
                nearestAssetList          : {
                    itemtap: function (list, index, target, record, e, opts) {
                        console.log('nearestAssetList')
                        var me = this;
                        Ext.Viewport.setMasked({
                            xtype  : 'loadmask',
                            message: 'Fetching details...'
                        });
                        var assetStore = Ext.getStore("assetStore");
                        assetStore.each(function (i) {
                            if (i.get('name') == record.get('assetName')) {
                                domainObjectType = i.get('domainObjectType');
                                domainObjectId   = i.get('domainObjectId');
                            }
                        });
                        this.domainObjectName = record.get('assetName');
                        // This has been implemented to only display "short" names in the toolbar title.
                        domainDataView = 'details';

                        // Fetch details for this DomainObject.
                        Ext.Ajax.request({
                            url    : App.config.serviceUrl + 'caesarObject/objectDataProvider3',
                            method: App.config.ajaxType,
                            params: {
                                domainObjectId  : domainObjectId,
                                domainObjectType: domainObjectType,
                                domainDataView  : domainDataView
                            },
                            success: function (response) {
                                var data = Ext.decode(response.responseText);
                                me.getAssetView().getAt(1).updateData(data, domainObjectType, domainObjectId, me.domainObjectName);
                                me.getAssetView().setActiveItem(1);
                                me.getAssetDetailsToolbar().setTitle(Ext.util.Format.ellipsis(me.domainObjectName, 10));
                                me.getAssetDtlBackBtn().setHidden(true);
                                if (!me.nearestAssetToAsset) {
                                    me.getNearestAssetDtlBckBtn().setHidden(false);
                                    me.getNearestAssetDtlAssetBckBtn().setHidden(true);
                                } else {
                                    me.getNearestAssetDtlBckBtn().setHidden(true);
                                    me.getNearestAssetDtlAssetBckBtn().setHidden(false);
                                }
                                me.getAssetDtlBackBtnFromMap().setHidden(true);
                                Ext.Viewport.setMasked(false);
                            }
                        });
                    }
                },
                nearestAssetBckBtn        : {
                    tap: function () {
                        console.log(this.getAssetView());
                        console.log('nearestAssetBckBtn');
                        var me = this;
                        if (this.nearestFromAssetGroup) {
                            this.getAssetView().setActiveItem(8);
                            this.nearestFromAssetGroup = false;
                        } else {
                            //this.getAssetView().setActiveItem(1);
                            if (me.id) {
                                Ext.Ajax.request({
                                    url    : App.config.serviceUrl + 'caesarObject/objectDataProvider3',
                                    method: App.config.ajaxType,
                                    params: {
                                        domainObjectId  : me.id,
                                        domainObjectType: me.object,
                                        domainDataView  : 'details'
                                    },
                                    success: function (response) {
                                        var data = Ext.decode(response.responseText);
                                        me.id    = false;
                                        me.getAssetView().getAt(1).updateData(data, me.domainObjectType, me.domainObjectId, me.domainObjectName);
                                        me.getAssetView().setActiveItem(1);
                                        me.getAssetDetailsToolbar().setTitle(Ext.util.Format.ellipsis(me.name, 10));
                                    }
                                });
                            } else {
                                if (this.nearestAssetBtnTapped && !this.nearestAssetToAsset) {
                                    console.log(this.nearestAssetToAsset);
                                    console.log(this.nearestAssetBtnTapped);
                                    me.getAssetView().setActiveItem(0);
                                    this.nearestAssetBtnTapped = false;
                                } else {
                                    me.getAssetView().setActiveItem(1);
                                }
                            }
                        }
                        //map is active
                        this.getAssetDtlBackBtnFromMap().getHidden();
                        if (this.getAssetDtlBackBtnFromMap().getHidden()) {
                            this.getAssetDtlBackBtn().setHidden(false);
                        }
                        this.getNearestAssetDtlBckBtn().setHidden(true);
                        //testing
                        this.getNearestAssetDtlAssetBckBtn().setHidden(true);
                    }
                },
                nearestAssetBtn           : {
                    tap: function () {
                        console.log('nearestAssetBtn');
                        this.nearestAssetBtnTapped = true;
                        this.id                    = false;
                        this.getAssetView().setActiveItem(9);
                        this.getNearestAssetDtlBckBtn().setHidden(false);
                        this.getNearestAssetDtlAssetBckBtn().setHidden(true);
                        this.getNearestAsset().updateData();
                    }
                },
                assetList                 : {
                    itemtap: 'assetListItemTapped'
                },
                assetDtlBackBtn           : {
                    tap: 'assetDetailBackBtnTapped'
                },
                assetOptionsBtn           : {
                    tap: 'assetDetailsOptionsBtnTapped'
                },
                assetGrouping             : {
                    tap: 'showAssetGroups'
                },
                assetGroupListBackBtn     : {
                    tap: 'showAllAssetsList'
                },
                assetGroupListTap         : {
                    itemtap: 'assetGroupListItemTapped'
                },
                assetsInGroupListBackBtn  : {
                    tap: 'assetGroupListBackBtnTapped'
                },
                assetsInGroupList         : {
                    itemtap: 'assetListItemTapped'
                },
                assetView                 : {
                    activeitemchange: 'checkActiveItem'
                },
                assetDtlNavBtn            : {
                    tap: 'assetDtlNavBtnTapped'
                },
                assetDtlSMSBtn            : {
                    tap: 'assetDtlSMSBtnTapped'
                }
            }
        },
        showNearestAsset: function (data) {
            console.log(this.nearestAssetToAsset);
            console.log(this.nearestAssetBtnTapped);
            console.log('showNearestAsset');
            this.nearestAssetToAsset = false;
            if (this.getAssetDetails().assetOptions) {
                this.nearestAssetToAsset = data;
                this.getAssetDetails().assetOptions.hide();
                this.getNearestAssetDtlAssetBckBtn().setHidden(false);
            }
            this.getAssetView().setActiveItem(9);
            this.getNearestAsset().updateData(data);
        },
        showDriverStatisticsList: function () {
        },
        showLineGraph           : function (reportType) {
            this.getAssetDetails().assetOptions.hide();
            this.getLaunchApp().setActiveItem(3);
            this.getStatisticsView().setActiveItem(2);
            this.getStatisticsView().getAt(2).updateData(this.domainObjectId, reportType);
        },
        assetDtlSMSBtnTapped    : function (btn) {
            Ext.Viewport.setMasked({
                xtype  : 'loadmask',
                message: 'Fetching your location...'
            });
            if (this.getAssetDetailView().items.items) {
                var number = '';
                for (var i = 0; i < this.getAssetDetailView().items.items.length; i++) {
                    if (this.getAssetDetailView().items.items[i].getTitle() == 'Driver Attributes') {
                        for (var j = 0; j < this.getAssetDetailView().items.items[i].getItems().length; j++) {
                            if (this.getAssetDetailView().items.items[i].getItems().items[j].get('label') == 'Driver Mobile') {
                                number = this.getAssetDetailView().items.items[i].getItems().items[j].get('html');
                                break;
                            }
                        }
                        break;
                    }
                }
                if (number != '&ndash;' && number != '' && number != null) {
                    number           = number.split("\"");
                    number = number[1].split(":");
                    var driverNumber = number[1];
                    if (App.currentPosition) {
                        var myLat = App.currentPosition.latitude;
                        var myLng = App.currentPosition.longitude;
                        if (Ext.os.is('iOS')) {
                            Ext.Msg.show({
                                title  : 'Navigate To Me',
                                message: "<span><a href='sms:" + driverNumber + "&body=Click on the following link: &nbsp; https://maps.google.ae/maps?daddr=" + myLat + "," + myLng + "' class='x-button x-button-action' style='text-decoration: none;' target='_blank'>Send Your Location</a></span>",
                                buttons: Ext.MessageBox.CANCEL,
                                fn     : function (buttonId) {
                                }
                            });
                        } else {
                            Ext.Msg.show({
                                title  : 'Navigate To Me',
                                message: "<span><a href='sms:" + driverNumber + "?body=Click on the following link: &nbsp; https://maps.google.ae/maps?daddr=" + myLat + "," + myLng + "' class='x-button x-button-action' style='text-decoration: none;' style='text-align:center'>Send Your Location</a></span>",
                                buttons: Ext.MessageBox.CANCEL,
                                fn     : function (buttonId) {
                                }
                            });

                        }
                    } else {
                        if (navigator.geolocation) {
                            navigator.geolocation.getCurrentPosition(success, error);
                            function success(position) {
                                var myLat           = position.coords.latitude;
                                var myLng = position.coords.longitude;
                                App.currentPosition = {
                                    latitude : position.coords.latitude,
                                    longitude: position.coords.longitude
                                };
                                if (Ext.os.is('iOS')) {
                                    Ext.Msg.show({
                                        title  : 'Navigate To Me',
                                        message: "<span><a href='sms:" + driverNumber + "&body=Click on the following link: &nbsp; https://maps.google.ae/maps?daddr=" + myLat + "," + myLng + "' class='x-button x-button-action' style='text-decoration: none;' target='_blank'>Send Your Location</a></span>",
                                        buttons: Ext.MessageBox.CANCEL,
                                        fn     : function (buttonId) {
                                        }
                                    });
                                } else {
                                    Ext.Msg.show({
                                        title  : 'Navigate To Me',
                                        message: "<span><a href='sms:" + driverNumber + "?body=Click on the following link: &nbsp; https://maps.google.ae/maps?daddr=" + myLat + "," + myLng + "' class='x-button x-button-action' style='text-decoration: none; al'>Send Your Location</a></span>",
                                        buttons: Ext.MessageBox.CANCEL,
                                        fn     : function (buttonId) {
                                        }
                                    });

                                }
                            }

                            function error() {
                                Ext.Msg.alert("Error", "GPS is not active. Please enable it and try again.");
                            }
                        }
                        else {
                            Ext.Msg.alert("Error", "GPS is not active. Please enable it and try again.");
                        }
                    }
                } else {
                    Ext.Msg.alert("Error", "The asset has no driver number specified");
                }
            }
            Ext.Viewport.setMasked(false);
        },
        assetDtlNavBtnTapped    : function () {
            //Opening Google Maps on Device
            Ext.Viewport.setMasked({
                xtype  : 'loadmask',
                message: 'Fetching your location...'
            });
            if (this.getAssetDetailView().items.items) {
                var LatLng = '&ndash;';
                for (var i = 0; i < this.getAssetDetailView().items.items.length; i++) {
                    if (this.getAssetDetailView().items.items[i].getTitle() == 'Location') {
                        for (var j = 0; j < this.getAssetDetailView().items.items[i].getItems().length; j++) {
                            if (this.getAssetDetailView().items.items[i].getItems().items[j].get('label') == 'Position') {
                                LatLng = this.getAssetDetailView().items.items[i].getItems().items[j].get('html').innerHTML;
                                break;
                            }
                        }
                        break;
                    }
                }
                if (LatLng != '' && LatLng != App.config.blankSign && LatLng != '0.000000°, 0.000000°') {
                    if (App.currentPosition) {
                        myLat = App.currentPosition.latitude;
                        myLng = App.currentPosition.longitude;
                        Ext.Msg.show({
                            title  : 'Navigate To Asset',
                            message: "<span><a href='https://maps.google.ae/maps?saddr=" + myLat + "," + myLng + "&daddr=" + LatLng + "' class='x-button x-button-action' style='text-decoration: none;' target='_blank'>Open Google Maps Navigation</a></span>",
                            buttons: Ext.MessageBox.CANCEL,
                            fn     : function (buttonId) {
                            }
                        });
                    } else {
                        if (navigator.geolocation) {
                            navigator.geolocation.getCurrentPosition(success);
                            function success(position) {
                                myLat               = position.coords.latitude;
                                myLng = position.coords.longitude;
                                App.currentPosition = {
                                    latitude : position.coords.latitude,
                                    longitude: position.coords.longitude
                                };
                                Ext.Msg.show({
                                    title  : 'Navigate To Asset',
                                    message: "<span><a href='https://maps.google.ae/maps?saddr=" + myLat + "," + myLng + "&daddr=" + LatLng + "' class='x-button x-button-action' style='text-decoration: none;' target='_blank'>Open Google Maps Navigation</a></span>",
                                    buttons: Ext.MessageBox.CANCEL,
                                    fn     : function (buttonId) {
                                    }
                                });
                            }
                        }
                        else {
                            Ext.Msg.alert("Error", "GPS is not active. Please enable it and try again");

                        }
                    }
                } else {
                    Ext.Msg.alert("Error", "No GPS Coordinates Avaliable");
                }
            }
            Ext.Viewport.setMasked(false);
        }
        ,
        checkActiveItem         : function (ths, newActive, oldActive, optn) {
            var active = oldActive.initialConfig.xtype;
            if (active == 'asset_list' || active == 'asset_groups_list') {
                this.changeToList = active;
            }
        }
        ,
        assetListItemTapped     : function (list, index, target, record, e, opts) {
            var me = this;
            console.log('assetListItemTapped');
            console.log(this.nearestAssetBtnTapped);
            console.log(this.nearestAssetToAsset);
            console.log('assetListItemTapped');
            this.object = this.domainObjectType = record.get('domainObjectType');
            this.id = this.domainObjectId = record.get('domainObjectId');
            this.name = this.domainObjectName = record.get('name');


            // This has been implemented to only display "short" names in the toolbar title.
            this.getAssetDetailsToolbar().setTitle(Ext.util.Format.ellipsis(this.domainObjectName, 10));
            domainObjectType   = record.get('domainObjectType');
            domainDataView   = 'details';
            domainObjectValues = this.getDomainObjectValues(domainDataView, domainObjectType);
            // Fetch details for this DomainObject.
            Ext.Ajax.request({
                url    : App.config.serviceUrl + 'caesarObject/objectDataProvider3',
                method: App.config.ajaxType,
                params: {
                    domainObjectId    : me.domainObjectId,
                    domainObjectValues: JSON.stringify(domainObjectValues),
                    domainObjectType  : domainObjectType,
                    domainDataView    : domainDataView
                },
                success: function (response) {
                    var data = Ext.decode(response.responseText);
                    me.getAssetView().getAt(1).updateData(data, domainObjectType, me.domainObjectId, me.domainObjectName);
                    me.getAssetView().setActiveItem(1);
                    //Resetting the previous view
                    me.getAssetListSearch().setValue('');
                    var assetStore = Ext.getStore('assetStore');
                    assetStore.clearFilter();
                }
            });
        }
        ,
        assetDetailBackBtnTapped: function (btn) {
            console.log('assetDetailBackBtnTapped');
            if (this.changeToList == 'asset_list') {
                if (this.fromMap) {
                    this.fromMap = false;
                    this.getLaunchApp().setActiveItem(1);
                    this.getAssetView().setActiveItem(0);
                } else if (this.nearestAssetBtnTapped) {
                    this.showNearestAsset();
                } else {
                    this.getAssetView().setActiveItem(0);
                }
            } else {
                //Resetting the previous view
                if (this.getAssetInGroupListSearch().getValue()) {
                    this.getAssetInGroupListSearch().setValue('');
                    var assetsInGroupStore = Ext.getStore('assetsInGroupStore');
                    assetsInGroupStore.clearFilter();
                    this.getAssetsInGroupList().refresh();
                }
                this.getAssetView().setActiveItem(8);
            }
            //Resetting the previous view
            this.getAssetListSearch().setValue('');
            var sto = Ext.getStore('assetStore');
            sto.clearFilter();
        }
        ,

        assetDetailsOptionsBtnTapped : function () {
            this.getAssetView().getActiveItem().addAssetOptions();
        }
        ,
        commandListPanelBackBtnTapped: function () {
            this.getAssetView().setActiveItem(1);
        }
        ,
        showAllAssetsList            : function () {
            console.log('showAllAssetsList');
            this.nearestFromAssetGroup = false;
            this.getAssetView().setActiveItem(0);
            //Resetting the previous view
            if (this.getGroupListSearch().getValue()) {
                this.getGroupListSearch().setValue('');
                var sto = Ext.getStore('assetGroupStore');
                sto.clearFilter();
            }
            //Resetting the previous view
            if (this.getAssetInGroupListSearch().getValue()) {
                this.getAssetInGroupListSearch().setValue('');
                var stor = Ext.getStore('assetsInGroupStore');
                stor.clearFilter();
                this.getAssetInGroupListSearch().refresh();
            }
        }
        ,
        showAssetGroups              : function () {
            var assetGroupStore = Ext.getStore('assetGroupStore');
            assetGroupStore.on('load', function (store) {
                this.getAssetGroupListtotalToolbar().setTitle('<div style="font-size: 0.7em">'
                                                              + assetGroupStore.getCount() +
                                                              ' Group(s)</div>');
                this.getAssetGroupList().assetGroupList(store);
                this.getAssetView().setActiveItem(4);
            }, this);
            assetGroupStore.load({
                params: {
                    view: 'oid,name'
                }
            });
            //Resetting the previous view
            this.getAssetListSearch().setValue('');
            var assetStore = Ext.getStore('assetStore');
            assetStore.clearFilter();
        }
        ,
        assetGroupListBackBtnTapped  : function (btn) {
            this.getAssetView().setActiveItem(4);
            //Resetting the previous view
            if (this.getGroupListSearch().getValue()) {
                this.getGroupListSearch().setValue('');
                var sto = Ext.getStore('assetGroupStore');
                sto.clearFilter();
            }
            //Resetting the previous view
            if (this.getAssetInGroupListSearch().getValue()) {
                this.getAssetInGroupListSearch().setValue('');
                var assetsInGroupStore = Ext.getStore('assetsInGroupStore');
                assetsInGroupStore.clearFilter();
                this.getAssetInGroupListSearch().refresh();
            }
        }
        ,
        assetGroupListItemTapped     : function (list, index, target, record, e, opts) {
            this.nearestFromAssetGroup = true;
            this.assetGroupName        = record.get('name');
            // this.getAssetView().getAt(8).getItems().getAt(0).setTitle(Ext.util.Format.ellipsis(this.assetGroupName, 7));
            var assetInGroupStore = Ext.getStore('assetsInGroupStore');
            assetInGroupStore.removeAll();
            assetInGroupStore.setParams(Ext.apply({}, {
                // FIXME use proper domainObjectType instead of "group".
                domainObjectType: 'group',
                domainObjectId  : record.get('oid') // coming from AssetGroupModel.
            }, assetInGroupStore.getParams()));
            assetInGroupStore.on('load', function (store) {
                // FIXME quite overnested here...
                this.getAssetsInGrouptotalToolbar().setTitle('<div style="font-size: 0.7em">' + Ext.getStore('assetsInGroupStore').getCount() + ' Asset(s)</div>');
                //this.getAssetView().getAt(8).getAt(2).refresh();
                this.getAssetView().getAt(8).getAt(3).refresh();
                this.getAssetView().setActiveItem(8);
                store.clearListeners();
                ////reset all controls
                this.getAssetInGroup().getAt(1).getAt(0).setPressedButtons([2]);
                this.getAssetInGroup().getAt(1).getAt(2).setPressedButtons([0]);
                this.getAssetInGroup().reset();
            }, this);
            assetInGroupStore.load();
            //Resetting the previous view
            if (this.getGroupListSearch().getValue()) {
                this.getGroupListSearch().setValue('');
                var assetGroupStore = Ext.getStore('assetGroupStore');
                assetGroupStore.clearFilter();
            }
            //Resetting the previous view
            if (this.getAssetInGroupListSearch().getValue()) {
                this.getAssetInGroupListSearch().setValue('');
                var assetsInGroupStore = Ext.getStore('assetsInGroupStore');
                assetsInGroupStore.clearFilter();
                // this.getAssetInGroupListSearch().refresh();

            }
        },

        getDomainObjectValues: function (domainDataView, domainOjectType) {
            var values = [];
            if (App.domainDataViewModel[domainOjectType]) {
                values = App.domainDataViewModel[domainOjectType][domainDataView].domainObjectValues;
            }
            return values
        }
    })
;