Ext.define('Rms.model.VisibleLocationsModel', {
    extend: 'Ext.data.Model',
    config: {
        idProperty: 'oid',
        fields    : [
            'name',
            'oid',
            'longitude',
            'latitude',
            'symbol'
        ]
    }

});