Ext.define('Rms.view.asset.AssetGroupList', {
    extend        : 'Ext.Panel',
    alias         : 'widget.asset_groups_list',
    requires      : [
        'Rms.model.AssetModel',
        'Rms.store.AssetStore',
        'Ext.dataview.List',
        'Ext.form.Panel',
        'Ext.Label'
    ],
    config        : {
        layout: 'fit',
        store : null,
        items : [{
            xtype : 'toolbar',
            docked: 'top',
            cls   : 'toolbar-title-font',
            items : [
                {
                    text  : 'Asset List',
                    itemId: 'back'
                },
                {
                    xtype      : 'searchfield',
                    width      : 130,
                    placeHolder: 'Search',
                    docked     : 'right',
                    listeners  : {
                        scope       : this,
                        keyup       : function (field) {
                            var value           = field.getValue();
                            var assetGroupStore = Ext.getStore('assetGroupStore');
                            assetGroupStore.clearFilter();
                            //sto.filter('name', value);
                            if (value) {
                                var thisRegEx = new RegExp(value, "i");
                                assetGroupStore.filterBy(function (record) {
                                    return thisRegEx.test(record.get('name'));
                                });
                            }
                        },
                        clearicontap: function () {
                            var assetGroupStore = Ext.getStore('assetGroupStore');
                            assetGroupStore.clearFilter();
                        }
                    }
                }
            ]
        },
                 {
                     xtype    : 'toolbar',
                     id       : 'totalToolbarGroups',
                     docked   : 'bottom',
                     minHeight: '1.8em',
                     title    : ''
                 }
        ]
    },
    assetGroupList: function (groupStore) {
        this.setItems({
            xtype           : 'list',
            store           : groupStore,
            grouped         : true,
            plugins         : [
                {
                    xclass   : 'Ext.ux.touch.PullRefreshFn',
                    pullText : 'Pull down to refresh the Asset Groups list!',
                    refreshFn: function () {
                        var store         = this.getList().getStore();
                        store.currentPage = 1;
                        store.load();
                        Ext.Viewport.setMasked(false);
                    }
                }
            ],
            infinite        : true,
            onItemDisclosure: true,
            variableHeights : true,
            itemTpl         : '<span class="iconlist ao-group"><b>{name}</b><br>&nbsp;<span style="font-size: 13px">{hierarchy}</span></span>'
        });
    },
    show          : function () {
        this.callParent(arguments);

        //this.down('list').show({
        //    type: 'slide',
        //    direction: 'up',
        //    duration: 300
        //});
    }
});