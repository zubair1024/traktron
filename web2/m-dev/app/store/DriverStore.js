Ext.define('Rms.store.DriverStore', {
    extend  : 'Ext.data.Store',
    requires: ['Rms.model.DriverModel'],
    config  : {
        model          : 'Rms.model.DriverModel',
        storeId        : 'driverStore',
        pageSize       : 5000,
        buffered       : true,
        clearOnPageLoad: false,
        remoteSort     : false,
        params         : {
            domainDataView: 'drivers',
            //sortValue     : 'timestamp',
            //sortOrder     : 1,
            filters       : JSON.stringify([])
        },
        grouper        : {
            groupFn: function (item) {
                return;
            } // groupFn
        }, // grouper
        sorters        : [{}],
        proxy          : {
            type: 'ajax',
            actionMethods: {
                create : 'POST',
                read   : 'POST',
                update : 'POST',
                destroy: 'POST'
            },
            crossDomain: true,
            url        : App.config.serviceUrl + 'caesarObject/objectDataProvider3',
            timeout: 500000,
            reader     : {
                type         : 'json',
                rootProperty : 'ui.items',
                totalProperty: 'originalSize'
            },
            extraParams: {
                domainObjectValues: JSON.stringify(['name','asset','timestamp','driverId'])
            },
            limitParam : 'take',
            pageParam  : 'page',
            startParam : 'skip'

        }
    }
});