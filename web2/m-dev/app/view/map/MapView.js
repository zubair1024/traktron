Ext.define('Rms.view.map.MapView', {
    extend    : 'Ext.Panel',
    alias     : 'widget.mapview',
    required  : [
        'Rms.view.common.AssetListPanel',
        'Rms.view.map.MapControl'
    ],
    config    : {
        iconCls: 'map',
        layout            : {
            type: 'card' ,
            animation: {type: 'fade'}
        }
    },
    initialize: function () {
        this.setItems([
            {
                xtype: 'asset_map_panel'
            }, {
                xtype: 'map_control'
            }, {
                xtype: 'locations_list',
                store: ''
            }, {
                xtype: 'geofence_list_map',
                store: ''
            },
            {
                xtype: 'nearby_assets_list'
            }
        ]);
    }
});