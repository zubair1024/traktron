Ext.define('Rms.store.ApplicationsStore', {
    extend  : 'Ext.data.Store',
    requires: ['Rms.model.ApplicationsModel'],
    config  : {
        model   : 'Rms.model.ApplicationsModel',
        autoLoad: false,
        proxy   : {
            type      : 'ajax',
            url       : App.config.serviceUrl + 'caesarAuthentication/applicationProviders',
            limitParam: false,
            pageParam : false,
            startParam: false,
            reader    : {
                type: 'json'
            }
        }
    }
});