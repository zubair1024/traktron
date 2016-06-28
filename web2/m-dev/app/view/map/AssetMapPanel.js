Ext.define('Rms.view.map.AssetMapPanel', {
    extend    : 'Ext.Panel',
    alias     : 'widget.asset_map_panel',
    config    : {
        record: null,
        layout: {
            type: 'fit'
        },
        items : [
            {
                xtype : 'toolbar',
                title : 'All Assets',
                cls   : 'toolbar-title-font',
                docked: 'top',
                items : [{
                        text  : 'Back',
                        ui    : 'back',
                        itemId: 'back',
                        hidden: 'true'
                    }, {
                        xtype:'button',
                        text:'Group',
                        itemId:'backToGroup',
                        ui:'back',
                        hidden:true
                    }
                    , {
                        xtype: 'button',
                        text : '< 1 KM'
                        //hidden: true
                    }
                    , {
                        xtype: 'spacer'
                    }, {
                        xtype: 'button',
                        text : 'Controls'
                    }
                ]
            }, {
                xtype: 'map'
            }
        ]
    },
    setRecords: function (record) {
        this.getAt(1).setTitle(Ext.util.Format.ellipsis(record.get('name'), 10));
    }
});
