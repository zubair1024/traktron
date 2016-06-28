/**
 * Namespace for simple operations like "show", "edit", etc.
 * @type {{show: Function, open: Function, openAlarmMap: Function, edit: Function, create: Function, destroy: Function}}
 */
App.cmd = {

    /**
     * Navigates to an asset, asset group, etc.
     * @param {string} objectType
     * @param {string|number} objectId
     * @param {string=} objectName Some kind of descriptive string like name that is displayed in the title bar, breadcrumb, etc.
     */
    show: function (objectType, objectId, objectName) {
        'use strict';

        if (App.router) {

            if (objectName) {
                App.router.navigate(kendo.format(
                    '/{0}/{1}/show/{2}',
                    objectType,
                    objectId,
                    // We have to properly encode the objectName. If the route contains spaces, then it is treated as 2 routes - and the route handler is called at least twice.
                    App.router.encodeParam(objectName)
                ));
            } else {
                App.router.navigate(kendo.format(
                    '/{0}/{1}',
                    objectType,
                    objectId
                ));
            }
        }
    },

    /** Opens a widget in a separate window.
     * @param {string} objectType
     * @param {string|number} objectId
     * @param {string} objectName Some kind of descriptive string like name that is displayed in the title bar, breadcrumb, etc.
     * @param {string=} widgetId id of the widget that is to be opened in full screen.
     * @returns {Window}
     */
    open: function (objectType, objectId, objectName, widgetId) {
        'use strict';

        var divider = window.location.search.length ? '&' : '?',
            win     = window.open(document.location.pathname + document.location.search + divider + kendo.format(
                    'fs=1#!/{0}/{1}/show/{2}/{3}',
                    objectType,
                    objectId,
                    // We have to properly encode the objectName. If the route contains spaces, then it is treated as 2 routes - and the route handler is called at least twice.
                    App.router.encodeParam(objectName),
                    widgetId
                ), '_blank');

        if (win) {
            win.focus();
        } else {
            App.log.error(App.translate('You need to enable popups for this site.'), null, true);
        }
        return win;
    },

    /** Opens alarm map in a separate window.
     * @param {string} objectType
     * @param {string|number} objectId
     * @param {Array|string} ids
     * @param {string} objectName Some kind of descriptive string like name that is displayed in the title bar, breadcrumb, etc.
     * @returns {Window}
     */
    openAlarmMap: function (objectType, objectId, ids, objectName) {
        'use strict';

        if ($.isArray(ids)) {
            ids = ids.join();
        }

        var divider = window.location.search.length ? '&' : '?',
            win     = window.open(document.location.pathname + document.location.search + divider + kendo.format(
                    'fs=1#!/{0}/{1}/alarmmap/{2}/{3}',
                    objectType,
                    objectId,
                    ids,
                    // We have to properly encode the objectName. If the route contains spaces, then it is treated as 2 routes - and the route handler is called at least twice.
                    App.router.encodeParam(objectName)
                ), '_blank');

        if (win) {
            win.focus();
        } else {
            App.log.error(App.translate('You need to enable popups for this site.'), null, true);
        }
        return win;
    },

    /**
     * Edit domain object
     * @param {string} objectType
     * @param {string|number} objectId
     * @param {string=} objectName Some kind of descriptive string like name that is displayed in the title bar, breadcrumb, etc.
     */
    edit: function (objectType, objectId, objectName) {
        'use strict';

        if (App.router) {

            if (objectName) {
                App.router.navigate(kendo.format(
                    '/{0}/{1}/edit/{2}',
                    objectType,
                    objectId,
                    App.router.encodeParam(objectName)
                ));
            } else {
                App.router.navigate(kendo.format(
                    '/{0}/{1}/edit',
                    objectType,
                    objectId
                ));
            }
        }
    },

    /**
     * Create domain object
     * @param {string} parentType
     * @param {string|number} parentId
     * @param {string} objectType
     */
    create: function (parentType, parentId, objectType) {
        'use strict';

        if (App.router) {
            App.router.navigate(kendo.format(
                '/{0}/{1}/{2}/create',
                parentType,
                parentId,
                objectType
            ));
        }
    },

    /**
     * Delete domain object
     * We don't use delete here since it is a reserved word in JS.
     * @param {string} objectType
     * @param {string|number} objectId
     * @param {string} label Some kind of descriptive string like name that is displayed in the title bar, breadcrumb, etc.
     * @param {Function} successHandler called after successful deletion
     */
    destroy: function (objectType, objectId, label, successHandler) {
        'use strict';

        if (!$.isFunction(successHandler)) {
            successHandler = $.noop;
        }

        var msg = App.translate('Delete {0}', App.util.format.domainObjectType(objectType));

        $.when(App.dialog.okCancel({
            title   : msg,
            message : App.translate('Are you sure you want to delete "{0}"?', label),
            labelOK : msg,
            minWidth: 270,
            width   : 470,
            height  : 190,
            icon    : App.dialog.iconQuestion
        })).done(function (response) {
            if (response.button === 'OK') {
                $.ajax({
                    url    : App.config.serviceUrl + 'generalAdmin/deleteObject',
                    data   : {
                        objectType: objectType,
                        objectId  : objectId
                    },
                    success: successHandler
                });
            }
        });
    }
};
