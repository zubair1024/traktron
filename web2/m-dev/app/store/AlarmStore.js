Ext.define('Rms.store.AlarmStore', {
    extend  : 'Ext.data.Store',
    requires: ['Rms.model.AlarmModel'],
    config  : {
        autoLoad: false,
        pageSize: 800,
        model   : 'Rms.model.AlarmModel',
        storeId : 'AlarmStore',
        proxy   : {
            reader: {
                type: 'array'
            }

        }
    }
});