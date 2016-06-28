Ext.define('Rms.view.map.MapControlLocationsList', {
    extend: 'Ext.Panel',
    alias: 'widget.locations_list',
    config: {
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
    setLocationsStore: function (store) {
        this.setItems(
            {
                xtype: 'list',
                id: 'locationList',
                indexBar: true,
                //indexBar: {
                //    letters: ['1','2','N','T','B','D','C','K','M','L','O','S'].sort()
                //},
                grouped: true,
                onItemDisclosure: true,
                store: store,
                itemTpl: '<div>{name}</div>'
            }
        );
    }
});