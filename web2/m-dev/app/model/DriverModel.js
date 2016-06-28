Ext.define('Rms.model.DriverModel', {
    extend: 'Ext.data.Model',
    config: {
        idProperty: 'domainObjectId',
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
                    return record.raw.items[0].items[0].displayValue;
                }
            },
            {
                name   : 'asset',
                convert: function (v, record) {
                    return record.raw.items[0].items[1].displayValue;
                }
            },
            {
                name   : 'timestamp',
                convert: function (v, record) {
                    var isodate = (record.raw.items[0].items[3].currentValues[0]).replace('T', ' ').replace(/-/g, '/');
                    var date    = new Date(isodate);
                    date.setMinutes(date.getMinutes() + App.config.user.timeZoneOffset);
                    return Ext.Date.format(date, App.config.user.dateTimeFormat);
                }
            }

        ]
    }
});