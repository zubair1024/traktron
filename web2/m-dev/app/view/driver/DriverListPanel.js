Ext.define('Rms.view.driver.DriverListPanel', {
    extend    : 'Ext.Panel',
    alias     : 'widget.driver_list',
    requires  : [
        'Rms.model.DriverModel',
        'Ext.plugin.ListPaging',
        'Ext.dataview.List',
        'Ext.field.Search'
    ],
    config    : {
        layout: 'fit',
        store : null,
        items : {}

    },
    renderList    : function () {
        this.setItems(
            {
                xtype           : 'list',
                id   : 'driverList',
                store: Ext.getStore('driverStore'),
                infinite: true,
                onItemDisclosure: true,
                variableHeights : true,
                //scrollToTopOnRefresh: false,
                items           : [
                    {
                        xtype : 'toolbar',
                        docked: 'top',
                        title : 'Drivers',
                        items : []
                    },
                    {
                        xtype : 'toolbar',
                        docked: 'top',
                        id    : 'driverListControls',
                        layout: {
                            pack: 'center'
                        },
                        items : [
                            {
                                //Segmented Button for Sorting
                                xtype        : 'segmentedbutton',
                                pack : 'center',
                                allowMultiple: false,
                                margin       : '0 0 0 10',
                                items        : [
                                    {
                                        text   : 'A-Z',
                                        handler: function () {
                                            var list  = Ext.getCmp('driverList');
                                            var store = Ext.getStore('driverStore');
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
                                            list.setIndexBar({
                                                letters  : ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'].sort(),
                                                listeners: {
                                                    index: function (html, target, eOpts) {


                                                    } // tap


                                                }
                                            });
                                            list.refresh();
                                        }
                                    },
                                    {
                                        text   : 'None',
                                        pressed: true,
                                        handler: function () {
                                            var list        = Ext.getCmp('driverList');
                                            var driverStore = Ext.getStore('driverStore');
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
                                xtype      : 'searchfield',
                                id   : 'driverListSearch',
                                docked: 'right',
                                width : 130,
                                placeHolder: 'Search',
                                listeners  : {
                                    scope       : this,
                                    keyup: function (field) {
                                        var value = field.getValue();
                                        var store = Ext.getStore('driverStore');
                                        store.clearFilter();
                                        //sto.filter('name', value);
                                        if (value) {
                                            var thisRegEx = new RegExp(value, "i");
                                            store.filterBy(function (record) {
                                                return (thisRegEx.test(record.get('name')))
                                            });
                                        }
                                        var list = Ext.getCmp('driverList');
                                        if (list.scroller) {
                                            list.scroller.scrollTo({x: 0, y: 0}, true);
                                        }
                                        list.refresh();
                                    },
                                    clearicontap: function () {
                                        var store = Ext.getStore('driverStore');
                                        store.clearFilter();
                                    }
                                }
                            }
                        ]
                    },
                    {
                        xtype    : 'toolbar',
                        docked: 'bottom',
                        minHeight: '1.8em',
                        id       : 'driversCount'
                    }
                ],
                itemTpl         : Ext.create('Ext.XTemplate',
                    '<span class="iconlist ao-{domainObjectType}"><b>{name}</b><br>{timestamp}<br><b>{asset}</b></span>', {}
                )
            });
        var assetStore = Ext.getStore('driverStore');
        assetStore.sort(new Ext.util.Sorter({
            property: 'timestamp',
            direction: 'DESC',
            sorterFn: function (o1, o2) {
                var date1 = o1.data.timestamp.replace('T', ' ');
                var first = new Date(date1.replace(/-/g, '/'));
                var date2 = o2.data.timestamp.replace('T', ' ');
                var second = new Date(date2.replace(/-/g, '/'));
                var v1 = new Date(first);
                var v2 = new Date(second);
                return v1 > v2 ? 1 : (v1 < v2 ? -1 : 0);
            }
        }));

    }
});
