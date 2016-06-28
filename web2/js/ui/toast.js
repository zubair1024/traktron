/**
 * Class for managing all toast messages.
 * Singleton usage.
 *
 * Usage:
 * App.view.toast.show('My message');
 *
 * @type {void|*}
 */
App.ui.Toast = kendo.Class.extend({

    /**
     * duration of toast in milliseconds
     */
    delay   : 8000, // 8 seconds
    parentEl: null,
    /**
     * this container contains all toasts
     */
    el      : null,
    /**
     * contains all current toasts and its delays
     */
    queue   : [],
    /**
     * little counter for all queues
     */
    queueId : 0,

    /**
     * Define notificationType states
     */
    notificationTypeError : 'Error',
    notificationTypeReport: 'Report',
    notificationTypeAlarm : 'Alarm',
    notificationTypeInfo  : 'Info',

    /**
     *
     * @param config
     * @returns {*}
     */
    init: function (config) {
        'use strict';

        $.extend(this, config);

        // Create container right underneath the parentEl
        this.el = $('<div>', {
            'class': 'toast-container'
        }).appendTo('body');
        this.el.css({
            top          : this.parentEl ? this.parentEl.height() : 4,
            'margin-left': -this.el.outerWidth() / 2,
            'margin-top' : -this.el.outerHeight() / 2
        });

    },

    /**
     * Show toast message
     * @param message {string=}
     */
    show: function (message) {
        'use strict';

        $('<div>', {
            'class': 'k-block toast',
            html   : message
        })
            .appendTo(this.el)
            .show('blind')                                      // Slide in
            .delay(this.delay)                                  // Wait...
            .hide('blind', function () {
                $(this).remove();
            });    // ...and slide out. Remove element from DOM..
    },

    hide: function (el) {
        'use strict';

        if (el) {
            el.hide('blind', function () {            // ...and slide out.
                $(this).remove();
            });
        }
    },

    /**
     * Show notification
     * @param type
     * @param title
     * @param description
     */
    showNotificationSimple: function (type, title, description) {
        'use strict';

        var template = kendo.template('<div class="#=cssClass#"><p><strong>#=title#</strong></p><p>#=description#</p></div>');
        this.show(template({
            cssClass   : this.getNotificationTypeClass(type),
            title      : title,
            description: description
        }));
    },

    /**
     * Show notification with buttons
     * @param id
     * @param eventId
     * @param type
     * @param title
     * @param description
     * @param criticalityStatus
     */
    showNotification: function (id, eventId, type, title, description, criticalityStatus) {
        'use strict';

        var template = kendo.template(
            '<div class="row"><div class="#=cssClass# col-sm-8"><p><strong>#=title#</strong></p><p>#=description#</p></div><div class="toast-buttons col-sm-4"></div></div>'
        );

        var toast           = $('<div>', {
            'class': 'k-block toast',
            html   : template({
                cssClass   : this.getNotificationTypeClass(type),
                title      : title,
                description: description
            })
        });
        var buttonContainer = toast.find('.toast-buttons');

        var me = this;

        /**
         * True if message should not vanish after this.delay/1000 seconds.
         * @type {boolean}
         */
        var sticky = (criticalityStatus === App.view.Notification.criticalityHigh);

        // Define Buttons
        switch (type) {
            case this.notificationTypeReport:
                $('<button>', {
                    text   : App.translate('Open {0}', App.translate('Report')),
                    'class': 'k-button',
                    click  : function () {
                        App.view.Notification.openReport(eventId, $(this).closest('.toast'));
                    }
                }).appendTo(buttonContainer);

                // Only add Dismiss to sticky toasts.
                if (sticky) {
                    $('<button>', {
                        text   : App.translate('Dismiss {0}', App.translate('Report')),
                        'class': 'k-button',
                        click  : function () {
                            App.view.Notification.dismiss(id, $(this).closest('.toast'));
                        }
                    }).appendTo(buttonContainer);
                }
                break;

            case this.notificationTypeError:
                $('<button>', {
                    text   : App.translate('Reprocess {0}', App.translate('Error')),
                    'class': 'k-button',
                    click  : function () {
                        App.view.Notification.reprocess(id, eventId, $(this).closest('.toast'));
                    }
                }).appendTo(buttonContainer);

                // Only add Discard to sticky toasts.
                if (sticky) {
                    $('<button>', {
                        text   : App.translate('Discard {0}', App.translate('Error')),
                        'class': 'k-button',
                        click  : function () {
                            App.view.Notification.discard(id, eventId, $(this).closest('.toast'));
                        }
                    }).appendTo(buttonContainer);
                }
                break;
        }

        // Sticky or not?
        if (sticky) {

            // Add "Close" button here in order to just close the sticky toast.
            $('<button>', {
                html   : App.translate('Close Notification'),
                'class': 'k-button',
                click  : function () {
                    me.hide($(this).closest('.toast'));
                }
            }).appendTo(buttonContainer);

            toast
                .appendTo(this.el)
                .show('fade');              // Fade in
        } else {

            // Add hover-behavior to the button container.
            // Also, remember hover status of toast to not close it when hovering over it.
            buttonContainer.css('opacity', 0);
            toast.hover(function () {
                buttonContainer.animate({opacity: 1});

                // marshall the queue array and stop all delays.
                me.queue.map(function (itm) {
                    window.clearTimeout(itm.timeoutID);
                });
            }, function () {
                buttonContainer.animate({opacity: 0});

                // After mouse leave, set up the time outs again.
                me.queue.map(function (itm) {
                    itm.timeoutID = window.setTimeout(itm.next, me.delay);
                });
            });

            toast
                .appendTo(this.el)
                .show('fade')               // Fade in...
                .queue(function (next) {    // ...wait...
                    var queueId = me.queueId++;
                    $(this).data('queueId', queueId);

                    // and put those in a queue array
                    me.queue[queueId] = {
                        timeoutID: window.setTimeout(next, me.delay),
                        next     : next
                    };
                })
                .hide('fade', function () { // ...and fade out.
                    delete me.queue[$(this).data('queueId')];
                    $(this).remove();
                });
        }
    },
    /**
     * Returns corresponding css class for notification.
     * @param notificationType
     * @returns {string}
     */
    getNotificationTypeClass: function (notificationType) {
        'use strict';

        var cssClass = '';
        switch (notificationType) {
            case this.notificationTypeInfo:
                cssClass = 'toast-notification-info';
                break;
            case this.notificationTypeAlarm:
                cssClass = 'toast-notification-alarm';
                break;
            case this.notificationTypeError:
                cssClass = 'toast-notification-error';
                break;
            case this.notificationTypeReport:
                cssClass = 'toast-notification-report';
                break;
        }
        return cssClass;
    }
});
