/*
 This file is generated and updated by Sencha Cmd. You can edit this file as
 needed for your application, but these edits will have to be merged by
 Sencha Cmd when it performs code generation tasks such as generating new
 models, controllers or views and when running "sencha app upgrade".

 Ideally changes to this file would be limited and most work would be done
 in other places (such as Controllers). If Sencha Cmd cannot merge your
 changes and its generated code, it will produce a "merge conflict" that you
 will need to resolve manually.
 */

/**
 * Let's dynamically include this file here.
 * Sencha Touch's compiler adds it then to the production files as well.
 */
//@require Ext.util.Cookies.js
//@require ux/touch/PullRefreshFn.js

Ext.application({
    name       : 'Rms',
    requires   : [
        'Rms.util.SizeMonitor', //TEMP fix, Chrome 43 bug
        'Rms.util.PaintMonitor', //TEMP fix, Chrome 43 bug
        'Ext.data.Model',
        'Ext.MessageBox',
        'Ext.field.Password',
        'Ext.field.Toggle',
        'Ext.form.FieldSet',
        'Ext.Img',
        'Ext.Map',
        'Ext.Panel',
        'Rms.model.LocalStorageModel',
        'Rms.view.common.LoginPanel',
        'Rms.view.map.NearbyAssets',
        'Rms.view.asset.AssetNearest',
        'Rms.view.statistics.StatisticsBar',
        'Rms.view.statistics.StatisticsLine',
        'Rms.view.statistics.StatisticsPie'
    ],
    views      : [
        'Main',
        'LaunchApp',
        'alarm.AlarmView',
        'asset.AssetView',
        'map.MapView',
        'asset.AssetDetails',
        'common.AssetListPanel',
        'map.MapControl',
        'map.NearbyAssets',
        'common.UserProfile',
        'driver.DriverView',
        'driver.DriverListPanel',
        'driver.DriverDetails',
        'statistics.StatisticsGauge',
        'statistics.StatisticsView',
        'statistics.StatisticsList'
    ],
    controllers: [
        'CommonController',
        'AssetController',
        'AlarmController',
        'SessionController',
        'ActionSheetController',
        'MapController',
        'DriverController'
    ],

    stores           : [
        'AssetStore',
        'DriverStore',
        'AssetPositionsStore',
        'ActiveAlarmsStore',
        'VisibleLocationsStore'
    ],
    icon             : {
        '57' : 'resources/icons/Icon.png',
        '72' : 'resources/icons/Icon~ipad.png',
        '114': 'resources/icons/Icon@2x.png',
        '144': 'resources/icons/Icon~ipad@2x.png'
    },
    isIconPrecomposed: true,
    startupImage     : {
        '320x460'  : 'resources/startup/320x460.jpg',
        '640x920'  : 'resources/startup/640x920.png',
        '768x1004' : 'resources/startup/768x1004.png',
        '748x1024' : 'resources/startup/748x1024.png',
        '1536x2008': 'resources/startup/1536x2008.png',
        '1496x2048': 'resources/startup/1496x2048.png'
    },
    launch           : function () {

        // Destroy the #appLoadingIndicator element
        Ext.fly('appLoadingIndicator').destroy();

        //Fix for Ext.Msg boxes not closing gracefully in chrome and 4.x Android native browser
        Ext.Msg.defaultAllowedConfig.showAnimation = false;

        // Access stored information and fill in the login screen.
        var store = Ext.create('Ext.data.Store', {
            model  : 'Rms.model.LocalStorageModel',
            storeId: 'localStore'
        });
        store.load();
        if (store.getCount() < 1) {
            store.add({
                key          : '1',
                username     : '',
                password     : '',
                applicationId: ''
            });
        }
        var integrate_app = Ext.create('Rms.view.common.IntegrateApp');
        Ext.Viewport.add(integrate_app);
        var record = store.findRecord('key', 1);

        // No matter what we do, we have to always login freshly. Doh.
        integrate_app.setActiveItem(0);

        var loginPanel = integrate_app.getActiveItem().getItems().getAt(1);

        if ((record.get('username') != '') && (record.get('password') != '')) {
            loginPanel.getComponent('username').setValue(store.getAt(0).data.username);
            loginPanel.getComponent('password').setValue(store.getAt(0).data.password);
        }

        // Register a global listener for session timeouts.
        Ext.Ajax.on({
            requestexception: function (connection, response) {
                switch (response.status) {
                    case 401:
                        /**
                         * We are not logged on anymore.
                         * Display Login panel.
                         */
                        Ext.Msg.show({
                            message: 'Your connection is lost due to inactivity.<br>Try to log in.',
                            buttons: {text: 'Login', itemId: 'ok'},
                            fn     : function () {
                                integrate_app.setActiveItem(0);
                                Ext.Viewport.unmask();
                            }
                        });
                        break;
                    case 500:
                        console.log('Error!', response);
                }
            }
        });

        // TODO (ORIG) Initialize the main view
        // Ext.Viewport.add(Ext.create('Rms.view.Main'));
    },

    onUpdated: function () {
        Ext.Msg.confirm(
            'Application Update',
            'This application has just successfully been updated to the latest version. Reload now?',
            function (buttonId) {
                if (buttonId === 'yes') {
                    window.location.reload();
                }
            }
        );
    }
});
