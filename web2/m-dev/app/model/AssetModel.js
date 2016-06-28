Ext.define('Rms.model.AssetModel', {
    extend: 'Ext.data.Model',
    config: {
        idProperty: 'domainObjectId',
        //'name',
        //'lastReportTime',
        //'assetStatus',
        //'location',
        //'internalNumber',
        //'group',
        //'driver',
        //'alarmStatusForAsset',
        //'lastReportType',
        //'configuration',
        //'active'
        fields    : [
            {
                name   : 'domainObjectType',
                convert: function (v, record) {
                    return record.raw.object.domainObjectType;
                }
            },
            {
                name   : 'domainObjectId',
                convert: function (v, record) {
                    return record.raw.object.id;
                }
            },
            {
                name   : 'name',
                convert: function (v, record) {
                    if (record.raw.items[0].items[0]) {
                        return record.raw.items[0].items[0].displayValue;
                    }
                }
            },
            {
                name   : 'lastReportTime',
                convert: function (v, record) {
                    if (record.raw.items[0].items[1]) {
                        return record.raw.items[0].items[1].currentValues[0];
                    }
                }
            },
            {
                name   : 'assetStatus',
                convert: function (v, record) {
                    if (record.raw.items[0].items[2]) {
                        var status = record.raw.items[0].items[2].currentValues[0];
                        return (status.split("."))[1];
                    }
                }
            },
            {
                name   : 'group',
                convert: function (v, record) {
                    if (record.raw.items[0].items[2]) {
                        return record.raw.items[0].items[2].displayValue;
                    }
                }
            },
            {
                name   : 'driver',
                convert: function (v, record) {
                    if (record.raw.items[0].items[10]) {
                        return record.raw.items[0].items[10].currentValues[0];
                    }

                }
            },
            {
                name   : 'Alarm',
                convert: function (v, record) {
                    if (record.raw.items[0].items[0]) {
                        var status = record.raw.items[0].items[0].currentValues[0];
                        return (status.split("."))[1];
                    }
                }
            }
        ]
    }
});