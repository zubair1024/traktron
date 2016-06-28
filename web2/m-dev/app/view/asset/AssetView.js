Ext.define('Rms.view.asset.AssetView', {
    extend    : 'Ext.Panel',
    alias     : 'widget.assetview',
    requires  : [
        'Rms.view.asset.AssetDetails',
        'Rms.view.common.ActiveAlarms',
        'Rms.view.common.CommandListPanel',
        'Rms.view.asset.AssetGroupList',
        'Rms.view.common.GeofenceListPanel',
        'Rms.view.common.GeofenceDetailsPanel',
        'Rms.view.asset.AssetsInGroup'
    ],
    config    : {
        iconCls           : 'home',
        store             : null,
        assetsInGroupStore: null,
        layout            : {
            type: 'card' ,
            animation: {type: 'fade'}
        }
    },
    initialize: function () {
        this.setItems([
            {
                xtype: 'asset_list',
                store: this.config.store
            }, {
                xtype: 'asset_details'
            }, {
                xtype: 'active_alarms_list'
            }, {
                xtype: 'command_list'
            }, {
                xtype: 'asset_groups_list'
            }, {
                xtype: 'geofence_list'
            }, {
                xtype: 'geofence_details'
            }, {
                xtype: 'all_alarm_details'
            }, {
                xtype: 'assets_in_group',
                store: this.config.assetsInGroupStore
            },
            {
                xtype: 'asset_nearest_list'
                //store: this.config.assetsInGroupStore
            }
        ]);
        this.callParent(arguments);
    }
});