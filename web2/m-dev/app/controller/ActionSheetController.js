Ext.define('Rms.controller.ActionSheetController', {
    extend  : 'Ext.app.Controller',
    requires: [
        'Rms.view.asset.AssetView',
        'Rms.view.asset.AssetDetails',
        'Rms.store.GeofencesStore'
    ],
    config  : {
        refs   : {
            actionSheetButton           : 'actionsheet button',
            commandListPanelBackBtn     : 'command_list toolbar #back',
            commandListCommandButton    : 'command_list button',
            activeAlarmToolbar          : 'assetview active_alarms_list toolbar',
            activeAlarmListBackbtn      : 'assetview active_alarms_list toolbar #back',
            activeAlarmListItem         : 'assetview active_alarms_list list',
            activeAlarmDetailsBackBtn   : 'assetview all_alarm_details #back',
            activeAlarmDetailsOptionsBtn: 'assetview all_alarm_details button[text=Options]',
            activeAlarmDetails          : 'active_alarm_details',
            assetDetails                : 'asset_details',
            assetView                   : 'assetview',
            geofenceListPanelBackBtn    : 'geofence_list toolbar #back',
            geofenceList                : 'geofence_list list',
            geofenceDetailsBackBtn      : 'geofence_details toolbar button',
            alarmGroupList              : 'alarm_list_groups',
            launchApp                   : 'launchapp'
        },
        control: {
            actionSheetButton           : {
                tap: 'actionSheetButtonTapped'
            },
            commandListPanelBackBtn     : {
                tap: 'commandListPanelBackBtnTapped'
            },
            activeAlarmListBackbtn      : {
                tap: 'commandListPanelBackBtnTapped'
            },
            activeAlarmDetailsOptionsBtn: {
                tap: 'activeAlarmDetailsOptionsBtn'
            },
            geofenceListPanelBackBtn    : {
                tap: 'geofenceListPanelBackBtnTapped'
            },
            geofenceList                : {
                itemtap: 'showGeofenceDetails'
            },
            geofenceDetailsBackBtn      : {
                tap: 'geofenceDetailsBackBtnTapped'
            },
            activeAlarmListItem         : {
                itemtap: 'showAlarmDetails'
            },
            activeAlarmDetailsBackBtn   : {
                tap: 'activeAlarmDetailsBackBtnTaped'
            },
            commandListCommandButton    : {
                tap: 'commandListCommandButtonTapped'
            },
            launchApp                   : {
                initialize: 'createStoreInstance'
            }
        }
    },

    createStoreInstance: function () {
        this.actionSheetgeofenceStore = Ext.create('Rms.store.GeofencesStore');
    },

    actionSheetButtonTapped: function (button) {
        console.log(button.getItemId());
        switch (button.getItemId()) {
            case 'alarm':
                this.actionSheetAlarmBtnTapped();
                break;
            case 'command':
                this.actionSheetCommandBtnTapped();
                break;
            case 'geofence':
                this.actionSheetGeofenceBtnTapped();
                break;
            case 'acknowledge':
                this.executeAlarmCommand(true);
                break;
            case 'reset':
                this.executeAlarmCommand(false);
                break;
            case 'engineCoolantTemperature':
                Rms.app.getController('AssetController').showLineGraph('engineCoolantTemperatureChart');
                break;
            case 'engineRPMChart':
                Rms.app.getController('AssetController').showLineGraph('engineRPMChart');
                break;
            case 'powerOutputChart':
                Rms.app.getController('AssetController').showLineGraph('powerOutputChart');
                break;
            case 'nearestAssets':
                Rms.app.getController('AssetController').showNearestAsset(button.get('data'));
                break;
            case 'driverMaxSpeed':
            case 'driverLiveScore':
            case 'driverMaxRPM':
                Rms.app.getController('DriverController').showGaugeGraph(button.getItemId());
                break;
            case 'driverLiveScoreChart':
                Rms.app.getController('DriverController').showLineGraph('driverLiveScoreChart');
                break;
            case 'map':
                // Do nothing. this is handled in the MapController.
                break;
        }
    },

    activeAlarmDetailsBackBtnTaped: function () {
        //this.getActiveAlarmListItem().deselectAll();
        this.getAssetView().setActiveItem(2);
    },

    activeAlarmDetailsOptionsBtn: function () {
        this.getActiveAlarmDetails().addCommandOptions();
    },

    showAlarmDetails: function (list, index, target, record, e, opts) {
        this.getAlarmGroupList().selectedAlarmId = record.get('oid');
        this.getAssetView().getAt(7).setRecords(record, false);
        this.getAssetView().setActiveItem(7);
    },

    actionSheetAlarmBtnTapped    : function () {
        var me = this;
        this.getAssetDetails().assetOptions.hide();
        var activeAlarms = Ext.getStore('activeAlarmsStore');
        setTimeout(function(){
            activeAlarms.clearListeners();
            activeAlarms.on('load', function (store) {
                if (store.getCount() === 0) {
                    Ext.Msg.alert('', 'There are no alarms for this asset.');
                } else {
                    this.getAssetView().getAt(2).showAlarmList(store, false);

                    this.getActiveAlarmToolbar().setTitle(Ext.util.Format.ellipsis(this.getAssetDetails().domainObjectName, 10));

                    this.getAssetView().setActiveItem(2);
                }
            }, me);
            activeAlarms.load({
                params: {
                    'oid' : [me.getAssetDetails().domainObjectId],
                    'view': 'asset,lastUpdatedTime,description,name,oid,assetID,position,heading,domainObjectType'
                }
            });
        },1000);
    },
    commandListPanelBackBtnTapped: function (btn) {
        this.getAssetView().setActiveItem(1);
    },

    actionSheetCommandBtnTapped: function () {
        var me = this;

        // service/action/contextMenu
        // object_type=canbusFleetVehicle
        // object_id=282643

        // Response:
        var commandOptions = ['normalMode', 'activateImmobilizer', 'synchronizeAllowedOperators', 'pollForPosition', 'serviceMode'];

        //Why is this not used?
        //var struct = {
        //    "data": [
        //        {
        //            "name": "",
        //            "category": "",
        //            "items": [
        //                {
        //                    "name": "Asset Commands",
        //                    "category": "",
        //                    "items": [
        //                        {
        //                            "name": "Poll Position",
        //                            "category": "command",
        //                            "action": {
        //                                "id": "pollForPosition",
        //                                "name": "Poll Position",
        //                                "description": "",
        //                                "category": "command",
        //                                "requiresConfirmation": false,
        //                                "oneclick": true,
        //                                "parameters": [],
        //                                "enabled": true
        //                            }
        //                        },
        //                        {
        //                            "name": "Activate Immobilizer Status",
        //                            "category": "command",
        //                            "action": {
        //                                "id": "activateImmobilizer",
        //                                "name": "Activate Immobilizer Status",
        //                                "description": "",
        //                                "category": "command",
        //                                "requiresConfirmation": true,
        //                                "oneclick": true,
        //                                "parameters": [],
        //                                "enabled": true
        //                            }
        //                        },
        //                        {
        //                            "name": "Service Mode",
        //                            "category": "command",
        //                            "action": {
        //                                "id": "serviceMode",
        //                                "name": "Service Mode",
        //                                "description": "Disable HID readers",
        //                                "category": "command",
        //                                "requiresConfirmation": true,
        //                                "oneclick": true,
        //                                "parameters": [],
        //                                "enabled": true
        //                            }
        //                        }, {
        //                            "name": "Normal Mode",
        //                            "category": "command",
        //                            "action": {
        //                                "id": "normalMode",
        //                                "name": "Normal Mode",
        //                                "description": "Enable HID readers",
        //                                "category": "command",
        //                                "requiresConfirmation": true,
        //                                "oneclick": true,
        //                                "parameters": [],
        //                                "enabled": true
        //                            }
        //                        }, {
        //                            "name": "Synchronize Allowed Operators",
        //                            "category": "command",
        //                            "action": {
        //                                "id": "synchronizeAllowedOperators",
        //                                "name": "Synchronize Allowed Operators",
        //                                "description": "",
        //                                "category": "command",
        //                                "requiresConfirmation": false,
        //                                "oneclick": true,
        //                                "parameters": [],
        //                                "enabled": true
        //                            }
        //                        }]
        //                }, {
        //                    //...
        //                }]
        //        }]
        //};

        Ext.Ajax.request({
            url    : App.config.serviceUrl + 'mobile/possibleCommands/',
            method : App.config.ajaxType,
            params : {
                'oid': [this.getAssetDetails().domainObjectId]
            },
            success: function (response) {
                var data              = Ext.decode(response.responseText);
                var commandCodeArray  = [];
                var commandValueArray = [];
                for (var i in data) {
                    if (commandOptions.indexOf(i) > -1) {
                        commandCodeArray.push(i);
                        var temp = data[i].replace(/([A-Z])/g, ' $1').replace(/^./, function (str) {
                            return str.toUpperCase();
                        });
                        commandValueArray.push(temp);
                    }
                }
                if (commandValueArray.length) {
                    me.getAssetDetails().assetOptions.hide();
                    me.getAssetView().getAt(3).addItems(commandCodeArray, commandValueArray);
                    me.getAssetView().setActiveItem(3);
                    me.getAssetView().getActiveItem().getAt(0).setTitle('Commands');
                } else {
                    Ext.Msg.alert('', 'There are no Commands for this Asset available.');
                }
            }
        });
    },

    geofenceListPanelBackBtnTapped: function (button) {
        this.getAssetView().setActiveItem(1);
    },

    actionSheetGeofenceBtnTapped: function () {
        this.actionSheetgeofenceStore.on('load', function (store) {

            this.getAssetDetails().assetOptions.hide();
            this.getAssetView().getAt(5).getItems().getAt(1)
                .setStore(store);
            this.getAssetView().setActiveItem(5);

        }, this);
        this.actionSheetgeofenceStore.load({
            params: {
                view: 'name,configName,isActive,shapeType,fenceDescription'
            }
        });
    },

    geofenceDetailsBackBtnTapped: function (button) {
        //this.getGeofenceList().deselectAll();
        this.getAssetView().setActiveItem(5);
    },

    showGeofenceDetails: function (list, index, target, record, e, opts) {
        this.getAssetView().getAt(6).setRecords(record);
        this.getAssetView().setActiveItem(6);
    },

    commandListCommandButtonTapped: function (button) {
        if (button.config.itemId != 'back') {
            Ext.Ajax.request({
                url       : App.config.serviceUrl + 'caesarAssetCommand/executeCommand',
                method    : App.config.ajaxType,
                params    : {
                    domainObjectType: this.getAssetDetails().domainObjectType,
                    domainObjectId  : this.getAssetDetails().domainObjectId,
                    commandId       : button.config.commandCode,
                    justification: 'Command sent through a mobile device'
                }, success: function (response) {
                    var data  = Ext.decode(response.responseText),
                        title = '',
                        msg   = '';

                    if (data.success) {
                        msg = 'Command sent successfully.';
                    } else {
                        title = 'Error';
                        msg   = 'Could not execute command.';
                    }
                    Ext.Msg.alert(title, msg);

                },
                /**
                 * this is executed if something on the server side went wrong.
                 * Usually, the status code is "400".
                 * @param response
                 */
                failure   : function (response) {
                    var msg = '';
                    if (response.status == 500) {
                        msg = 'Internal server error.';
                    } else {
                        var data = Ext.decode(response.responseText);
                        for (var i = 0; i < data.messages.length; i++) {
                            msg += data.messages[i] + '<br>';
                        }
                    }
                    Ext.Msg.alert('Error', msg);
                }
            });
        }
    },
    executeAlarmCommand           : function (decision) {
        var me            = this,
            url           = '',
            justification = '',
            msg           = '',
            alarmId       = this.getAlarmGroupList().selectedAlarmId;

        if (decision) {
            url = 'caesarAssetAlarm/acknowledgeMultipleAlarms';
            msg = 'Alarm acknowledged successfully.';
        } else {
            url = 'caesarAssetAlarm/resetMultipleAlarms';
            msg = 'Alarm reset successfully.';
        }

        Ext.Ajax.request({
            url    : App.config.serviceUrl + url,
            method : App.config.ajaxType,
            params : {
                alarmIds     : JSON.stringify([alarmId]),
                justification: justification
            },
            success: function (response) {
                var data = Ext.decode(response.responseText);

                if (data.success) {
                    Ext.Msg.alert('', msg);
                    console.log('excuted Command');
                    if (me.getAssetView().getActiveItem().xtype = "all_alarm_details") {
                        me.getAssetView().setActiveItem(1);
                    } else {
                        me.getLaunchApp().setActiveItem(2);
                    }
                } else {
                    for (var i = 0; i < data.messages.length; i++) {
                        msg += data.messages[i] + '<br>';
                    }
                    Ext.Msg.alert('Error', msg);
                }
            },
            /**
             * this is executed if something on the server side went wrong.
             * Usually, the status code is "400".
             * @param response
             */
            failure: function (response) {
                var msg = '';
                if (response.status == 500) {
                    msg = 'Internal server error.';
                } else {
                    var data = Ext.decode(response.responseText);
                    for (var i = 0; i < data.messages.length; i++) {
                        msg += data.messages[i] + '<br>';
                    }
                }
                Ext.Msg.alert('Error', msg);
            }
        });
        this.getActiveAlarmDetails().commandOptions.hide();
    }
});