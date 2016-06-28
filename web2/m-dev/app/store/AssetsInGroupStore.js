Ext.define('Rms.store.AssetsInGroupStore', {
    extend  : 'Ext.data.Store',
    requires: ['Rms.model.AssetModel'],
    config  : {
        model          : 'Rms.model.AssetModel',
        storeId        : 'assetsInGroupStore',
        autoLoad       : false,
        pageSize       : 5000,
        buffered       : true,
        clearOnPageLoad: false,
        params         : {
            domainDataView: 'allAssets',
            sortValue     : 'lastReportTime',
            sortOrder     : 1,
            filters       : JSON.stringify([])
        },
        proxy          : {
            type       : 'ajax',
            actionMethods: {
                create : 'POST',
                read   : 'POST',
                update : 'POST',
                destroy: 'POST'
            },
            crossDomain: true,
            url        : App.config.serviceUrl + 'caesarObject/objectDataProvider3',
            reader     : {
                type         : 'json',
                rootProperty : 'ui.items',
                totalProperty: 'originalSize'
            },
            extraParams: {
                domainObjectValues: JSON.stringify([
                    'name',
                    'lastReportTime',
                    'assetStatus'
                    //'location',
                    //'internalNumber',
                    //'group',
                    //'driver',
                    //'alarmStatusForAsset',
                    //'lastReportType',
                    //'configuration',
                    //'active'
                ])
            },
            limitParam : 'take',
            pageParam  : 'page',
            startParam : 'skip'
        }
    }
});