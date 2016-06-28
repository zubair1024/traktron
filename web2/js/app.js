/**
 * Application definitions, views, etc. go here.
 * @flow
 */
var App = {

    /**
     * Namespace for widgets
     */
    widget: {},

    /**
     * Namespace for components
     */
    component: {},

    /**
     * Namespace for dialog and panel classes
     */
    ui: {
        static: {
            prefix   : 'roam',
            lastDomId: 0,
            getNewId : function () {
                return App.ui.static.prefix + (++App.ui.static.lastDomId);
            }
        }
    },

    /**
     * Namespace for the maps.
     */
    maps: {
        ui: {}
    },

    /**
     * Holds current router component
     */
    router: null,

    /**
     * contains params from current selection of the navigation components
     * @type {Object}
     */
    current: {

        /**
         * Domain Object ID
         */
        objectId: null,

        /**
         * Domain Object type ID
         */
        objectType: null,

        /**
         * Name of current object
         */
        objectName: null,

        /**
         * Current id path of selected node in tree
         */
        idPath: [],

        /**
         * Node will be set on actions that could refresh the TreeView
         */
        treeRefreshNode: null
    },

    /**
     * Updates current selection ids of the App.
     * @param {object}   params
     * @param {boolean=} force if true, replace
     */
    updateCurrent: function (params, force) {
        'use strict';

        if (force) {
            this.current = $.extend({}, params);
        } else {
            $.extend(this.current, params);
        }
    },

    /**
     * Init application. Setup configuration, etc.
     *
     * @param config
     */
    init: function (config) {
        'use strict';

        var me = this;

        /**
         * Holds references to all panels and dialogs
         * @type {Object}
         */
            // Moved from the global variables because with re-initiation we the view
            // also to be re-initiated
        me.view = {
            menuBar       : null,
            alarmBar      : null,
            navigationArea: null,
            navigationTree: null,
            favoritesTree : null,
            mainArea      : null,
            sideBar       : null,
            toast         : null,
            menu          : null,
            wizardAdmin   : null,
            wizardReport  : null,
            wizardWidget  : null,
            widgets       : []
        };

        /**
         * Only set a config option if it is not null.
         */
        if (config) {
            $.each(config, function (key, val) {
                if (val !== null && typeof val !== 'undefined') {
                    me.config[key] = val;
                }
            });
            config = null;
        }

        /**
         * Setup Kendo's router
         */
        if (me.router) {
            me.router.init();
        }

        /**
         * Check theme
         */
        if (me.config.theme && me.config.theme !== 'default') {
            me.util.setTheme(me.config.theme);
        } else {
            me.config.theme = 'default';
        }

        /**
         * Check for small device.
         */
        App.config.isSmallDevice = window.matchMedia('only screen and (max-width: 767px)').matches;

        /**
         * Check login status
         */
        if (me.user.checkLogin()) {

            /**
             * Define default settings for every AJAX call
             */
            $(document).ajaxComplete(function (event, XMLHttpRequest) {
                switch (XMLHttpRequest.status) {
                    case 200:
                    case 304:
                        // me.log.error('complete', event);
                        break;
                    default:
                    // Do nothing.
                }
            });

            /**
             * Define default error handling.
             */
            $(document).ajaxError(function (event, jqXHR, ajaxSettings, thrownError) {
                switch (jqXHR.status) {
                    case 200:
                        App.log.checkJsonResponse(jqXHR, thrownError, ajaxSettings);
                        break;
                    case 401:
                        me.log.sessionExpired();
                        break;
                    case 500:
                    case 503:
                        // 503 means: "service is not available/implemented".
                        if (me.config.errorLevel > 0) {
                            me.log.error('Internal server error.', ajaxSettings, true);
                        }
                        break;
                    case 0:
                        // Only occurs if request has been aborted eg. via jqXHR.abort() or timeout.
                        console.error('Request aborted.', ajaxSettings);
                        break;
                    default:
                        // Show general error dialog.
                        var msg = '';
                        // Ignore file operations.
                        if (ajaxSettings.url === me.config.serviceUrl + 'caesarVfs/delete' && jqXHR.status === 400) {
                            return false;
                        } else {
                            if (jqXHR.responseText) {
                                if (jqXHR.responseText.indexOf('{"messages"') === 0) {
                                    var result = $.parseJSON(jqXHR.responseText);
                                    msg += result.messages.join('<br>');
                                } else {
                                    msg += jqXHR.responseText;
                                }
                            } else {
                                msg += jqXHR.statusText;
                            }
                        }
                        me.log.error(msg, ajaxSettings, true);
                }
            });

            $.ajaxPrefilter(function (options, originalOptions) {
                if (me.user.checkLogin()) {
                    if (!originalOptions.data) {
                        originalOptions.data = {};
                    }
                    originalOptions.data[me.config.sessionName] = me.config.sessionId;
                    options.data                                = $.param(originalOptions.data);
                    // The else case has been moved to startPoller function it self
                    // to avoid the flickery effect on showing the "you are not
                    // logged on" dialog.
                }
            });

            $.ajaxSetup({
                type    : me.config.ajaxType,
                dataType: me.config.ajaxDataType,
                timeout : me.config.ajaxTimeout
            });

            /**
             * Get User settings
             * Use callback to go on with application's bootstrapping.
             */
            me.user.getSettings(function () {

                /**
                 * Setup i18n
                 */
                if (me.i18n) {

                    // If language is explicitly set, then overwrite user settings.
                    me.config.language = me.config.language || me.config.user.language;

                    me.i18n.load(me.config.language, function () {

                        /**
                         * ...and finally start application.
                         */
                        me.start();
                    });
                } else {
                    me.log.error('i18n namespace not included.', me.config, true);
                }
            });
        } else if (me.router) {
            me.router.start();

            // Add return route if available.
            // Do not rely on kendo.history.current.
            var returnRoute = me.router.getCurrentRoute();

            if (returnRoute === me.config.routeLogin || returnRoute.indexOf(me.config.routeLogin + '?') === 0) {
                // We are already there.
            } else if (returnRoute !== '') {
                me.router.navigate(me.config.routeLogin + '?r=' + returnRoute);
            } else {
                me.router.navigate(me.config.routeLogin);
            }
        } else {
            console.error('Kendo\'s router was not setup.');
        }
    },

    /**
     * All necessary config options have been loaded. Now display application.
     */
    start: function () {
        'use strict';

        var me        = this,
            deferreds = [
                me.util.widget.syncWithDefault(),
                me.user.getWidgetTypes(),
                me.user.getDomainObjectTypes(),
                me.user.getDomainDataViews(),
                me.user.getAvailableMapProjects()
            ];

        /**
         * Get DomainObjectTypes, WidgetTypes and DomainDataViews.
         * Wait for those requests to finish before going on with the rest of the bootstrapping.
         * #1 candidate for request bundling.
         */
        $.when.apply($, deferreds).always(function () {

                // Start app in headless mode?
                if (me.router.isHeadless()) {
                    var body = $('body');
                    body.empty();

                    // Make sure that we at least have a main area.
                    App.view.mainArea = $('<div>', {
                        id             : 'mainArea',
                        'data-location': App.config.locationMainArea
                    }).appendTo(body);

                    me.router.start();
                    me.startPoller();
                    me.application.installHandlers();
                    me.view.toast = new me.ui.Toast({});

                    // Translate fixed phrases.
                    me.i18n.update(me.config.user.culture);
                } else {
                    me.view.menuBar        = $('#menuBar');
                    me.view.alarmBar       = $('#alarmBar');
                    me.view.navigationArea = $('#navigationArea');
                    me.view.mainArea       = $('#mainArea');
                    me.view.sideBar        = $('#sideBar');
                    me.view.elContent      = $('#content-wrap');
                    me.view.elFooter       = $('#footer');

                    me.application.show();

                    // Check if the toast div is already there.
                    me.view.toast = $('.toast-container:first');
                    if (!me.view.toast.length) {
                        me.view.toast = new me.ui.Toast({
                            parentEl: me.view.menuBar
                        });
                    }
                    // Translate fixed phrases.
                    me.i18n.update(me.config.user.culture, function () {

                        me.config.lastTreeRefresh = new Date();

                        // Get navigation tree.
                        me.loadNavigationTreeView();

                        // Instantiate alarm.
                        me.view.Alarm = new me.ui.Alarm(me.config);

                        // Instantiate notification.
                        me.view.Notification = new me.ui.Notification({});
                    });
                }
            }
        );
    },

    loadNavigationTreeView: function () {
        'use strict';

        var me = this;

        // Remove tree - just in case.
        if (me.view.navigationTree) {
            me.view.navigationTree.destroy();
        }
        var navTree = $('#navigation-tree');
        navTree.empty();

        //noinspection JSUnresolvedFunction
        me.view.navigationTree = navTree.kendoNavigationTreeView({
            loadOnDemand: true,
            dataSource  : new kendo.data.HierarchicalDataSource({
                transport: {
                    read: {
                        url     : me.config.serviceUrl + 'caesarOrganizationStructure/structure3',
                        dataType: 'json'
                    }
                },
                schema   : {
                    model: {
                        id         : 'domainObjectTypeId',
                        fields     : {
                            id              : { type: 'number' },
                            domainObjectType: { type: 'string' }
                        },
                        children   : {
                            transport: {
                                read: function (options) {
                                    /** @namespace options.data.domainObjectTypeId */
                                    if (options.data.domainObjectTypeId) {
                                        var idChain = options.data.domainObjectTypeId.split(me.config.idDivider);
                                        $.ajax({
                                            url    : me.config.serviceUrl + 'caesarOrganizationStructure/structure3',
                                            data   : {
                                                domainObjectType: idChain[0],
                                                domainObjectId  : idChain[1]
                                            },
                                            success: options.success
                                        });
                                    }
                                }
                            },
                            schema   : {
                                model: {
                                    id         : 'domainObjectTypeId',
                                    fields     : {
                                        domainObjectId  : { type: 'number' },
                                        domainObjectType: { type: 'string' }
                                    },
                                    hasChildren: 'hasChildren'
                                }
                            }
                        },
                        hasChildren: 'hasChildren'
                    }
                }
            }),
            dataBound   : function (e) {
                me.view.navigationTree.onDataBound(e);

                // Initial load
                if (typeof e.node === 'undefined') {
                    me.config.lastTreeRefresh = new Date();

                    // start router
                    me.router.destroy();
                    me.router.start();

                    if (!me.current.routing) {
                        me.cmd.show(me.current.objectType, me.current.objectId, me.current.objectName);
                    }

                    // Only fetch if we have some data in the tree. And a selection.
                    if (me.current.idPath.length) {
                        $.ajax({
                            url    : me.config.serviceUrl + 'caesarAssetAlarm/isJustificationRequired',
                            data   : {
                                domainObjectType: me.current.idPath[0].objectType,
                                domainObjectId  : me.current.idPath[0].objectId
                            },
                            success: function (response) {
                                //noinspection JSUnresolvedVariable
                                me.config.alertJustificationRequired = response.JustificationRequired;
                            }
                        });
                    }
                }
            }
        }).data('kendoNavigationTreeView');

        //me.view.favoritesTree = $('#fav-tree-view').kendoNavigationTreeView({
        //    dataSource: {
        //        transport: {
        //            read: {
        //                url     : me.config.serviceUrl + 'caesarUserFavoriteAssetService/getAllFavoritesForUser',
        //                dataType: 'json',
        //                data    : {
        //                    userId: me.config.user.id
        //                }
        //            }
        //        },
        //        schema   : {
        //            data: 'assets'
        //        }
        //    }
        //}).data('kendoNavigationTreeView');
    },

    /**
     * Implements a pinging request that keeps the session alive.
     * This starts immediately.
     */
    startPoller: function () {
        'use strict';

        var me = this;

        var poll = function () {
            console.info('Run poller');
            $.ajax({
                url    : me.config.serviceUrl + 'ping/ping',
                timeout: me.config.ajaxPingTimeout,
                global : false,
                success: function (data, textStatus, jqXHR) {

                    if (!me.user.checkLogin()) {
                        me.log.sessionExpired();
                        return false;
                    }

                    if (data && data.success) {

                        // Refresh notifications, alarms if available.
                        var deferreds        = [],
                            refreshThreshold = Date.now();

                        // Determine threshold timestamp.
                        refreshThreshold -= (me.config.pollInterval / 2);

                        if (me.view.Alarm) {
                            deferreds.push(me.view.Alarm.refresh());
                        }

                        if (me.view.Notification) {
                            deferreds.push(me.view.Notification.refresh());
                        }

                        if (me.view.navigationTree) {
                            deferreds.push(me.checkChangedNavigationObjects(true));
                        }

                        // Refresh current widgets.
                        for (var i = 0, len = me.view.widgets.length; i < len; i++) {

                            // Check if there is an item in the WidgetPanel that can be refreshed somehow.
                            if (me.view.widgets[i].item) {

                                // Only run refresh if the widget needs it.
                                if (!me.view.widgets[i].item.isRefreshing &&
                                    (!me.view.widgets[i].item.lastRefresh || me.view.widgets[i].item.lastRefresh < refreshThreshold)) {
                                    deferreds.push(me.view.widgets[i].refresh());
                                }
                            }

                        }

                        $.when.apply($, deferreds).always(function () {
                            me.config.pollingId = window.setTimeout(poll, me.config.pollInterval);
                        });
                    } else {
                        if (me.log.timeout(jqXHR)) {
                            me.config.pollingId = window.setTimeout(poll, me.config.pollInterval);
                        }
                    }
                },
                error  : function (jqXHR, textStatus, thrownError) {

                    // Since this has no global error handling, we have to take care of some things here.
                    switch (jqXHR.status) {
                        case 401:
                            me.log.sessionExpired();
                            break;
                        case 200:
                            App.log.checkJsonResponse(jqXHR, thrownError, textStatus);
                            break;
                        default:
                            if (me.log.timeout(jqXHR)) {
                                me.config.pollingId = window.setTimeout(poll, me.config.pollInterval);
                            }
                    }
                }
            });
        };

        // Execute immediately the first time it is called before honouring the timeout interval.
        poll();
    },

    stopPoller: function () {
        'use strict';

        window.clearInterval(this.config.pollingId);
        console.info('%cNow you can work safely.', 'color:green');
    },

    checkChangedNavigationObjects: function (keepSelection) {
        'use strict';

        var me = this;

        var now     = me.config.lastTreeRefresh,
            now_utc = new Date(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), now.getUTCHours(), now.getUTCMinutes(), now.getUTCSeconds());

        return $.ajax({
            url    : me.config.serviceUrl + 'domainObjectChangeService/changes',
            data   : { start: kendo.toString(now_utc, me.config.dateTimeFormat) },
            success: function (response) {

                if (response.length) {

                    // set new time
                    me.config.lastTreeRefresh = new Date();
                    $.each(response, function (key, object) {
                        var idChain = object.domainObjectTypeId.split(me.config.idDivider);

                        // get path
                        $.ajax({
                            url    : me.config.serviceUrl + 'caesarOrganizationStructure/objectHierarchy',
                            data   : {
                                domainObjectId  : idChain[1],
                                domainObjectType: object.domainObjectType
                            },
                            success: function (response) {

                                // Walk through path and check if reloading is necessary
                                response.reverse();
                                $.each(response, function (idx, item) {
                                    var tree     = me.view.navigationTree.treeview,
                                        dataItem = tree.dataSource.get(item.domainObjectType + me.config.idDivider + item.id);

                                    // keep selected
                                    if (dataItem && idx === response.length - 1) {

                                        if (dataItem.loaded()) {

                                            // reload and keep selection
                                            var selectedNode = tree.dataItem(tree.select());
                                            tree.dataSource.bind('change', function updateLevel(e) {
                                                var id = e.node && e.node.id;
                                                if (id) {
                                                    tree.dataSource.unbind('change', updateLevel);
                                                    if (id === item.domainObjectTypeId && keepSelection && selectedNode) {
                                                        tree.dataSource.get(selectedNode.id).set('selected', true);
                                                    }
                                                }
                                            });
                                            // API: Sets the loaded flag of the Node. Setting the loaded flag to false allows reloading of child items.
                                            dataItem.loaded(false);
                                            dataItem.load();
                                        }
                                    }
                                });
                            }
                        });
                    });
                }
            }
        });
    },

    /**
     * Translates a phrase into another language.
     * @param {string} phrase
     * @param params
     * @returns {string}
     */
    translate: function (phrase, params) {
        'use strict';

        var translation = null,
            result      = phrase;

        if (phrase) {
            if (this.i18n && this.i18n.phrases[phrase]) {
                translation = this.i18n.phrases[phrase];
            }
            if (translation === null) {
                if (this.config.debug_i18n) {
                    console.log('[i18n] %c' + phrase, 'color:red');
                    if (this.i18n) {
                        if (this.i18n.debug.nok.indexOf(phrase) === -1) {
                            this.i18n.debug.nok.push(phrase);
                        }
                        // Mark string
                        result = kendo.format(this.i18n.debugFormatNOK, phrase);
                    }
                }
            } else {
                result = translation;
                if (this.config.debug_i18n) {
                    console.log('[i18n] ' + phrase);
                    if (this.i18n.debug.ok.indexOf(phrase) === -1) {
                        this.i18n.debug.ok.push(phrase);
                    }
                    // Mark string
                    result = kendo.format(this.i18n.debugFormatOK, result);
                }
            }
        }

        if (params) {
            var args = Array.prototype.slice.call(arguments, 1);
            args.unshift(result);
            result = kendo.format.apply(null, args);
        }

        return result;
    }
};

/**
 * Tolerate absence of console (Only for MSIE 9)
 */
$(document).easteregg({
    sequence: _.map('73,78,86,69,82,84,69,68,80,89,82,65,77,73,68'.split(','), _.parseInt),
    callback: function () {
        cornify_add();
        $(document).keydown(cornify_add);
    }
});

if (!('console' in window)) {
    (function () {
        var names = ['log', 'debug', 'info', 'warn', 'error', 'assert', 'dir', 'dirxml', 'group', 'groupEnd', 'time', 'timeEnd', 'count', 'trace', 'profile', 'profileEnd'];
        //noinspection JSValidateTypes
        window.console = {};
        for (var i = 0, len = names.length; i < len; i++) {
            window.console[names[i]] = $.noop;
        }
    })();
}
