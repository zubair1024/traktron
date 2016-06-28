Ext.define('Rms.store.AssetPositionsStore', {
    extend  : 'Ext.data.Store',
    requires: ['Rms.model.AssetPositionsModel'],
    config  : {
        model   : 'Rms.model.AssetPositionsModel',
        storeId : 'assetPositionsStore',
        pageSize: 3000,
        grouper: {
            groupFn: function (item) {
                return;
            } // groupFn
        }, // grouper
        autoLoad: false,
        proxy   : {
            type  : 'ajax',
            actionMethods: {
                create : 'POST',
                read   : 'POST',
                update : 'POST',
                destroy: 'POST'
            },
            crossDomain: true,
            timeout: 500000,
            url   : App.config.serviceUrl + 'mobile/assetPositions/',
            reader: {
                type        : 'json',
                rootProperty: 'data'
            }

        }
    }
});