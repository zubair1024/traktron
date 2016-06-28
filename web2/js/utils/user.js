/**
 * Namespace for authentication related functions.
 * @type {{checkLogin: Function, doLogin: Function, logout: Function, doLogout: Function, removeSession: Function, getSettings: Function, getWidgetTypes: Function, getDomainDataViews: Function, getAvailableMapProjects: Function}}
 */
App.user = {

    /**
     * Right now it really checks only for a valid session id.
     * @returns {boolean}
     */
    checkLogin: function () {
        return App.config.sessionId !== null;
    },

    /**
     * Perform login.
     * @params {{username: string, password: string, appId: string, error: Function, returnRoute: string}} params
     * @returns void
     */
    doLogin: function (params) {
        'use strict';

        $.ajax({
            url     : App.config.serviceUrl + 'caesarAuthentication/logon',
            type    : App.config.ajaxType,
            dataType: App.config.ajaxDataType,
            data    : {
                username             : params.username,
                password             : params.password,
                applicationProviderId: params.appId
            },
            success : function (response) {
                App.config.sessionId = response[App.config.sessionName];

                // Set cookie.
                $.cookie(App.config.sessionName, App.config.sessionId, {path: '/'});

                // As long we are not reloading anymore, and we are navigating
                // instead, there is no need to remember url parameters (theme,
                // culture).
                var url = '';
                if (params.returnRoute) {
                    url += params.returnRoute;
                } else {
                    // Basically if we can't find anything to navigate to, then
                    // we get the url from window.location unless there is a
                    // login route in the url.
                    if (window.location.href.indexOf(App.config.routeLogin) < 0) {
                        url = window.location.href;
                    }
                }

                // Closing the login window and removing it from the dom.
                App.ui.login.dialog.destroy();
                // Re-initiating the application, as a compensation for the reload.
                App.init({
                    sessionId : $.cookie(App.config.sessionName),
                    culture   : App.router.getUrlParameterByName('lg'),
                    theme     : App.router.getUrlParameterByName('theme'),
                    debug_i18n: App.router.getUrlParameterByName('debug_i18n') === '1'
                });
                // Navigate to the return url, if it exists.
                App.router.navigate(url);

                // Clear previous cookie state and picks the state from server
               
            },
            error   : params.error
        });
    },

    /**
     * Ask current user to log out.
     */
    logout: function () {
        'use strict';

        $.when(App.dialog.okCancel({
            title  : App.translate('Logout'),
            message: App.translate('Are you sure you want to log out?'),
            labelOK: App.translate('Logout'),
            icon   : App.dialog.iconQuestion
        })).done(function (response) {
            if (response.button === 'OK') {
                App.user.doLogout();
            }
        });
    },

    /**
     * Perform logout action.
     */
    doLogout: function () {
        'use strict';

        var me = this;

        if (App.application) {
            App.application.hide();
        }

        $.ajax({
            url    : App.config.serviceUrl + 'caesarAuthentication/logoff',
            success: function () {
                me.removeSession();

                App.config.user = {};
                App.config.widgets = {};
                App.application.handlersInstalled = false;
                App.current.routing = false;
                App.router.navigate(App.config.routeLogin);
                App.stopPoller();
            },
            'error': function () {
                if (App.application) {
                    App.application.show();
                }
                App.log.error('Logout failed');
            }
        });
    },

    /**
     * Remove all session related settings.
     */
    removeSession: function () {
        'use strict';

        // Remove cookie.
        $.removeCookie(App.config.sessionName, {path: '/'});

        // Internet Explorer needs special treatment.
        $.removeCookie(App.config.sessionName);

        App.config.sessionId = null;
    },

    /**
     * Retrieves all settings for the current user.
     * @param {Function} onDone callback
     */
    getSettings: function (onDone) {
        'use strict';

        $.ajax({
            url    : App.config.serviceUrl + 'userSettings/current',
            success: function (response) {
                $.extend(App.config.user, response.user);
                if ($.isFunction(onDone)) {
                    onDone();
                }
            }
        });
    },

    /**
     * Fetch all DomainObjectTypes and their associated widget types
     * and put them in App.config.domainObjectTypesTree.
     * @returns {*}
     */
    getWidgetTypes: function () {
        'use strict';

        return $.ajax({
            url    : App.config.serviceUrl + 'caesarWidgetType/widgetTypes3',
            success: function (response) {

                // Iterate over the sections
                $.each(response, function (key, item) {

                    // Since there are probably sections with empty items, filter them out here.
                    if (item.items && item.items.length) {
                        App.config.domainObjectTypesTree.push(item);
                    }
                });
            }
        });
    },

    /**
     * Fetch all DomainObjectTypes and put them in App.config.domainObjectTypes.
     * @returns {*}
     */
    getDomainObjectTypes: function () {
        'use strict';

        return $.ajax({
            url    : App.config.serviceUrl + 'domainObjectTypes/availableDomainObjectTypes',
            success: function (response) {

                // Iterate over the domainObjectTypes
                for (var i = 0, len = response.domainObjectTypes.length; i < len; i++) {
                    var domainObjectType                              = response.domainObjectTypes[i];
                    App.config.domainObjectTypes[domainObjectType.id] = {
                        name: domainObjectType.name
                    };
                }
            }
        });
    },

    /**
     * @returns {*}
     */
    getDomainDataViews: function () {
        'use strict';

        return $.ajax({
            url    : App.config.serviceUrl + 'caesarObject/availableDomainDataViews',
            data   : {
                domainObjectType: 'customer'
            },
            success: function (response) {
                if (response.domainDataViews) {
                    App.config.domainDataViews = response.domainDataViews;
                }
            }
        });
    },

    /**
     * @returns {*}
     */
    getAvailableMapProjects: function () {
        'use strict';

        return $.ajax({
            url    : App.config.serviceUrl + 'userSettings/availableMapProjects',
            success: function (response) {
                App.config.map.projects = {};

                for (var i = 0, len = response.length; i < len; i++) {
                    var o                         = response[i];
                    App.config.map.projects[o.id] = o;

                    // Set default value.
                    // Quote the property since IE does not like it.
                    if (o['default']) {
                        App.config.map.defaultId = o.id;
                    }
                }
                // Test google maps
                //App.config.map.defaultId = '4026374';
                //App.config.map.projects['4026374'] = {
                //    "id"       : "4026374",
                //    "name"     : "Google Maps V3",
                //    "mapViewer": "GoogleMapsV3",
                //    "datumName": "WGS84"
                //};
                //App.config.map.projects['16711592'] = App.config.map.projects['4026374'];

                // Test OpenLayer
                //App.config.map.defaultId = '16711592';
                //App.config.map.projects[App.config.map.defaultId] = {
                //    "id"       : "16711592",
                //    "name"     : "OpenLayers",
                //    "mapViewer": "OpenLayers",
                //    "datumName": "GOOGLE"
                //};

                // Test ESRI
                //App.config.map.defaultId = '1234';
                //App.config.map.projects[App.config.map.defaultId] = {
                //    "id"       : "1234",
                //    "name"     : "ESRI 3",
                //    "mapViewer": "esri3",
                //    "datumName": "GOOGLE"
                //};
            }
        });
    }
};
