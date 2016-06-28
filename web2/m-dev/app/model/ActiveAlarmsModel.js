Ext.define('Rms.model.ActiveAlarmsModel', {
    extend: 'Ext.data.Model',
    config: {
        idProperty: 'oid',
        fields    : [
            'asset',
            'lastUpdatedTime',
            'description',
            'name',
            'assetID',
            'oid',
            'position',
            'heading'
        ]
    }
});