Ext.define('Rms.store.GeofencesStore', {
    extend  : 'Ext.data.Store',
    requires: ['Rms.model.GeofencesModel'],
    config  : {
//		storeId :'geofencesStore',
        autoLoad: false,
        pageSize: 800,
        model   : 'Rms.model.GeofencesModel',
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
            url   : App.config.serviceUrl + 'mobile/visibleGeoFences/',
            reader: {
                type        : 'json',
                rootProperty: 'data'
            }
        }
    }
});