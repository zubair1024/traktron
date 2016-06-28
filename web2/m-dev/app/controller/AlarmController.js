Ext.define('Rms.controller.AlarmController', {
    extend: 'Ext.app.Controller',
    config: {
        refs: {
            alarmView: 'alarmview',
            activeAlarmBackBtn: 'alarmview active_alarms_list toolbar #back',
            alarmGroupListTap: 'alarm_list_groups list',
            activeAlarmToolbar: 'alarmview active_alarms_list toolbar',
            activeAlarmDetailsToolbarBtn: 'active_alarm_details toolbar button',
            allAlarmGroupsButton: 'alarmview all_alarm_list toolbar button[text=Groups]',
            alarmGroupListBackBtn: 'alarmview alarm_list_groups toolbar #back',
            activeAlarmListTap: 'alarmview active_alarms_list list',
            activeAlarmDetailsBackBtn: 'active_alarm_details toolbar #back',
            activeAlarmDetails: 'active_alarm_details',
            alarmGroupList: 'alarm_list_groups'
        },
        control: {
            activeAlarmBackBtn: {
                tap: 'alarmBackBtnTapped'
            },
            activeAlarmOptnBtn: {
                tap: 'alarmOptionsBtnTapped'
            },
            alarmGroupListTap: {
                itemtap: 'showAlarms'
            },
            alarmView: {
                activate: 'setAlarmStore'
            },
            allAlarmGroupsButton: {
                tap: 'allAlarmGroupsButtonTapped'
            },
            alarmGroupListBackBtn: {
                tap: 'alarmTypeBackBtnTapped'
            },
            activeAlarmListTap: {
                itemtap: 'showActiveAlarmDetails'
            },
            activeAlarmDetailsToolbarBtn: {
                tap: 'activeAlarmDetailsToolbarBtnTapped'
            }
        }
    },
    alarmBackBtnTapped: function () {
        this.getAlarmView().setActiveItem(0);
    },
    showAlarms: function (list, index, target, record, e, opts) {
        var activeAlarmsStore = Ext.create('Rms.store.ActiveAlarmsStore');

        // FIXME trickery with strings since there is no proper alarm type avail.
        this.alarmType = String(record.get('alarm_type')).substring(0, record.get('alarm_type').indexOf('('));
        this.alarmType = this.alarmType.substring(0, this.alarmType.length - 1);
        if (this.alarmType.length > 10) {
            this.getActiveAlarmToolbar().setTitle(Ext.util.Format.ellipsis(this.alarmType, 10));
        } else {
            this.getActiveAlarmToolbar().setTitle(Ext.util.Format.ellipsis(this.domainObjectName, 10));
        }
        activeAlarmsStore.on('load', function (store) {

            var alarmGroupListTap = this.getAlarmGroupListTap();
            if (alarmGroupListTap) {
                //this.getAlarmGroupListTap().deselectAll();
            }

            if (store.getCount() === 0) {
                Ext.Msg.alert('', 'There are no Alarms under this group');
            } else {
                this.getAlarmView().getAt(1).showAlarmList(store, true);
                this.getAlarmView().setActiveItem(1);
            }
        }, this);
        activeAlarmsStore.load({
            params: {
                alarmType: this.alarmType,
                view: 'asset,lastUpdatedTime,description,name,oid,assetID,position,heading'
            }
        });
        //this.getAlarmGroupListTap().deselectAll();
    },
    alarmTypeBackBtnTapped: function (Button) {
        this.getAlarmView().setActiveItem(0);
    },
    allAlarmGroupsButtonTapped: function (btn) {
        var me = this;
        //Stop Map refresher if exists
        if (Rms.app.getController('MapController').refresh) {
            Rms.app.getController('MapController').refresh = false;
            clearInterval(Rms.app.getController('MapController').refreshIntervalId);
        }
        Ext.Ajax.request({
            url: App.config.serviceUrl + 'mobile/activeAlarmGroups/',
            method: App.config.ajaxType,
            success: function (response) {
                var data = Ext.decode(response.responseText);
                me.alarmStore = Ext.create('Rms.store.AlarmStore');
                for (var i = 0; i < data.length; i++) {
                    data[i] = data[i].replace(/&#39;/g, '');
                    data[i] = data[i].replace(/-> /g, '(');
                    data[i] = data[i] + ')';
                    me.alarmStore.add({
                        'alarm_type': data[i]
                    });
                }
                me.getAlarmView().getAt(0).setAlarmsTypeStore(me.alarmStore);
                me.getAlarmView().setActiveItem(0);
            }
        });
    },
    setAlarmStore: function (thisComp, newActive, oldActive, eOpts) {
        if(!Rms.app.getController('MapController').alarmedAsset){
            this.allAlarmGroupsButtonTapped();
        }
    },
    activeAlarmDetailsToolbarBtnTapped: function (button) {
        //this.getActiveAlarmListTap().deselectAll();
        if (button.config.itemId == 'back') {
            this.getAlarmView().setActiveItem(1);
        }
        else if (button.config.text == 'Options') {
            this.getActiveAlarmDetails().addCommandOptions();
        }
    },
    showActiveAlarmDetails: function (list, index, target, record, e, opts) {
        //this.getActiveAlarmListTap().deselectAll();
        this.getAlarmGroupList().selectedAlarmId = record.get('oid');
        this.getAlarmView().getAt(3).setRecords(record);
        this.getAlarmView().setActiveItem(3);
    }
});