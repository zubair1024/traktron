Ext.define('Rms.controller.SessionController', {
    extend     : 'Ext.app.Controller',
    requires   : [
        'Ext.Ajax',
        'Ext.data.Model',
        'Rms.store.ApplicationsStore',
        'Rms.view.common.IntegrateApp',
        'Rms.view.common.LoginPanel',
        'Rms.view.common.UserProfile'
    ],
    config     : {
        refs   : {
            applicationId: 'loginPage selectfield',
            userName     : 'loginPage textfield[name=username]',
            password     : 'loginPage passwordfield',
            savePassword: 'loginPage togglefield',
            logoutTab    : 'launchapp #logout',
            integrateApp : 'integrate_app',
            launchApp    : 'launchapp'
        },
        control: {
            '#btnLogin'          : {
                tap: 'login'
            },
            logoutTab            : {
                activate: 'logout'
            },
            'loginPage textfield': {
                keyup: 'onKeyUp'
            }
        }
    },
    launch     : function () {
        var appSelector = this.getApplicationId();
        var savePassword = this.getSavePassword();
        var username = this.getUserName().getValue();
        var password = this.getPassword().getValue();
        var localStore = Ext.getStore('localStore');
        // No fixed appId has been defined before, so we need to display the appSelector SelectField and load the store for that.
        if (App.config.appId === null) {
            var appStore = Ext.create('Rms.store.ApplicationsStore');
            appStore.on('load', function () {
                var record     = localStore.findRecord('key', 1);
                if (localStore.getCount() > 0 && record.get('applicationId') != '') {
                    appSelector.setValue(App.config.appId || record.get('applicationId'));
                    savePassword.setValue(true);
                }
            }, this);
            //Force Save
            appSelector.setStore(appStore);
            appStore.load();
        } else {
            appSelector.hide();
        }
        if (document.cookie.match(/ROAMSESSIONKEY/g)) {
            this.getIntegrateApp().setActiveItem(1);
            this.getSettings();
        }
    },
    /**
     * Do a login also after hitting on enter.
     * @param fld
     * @param e
     */
    onKeyUp    : function (fld, e) {
        // 13 = user tapped 'return/enter' button on keyboard
        if (e.browserEvent.keyCode == 13) {
            this.login();
        }
    },
    login      : function () {
        var me       = this,
            username = this.getUserName().getValue(),
            password = this.getPassword().getValue();

        if (username == '' || password == '') {

            Ext.Msg.alert('', 'Please enter username and password');

        } else {
            var localStore    = Ext.getStore('localStore');
            var record        = localStore.findRecord('key', 1);
            var applicationId = App.config.appId || this.getApplicationId().getValue() || record.get('applicationId');

            Ext.Viewport.setMasked({
                xtype  : 'loadmask',
                message: 'Logging In...'
            });

            Ext.util.Cookies.clear(App.config.sessionName);

            Ext.Ajax.request({
                url    : App.config.serviceUrl + 'caesarAuthentication/logon',
                method : App.config.ajaxType,
                params : {
                    username             : username,
                    password             : password,
                    applicationProviderId: applicationId
                },
                success: function (response) {
                    var data       = Ext.decode(response.responseText),
                        localStore = Ext.getStore('localStore');
                    //noinspection JSUnresolvedVariable
                    if (data.loggedOn) {
                        // Save SessionId.
                        App.config.sessionId = data[App.config.sessionName];
                        Ext.util.Cookies.set(App.config.sessionName, App.config.sessionId);
                        var record           = localStore.findRecord('key', 1);
                        if (me.getSavePassword().getValue()) {
                            record.set('username', username);
                            record.set('applicationId', applicationId);
                            record.set('password', password);
                            record.set('savePassword', true);
                        }else{
                            window.localStorage.clear();
                            record.set('savePassword', false);
                        }
                        me.getSettings();
                    }
                    // Save changes to local store.
                    localStore.sync();
                    Ext.Viewport.unmask();

                },
                /**
                 * Any other response than a 200
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
                    Ext.Msg.alert('Login Error', msg);
                    Ext.Viewport.unmask();
                }
            });
        }
    },
    logout     : function (ths, newActive, oldActive, option) {
        var me = this;
        var localStore       = Ext.getStore('localStore');
        //Stop Map refresher if exists
        if (Rms.app.getController('MapController').refresh) {
            Rms.app.getController('MapController').refresh = false;
            clearInterval(Rms.app.getController('MapController').refreshIntervalId);
        }
        Ext.Msg.confirm(
            "Logout",
            "Are you use you want to logout?",
            function (btn) {
                if (btn === 'yes') {
                    Ext.Viewport.setMasked({
                        xtype  : 'loadmask',
                        message: 'Logging out...'
                    });
                    Ext.Ajax.request({
                        url    : App.config.serviceUrl + 'caesarAuthentication/logoff',
                        method : App.config.ajaxType,
                        success: function () {

                            App.config.sessionId = null;
                            Ext.util.Cookies.clear(App.config.sessionName);

                            me.getLaunchApp().destroy();
                            var cache            = localStore.findRecord('key', 1);
                            var integrate_app    = me.getIntegrateApp();
                            var launchApp        = Ext.create('Rms.view.LaunchApp');
                            integrate_app.insert(1, launchApp);
                            var loginPanel = integrate_app.getActiveItem().getItems().getAt(1);
                            if (cache.get('savePassword') && cache.get('username') != '' && cache.get('password') != '') {
                                loginPanel.getComponent('username').setValue(cache.get('username'));
                                loginPanel.getComponent('password').setValue(cache.get('password'));
                            }else{
                                loginPanel.getComponent('username').setValue('');
                                loginPanel.getComponent('password').setValue('');
                                window.localStorage.clear();
                            }
                            localStore.sync();
                            integrate_app.setActiveItem(0);
                            Ext.Viewport.unmask();
                        }
                    });
                } else {
                    this.getLaunchApp().setActiveItem(0);
                }
            },
            this
        );
    },
    /**
     * Fetch user settings for timezone, dateformatting and so on.
     */
    getSettings: function () {
        "use strict";
        var me = this;
        Ext.Ajax.request({
            url    : App.config.serviceUrl + 'userSettings/current',
            method : App.config.ajaxType,
            success: function (response) {
                var data        = Ext.decode(response.responseText);
                App.config.user = data.user;

                /**
                 * Fetch Kendo culture and use it to localize the formatters.
                 */
                var kendoCultureFile = 'resources/cultures/kendo.culture.' + App.config.user.culture + '.min.js';
                Ext.Loader.injectScriptElement(kendoCultureFile, function () {
                    // Adapt the time / date formats for ExtJS.
                    if (kendo.cultures[App.config.user.culture]) {
                        var culture = kendo.cultures[App.config.user.culture];

                        Date.dayNames     = culture.calendars.standard.days.names;
                        Date.monthNames   = culture.calendars.standard.months.names;
                        Date.monthNumbers = {};
                        for (var i = 0; i < culture.calendars.standard.months.namesAbbr.length; ++i) {
                            Date.monthNumbers[culture.calendars.standard.months.namesAbbr[i]] = i;
                        }

                        /**
                         * Convert Kendo Date format into Ext-Format.
                         * All date/time patterns are in here: culture.calendars.standard.patterns
                         * @param {string} kendoDateFormat
                         * @returns {string}
                         */
                        var convertKendoToExtFormat = function (kendoDateFormat) {
                            var format = kendoDateFormat.replace('yyyy', 'Y');  // The year full value.
                            format = format.replace('yy', 'y');             // The last two characters from year value.
                            format = format.replace('MMMM', 'F');           // The full name of the month.
                            format = format.replace('MMM', '___1___');      // The abbreviated name of the month. Quote it.
                            format = format.replace('MM', '___2___');       // The month, from 01 through 12. Quote it.
                            format = format.replace('M', 'n');              // The month, from 1 through 12.
                            format = format.replace('dddd', 'l');           // The full name of the day of the week.
                            format = format.replace('ddd', 'D');            // The abbreviated name of the day of the week.
                            format = format.replace('dd', '___3___');       // The day of the month, from 01 through 31. Quote it.
                            format = format.replace('d', 'j');              // The day of the month, from 1 through 31.
                            format = format.replace('HH', '___4___');       // The hour, using a 24-hour clock from 01 to 23. Quote it.
                            format = format.replace('H', 'G');              // The hour, using a 24-hour clock from 1 to 23.
                            format = format.replace('hh', '___5___');       // The hour, using a 12-hour clock from 01 to 12. Quote it.
                            format = format.replace('h', 'g');              // The hour, using a 12-hour clock from 1 to 12.
                            format = format.replace('mm', 'i');             // The minute, from 00 through 59.
                            format = format.replace('m', 'i');              // The minute, from 0 through 59. Not available in Sencha Touch.
                            format = format.replace('ss', 's');             // The second, from 00 through 59.
                            // format = format.replace('s', 's');           // The second, from 0 through 59. Not available in Sencha Touch.
                            format = format.replace('tt', 'a');             // The AM/PM designator. Lower case version.
                            format = format.replace('fff', 'u');            // The milliseconds in a date and time value.

                            // Remove quoted thingies.
                            format = format.replace('\':\'', ':');
                            format = format.replace('\'-\'', '-');

                            // Replace quoted formats.
                            format = format.replace('___1___', 'M');        // The abbreviated name of the month.
                            format = format.replace('___2___', 'm');        // The month, from 01 through 12.
                            format = format.replace('___3___', 'd');        // The day of the month, from 01 through 31.
                            format = format.replace('___4___', 'H');        // The hour, using a 24-hour clock from 01 to 23.
                            format = format.replace('___5___', 'h');        // The hour, using a 12-hour clock from 01 to 12.

                            return format;
                        };

                        App.config.user.dateFormat     = convertKendoToExtFormat(culture.calendars.standard.patterns.d);
                        App.config.user.dateTimeFormat = convertKendoToExtFormat(culture.calendars.standard.patterns.G);
                        //App.config.user.timeFormat   = convertKendoToExtFormat(culture.calendars.standard.patterns.t);

                        if (Ext.util.Format) {
                            Ext.util.Format.defaultDateFormat = App.config.user.dateFormat;
                        }
                    }
                }, function () {
                    console.log('Unable to load the culture file ' + kendoCultureFile);
                    App.config.user.dateFormat     = Ext.util.Format.defaultDateFormat;
                    App.config.user.dateTimeFormat = 'd/m/Y h:i:s a';
                });

                /**
                 * Now call the "structure" service to get the root objects for the asset list.
                 */
                Ext.Ajax.request({
                    url    : App.config.serviceUrl + 'caesarOrganizationStructure/structure3',
                    method : App.config.ajaxType,
                    success: function (response) {
                        var data = Ext.decode(response.responseText);

                        for (var i = 0; i < data.length; i++) {
                            var obj                         = data[i];
                            App.config.rootDomainObjectType = obj.domainObjectType;
                            App.config.rootDomainObjectId   = obj.id;
                        }

                        // Create stores...
                        me.getIntegrateApp().getAt(1).createStores();
                        // ...and display them.
                        me.getIntegrateApp().setActiveItem(1);
                    }
                });
            },
            /**
             * Any other response than a 200
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
    }
});