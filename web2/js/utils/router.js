/**
 * Kendo Router. Will be instantiated in App.init().
 */
App.router = {
    /**
     * contains the objects that are returned by a ajax call within the routes
     * @type {Array.jqXHR|Array}
     */
    jqXHRs      : [],
    /**
     * last Route that _was_ being viewed.
     */
    lastRoute   : '__no_route__',
    /**
     * Current route that is being viewed.
     */
    currentRoute: '',
    /**
     * init
     */
    init        : function () {
        'use strict';

        var guid = new Date().getTime();

        /**
         * contains Kendo's router.
         * @private
         */
        var router  = new kendo.Router({
            hashBang: true
        });
        var started = false;


        /**
         * Listen for changes on the url.
         * Kendo's Change event in the router is broken. So we use our own.
         */
        $(window).on('hashchange.' + guid, function () {
            //console.log('getCurrentRoute() says:', App.router.getCurrentRoute());
            //console.log('App.router.currentRoute says:', App.router.currentRoute);
            //console.log('App.router.lastRoute says:', App.router.lastRoute);

            var currentRoute = App.router.getCurrentRoute();
            if (!currentRoute || currentRoute === '#' || currentRoute === '#!' || currentRoute === '#!/') {
                currentRoute = kendo.format(
                    '/{0}/{1}/show/{2}',
                    App.current.objectType,
                    App.current.objectId,
                    // We have to properly encode the objectName. If the route contains spaces, then it is treated as 2 routes - and the route handler is called at least twice.
                    App.router.encodeParam(App.current.objectName)
                );
            }

            if (currentRoute != App.router.currentRoute) {
                App.router.lastRoute    = App.router.currentRoute;
                App.router.currentRoute = currentRoute;
            }
        });


        /**
         /**
         * Define routes
         */
        router.route('/home', this.routeHome);
        router.route(App.config.routeLogin, this.routeLogin);
        router.route('/logout', App.user.doLogout);
        router.route('/widgetcatalog', this.routeWidgetCatalog);
        router.route('/about', this.routeAbout);
        router.route('/jobcard/:objectId(/lon/:longitude/lat/:latitude)', this.routeJobCard);
        router.route('/:parentObjectType/:parentObjectId/:objectType/create', this.routeCreateObject);
        router.route('/:parentObjectType/:parentObjectId/:objectType/batchcreate', this.routeBatchCreateObject);
        router.route('/:objectType/:objectId/report/:reportId', this.routeReport);
        router.route('/:objectType/:objectId/edit(/:objectName)', this.routeEditObject);
        router.route('/:objectType/:objectId/show/:objectName(/:widgetId)', this.routeContent);
        router.route('/:objectType/:objectId/alarmmap/:ids/:objectName', this.routeAlarmMap);
        router.route('/:objectType/:objectId', this.routeContent);
        router.route('/', this.routeDummy);

        /**
         * Expose these methods.
         */
        this.navigate = function (route) {
            if (started) {
                router.navigate(route);
            }
        };
        this.start   = function () {
            if (!started) {
                router.start();
                started = true;
            }
        };
        this.destroy = function () {
            router.destroy();
            started = false;
        };

        this.closeOpenWizardsAndDialogs = function () {
            if (App.view.wizardAdmin) {
                App.view.wizardAdmin.destroy();
                App.view.wizardAdmin = null;
            }
            if (App.view.widgetCatalog) {
                App.view.widgetCatalog.destroy();
                App.view.widgetCatalog = null;
            }
            if (App.view.BatchUpload) {
                App.view.BatchUpload.destroy();
                App.view.BatchUpload = null;
            }
            if (App.view.wizardReport) {
                App.view.wizardReport.destroy();
                App.view.wizardReport = null;
            }
            if (App.view.aboutWindow) {
                App.view.aboutWindow.dialog.destroy();
                App.view.aboutWindow = null;
            }
            if (App.view.wizardWidget) {
                App.view.wizardWidget.destroy();
                App.view.wizardWidget = null;
            }
        };
    },

    /**
     * Abort all current ajax calls that are running in the router.
     */
    ajaxClear: function () {
        if (this.jqXHRs.length) {
            this.jqXHRs.map(function (jqXHR) {

                // Stop Ajax call - only if not uninitialized (0) or finished (4).
                if (jqXHR && jqXHR.readyState !== 4 && jqXHR.readyState !== 0) {
                    jqXHR.abort();
                    jqXHR = null;
                }
            });
            this.jqXHRs = [];
        }
    },

    /**
     * Simple check if the current route (one of the above) needs all the application UI framework.
     */
    isHeadless     : function () {
        return (
            App.router.getUrlParameterByName('fs') === '1' ||
            document.location.hash.indexOf('#!/jobcard') === 0
        );
    },
    /**
     * Returns current Kendo route
     * @returns {string}
     */
    getCurrentRoute: function () {
        // Since we are using "hashBang", we do not need the beginning of the route, which is "#!", so the first two characters. Strip them.
        return window.location.hash.slice(2);
    },

    /**
     * Checks if the currentRoute is the same as it is already stored in App.current.route.
     * If it is NOT the same, it updates it to the current one and stores the old route in "App.current.lastRoute".
     * @returns {boolean} true if the route is a new one and not the same that is being already displayed.
     */
    checkRoute  : function () {
        return App.router.currentRoute != App.router.lastRoute;
    },
    /**
     * Returns all GET parameters from the url.
     * @returns {Object}
     */
    getUrlParams: function () {
        'use strict';

        var params = {};
        if (window.location.search.length) {

            // Remove leading "?" and split into pieces.
            var hashes = window.location.search.slice(1).split('&'),
                hash;

            for (var i = 0, len = hashes.length; i < len; i++) {
                hash = hashes[i].split('=');

                if (hash.length > 1) {
                    params[hash[0]] = decodeURIComponent(hash[1]);
                }
            }
        }
        return params;
    },

    getUrlParameterByName: function (name) {
        'use strict';

        var match = new RegExp('[?&]' + name + '=([^&]*)').exec(window.location.search);
        return match && decodeURIComponent(match[1].replace(/\+/g, ' '));
    },
    /**
     * Encode for the URL. Do not forget the blanks.
     * @param s
     * @returns {string}
     */
    encodeParam          : function (s) {
        return encodeURIComponent(s).replace(/%20/g, '+');
    },
    decodeParam          : function (s) {
        if (typeof s === 'string') {
            return decodeURIComponent(s.replace(/\+/g, ' '));
        } else {
            return s;
        }
    },

    /**
     * Dummy route for cancellation of eg. dialogs, etc.
     * It only deletes the breadcrumb.
     */
    routeDummy: function () {
        'use strict';
        App.router.closeOpenWizardsAndDialogs();
        App.util.updateBreadcrumb('');
    },

    /**
     * select first node in Navigation tree.
     */
    routeHome: function () {
        'use strict';
        App.router.closeOpenWizardsAndDialogs();
        App.router.navigate('/');
        window.location.reload();
    },

    /**
     * Create a new domainObject
     * @param {string} parentObjectType
     * @param {string|number} parentObjectId
     * @param {string} objectType
     */
    routeCreateObject: function (parentObjectType, parentObjectId, objectType) {
        'use strict';

        if (!App.router.checkRoute()) {
            return;
        }
        App.router.closeOpenWizardsAndDialogs();

        App.view.wizardAdmin = new App.ui.WizardAdmin({
            objectType      : objectType,
            parentObjectType: parentObjectType,
            parentObjectId  : parentObjectId
        });

        App.view.wizardAdmin.show();
    },

    /**
     *
     * @param {string} parentObjectType
     * @param {string|number} parentObjectId
     * @param {string} objectType
     */
    routeBatchCreateObject: function (parentObjectType, parentObjectId, objectType) {
        'use strict';

        if (!App.router.checkRoute()) {
            return;
        }
        App.router.closeOpenWizardsAndDialogs();

        App.view.BatchUpload = new App.ui.BatchUpload({
            objectType      : objectType,
            parentObjectType: parentObjectType,
            parentObjectId  : parentObjectId
        });

        App.view.BatchUpload.show();
    },

    /**
     * edit some object
     * @param {string} objectType
     * @param {string|number} objectId
     * @param {string} objectName
     */
    routeEditObject: function (objectType, objectId, objectName) {
        'use strict';

        if (!App.router.checkRoute()) {
            return;
        }

        App.router.closeOpenWizardsAndDialogs();

        if (objectName) {
            objectName = App.router.decodeParam(objectName);
        }

        App.view.wizardAdmin = new App.ui.WizardAdmin({
            objectType: objectType,
            objectId  : objectId,
            label     : objectName || null
        });

        App.view.wizardAdmin.show();
    },

    /**
     * Opens report dialog
     * @param {string} objectType
     * @param {string|number} objectId
     * @param {string} reportId
     */
    routeReport: function (objectType, objectId, reportId) {
        'use strict';

        if (!App.router.checkRoute()) {
            return;
        }

        App.router.closeOpenWizardsAndDialogs();

        App.view.wizardReport = new App.ui.WizardReport({
            reportId  : reportId,
            objectType: objectType,
            objectId  : objectId
        });
        App.view.wizardReport.show();
        App.util.updateBreadcrumb(reportId);
    },

    /**
     * Open WidgetCatalog.
     */
    routeWidgetCatalog: function () {
        'use strict';

        if (!App.router.checkRoute()) {
            return;
        }

        App.router.closeOpenWizardsAndDialogs();

        App.view.widgetCatalog = new App.ui.WidgetCatalog({});
        App.view.widgetCatalog.show();
        App.updateCurrent({
            objectName: null
        });
        App.util.updateBreadcrumb(App.translate('Widget Catalog'));
    },

    /**
     * Show About Page
     */
    routeAbout: function () {
        'use strict';

        App.router.closeOpenWizardsAndDialogs();

        App.view.aboutWindow = new App.ui.AboutWindow({});

        App.util.updateBreadcrumb(App.translate('About'));
    },

    /**
     * only open this JobCard for SmartPhone use
     * @param objectId
     * @param longitude
     * @param latitude
     */
    routeJobCard: function (objectId, longitude, latitude) {
        'use strict';

        if (!App.router.checkRoute()) {
            return;
        }

        App.router.closeOpenWizardsAndDialogs();

        App.current.routing = true;

        var panelTemplate = kendo.template(
            '<div id="#=id#" class="panel panel-primary" style="#=style#">' +
            '<div class="panel-heading"><h3 class="panel-title">#=title#</h3></div>' +
            '#=content#' +
            '</div>'
        );

        var body = $('body');
        body
            .empty()
            .css({
                height     : 'auto',
                'font-size': '14px',
                margin     : '15px 40px 15px 15px'
            })
            .html(panelTemplate({
                id     : 'mobile-jobcard',
                style  : '',
                title  : 'JobCard ' + objectId,
                content: '<table class="table"></table>' +
                '<div class="panel-body">' +
                '<div class="pull-right">' +
                '<button type="button" class="btn btn-danger" data-action="job-action" data-actiontype="cancelJob">' + App.translate('Cancel Jobs') + '</button> ' +
                '<button type="button" class="btn btn-success" data-action="job-action" data-actiontype="completeJob">' + App.translate('Complete Jobs') + '</button>' +
                '</div>' +
                '</div>' +
                '<div class="panel-footer">' + App.translate('Your changes have not been saved yet.') + '</div>'
            }))
            .show();

        var startCoordinates = null;
        /**
         * If this commented in, this is used as starting point.
         * @type {{longitude: number, latitude: number}}
         */
        //startCoordinates = {
        //    // Dubai city centre: lon: 55.29141, lat: 25.26371
        //    //longitude: 55.29141,
        //    //latitude : 25.26371
        //    // RW HQ: lon: 55.16247, lat: 25.09773 (on a street in front of the building)
        //    longitude: 55.16247,
        //    latitude : 25.09773
        //};

        // Only show the map if we have longitude and latitude from the route parameters.
        if ($.isNumeric(longitude) && $.isNumeric(latitude)) {

            // Append map widget.
            $(panelTemplate({
                id     : 'mobile-assetmap',
                style  : 'height:300px',
                title  : 'Map',
                content: ''
            })).appendTo('body');

            // Try to get the current position.
            if (!startCoordinates && navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(
                    // Success handler
                    function (position) {

                        // Now create the map panel.
                        var mapUrl = 'js/roam/maps/viewers/heremaps/ext/route_display.html?' + $.param({
                                // Start coordinates:
                                lon0: position.coords.longitude,
                                lat0: position.coords.latitude,
                                // End coordinates:
                                lon1: longitude,
                                lat1: latitude
                            });

                        $('#mobile-assetmap').append('<iframe src="' + mapUrl + '" style="width:100%;height:100%;border:0"></iframe>');

                        //$('#mobile-assetmap').height($(window).height() - $('#mobile-assetmap').offset().top
                        //                             - parseInt($("#mobile-jobcard").css("margin-bottom"))
                        //                             - parseInt($("#mobile-jobcard").css("margin-top"))
                        //                             - parseInt($('#mobile-assetmap').css("margin-bottom"))
                        //);
                    },

                    // Error handler
                    function (errorFlag) {
                        if (errorFlag) {
                            $('#mobile-assetmap').append('<div class="panel-body"><div class="alert alert-warning"><strong>Error!</strong> The Geolocation service failed.</div></div>');

                        } else {
                            $('#mobile-assetmap').append('<div class="panel-body"><div class="alert alert-warning"><strong>Error!</strong> Your browser does not support geolocation.</div></div>');
                        }
                    }
                );
            } else {

                // Use default coordinates
                var mapUrl = 'js/roam/maps/viewers/heremaps/ext/route_display.html?' + $.param({
                        // Start coordinates:
                        lon0: startCoordinates.longitude,
                        lat0: startCoordinates.latitude,
                        // End coordinates:
                        lon1: longitude,
                        lat1: latitude
                    });

                $('#mobile-assetmap').append('<iframe src="' + mapUrl + '" style="width:100%;height:100%;border:0"></iframe>');
            }
        }

        /**
         * fixed domain objectType
         * @type {string}
         */
        var objectType = 'jobcard';

        var columns = [
            {domainObjectValueId: 'jobStatus', title: ''},
            {domainObjectValueId: 'jobCode', title: 'Code'},
            {domainObjectValueId: 'jobcardName', title: 'Name'},
            {domainObjectValueId: 'jobType', title: 'Type'}
        ];

        //noinspection JSJQueryEfficiency
        var jobCards = new App.widget.SimpleGrid({
            domainDataView: 'maintenanceJobs',
            objectType    : objectType,
            objectId      : objectId,
            objectValues  : '["jobCode","jobcardName","jobType","jobStatus"]',
            columns       : columns,
            renderTo      : $('#mobile-jobcard .table')
        });

        var jobgridAction = function (action, ids) {
            if (ids.length) {
                kendo.ui.progress(jobCards.el, true);
                $.ajax({
                    url  : App.config.serviceUrl + 'caesarMaintenance/' + action,
                    data : {
                        domainObjectId: objectId,
                        jobId         : JSON.stringify(ids)
                    },
                    // TODO rename to success, at the moment service does not return proper json format
                    error: function () {
                        jobCards.elTbody.empty();
                        jobCards.renderTableData();
                        $('.panel-footer').text(App.translate('Status of selected jobs successfully changed.'));
                        kendo.ui.progress(jobCards.el, false);
                    }
                });
            }
        };

        $('[data-action="job-action"]').on('click', function (e) {
            jobgridAction($(this).data('actiontype'), jobCards.getSelectedIds());
            e.preventDefault();
            return false;
        });

        App.updateCurrent({
            objectType: objectType,
            objectId  : objectId,
            objectName: 'JobCard ' + objectId
        });
        App.util.updateBreadcrumb();
    },

    /**
     * Display the login dialog. Remember the returnRoute.
     * @param params
     */
    routeLogin: function (params) {
        'use strict';
        App.router.closeOpenWizardsAndDialogs();

        if (!App.user.checkLogin()) {
            App.util.updateBreadcrumb('Login');
            var returnRoute = params && params.r && params.r !== App.config.routeLogin ? params.r : null;
            App.ui.login.show(returnRoute);
        }
    },

    /**
     * Shows a map preferably in full screen with a list of events or alarms.
     * @param {string} objectType
     * @param {string|number} objectId
     * @param {string} ids comma separated list of alarm or event ids
     * @param {string} objectName of Widget
     */
    routeAlarmMap: function (objectType, objectId, ids, objectName) {
        'use strict';

        if (!App.router.checkRoute()) {
            return;
        }

        App.router.closeOpenWizardsAndDialogs();

        // Sanitize objectName.
        if (objectName) {
            // The objectName is url encoded. Decode.
            objectName = App.router.decodeParam(objectName);
        } else {
            objectName = null;
        }

        // Notify other components that routing going on.
        App.current.routing = true;

        /**
         * 1. Destroy existing widgets.
         */
        for (var i = 0; i < App.view.widgets.length; i++) {
            if (App.view.widgets[i]) {
                App.view.widgets[i].destroy();
                App.view.widgets[i] = null;
            }
        }
        App.view.widgets = null;
        App.view.widgets = [];

        App.updateCurrent({
            objectId  : objectId,
            objectType: objectType,
            objectName: objectName
        });
        App.util.updateBreadcrumb();

        /**
         * 2. Clear main content area.
         */
        if (App.view.mainArea) {
            App.view.mainArea.empty();
        } else {
            // Make sure that we at least have a main area.
            App.view.mainArea = $('#mainArea');
            if (!App.view.mainArea.length) {
                App.view.mainArea = $('<div>', {
                    id             : 'mainArea',
                    'data-location': App.config.locationMainArea
                }).appendTo('body');
            }
        }

        /**
         * 3. Display widget.
         * @type {App.ui.WidgetPanel}
         */
        var widget = new App.ui.WidgetPanel({
            widgetType    : 'map',
            location      : App.config.locationMainArea,
            isHeadless    : App.router.isHeadless(),
            name          : objectName,
            pictureName   : App.util.widget.defaultIcon.alarmMap,
            id            : 'alarmMap', // Only used for the settings dialog and fade in of other widget.
            widgetData    : {
                // This tells the alarm map to use the default mapProject.
                viewType: null
            },
            objectType    : objectType,
            domainObjectId: objectId,
            ids           : ids.split(','), // alarmIds or eventIds
            objectName    : null // Maybe we can fill this with "3 objects" or so.
        });

        App.view.widgets.push(widget);
        widget.show();
    },

    /**
     * Selects given objectType and objectId in the navigation tree and displays associated widgets.
     * @param {string} objectType
     * @param {string} objectId
     * @param {string=} objectName
     * @param {string=} widgetId
     */
    routeContent: function (objectType, objectId, objectName, widgetId) {
        'use strict';

        if (!App.router.checkRoute()) {
            return;
        }

        App.router.closeOpenWizardsAndDialogs();
        // In case the user is not logged in then don't populate the area.
        if (!App.user.checkLogin()) {
            return;
        }

        if (App.ui.login.dialog) {
            App.ui.login.dialog.destroy();
        }

        // Called with simple route. Just empty the third parameter (which is "params") with null.
        if (arguments.length === 3) {
            objectName = null;
        }

        // Sanitize objectName.
        if (objectName) {
            // The objectName is url encoded. Decode.
            objectName = App.router.decodeParam(objectName);
        } else {
            objectName = null;
        }

        // Sanitize widgetId.
        if (widgetId && widgetId.indexOf('/') === 0) {
            widgetId = widgetId.substr(1);
        }

        // We don't use "this" scope here, since the route functions are scoped to the "window".
        App.router.ajaxClear();

        // Notify other components that routing going on.
        App.current.routing = true;

        /**
         * 1. Destroy existing widgets.
         */
        for (var i = 0; i < App.view.widgets.length; i++) {
            if (App.view.widgets[i]) {
                App.view.widgets[i].destroy();
                App.view.widgets[i] = null;
            }
        }
        App.view.widgets = null;
        App.view.widgets = [];

        /**
         * 2. Select item in the tree and enrich App.current with more params if available.
         *    Check if selection already reflects objectType, objectId. If yes, don't search the tree.
         */
        if (App.view.navigationTree) {
            var currentNode = App.view.navigationTree.treeview.select(),
                node        = null,
                idChain     = [];

            if (currentNode.length && App.router.currentRoute && !App.router.currentRoute.match('edit')) {
                node = App.view.navigationTree.treeview.dataSource.getByUid($(currentNode).data().uid);
                if (node) {
                    idChain = node.id.split(App.config.idDivider);
                }
            }

            if (node && node.domainObjectType === objectType && idChain[1] === objectId) {
                // Already selected.
                currentNode.scrollintoview({
                    direction: 'vertical'
                });
            } else {
                // Get ID Path for object - server turnaround.
                App.router.jqXHRs.push($.ajax({
                    url    : App.config.serviceUrl + 'caesarOrganizationStructure/objectHierarchy',
                    data   : {
                        domainObjectType: objectType,
                        domainObjectId  : objectId
                    },
                    success: function (response) {
                        App.view.navigationTree.selectNodeByPath(response.reverse());
                    }
                }));
            }
        }

        App.updateCurrent({
            objectId  : objectId,
            objectType: objectType,
            objectName: objectName
        });
        App.util.updateBreadcrumb();

        /**
         * 3. Clear content areas.
         */
        if (App.view.mainArea) {
            App.view.mainArea.empty();
        }
        if (App.view.sideBar) {
            App.view.sideBar.empty();
        }

        /**
         * 4. Load widgets if necessary.
         */
        if (App.config.widgets[objectType]) {

            App.router.addWidgets(App.config.widgets[objectType], objectId, objectName, widgetId);

        } else {
            App.router.jqXHRs.push($.ajax({
                url    : App.config.serviceUrl + 'caesarWidgetProvider/getWidgets2',
                data   : {
                    domainObjectType: objectType
                },
                success: function (response) {

                    /**
                     * In "data" there is already the objectType in it.
                     */
                    var data = response.data,
                        i;

                    /**
                     * Restructure items.
                     * @type {Array}
                     */

                        // 1) Add parent widgets.
                    var items = data.filter(function (item) {
                        return App.config.parentWidgetType === item.widgetType;
                    });

                    // 2) Fill parent widgets with its children. Sort them.
                    for (i = 0; i < items.length; i++) {

                        items[i].children = [];
                        for (var j = 0; j < data.length; j++) {
                            if (data[j].parent === items[i].id) {
                                items[i].children.push(data[j]);
                            }
                        }
                        items[i].children.sort(App.util.sortWidget);
                    }

                    // 3) Add standalone widgets.
                    for (i = 0; i < data.length; i++) {
                        //noinspection JSValidateTypes
                        if (App.config.parentWidgetType !== data[i].widgetType && data[i].parent === '') {
                            items.push(data[i]);
                        }
                    }

                    // 4) Sort them.
                    items.sort(App.util.sortWidget);

                    // 5) Cache result.
                    App.config.widgets[objectType] = items;

                    // 6) Iterate over the widget configurations.
                    App.router.addWidgets(items, objectId, objectName, widgetId);
                }
            }));
        }
    },

    refreshWidgetsCache: function(objectType){

        App.router.jqXHRs.push($.ajax({
            url    : App.config.serviceUrl + 'caesarWidgetProvider/getWidgets2',
            data   : {
                domainObjectType: objectType
            },
            success: function (response) {

                /**
                 * In "data" there is already the objectType in it.
                 */
                var data = response.data,
                    i;

                /**
                 * Restructure items.
                 * @type {Array}
                 */

                    // 1) Add parent widgets.
                var items = data.filter(function (item) {
                    return App.config.parentWidgetType === item.widgetType;
                });

                // 2) Fill parent widgets with its children. Sort them.
                for (i = 0; i < items.length; i++) {

                    items[i].children = [];
                    for (var j = 0; j < data.length; j++) {
                        if (data[j].parent === items[i].id) {
                            items[i].children.push(data[j]);
                        }
                    }
                    items[i].children.sort(App.util.sortWidget);
                }

                // 3) Add standalone widgets.
                for (i = 0; i < data.length; i++) {
                    //noinspection JSValidateTypes
                    if (App.config.parentWidgetType !== data[i].widgetType && data[i].parent === '') {
                        items.push(data[i]);
                    }
                }

                // 4) Sort them.
                items.sort(App.util.sortWidget);

                // 5) Cache result.
                App.config.widgets[objectType] = items;
            }
        }));
    },

    /**
     * Iterate over the widget configurations and create the widgets.
     * @param {Array} widgets
     * @param {string} objectId
     * @param {string} objectName
     * @param {string|null} widgetId
     */
    addWidgets: function (widgets, objectId, objectName, widgetId) {

        for (var i = 0; i < widgets.length; i++) {

            var config = $.extend(true, {}, widgets[i]),
                widget;

            // Save the object id and name to the widget - in case this is a sticky widget.
            config.domainObjectId = objectId;
            config.objectName     = objectName;

            // Only display a specific widget...
            if (widgetId) {

                if (config.id === widgetId) {

                    // Place this widget always in the mainArea - since it is the only area here.
                    config.location   = App.config.locationMainArea;
                    config.isHeadless = App.router.isHeadless();

                    // Is this a parent widget?
                    if (App.config.parentWidgetType === config.widgetType) {
                        widget = new App.ui.WidgetGroupPanel(config);
                    } else {
                        widget = new App.ui.WidgetPanel(config);
                    }

                    //Change the title in headless mode to give information about the widget type.
                    if (config.isHeadless && widget.config) {
                        document.title = widget.config.objectName + ' [' + widget.config.name + ']';
                    }

                    App.view.widgets.push(widget);
                    widget.show();
                }
            } else if (config.location !== App.config.locationNone) {
                // ...or display widgets that have a location.

                // Is this a parent widget?
                if (App.config.parentWidgetType === config.widgetType) {
                    widget = new App.ui.WidgetGroupPanel(config);
                } else {
                    widget = new App.ui.WidgetPanel(config);
                }

                App.view.widgets.push(widget);
                widget.show();
            }
        }
    }
};
