Ext.define('Rms.model.AssetGroupModel', {
    extend: 'Ext.data.Model',
    config: {
        idProperty: 'oid',
        fields    : [
            'name',
            'oid',
            {
                name   : 'hierarchy',
                convert: function (v, record) {
                    var str = (record.raw.hierarchy).split('Default Asset Group')[0];
                    if (str.charAt(str.length - 2) == '>') {
                        str = str.slice(0, -3);
                    }
                    if (str.match(/ROAMWORKS/g)) {
                        str = str.split('-> ROAMWORKS')[0];
                    }
                    str = str.replace(/->/gi, '&#10148;');
                    return str;
                }
            },
        ]
    }
});