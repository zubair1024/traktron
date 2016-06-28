/**
 * Namespace for application specific functions.
 * @type {{handlersInstalled: boolean, alarmBarAnimDuration: number, alarmBarVisible: boolean, resizeHandler: jQuery.noop, show: Function, hide: Function, toggleAlarmBar: Function, installHandlers: Function, getMenuItem: Function, onCommandSendClick: Function, doKeyNavigation: Function, doFullsearch: Function, widgetIterator: Function, widgetPrint: Function, widgetSettings: Function, widgetNewWindow: Function, widgetToggleMinimize: Function}}
 */
App.application = {

    /**
     * Whether the click handlers, etc. already have been installed or not.
     * @type {boolean}
     */
    handlersInstalled: false,

    /**
     * Duration in milli seconds of the alarmBar collapse animation
     * @type {number}
     */
    alarmBarAnimDuration: 200,

    alarmBarVisible: true,

    resizeHandler: $.noop,

    show: function () {
        'use strict';

        // Show proper copyright message in footer.
        App.view.elFooter.find('#copyrights-text').html(App.translate(App.config.copyrights));

        App.view.elContent.show();
        App.view.elFooter.show();

        if (!this.handlersInstalled) {
            this.installHandlers();
        }
    },

    hide: function () {
        'use strict';
        if (App.view && App.view.elContent) {
            App.view.elContent.hide();
        }

        if (App.view && App.view.elFooter) {
            App.view.elFooter.hide();
        }
    },

    /**
     * toggles AlarmBar
     * @param {boolean} visible - if true the AlarmBar is shown, if false it is hidden
     */
    toggleAlarmBar: function (visible) {
        'use strict';

        var alerts           = $('.alerts');
        this.alarmBarVisible = visible;
        if (visible) {

            // Show
            alerts.slideDown(this.alarmBarAnimDuration, this.resizeHandler);

            // Change the collapse button arrows
            $('.alarmbar-collapse-button .icon-collapse').css('background-position', 'top left');
        } else {

            // Hide
            alerts.slideUp(this.alarmBarAnimDuration, this.resizeHandler);

            // Change the collapse button arrows
            $('.alarmbar-collapse-button .icon-collapse').css('background-position', 'bottom left');
        }
    },

    /**
     * Installs various onclick handlers for bar collapsing, widget actions, etc.
     */
    installHandlers: function () {
        'use strict';

        var me = this;

        this.resizeHandler = function () {
            var view = App.view;

            if (view.alarmBar) {

                if (me.alarmBarVisible) {
                    $('#content-wrap > .container').css({
                        'padding-top': view.menuBar.outerHeight() + view.alarmBar.outerHeight() + 1
                    });
                } else {
                    $('#content-wrap > .container').css({
                        'padding-top': view.menuBar.outerHeight() + 24
                    });
                }
            }

            if (view.navigationTree) {
                var nav       = view.navigationTree.element.closest('.widget-content'),
                    favHeight = 0;

                if (view.favoritesTree) {
                    favHeight = view.favoritesTree.element.closest('.widget').height();
                }
                var clientHeight = $('body').innerHeight() -
                                   view.navigationArea.position().top -
                                   favHeight -
                                   112;
                nav.css('max-height', clientHeight);
            }
        };
        $(window).resize(this.resizeHandler);

        /**
         * Track online / offline status of browser.
         */
        $(window).on('offline', function () {
            App.log.add('Browser is offline.');
        });
        $(window).on('online', function () {
            App.log.add('Browser is online.');
        });

        // Collapse/expand Alerts bar that is placed below the Menu
        $('.alarmbar-collapse').on('click', function () {
            me.toggleAlarmBar(!$('.alerts').is(':visible'));
        });

        // Layout selection
        var layoutMenuEntries = $('#menu-layout > .dropdown-menu div.menu-column-header-icon');
        if (layoutMenuEntries.length) {
            layoutMenuEntries.on('click', function () {
                layoutMenuEntries.removeClass('selected');
                $(this).addClass('selected');
                var view = App.view;

                switch ($(this).data('layout')) {
                    case 1:
                        // alarmBar, navigationArea, mainArea, sideBar
                        me.toggleAlarmBar(true);
                        view.navigationArea.removeClass('hidden');
                        view.sideBar.removeClass('hidden');
                        view.mainArea.removeClass('col-sm-9 col-sm-10 col-sm-12').addClass('col-sm-7 col-sm-offset-2');
                        break;
                    case 2:
                        // alarmBar, navigationArea, mainArea
                        me.toggleAlarmBar(true);
                        view.navigationArea.removeClass('hidden');
                        view.sideBar.addClass('hidden');
                        view.mainArea.removeClass('col-sm-7 col-sm-9 col-sm-12').addClass('col-sm-10 col-sm-offset-2');
                        break;
                    case 3:
                        // alarmBar, mainArea, sideBar
                        me.toggleAlarmBar(true);
                        view.navigationArea.addClass('hidden');
                        view.sideBar.removeClass('hidden');
                        view.mainArea.removeClass('col-sm-7 col-sm-10 col-sm-12 col-sm-offset-2').addClass('col-sm-9');
                        break;
                    case 4:
                        // alarmBar, mainArea
                        me.toggleAlarmBar(true);
                        view.navigationArea.addClass('hidden');
                        view.sideBar.addClass('hidden');
                        view.mainArea.removeClass('col-sm-7 col-sm-9 col-sm-10 col-sm-offset-2').addClass('col-sm-12');
                        break;
                    case 5:
                        // navigationArea, mainArea, sideBar
                        me.toggleAlarmBar(false);
                        view.navigationArea.removeClass('hidden');
                        view.sideBar.removeClass('hidden');
                        view.mainArea.removeClass('col-sm-9 col-sm-10 col-sm-12').addClass('col-sm-7 col-sm-offset-2');
                        break;
                    case 6:
                        // mainArea
                        me.toggleAlarmBar(false);
                        view.navigationArea.addClass('hidden');
                        view.sideBar.addClass('hidden');
                        view.mainArea.removeClass('col-sm-7 col-sm-9 col-sm-10 col-sm-offset-2').addClass('col-sm-12');
                        break;
                }

                // Execute resize method if available.
                view.mainArea.find('.widget:visible').each(me.widgetIterator);
                view.sideBar.find('.widget:visible').each(me.widgetIterator);
            });
        }

        // Changing themes.
        $('.themes a').on('click', function (e) {
            e.preventDefault();
            App.util.setTheme($(this).data('theme'));
        });

        // Open widget catalog.
        $('[data-action="widget-catalog"]').on('click', function (e) {
            e.preventDefault();
            App.router.navigate('/widgetcatalog');
            return false;
        });

        // Open about window.
        $('[data-action="main-legal-notice"]').on('click', function () {
            App.router.navigate('/about');
            return false;
        });

        // Display UserName
        if (App.config.user.loginName) {
            $('#userName').text(App.config.user.loginName);
        }

        // Settings
        $('[data-action="user-settings"]').on('click', function (e) {
            e.preventDefault();
            App.cmd.edit('user', App.config.user.id, 'account');
        });

        // Logout.
        $('[data-action="logout"]').on('click', function (e) {
            e.preventDefault();
            App.user.logout();
        });

        // Home
        $('[data-action="home"]').on('click', function (e) {
            e.preventDefault();
            App.router.routeHome();
            return false;
        });

        // First, set Bootstrap's default tooltip placement from "top" to "auto".
        $.fn.tooltip.Constructor.DEFAULTS.placement = 'auto';

        // Register click on reference link icon in order to show the corresponding menu.
        $('body')
            .on('click contextmenu', '[data-action="refmenu"]', function (e) {
                e.preventDefault();
                var el   = $(this),
                    node = {
                        id              : el.data('objecttype') + App.config.idDivider + el.data('id'),
                        domainObjectType: el.data('objecttype'),
                        name            : el.data('label'),
                        parentNode      : null
                    };

                // Create context menu container if necessary.
                var menu = $('#context-menu');
                if (menu.length === 0) {
                    menu = $('<div>', {
                        id: 'context-menu'
                    }).appendTo('body');
                }

                // Load context menu
                $.ajax({
                    url    : App.config.serviceUrl + 'action/contextMenu',
                    data   : {
                        object_type: el.data('objecttype'),
                        object_id  : el.data('id')
                    },
                    success: function (response) {

                        if (response.data.length) {
                            var menuData = [];

                            for (var i = 0, len = response.data[0].items.length; i < len; i++) {
                                var subItems = null,
                                    item     = response.data[0].items[i];

                                if (item.items && item.items.length > 0) {
                                    subItems = [];

                                    for (var j = 0, sublen = item.items.length; j < sublen; j++) {
                                        subItems.push(me.getMenuItem(item.items[j], null, node, el));
                                    }
                                    menuData.push(me.getMenuItem(item, subItems, node, el));
                                } else if (item.action) {
                                    menuData.push(me.getMenuItem(item, subItems, node, el));
                                }
                            }

                            // Create context menu
                            //noinspection JSUnresolvedFunction
                            var contextMenu = menu.kendoMenuEx({
                                dataSource: menuData,
                                anchor    : el,
                                offsetY   : e.pageY
                            }).data('kendoMenuEx');

                            contextMenu.show(el, e);
                        }
                    }
                });
                return false;
            })

            // Handler for "minimize / restore" action button.
            .on('click', '[data-action="widget-toggle-minimize"]', me.widgetToggleMinimize)

            // Handler for "widget settings" action button.
            .on('click', '[data-action="widget-settings"]', me.widgetSettings)

            // Handler for "open widget in new window" action button.
            .on('click', '[data-action="widget-new-window"]', me.widgetNewWindow)

            // Handler for "print widget" action button.
            .on('click', '[data-action="widget-print"]', me.widgetPrint)

            // Add Bootstrap tooltips where available. Only respect tags that have
            // a) this attribute: data-toggle="tooltip" or
            // b) that attribute: data-toggle="dropdown" and a title.
            .tooltip({
                selector : '[data-toggle="tooltip"],[data-toggle="dropdown"][title]',
                container: 'body'
            })
        ;

        // Tweak the style of the tooltips for the navigation area. Make them appear horizontally.
        if (App.view.navigationArea) {
            App.view.navigationArea.tooltip({
                selector : '[data-toggle="tooltip-horizontal"]',
                container: 'body',
                placement: 'right'
            });

            // Prevent scrolling is propagated to the parent div
            App.view.navigationArea.find('.widget-content').on('mousewheel', function (e, d) {
                var t = $(this);

                if (d > 0 && t.scrollTop() === 0) {
                    e.preventDefault();
                } else {
                    if (d < 0 && (t.scrollTop() === t.get(0).scrollHeight - t.innerHeight())) {
                        e.preventDefault();
                    }
                }
            });
        }

        var searchMain = $('#search-main');
        searchMain.keyup(App.application.doFullsearch);
        searchMain.keydown(App.application.doKeyNavigation);

        // Add search functionality to search icon (magnifier)
        $('.search > .glyphicon-search').on('click', function (e) {
            App.application.doFullsearch(e);

            if (_.eq($('#search-main').val().toLowerCase(), 'do the harlem shake')) {
                doTheHarlemShake();
            }
        });

        $('.search > .glyphicon-remove').on('click', function () {
            $('.search-results').addClass('hidden');
            $(this).hide();
            searchMain.val('');
        });
        if (searchMain.val() === '') {
            $('.search > .glyphicon-remove').hide();
        }

        // Refresh Actions menu when clicking the main menu.
        $('#menu-menu').on('click', function () {

            // Load contextual menu entries from current selection - if menu is available.
            if (App.view.menu) {
                App.view.menu.refreshActionsMenu();
            }
        });

        // Make widgets on Dashboard sortable.
        $('#mainArea, #sideBar').sortable({
            connectWith: '.draggable',
            placeholder: 'widget ui-state-highlight',
            handle     : '.widget-header',
            tolerance  : 'pointer',
            cursorAt   : {
                left: 50
            },
            start      : function (event, ui) {
                var el = $(ui.item);
                el.addClass('widget-drag');
                el.css('width', 241);
                el.find('.widget-content').hide();
            },

            /**
             * Save positions of widgets after reordering
             * @param event
             * @param ui
             */
            stop: function (event, ui) {
                var el     = $(ui.item),
                    widget = el.data('widget');

                // Do not save positions if the dragged widget is a temporary one.
                if (widget) {

                    if (widget.config.isTemporary) {
                        widget.config.location = el.parent().attr('data-location');
                    } else {
                        //noinspection JSCheckFunctionSignatures
                        el.parent().find('.widget:visible').each(function () {
                            var data = $(this).data('widget');

                            if (data) {

                                // Store position and area - if this is not a temporary widget.
                                if (!data.config.isTemporary) {
                                    //noinspection JSCheckFunctionSignatures
                                    data.update({
                                        location      : $(this).parent().attr('data-location'),
                                        positionNumber: $(this).parent().children().not(':hidden').index($(this)) + ''
                                    });

                                    // Clear cached widget configuration.
                                    App.config.widgets[data.config.objectType] = null;
                                }
                            }
                        });
                    }
                }

                el.removeClass('widget-drag');
                el.find('.widget-content').show();

                // Call onDrop handler if available.
                if (widget && widget.onDrop) {
                    widget.onDrop();
                }

                // Call resize handler if available for the current sorted widget.
                me.widgetIterator(null, el);
            }
        });

        this.handlersInstalled = true;
    },

    getMenuItem: function (item, subItem, node, target) {
        'use strict';

        //noinspection JSUnresolvedVariable
        var myTarget = target || null,
            me       = this,
            enabled  = item.action ? item.action.enabled : true,
            oneclick = item.action ? item.action.oneclick : true,
            tooltip  = item.action ? item.action.description : '';

        var result = {
            enabled: enabled,
            text   : kendo.format('<span data-toggle="tooltip" title="{0}">{1}</span>',
                tooltip,
                App.translate(item.name) + (oneclick ? '' : '&hellip;')),
            encoded: false,
            action : item.action
        };

        if (subItem) {
            result.items = subItem;
        }

        // Only add click handler if enabled.
        if (enabled) {
            result.click = function () {
                var action    = null,
                    service   = null,
                    commandId = null;

                // Sanitize actions.
                if (item.action) {

                    if (!item.action.enabled) {
                        return;
                    }

                    if (item.action.id) {
                        action = item.action.id;
                    }

                    if (item.action.service) {
                        service = item.action.service.replace('service/', App.config.serviceUrl);
                    }

                    if (item.category === 'command') {
                        action    = item.category;
                        commandId = item.action.id;
                    }

                    if (item.category === 'updateDomainObject' ||
                        item.category === 'addDomainObject' ||
                        item.category === 'deleteDomainObject' ||
                        item.category === 'domainObjectBatchUpload') {
                        action = item.category;
                    }
                }

                var idChain        = node.id.split(App.config.idDivider),
                    domainObjectId = idChain[1];

                switch (action) {
                    case 'open':
                        App.cmd.show(node.domainObjectType, domainObjectId, node.name);
                        break;

                    case 'favorite_add':
                        $.ajax({
                            url    : App.config.serviceUrl + 'caesarUserFavoriteAssetService/createFavoriteForUser',
                            data   : {
                                userId          : App.config.user.id,
                                domainObjectType: node.domainObjectType,
                                domainObjectId  : domainObjectId
                            },
                            success: function () {
                                // Reload favorites.
                            }
                        });
                        break;

                    case 'favorite_delete':
                        $.ajax({
                            url    : App.config.serviceUrl + 'caesarUserFavoriteAssetService/deleteFavoriteForUser',
                            data   : {
                                userId          : App.config.user.id,
                                domainObjectType: node.domainObjectType,
                                domainObjectId  : domainObjectId
                            },
                            success: function () {
                            }
                        });
                        break;

                    case 'command':
                        var params = {
                            domainObjectType: node.domainObjectType,
                            domainObjectId  : domainObjectId,
                            commandId       : commandId
                        };

                        /** @namespace item.action.requiresConfirmation */
                        /** @namespace item.action.requiresJustification */
                        if (item.action.requiresJustification) {
                            $.when(App.dialog.okCancel({
                                title      : App.translate('Execute Command'),
                                height     : 180,
                                minWidth   : 270,
                                width      : 450,
                                message    : App.translate('Are you sure you want to execute {0}?', item.name),
                                labelCancel: App.translate('No'),
                                labelOK    : App.translate('Execute'),
                                icon       : App.dialog.iconQuestion
                            })).done(function (response) {
                                if (response.button === 'OK') {
                                    $.when(App.dialog.input({
                                        title   : App.translate('Requires Justification'),
                                        message : App.translate('This Asset command requires a justification. Please enter a justification below'),
                                        required: true
                                    })).done(function (response) {
                                        if (response.button === 'OK') {
                                            params.justification = response.input;
                                            me.onCommandSendClick(params);
                                        }
                                    });
                                }
                            });
                        } else if (item.action.requiresConfirmation) {
                            $.when(App.dialog.okCancel({
                                title      : App.translate('Execute Command'),
                                height     : 180,
                                minWidth   : 270,
                                width      : 450,
                                message    : App.translate('Are you sure you want to execute {0}?', item.name),
                                labelCancel: App.translate('No'),
                                labelOK    : App.translate('Execute'),
                                icon       : App.dialog.iconQuestion
                            })).done(function (response) {
                                if (response.button === 'OK') {
                                    me.onCommandSendClick(params);
                                }
                            });
                        } else {
                            me.onCommandSendClick(params);
                        }
                        break;

                    case 'updateDomainObject':
                        if (node.parentNode) {
                            App.current.treeRefreshNode = node.parentNode();
                        }
                        App.cmd.edit(node.domainObjectType, domainObjectId, node.name);
                        break;

                    case 'addDomainObject':
                        App.current.treeRefreshNode = node;
                        App.cmd.create(node.domainObjectType, domainObjectId, item.action.parameters[0].value);
                        break;

                    case 'deleteDomainObject':
                        var parentNodeIdChain = null;
                        if (node.parentNode) {
                            parentNodeIdChain = node.parentNode().id.split(App.config.idDivider);
                        }
                        App.cmd.destroy(node.domainObjectType, domainObjectId, node.name, function () {
                            // TODO find "myTarget" - or determine if it is visible... just reload the subtree!?
                            if (parentNodeIdChain) {
                                if (App.view.navigationTree) {
                                    App.view.navigationTree.treeview.remove(myTarget);
                                }
                                App.cmd.show(node.parentNode().domainObjectType, parentNodeIdChain[1]);
                            }
                        });
                        break;

                    case 'domainObjectBatchUpload':
                        App.router.navigate(kendo.format(
                            '/{0}/{1}/{2}/batchcreate',
                            node.domainObjectType,
                            domainObjectId,
                            item.action.parameters[0].value
                        ));
                        break;
                    default:
                    // Do nothing.
                }
            };
        }

        return result;
    },

    /**
     * Execute some asset command.
     * @param params
     */
    onCommandSendClick: function (params) {
        'use strict';

        $.ajax({
            url    : App.config.serviceUrl + 'caesarAssetCommand/executeCommand',
            data   : params,
            success: function (response) {
                var message = response.success ? App.translate('Asset Command sent.') : App.translate('Asset Command not sent.');
                App.dialog.alert({
                    title  : App.translate('Command'),
                    message: message,
                    icon   : response.success ? App.dialog.iconInfo : App.dialog.iconExclamation
                });
                App.log.add(message, params);
            }
        });
    },

    /**
     * Handler for key navigation in search results
     * @param e
     */
    doKeyNavigation: function (e) {
        var elements   = $('.search-results li'),
            selectedEl = elements.filter('.selected'),
            selected;

        if (e.key === 'Down' || e.key === 'Up') {

            if (selectedEl.length === 0) {
                selected = elements.first();
            } else {

                for (var i = 0, len = elements.length; i < len; i++) {
                    var el = $(elements[i]);

                    if (el.hasClass('selected')) {
                        el.removeClass('selected');

                        if (e.key === 'Down') {
                            selected = $(elements[i + 1]);
                        } else if (e.key === 'Up') {

                            if (i - 1 < 0) {
                                selected = elements.last();
                            } else {
                                selected = $(elements[i - 1]);
                            }
                        }
                        break;
                    }
                }
            }
        } else if (e.key === 'Enter') {

            if (selectedEl.length > 0) {
                selectedEl.trigger('click');
                $('.search-results').addClass('hidden');
            }
            return;
        }

        if (selected) {
            selected.addClass('selected');
            selected.scrollintoview({
                direction: 'vertical',
                duration : 1
            });
        }
    },

    /**
     * Fulltext search handler (looks in nodes of "Asset Explorer" TreeView.
     * @param eventObject
     */
    doFullsearch: function (eventObject) {

        if (eventObject && (eventObject.key === 'Down' ||
                            eventObject.key === 'Up' ||
                            eventObject.key === 'Enter')) {

            return;
        }

        var searchParam = $('#search-main').val().toLowerCase(),
            glyphRemove = $('.search > .glyphicon-remove');

        if (searchParam.length === 0) {
            glyphRemove.hide();
            $('.search-results').addClass('hidden');
        } else {
            glyphRemove.show();
        }

        // Look for keycode "Esc". Then clean search.
        if (eventObject && eventObject.key === 'Esc') {
            $('.search-results').addClass('hidden');
            glyphRemove.hide();
            $(eventObject.target).val('');
        } else if (searchParam.length > 2) {
            $.ajax({
                url    : App.config.serviceUrl + 'caesarOrganizationStructure/find',
                data   : {
                    domainObjectName: searchParam
                },
                success: function (response) {
                    var dot  = '',
                        html = '';

                    if (response.length) {
                        $.each(response, function (idx, item) {

                            if (dot !== item.domainObjectType) {

                                if (dot !== '') {
                                    html += '</ul></td></tr>';
                                }
                                dot = item.domainObjectType;
                                html += '<tr>';
                                html += '<td class="category">' + App.util.format.domainObjectType(dot) + '</td>';
                                html += '<td class="search-dropdown-items">';
                                html += '<ul>';
                            }

                            html += kendo.format('<li data-id="{0}" data-objectType="{1}">', item.id, dot);
                            html += kendo.format('<span class="k-sprite ao-16px {0}"></span> ', App.util.format.domainObjectTypeIcon(dot));
                            html += item.name;
                            html += '</li>';
                        });

                        if (html !== '') {
                            html += '</ul></td></tr>';
                        } else {
                            html = '<tr><td class="search-dropdown-items">' + App.translate('No results.') + '</td></tr>';
                        }

                        var searchResults = $('#search-results');
                        searchResults.html(html);
                        $('.search-results').removeClass('hidden');

                        // Calculate max height for the search results list.
                        searchResults.css('max-height', $('body').innerHeight() - searchResults[0].offsetTop - 20);

                        // Add click handler to the search results.
                        searchResults.find('.search-dropdown-items li').click(function (e) {
                            var el = $(e.target);
                            $('.search-results').addClass('hidden');

                            App.cmd.show(el.attr('data-objectType'), el.attr('data-id'), el.text());
                        });
                    } else {
                        // Hide "Clear search icon"
                        $('.search-results').addClass('hidden');
                    }
                }
            });
        }
    },

    /**
     * Run over widgets and resize them
     */
    widgetIterator: function (index, element) {
        'use strict';

        var widget = $(element).data('widget');
        if (widget && widget.item && $.isFunction(widget.item.resize)) {
            widget.item.resize();
        }
    },

    /**
     * The following functions are used in conjunction with the action buttons at the upper right of each widget.
     * The naming convention is like widget<action>
     */
    /**
     * Print widget in a separate window.
     */
    widgetPrint: function () {
        'use strict';

        var el         = $(this),
            widgetElem = el.closest('.widget'),
            widget     = widgetElem.data('widget'),
            content    = widgetElem.find('.widget-content'),
            title      = el.closest('.widget-header').text();

        if (widget.config.widgetType === 'map') {
            widget.item.controller.onMapsPrintRequested();

            return;
        }

        // If this is a tab panel, only use the content from the active tab.
        //if (content.find('.k-tabstrip').length) {
        //    content = content.find('.k-tabstrip > div:visible');
        //    // Remove fixed height.
        //    content.height('auto');
        //    if (content.find('.k-grid-content').length) {
        //        content.find('.k-grid-content').height('auto');
        //    }
        //}

        var win  = window.open('', 'PrintWindow'),
            html = '<html><head><title>' + title + '</title>' +
                   '<link rel="stylesheet" href="css/bootstrap.min.css">' +
                   '<link rel="stylesheet" href="css/kendo/kendo.common.min.css">' +
                   '<link rel="stylesheet" href="dist/app.css">' +
                   '<link rel="stylesheet" href="dist/theme-' + App.config.theme + '.css">' +
                   '</head><body>' +
                   $(content).html() +
                   '</body></html>'
            ;

        win.document.write(html);
        win.document.close();
        win.focus();

        // Only show Print dialog if all stylesheets have been loaded successfully.
        $(win.document).ready(function () {
            setTimeout(function () {
                win.print();
                win.close();
            }, 30);
        });
    },

    /**
     * Open the settings dialog for that specific widget
     */
    widgetSettings: function () {
        'use strict';

        var widget = $(this).closest('.widget').data('widget');
        if (widget && widget.config) {
            if (App.router) {
                App.router.navigate('/editwidget');
            }
            App.view.wizardWidget = new App.ui.WizardWidget({
                myId            : widget.config.id,
                data            : widget.config,
                domainObjectType: widget.config.objectType,
                parentRef       : null,
                routeOnClose    : false
            });
            App.view.wizardWidget.show();
        }
    },

    /**
     * Open widget in a new window.
     */
    widgetNewWindow: function () {
        'use strict';

        var widget = $(this).closest('.widget').data('widget');
        if (widget && widget.config) {

            // Check if we have eventIds. Then we use a different route to travel them in the URL.
            if (widget.config.ids) {
                App.cmd.openAlarmMap(
                    widget.config.objectType,
                    widget.config.domainObjectId,
                    widget.config.ids,
                    widget.config.name
                );
            } else {
                App.cmd.open(
                    widget.config.objectType,
                    widget.config.domainObjectId,
                    widget.config.objectName,
                    widget.config.id
                );
            }
        }
    },

    widgetToggleMinimize: function () {
        'use strict';

        var el      = $(this),
            content = el.closest('.widget').find('.widget-content');

        content.slideToggle(400, function () {
            if (content.is(':hidden')) {
                el
                    .toggleClass('glyphicon-minus', false)
                    .toggleClass('glyphicon-plus', true)
                    .attr('title', App.translate('Restore widget'))
                    .tooltip('fixTitle');
            } else {
                el
                    .toggleClass('glyphicon-minus', true)
                    .toggleClass('glyphicon-plus', false)
                    .attr('title', App.translate('Minimize widget'))
                    .tooltip('fixTitle');
            }
        });
    }
};
