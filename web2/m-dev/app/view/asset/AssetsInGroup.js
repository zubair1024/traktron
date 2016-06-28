Ext.define('Rms.view.asset.AssetsInGroup', {
    extend: 'Ext.Panel',
    alias: 'widget.assets_in_group',
    requires: [
        'Rms.model.AssetModel',
        'Rms.store.AssetStore',
        'Rms.store.AssetsInGroupStore',
        'Ext.Panel',
        'Ext.dataview.List',
        'Ext.field.Search'

    ],
    config: {
        layout: 'fit',
        store: null,
        items: [
            {
                xtype: 'toolbar',
                docked: 'top',
                cls: 'big-text',
                items: [
                    {
                        text: 'Back',
                        ui: 'back',
                        itemId: 'back'
                    },
                    {
                        xtype: 'button',
                        text:'On Map',
                        id:'groupOnMap'
                    },
                    {
                        xtype: 'searchfield',
                        width: 130,
                        placeHolder:'Search',
                        docked: 'right',
                        listeners: {
                            scope: this,
                            keyup: function (field) {
                                var assetsInGroupList = Ext.getCmp('assetsInGroupList');
                                var value = field.getValue();
                                var sto = Ext.getStore('assetsInGroupStore');
                                sto.clearFilter();
                                //sto.filter('name', value);
                                if (value) {
                                    var thisRegEx = new RegExp(value, "i");
                                    sto.filterBy(function (record) {
                                        return (thisRegEx.test(record.get('name')))
                                    });
                                }
                                assetsInGroupList.refresh();
                            },
                            clearicontap: function () {
                                var assetsInGroupList = Ext.getCmp('assetsInGroupList');
                                var sto = Ext.getStore('assetsInGroupStore');
                                sto.clearFilter();
                                sto.load();
                                assetsInGroupList.refresh();
                            }
                        }
                    }
                ]
            },
            {

                xtype: 'toolbar',
                docked: 'top',
                layout: {
                    pack: 'center'
                },
                items: [
                    {
                        //Segmented Button for Sorting
                        xtype: 'segmentedbutton',
                        pack: 'center',
                        allowMultiple: false,
                        margin: '0 0 0 10',
                        items: [
                            {
                                text: 'A-Z',
                                handler: function () {
                                    var list = Ext.getCmp('assetsInGroupList');
                                    var store = Ext.getStore('assetsInGroupStore');
                                    //Resetting the grouper
                                    list.getStore().setGrouper({
                                        groupFn: function () {
                                            return '';
                                        }
                                    });
                                    //list.setIndexBar(false);
                                    list.setGrouped(false);
                                    //Setting the grouper
                                    store.setGrouper({
                                        groupFn: function (record) {
                                            return record.get('name')[0].toUpperCase();
                                        }
                                    });
                                    list.setGrouped(true);
                                    //list.setIndexBar(true);
                                    list.setIndexBar( {
                                        letters: ['A','B','C','D','E','F','G','H','I','J','K','L','M','N','O','P','Q','R','S','T','U','V','W','X','Y','Z'].sort()
                                    });
                                    list.getIndexBar().removeCls('status')
                                }
                            },
                            {
                                text: 'Status',
                                handler: function () {
                                    var list = Ext.getCmp('assetsInGroupList');
                                    var store = Ext.getStore('assetsInGroupStore');
                                    //Resetting the Grouper
                                    list.getStore().setGrouper({
                                        groupFn: function () {
                                            return '';
                                        }
                                    });
                                    list.setGrouped(false);
                                    //Setting the grouper
                                    store.setGrouper({
                                        groupFn: function (record) {
                                            return record.get('assetStatus').toUpperCase();
                                        }
                                    });
                                    list.setGrouped(true);
                                    //list.setIndexBar(false);
                                    list.setIndexBar({
                                        letters: ['IDLING','NORMAL','NOTMOV','NOTOP']
                                    });
                                    list.getIndexBar().setCls('status');

                                }
                            },
                            {
                                text: 'None',
                                pressed: true,
                                handler: function () {
                                    var list = Ext.getCmp('assetsInGroupList');
                                    list.getStore().setGrouper({
                                        groupFn: function () {
                                            return '';
                                        }
                                    });
                                    list.setGrouped(false);
                                    list.setIndexBar(false);
                                    list.refresh();
                                }
                            }
                        ]
                    },
                    {
                        xtype: 'spacer'
                    },
                    {
                        xtype: 'segmentedbutton',
                        pack: 'center',
                        allowMultiple: false,
                        margin: '0 10 0 0',
                        items: [
                            {
                                text: 'T &#x25BC;',
                                pressed: true,
                                handler: function () {
                                    //Sort by Last Reported Time
                                    var sorters3 = [{
                                        property: 'lastReportTime',
                                        direction: 'DESC',
                                        sorterFn: function (o1, o2) {
                                            var date1 = o1.data.lastReportTime.replace('T', ' ');
                                            var first = new Date(date1.replace(/-/g, '/'));
                                            var date2 = o2.data.lastReportTime.replace('T', ' ');
                                            var second = new Date(date2.replace(/-/g, '/'));
                                            var v1 = new Date(first);
                                            var v2 = new Date(second);
                                            return v1 > v2 ? 1 : (v1 < v2 ? -1 : 0);
                                        }
                                    }];
                                    var assetStore = Ext.getStore('assetsInGroupStore');
                                    assetStore.sort(sorters3);
                                    var list = Ext.getCmp('assetsInGroupList');
                                    list.refresh();
                                }
                            },
                            {
                                text: 'T &#x25B2;',
                                handler: function () {
                                    //Sort by Last Reported Time
                                    var sorters4 = [{
                                        property: 'lastReportTime',
                                        direction: 'ASC',
                                        sorterFn: function (o1, o2) {
                                            var date1 = o1.data.lastReportTime.replace('T', ' ');
                                            var first = new Date(date1.replace(/-/g, '/'));
                                            var date2 = o2.data.lastReportTime.replace('T', ' ');
                                            var second = new Date(date2.replace(/-/g, '/'));
                                            var v1 = new Date(first);
                                            var v2 = new Date(second);
                                            return v1 > v2 ? 1 : (v1 < v2 ? -1 : 0);
                                        }
                                    }];
                                    var assetStore = Ext.getStore('assetsInGroupStore');
                                    assetStore.sort(sorters4);
                                    var list = Ext.getCmp('assetsInGroupList');
                                    list.refresh();
                                }
                            }
                        ]

                    }
                ]
            },
            {
                xtype:'toolbar',
                docked: 'bottom',
                id:'totalToolbarInGroup',
                minHeight: '1.8em',
                title: ''
            }
        ]
    },
    initialize: function () {
        this.setItems(
            {
                xtype: 'list',
                id: 'assetsInGroupList',
                store: 'assetsInGroupStore',
                plugins: [
                    {
                        xclass: 'Ext.ux.touch.PullRefreshFn',
                        pullText: 'Pull down to refresh the Asset list!',
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
                    '<span class="iconlist ao-{domainObjectType}"><b>{name}</b>' +
                    '<br><span>{[this.formatDateTime(values.lastReportTime)]}<br>' +
                    '&nbsp;<b>{[this.engineState(values.assetStatus, values.domainObjectType)]}</b>' +
                    '</span></span>', {
                        formatDateTime: function (isodate) {
                            //Fixing for iOS
                            var tempDate = isodate.replace('T', ' ');
                            var date = new Date(tempDate.replace(/-/g, '/'));
                            date.setMinutes(date.getMinutes() + App.config.user.timeZoneOffset);
                            return Ext.Date.format(date, App.config.user.dateTimeFormat);
                        },
                        engineState: function (assetStatus, config) {
                            if (config == 'canbusfleetvehicle') {
                                if (assetStatus == 'normal') {
                                    return "Engine ON"
                                } else if (assetStatus == 'idling') {
                                    return 'Idle'
                                }
                                else {
                                    return "Engine OFF"
                                }
                            } else {
                                if (assetStatus == 'normal' || assetStatus == 'idling') {
                                    return "Operating"
                                } else {
                                    return "Not Operating"
                                }

                            }

                        }
                    }
                )
            });
        this.reset();
    },
    show: function() {
        this.callParent(arguments);

        this.down('list').show({
            type: 'slide',
            direction: 'down',
            duration: 300
        });
    },
    reset: function(){
        var list = Ext.getCmp('assetsInGroupList');
        var assetStore = Ext.getStore('assetsInGroupStore');
        assetStore.sort(new Ext.util.Sorter({
            property: 'lastReportTime',
            direction: 'DESC',
            sorterFn: function (o1, o2) {
                var date1 = o1.data.lastReportTime.replace('T', ' ');
                var first = new Date(date1.replace(/-/g, '/'));
                var date2 = o2.data.lastReportTime.replace('T', ' ');
                var second = new Date(date2.replace(/-/g, '/'));
                var v1 = new Date(first);
                var v2 = new Date(second);
                return v1 > v2 ? 1 : (v1 < v2 ? -1 : 0);
            }
        }));
        list.getStore().setGrouper({
            groupFn: function () {
                return '';
            }
        });
        list.setGrouped(false);
        list.setIndexBar(false);
        list.refresh();
    }
});