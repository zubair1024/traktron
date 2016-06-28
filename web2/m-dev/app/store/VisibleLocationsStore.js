Ext.define('Rms.store.VisibleLocationsStore', {
    extend  : 'Ext.data.Store',
    requires: ['Rms.model.VisibleLocationsModel'],
    config  : {
        model   : 'Rms.model.VisibleLocationsModel',
        storeId : 'visibleLocationsStore',
        pageSize: 800,
        autoLoad: false,
        grouper: {
            groupFn: function (record) {
                return
            }
        }, // grouper
        sorter:{
            property: 'name',
            direction: 'ASC'
        },
        proxy   : {
            type  : 'ajax',
            crossDomain: true,
            url   : App.config.serviceUrl + 'mobile/visibleLocations/',
            reader: {
                type        : 'json',
                rootProperty: 'data'
            }
        }
    }
});