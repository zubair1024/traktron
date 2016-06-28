Ext.define('Rms.store.AssetGroupStore', {
    extend  : 'Ext.data.Store',
    requires: ['Rms.model.AssetGroupModel'],
    config  : {
        model   : 'Rms.model.AssetGroupModel',
        storeId : 'assetGroupStore',
        autoLoad: false,
        pageSize: 800,
        grouper: {
            groupFn: function (item) {
                return item.get('name')[0].toUpperCase();
            } // groupFn
        }, // grouper
        sorter:{
            property: 'name',
            direction: 'ASC'
        },
        params  : {
            //the new method has no required params to be passed
        },
        proxy   : {
            type  : 'ajax',
            actionMethods: {
                create : 'POST',
                read   : 'POST',
                update : 'POST',
                destroy: 'POST'
            },
            crossDomain: true,
            url   : App.config.serviceUrl + 'mobile/visibleGroups/',
            reader: {
                type        : 'json',
                rootProperty: 'data'
            }
        }
    }
});