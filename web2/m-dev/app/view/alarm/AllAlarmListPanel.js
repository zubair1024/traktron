Ext.define('Rms.view.alarm.AllAlarmListPanel', {
    extend       : 'Ext.Panel',
    alias        : 'widget.all_alarm_list',
    requires     : ['Ext.dataview.List', 'Ext.Panel', 'Ext.dataview.List'],
    config       : {
        layout: 'fit',
        items : {
            xtype : 'toolbar',
            docked: 'top',
            title : 'All Alarms',
            cls   : 'toolbar-title-font',
            items : [
                {
                    xtype: 'spacer'
                }, {
                    xtype: 'button',
                    text : 'Groups'
                }
            ]
        }
    },
    setAlarmStore: function (store) {
        this.setItems({
            xtype           : 'list',
            store           : store, // this.config.store,
            onItemDisclosure: true,
            itemTpl         : '<div>{name}</div>'
        });
    }
});