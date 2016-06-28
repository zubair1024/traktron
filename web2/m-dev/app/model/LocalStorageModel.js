Ext.define('Rms.model.LocalStorageModel', {
    extend: 'Ext.data.Model',
    config: {
        fields: ['key', 'username', 'password', 'applicationId'],
        proxy : {
            type: 'localstorage'
        }
    }
});