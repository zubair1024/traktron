Ext.define('Rms.view.alarm.AlarmView', {
    extend: 'Ext.Panel',
    alias: 'widget.alarmview',
    requires: [
        'Rms.view.alarm.ActiveAlarmDetailsPanel',
        'Rms.view.alarm.AlarmListPanel',
        'Rms.view.alarm.AllAlarmListPanel',
        'Rms.view.alarm.AllAlarmDetailsPanel',
        'Rms.view.common.ActiveAlarms'
    ],
    config: {
        store: null,
        iconCls: 'alarm',
        layout: {
            type: 'card',
            animation: {type: 'fade'}
        },
        badgeText: '',
        items: [
            {
                xtype: 'alarm_list_groups',
                store: null
            }, {
                xtype: 'active_alarms_list',
                store: null
            }, {
                xtype: 'all_alarm_details'
            }, {
                xtype: 'active_alarm_details'
            }
        ]
    },
    initialize: function () {
        var me = this;
        //Setting the badgeText for Alarms Tab
        Ext.Ajax.request({
            async: false,
            url: App.config.serviceUrl + 'mobile/activeAlarmGroups/',
            method: App.config.ajaxType,
            success: function (response) {
                var data = Ext.decode(response.responseText);
                var badgeCount = 0;
                for (var i = 0; i < data.length; i++) {
                    badgeCount += Number((data[i].split('>'))[1]);
                }
                me.setBadgeText(badgeCount);
            }
        });
    }
});