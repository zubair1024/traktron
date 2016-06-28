Ext.define('Rms.view.LaunchApp', {
    extend      : 'Ext.tab.Panel',
    alias       : 'widget.launchapp',
    config      : {
        tabBarPosition: 'bottom',
        tabBar        : {
            scrollable: 'horizontal'
        },
        activeItem    : 0,
        layout        : {
            type     : 'card',
            animation: {type: 'fade'}
        }
    },
    requires    : [
        'Rms.view.map.AssetMapPanel',
        'Rms.view.map.MapControlLocationsList',
        'Rms.view.map.MapControlGeofenceList'
    ],
    initialize  : function () {
        this.callParent(arguments);
        Ext.Ajax.on('beforerequest', function () {
            Ext.Viewport.setMasked({
                xtype  : 'loadmask',
                message: 'Loading..'
            });
        });
        Ext.Ajax.on('requestcomplete', function () {
            Ext.Viewport.setMasked(false);
        });
        Ext.Ajax.on('requestexception', function (conn, response, options) {
            console.info(response.responseText);
            Ext.Viewport.setMasked(false);
        });
    },
    createStores: function () {
        var assetPositionStore = Ext.create('Rms.store.AssetPositionsStore');
        Ext.create('Rms.store.GeofencesStore');
        Ext.create('Rms.store.VisibleLocationsStore');
        Ext.create('Rms.store.ActiveAlarmsStore');
        Ext.create('Rms.store.AssetGroupStore');
        var assetStore         = Ext.create('Rms.store.AssetStore');
        var assetsInGroupStore = Ext.create('Rms.store.AssetsInGroupStore');
        this.setItems([{
            title  : 'Map',
            xtype  : 'mapview',
            iconCls: 'map'
        }, {
            title             : 'Assets',
            xtype             : 'assetview',
            store             : assetStore,
            assetsInGroupStore: assetsInGroupStore,
            iconCls           : 'bookmarks'
        }, {
            title  : 'Alarms',
            xtype  : 'alarmview',
            iconCls: 'alarm'
        },
                       {
                           title  : 'Stats',
                           xtype  : 'statistics_view',
                           iconCls: 'stats'
                       },
                       {
                           title  : 'Drivers',
                           xtype  : 'driverview',
                           iconCls: 'team'
                       },
                       {
                           title  : 'Logout',
                           iconCls: 'logout',
                           itemId : 'logout'
                       }
        ]);
        /**
         * Pipline and show Map first
         */

        Rms.app.getController('MapController').showAllAssetsOnMap();

        /**
         * Set additional parameters for the asset store.
         */
        assetStore.setParams(Ext.apply({}, {
            domainObjectType: App.config.rootDomainObjectType,
            domainObjectId  : App.config.rootDomainObjectId
        }, assetStore.getParams()));
        assetStore.load();
    }
});