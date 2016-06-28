Ext.define('Rms.model.GeofencesModel', {
    extend: 'Ext.data.Model',
    config: {
        idProperty: 'oid',
        fields    : [
            'name',
            'configName',
            'isActive',
            'shapeType',
            'fenceDescription'
        ]
    }
});