Ext.define('Rms.view.common.GeofenceListPanel', {
    extend    : 'Ext.Panel',
    alias     : 'widget.geofence_list',
    config    : {
        layout: 'fit',
        items : {
            xtype : 'toolbar',
            docked: 'top',
            cls   : 'toolbar-title-font',
            title : 'Geofences',
            items : [
                {
                    text  : 'Back',
                    ui    : 'back',
                    itemId: 'back'
                }
            ]
        }
    },
    initialize: function () {
        this.setItems({
            xtype           : 'list',
            onItemDisclosure: true,
            store           : '',
            itemTpl         : '<div>{name}</div>'
        });
    }
});