Ext.define('Rms.view.map.MapControlGeofenceList', {
    extend          : 'Ext.Panel',
    alias           : 'widget.geofence_list_map',
    config          : {
        layout: 'fit',
        items: [
            {
                xtype: 'toolbar',
                docked: 'top',
                items: [
                    {
                        xtype: 'button',
                        text: 'Back',
                        ui: 'back'
                    },
                    {
                        xtype: 'spacer'
                    }
                ]
            }
        ]
    },
    setGeofenceStore: function (store) {
        this.setItems({
            xtype           : 'list',
            onItemDisclosure: true,
            grouped:true,
            indexBar: true,
            store           : store,
            itemTpl         : '<div>{name}</div>'
        });
    }
});