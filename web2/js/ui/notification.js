/**
 * Notification class
 * @type {*}
 */
App.ui.Notification = App.ui.MenuBase.extend({

    /**
     * Time of last refresh.
     * Will be set on first successful load and any call of refresh().
     * This attribute is fed by the server's "now".
     * @type {Date|null}
     */
    lastRefresh: null,

    /**
     * Define notificationType states
     */
    notificationTypeError : 'Error',
    notificationTypeReport: 'Report',
    notificationTypeAlarm : 'Alarm',
    notificationTypeInfo  : 'Info',

    /**
     * Define criticality states
     */
    criticalityHigh  : 'userEventCriticality.high',
    criticalityMedium: 'userEventCriticality.medium',
    criticalityLow   : 'userEventCriticality.low',

    /**
     * Already displayed notification ids
     */
    ids: [],

    /**
     * number of current notifications
     */
    notificationCount: 0,

    /**
     *
     * @param config
     * @returns {*}
     */
    init: function (config) {
        'use strict';

        App.ui.MenuBase.fn.init.call(this, $.extend({}, config));

        // Create reference to notification menu.
        this.elMenu = $('#menu-notifications > .dropdown-menu');

        // Add global listener for the "dismiss All" link.
        $('body').on('click', '[data-action="dismiss-all-notifications"]', $.proxy(this.dismissAll, this));
        return this;
    },

    /**
     * Fetches new notifications and renders them accordingly.
     * @returns {*}
     */
    refresh: function () {
        'use strict';

        var me = this;

        // Call service
        return $.ajax({
            url    : App.config.serviceUrl + 'notificationCenter/newNotifications',
            success: function (response) {

                var types                        = {};
                types[me.notificationTypeReport] = {
                    title   : App.translate('Reports'),
                    icon    : 'notificationsmenu-events',
                    html    : '',
                    renderer: me.buildNotificationReportContent
                };
                types[me.notificationTypeError]  = {
                    title   : App.translate('Errors'),
                    icon    : 'notificationsmenu-errors',
                    html    : '',
                    renderer: me.buildNotificationErrorContent
                };
                types[me.notificationTypeAlarm]  = {
                    title   : App.translate('Alarms'),
                    icon    : 'notificationsmenu-alarms',
                    html    : '',
                    renderer: me.buildNotificationAlarmContent
                };

                me.notificationCount = response.data.length;

                // Set initial lastRefresh to the server's timestamp minus 2 minutes.
                if (!me.lastRefresh && response.now) {
                    // Reformat ISO string: "2015-02-23T10:05" -> "2015/02/23 10:05"
                    me.lastRefresh = new Date(response.now.replace(/-/g, '/').replace(/T/, ' '));
                    me.lastRefresh.setSeconds(me.lastRefresh.getSeconds() - App.config.notificationThreshold);
                }

                // Collect ids here, compare them with the last refresh.
                for (var i = 0; i < me.notificationCount; i++) {

                    var currentItem = response.data[i];

                    // Add to notification menu
                    types[currentItem.notificationType].html += types[currentItem.notificationType].renderer(currentItem, response.now);

                    // Has current notification id already been shown? No?
                    if (me.ids.indexOf(response.data[i].notification.id) === -1) {

                        me.ids.push(response.data[i].notification.id);

                        var isNew = true;

                        // If there is NO current time (because it is not valid or missing) then show notification by default!
                        if (currentItem.time) {
                            var currentItemTime = new Date(currentItem.time.replace(/-/g, '/').replace(/T/, ' '));
                            isNew               = currentItemTime >= me.lastRefresh;
                        }

                        // Create toast message if necessary.
                        if (currentItem.criticality !== me.criticalityLow && isNew) {
                            me.displayToast(currentItem);
                        }
                    }
                }

                // After the date comparison, set lastRefresh to the current server's timestamp.
                if (me.notificationCount > 0 && response.now) {
                    me.lastRefresh = new Date(response.now.replace(/-/g, '/').replace(/T/, ' '));
                }

                me.clearMenu();

                // Refresh badge number
                me.setBadge(me.notificationCount);

                /**
                 * Add generated notifications to notification menu.
                 * Every notificationType has its own section / menu column.
                 */
                for (var notificationType in types) {
                    if (types.hasOwnProperty(notificationType)) {

                        // Is there at least some generated html?
                        if (types[notificationType] && types[notificationType].html.length > 0) {
                            me.elMenu.append(me.renderMenuColumn(
                                types[notificationType].icon,
                                types[notificationType].title,
                                types[notificationType].html,
                                '<a data-action="dismiss-all-notifications" class="navbar-right cursor-pointer">' + App.translate('Dismiss All') + '</a>',
                                null
                            ));
                        }

                    }
                }

                me.elMenu.css('max-height', $('body').innerHeight() - me.elMenu[0].offsetTop - 60);

                // Create click handler for notification actions
                me.elMenu.find('a').on('click', function (e) {
                    var el      = $(e.target),
                        item    = el.closest('.notif-text'),
                        id      = item.data('id'),
                        eventId = item.data('event-id'),
                        action  = el.data('action');

                    switch (action) {
                        case 'notification-reprocess':
                            me.reprocess(id, eventId, item);
                            break;
                        case 'notification-discard':
                            me.discard(id, eventId, item);
                            break;
                        case 'notification-alarm-details':
                            break;
                        case 'notification-dismiss':
                            me.dismiss(id, item);
                            break;
                        case 'notification-report-open':
                            me.openReport(eventId);
                            break;
                        case 'notification-report-details':
                            break;
                    }
                });
            }
        });
    },

    /**
     * Build notification report content.
     * @param {{notification: {id: string}, eventid: string, title: string, description: string, time: string}} item
     * @param {string} nowValue as ISO string
     */
    buildNotificationReportContent: function (item, nowValue) {
        'use strict';
        var html = '';

        html += '<li>';
        html += '<div class="notif-text" data-id="' + item.notification.id + '" data-event-id="' + item.eventid + '">' + App.translate(item.title.replace('Report: ', ''));
        html += '<div class="notif-time">' + App.util.format.fuzzyTime(item.time, nowValue) + '</div>';
        html += '<div class="notif-action">';
        html += '<a class="cursor-pointer" data-action="notification-report-open">' + App.translate('Open') + '</a> | ';
        html += '<a class="cursor-pointer" data-action="notification-dismiss">' + App.translate('Dismiss') + '</a>';
        html += '</div>';
        html += '</div>';
        html += '</li>';

        return html;
    },

    /**
     * Build notification error content.
     * @param {{notification: {id: string}, eventid: string, title: string, description: string, time: string}} item
     * @param {string} nowValue as ISO string
     */
    buildNotificationErrorContent: function (item, nowValue) {
        'use strict';

        var html = '';

        html += '<div class="notif-text" data-id="' + item.notification.id + '" data-event-id="' + item.eventid + '">' + App.translate(item.title);
        html += '<div class="notif-time">' + App.util.format.fuzzyTime(item.time, nowValue) + '</div>';
        html += '<div class="notif-description">' + item.description + '</div>';
        html += '<div style="margin-left: 10px;">';
        html += '<a class="cursor-pointer" data-action="notification-reprocess">' + App.translate('Reprocess') + '</a> | ';
        html += '<a class="cursor-pointer" data-action="notification-discard">' + App.translate('Discard') + '</a></div>';
        html += '</div>';

        return html;
    },

    /**
     * Build notification alarm content.
     * @param {{notification: {id: string}, eventid: string, title: string, description: string, time: string}} item
     * @param {string} nowValue as ISO string
     */
    buildNotificationAlarmContent: function (item, nowValue) {
        'use strict';

        var html = '';

        html += '<div class="notif-text" data-id="' + item.notification.id + '">' + App.translate(item.title);
        html += '<div class="notif-time">' + App.util.format.fuzzyTime(item.time, nowValue) + '</div>';
        html += '<div class="notif-description">' + item.description + '</div>';
        html += '<div style="margin-left:10px;">';
        html += '<a class="cursor-pointer" data-action="notification-dismiss">' + App.translate('Dismiss') + '</a></div>';
        html += '</div>';

        return html;
    },

    /**
     * displays a Kendo panel as a "Toast".
     * @param {{notification: {id: string}, eventid: string, notificationType: string, title: string, description: string, criticality: string}} item
     */
    displayToast: function (item) {
        'use strict';

        // TODO remove this Workaround ASAP
        if (item.notificationType === this.notificationTypeReport) {
            item.description = '&nbsp;';
        }

        App.view.toast.showNotification(
            item.notification.id,
            item.eventid,
            item.notificationType,
            item.title,
            item.description,
            item.criticality
        );
    },

    /**
     * Opens report via its eventId.
     * @param eventId
     * @param {jQuery=} el
     */
    openReport: function (eventId, el) {
        'use strict';

        $.ajax({
            url    : App.config.serviceUrl + 'caesarReporting/viewReport',
            data   : {
                notificationid: eventId
            },
            success: function (response) {
                //noinspection JSUnresolvedVariable
                var win = window.open(response.reportLink, '_blank');

                if (win) {
                    win.focus();

                    if (el) {
                        // if action has been invoked by a toast, hide it.
                        App.view.toast.hide(el);
                    }
                } else {
                    App.log.error(App.translate('You need to enable popups for this site.'), null, true);
                }
            }
        });
    },

    /**
     * Discards error event
     * @param id
     * @param eventId
     * @param {jQuery} el
     */
    discard: function (id, eventId, el) {
        'use strict';

        var me = this;

        $.ajax({
            url    : App.config.serviceUrl + 'caesarErrorEvent/discard',
            data   : {errorEventId: eventId},
            success: function () {
                me.dismiss(id, el);
            }
        });
    },

    /**
     * Reprocess report
     * @param id
     * @param eventId
     * @param {jQuery} el
     */
    reprocess: function (id, eventId, el) {
        'use strict';

        var me = this;

        $.ajax({
            url    : App.config.serviceUrl + 'caesarErrorEvent/reprocess',
            data   : {errorEventId: eventId},
            success: function () {
                me.dismiss(id, el);
            }
        });
    },

    /**
     * Mark report as read
     * @param id
     * @param {jQuery} el
     */
    dismiss: function (id, el) {
        'use strict';

        var me = this;
        $.ajax({
            url    : App.config.serviceUrl + 'notificationCenter/dismiss',
            data   : {id: id},
            success: function () {
                App.view.toast.hide(el);
                me.notificationCount--;
                me.setBadge(me.notificationCount);
            },
            // The error handler is called, because the result is empty.
            error  : function (jqXHR) {
                switch (jqXHR.status) {
                    case 200:
                        App.view.toast.hide(el);
                        me.notificationCount--;
                        me.setBadge(me.notificationCount);
                        break;
                    default:
                }
            }
        });
    },

    /**
     * Mark all reports as read
     */
    dismissAll: function () {
        'use strict';

        var me = this;

        $.when(App.dialog.okCancel({
            title  : App.translate('Dismiss all?'),
            message: App.translate('Are you sure you want to dismiss all notifications?'),
            width  : 400,
            icon   : App.dialog.iconQuestion
        })).done(function (response) {
            if (response.button === 'OK') {
                $.ajax({
                    url    : App.config.serviceUrl + 'notificationCenter/dismissAll',
                    success: function () {
                        App.view.toast.el.children().each(function () {
                            App.view.toast.hide(this);
                        });
                        me.notificationCount = 0;
                        me.setBadge(me.notificationCount);
                        me.clearMenu();
                    },
                    // The error handler is called, because the result is empty.
                    error  : function (jqXHR) {
                        switch (jqXHR.status) {
                            case 200:
                                App.view.toast.el.children().each(function () {
                                    App.view.toast.hide(this);
                                });
                                me.notificationCount = 0;
                                me.setBadge(me.notificationCount);
                                break;
                            default:
                        }
                    }
                });
            }
        });
    },

    /**
     * Refreshes the number in the badge right over the notification menu.
     * @param {int} nr
     */
    setBadge: function (nr) {
        $('#menu-notifications a span.badge').html(nr > 0 ? nr : '');
    },

    /**
     * Clear existing buttons and menu items.
     */
    clearMenu: function () {
        this.elMenu.empty();

        if (this.notificationCount === 0) {
            this.elMenu.html('<li class="no-items">' + App.translate('No notifications.') + '</li>');
        }
    }
});
