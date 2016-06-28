Ext.define('Rms.store.ActiveAlarmsStore', {
    extend  : 'Ext.data.Store',
    requires: ['Rms.model.ActiveAlarmsModel'],
    config  : {
        model   : 'Rms.model.ActiveAlarmsModel',
        storeId : 'activeAlarmsStore',
        autoLoad: false,
        pageSize: 800,
        params  : {
            view: 'asset,lastUpdatedTime,description,name,oid,assetID,position,heading'
        },
        proxy   : {
            type  : 'ajax',
            timeout: 500000,
            url   : App.config.serviceUrl + 'mobile/activeAlarms/',
            reader: {
                type        : 'json',
                rootProperty: 'data'
            }

        }
    }
});