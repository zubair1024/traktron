Ext.define('Rms.view.common.AssetListPanel', {
    extend: 'Ext.Panel',
    alias: 'widget.asset_list',
    requires: [
        'Rms.model.AssetModel',
        'Ext.plugin.ListPaging',
        'Ext.dataview.List',
        'Ext.field.Search'
    ],
    config: {
        layout: 'fit',
        store: null,
        items: {}

    },
    initialize: function () {
        this.setItems(
            {
                xtype: 'list',
                id: 'assetList',
                indexBar:false,
                grouped: false,
                store: this.config.store,
                plugins: [{
                    xclass   : 'Ext.ux.touch.PullRefreshFn',
                    pullText : 'Pull down to refresh the Asset list!',
                    refreshFn: function () {
                        var list       = Ext.getCmp('assetList'),
                            assetStore = Ext.getStore('assetStore');
                        assetStore.clearFilter();
                        assetStore.removeAll();
                        assetStore.load();
                        list.refresh();
                        Ext.Viewport.setMasked(false);
                    }
                }],
                infinite: true,
                onItemDisclosure: true,
                variableHeights: true,
                //scrollToTopOnRefresh: false,
                items: [
                    {
                        xtype: 'toolbar',
                        docked: 'top',
                        items: [
                            {
                                xtype: 'searchfield',
                                id: 'assetListSearch',
                                docked: 'right',
                                width: 130,
                                placeHolder:'Search',
                                listeners: {
                                    scope: this,
                                    keyup: function (field) {
                                        var value = field.getValue();
                                        var assetStore = Ext.getStore('assetStore');
                                        assetStore.clearFilter();
                                        //sto.filter('name', value);
                                        if (value) {
                                            var thisRegEx = new RegExp(value, "i");
                                            assetStore.filterBy(function (record) {
                                                return (thisRegEx.test(record.get('name')))
                                            });
                                        }
                                        var list = Ext.getCmp('assetList');
                                        if (list.scroller) {
                                            list.scroller.scrollTo({x:0, y:0},true);
                                        }
                                        list.refresh();
                                    },
                                    clearicontap: function () {
                                        var assetStore = Ext.getStore('assetStore');
                                        assetStore.clearFilter();
                                    }
                                }
                            },
                            {
                                xtype: 'button',
                                text: 'Near',
                                id: 'nearest_Asset'
                            },

                            {
                                xtype: 'button',
                                text: 'Group List'
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
                                id: 'segmentedBtn_AssetList',
                                allowMultiple: false,
                                margin: '0 0 0 10',
                                items: [
                                    {
                                        text: 'A-Z',
                                        handler: function () {
                                            var list = Ext.getCmp('assetList');
                                            var store = Ext.getStore('assetStore');
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
                                                        letters: ['A','B','C','D','E','F','G','H','I','J','K','L','M','N','O','P','Q','R','S','T','U','V','W','X','Y','Z'].sort(),
                                                listeners: {
                                                    index: function (html, target, eOpts) {



                                                    } // tap


                                                }
                                                    });
                                            list.getIndexBar().removeCls('status')
                                        }
                                    },
                                    {
                                        text: 'Status',
                                        handler: function () {
                                            var list = Ext.getCmp('assetList');
                                            var store = Ext.getStore('assetStore');
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
                                            var list = Ext.getCmp('assetList');
                                            var assetStore = Ext.getStore('assetStore');
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
                                            var assetStore = Ext.getStore('assetStore');
                                            assetStore.sort(sorters3);
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
                                            var assetStore = Ext.getStore('assetStore');
                                            assetStore.sort(sorters4);
                                        }
                                    }
                                ]

                            }
                        ]
                    },
                    {
                        xtype: 'toolbar',
                        id:'totalAssetCount',
                        docked: 'bottom',
                        minHeight: '1.8em',
                        //title: '<div style="font-size: 0.7em">'+(Ext.getStore('assetStore')).getCount()+' Assets</div>'
                    }
                ],
                itemTpl: Ext.create('Ext.XTemplate',
                    '<span class="iconlist ao-{domainObjectType}"><b>{name}</b><br><span>' +
                    '{[this.formatDateTime(values.lastReportTime)]}<br>&nbsp;<b>' +
                    '{[this.engineState(values.assetStatus, values.domainObjectType)]}</b></span></span>', {
                        formatDateTime: function (isodate) {
                            //Fixing for iOS
                            var tempDate = isodate.replace('T', ' ');
                            var date = new Date(tempDate.replace(/-/g, '/'));
                            date.setMinutes(date.getMinutes() + App.config.user.timeZoneOffset);
                            return Ext.Date.format(date, App.config.user.dateTimeFormat);
                        },
                        engineState: function (assetStatus, config) {
                            return assetStatus.replace(/([A-Z])/g, ' $1').replace(/^./, function(str){ return str.toUpperCase(); });
                        }
                    }
                )
            });
        var assetStore = Ext.getStore('assetStore');
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
        assetStore.on('load',function(){
            Ext.getCmp('totalAssetCount').setTitle('<div ' +
                                                   'style="font-size: 0.7em">'+(Ext.getStore('assetStore')).getCount()+' ' +
                                                   'Assets</div>');
        });
    }
});
