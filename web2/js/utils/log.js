/**
 * Namespace for logging functionality.
 * @type {{data: Array, add: Function, error: Function, timeout: Function, sessionExpired: Function, emergencyEject: Function, send: Function}}
 * @flow
 */
App.log = {

    /**
     * Contains log roll.
     * @type {{ts: number, msg: string, route: string, data: *|null, sent: number|null}[]}
     */
    data: [],

    /**
     * Add log roll entry, eg.
     * {
     *   ts   : 1400682615437, // Unix timestamp in milliseconds
     *   msg  : "my message",
     *   route: "/current/route",
     *   data : {some: "other", stuff: "here"} // optional
     * }
     * @param {string} message
     * @param {*=} data
     */
    add: function (message, data) {
        'use strict';

        var entry = {
            ts   : Date.now(),
            msg  : message,
            route: App.router.getCurrentRoute()
        };
        if (data) {
            entry.data = data;
        }

        App.log.data.push(entry);
        console.log(message);

        /**
         * Only send messages if configured for "no errors" or "suppress timeouts".
         */
        if (App.config.errorLevel <= 1) {
            App.log.send();
        }
    },

    /**
     * Displays an error message, if "display" is true
     * @param {string} message
     * @param {*=} data
     * @param {boolean=} display If true, display an alert with a message.
     */
    error: function (message, data, display) {
        'use strict';

        if (display) {
            App.dialog.alert({
                message: message
            });
        }
        App.log.add(message, data);
    },

    /**
     * log timeout
     * @param jqXHR
     * @returns {boolean}
     */
    timeout: function (jqXHR) {
        'use strict';

        var result = false;
        if (App.config.errorLevel > 1) {
            App.log.emergencyEject(jqXHR);
        } else {
            App.log.add('Timeout', jqXHR);
            result = true;
        }
        return result;
    },

    /**
     * Check for invalid JSON Response.
     * @param {jqXHR} jqXHR
     * @param {Error} thrownError an error object
     * @param {*} ajaxSettings some additional information for the logger
     */
    checkJsonResponse: function (jqXHR, thrownError, ajaxSettings) {
        'use strict';

        if (App.config.errorLevel > 0) {

            // Check for invalid JSON, but ignore empty responses.
            //noinspection JSUnresolvedVariable
            if (thrownError.name === 'SyntaxError' && jqXHR.responseText.length) {
                App.log.error(App.translate('Internal Server Error: The response contains invalid JSON code.'), ajaxSettings, true);
            } else {
                App.log.emergencyEject(jqXHR);
            }
        }
    },

    sessionExpired: function () {
        'use strict';

        App.log.add('sessionExpired');
        // We have already done everything if the login dialog is visible
        if (App.ui.login.dialog && App.ui.login.dialog.element.length > 0) {
            return false;
        }

        $.when(App.dialog.alert({
            message: App.translate('You are not logged in.')
        })).done(function () {
            var returnRoute = App.router.getCurrentRoute();
            App.user.removeSession();
            App.application.hide();
            if (returnRoute === '' || returnRoute.indexOf(App.config.routeLogin) === 0) {
                App.router.navigate('/');
            } else {
                // Remember where we were.
                App.router.navigate(App.config.routeLogin + '?r=' + returnRoute);
            }
        });
    },

    /**
     * Server is probably gone - or the internet connection is broken.
     * Offer two options:
     * - Try to continue which reloads the page
     * - Try to login - remove sessionId and force the login dialog with that.
     */
    emergencyEject: function (jqXHR) {
        'use strict';

        App.log.add('emergencyEject', jqXHR);

        $.when(App.dialog.okCancel({
            title      : App.translate('No connection'),
            message    : App.translate('The server could not be reached. Please check your internet connection.<br>If the problem persists, please contact <a href="mailto:{0}">helpdesk</a>.', App.config.mailHelpdesk),
            height     : 240,
            labelCancel: App.translate('Try to continue'),
            labelOK    : App.translate('Try to login')
        })).done(function (e) {
            if (e.button === 'OK') {
                var params      = App.router.getUrlParams();
                App.user.removeSession();
                window.location = window.location.pathname + '?' + $.param(params);
            } else {
                window.location.reload(true);
            }
        });
    },

    /**
     * Send all pending log events to the log service.
     */
    send: function () {
        'use strict';

        /**
         * Those parameters are send over to the log service.
         * @type {{userId: (App.user.id|*), appId: (string|number|null), items: Array}}
         */
        var params   = {
            userId   : App.config.user.id,
            sessionId: App.config.sessionId,
            items    : []
        };
        var me       = this,
            newItems = [],
            itm      = null,
            sent     = Date.now(),
            i;

        /**
         * Send only entries that are not sent already. Add send timestamp.
         * Remember index of that log entry. This works, since entries are only appended to that array.
         */
        for (i = 0; i < me.data.length; i++) {

            if (!me.data[i].sent) {
                me.data[i].sent = sent;
                newItems.push(i);
            }
        }

        if (newItems.length) {

            for (i = 0; i < newItems.length; i++) {
                itm = me.data[newItems[i]];
                params.items.push({
                    ts   : new Date(itm.ts).toISOString(),
                    msg  : itm.msg,
                    data : itm.data,
                    route: itm.route
                });
            }

            // Stringify this:
            params.items = JSON.stringify(params.items);

            /**
             * Send them.
             */
            $.ajax({
                url    : App.config.logUrl,
                global : false,
                data   : params,
                success: function () {
                    // We do not need to do anything here.
                },
                error  : function (response) {

                    if (response.status !== 200 && response.statusText !== 'OK') {

                        // Delete the "sent" timestamp, since this request was not successful.
                        for (var j = 0, len = newItems.length; j < len; j++) {
                            delete me.data[newItems[j]].sent;
                        }
                    }
                }
            });
        }
    }
};
