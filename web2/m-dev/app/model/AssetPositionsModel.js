Ext.define('Rms.model.AssetPositionsModel', {
    extend: 'Ext.data.Model',
    config: {
        fields: [
            'typeShort',
            'longitude',
            'latitude',
            'eventTime',
            'heading',
            'assetID',
            'assetName',
            'locationReference'
        ]
    }
});