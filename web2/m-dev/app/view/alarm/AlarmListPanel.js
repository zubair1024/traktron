Ext.define('Rms.view.alarm.AlarmListPanel', {
    extend            : 'Ext.Panel',
    alias             : 'widget.alarm_list_groups',
    requires          : [
        'Rms.store.AlarmStore',
        'Ext.Panel',
        'Ext.dataview.List'
    ],
    config            : {
        store : null,
        layout: 'fit',
        items : {
            xtype : 'toolbar',
            docked: 'top',
            title : 'Alarm Groups',
            cls   : 'toolbar-title-font'
        }
    },
    setAlarmsTypeStore: function (store) {
        this.selectedAlarmId = null;
        this.setItems({
            xtype           : 'list',
            store           : store,
            infinite        : true,
            onItemDisclosure: true,
            variableHeights : true,
            itemTpl         : '<div>{alarm_type}</div>'
        });
    }
});