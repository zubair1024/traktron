/**
 * Created by Michael on 30.10.13.
 */

/**
 * creates a menu instance.
 * @type {void|*}
 */
App.ui.Menu = App.ui.MenuBase.extend({
    el    : null,
    config: {
        url       : null,
        objectType: null,
        objectId  : null,
        id        : ''
    },

    init: function (config) {
        'use strict';

        /**
         * Call parent constructor with config
         */
        App.ui.MenuBase.fn.init.call(this, $.extend({
            id        : 'navigation-menu',
            url       : App.config.serviceUrl + 'action/menu',
            objectType: App.current.objectType,
            objectId  : App.current.objectId
        }, config));

        // create reference to DOM
        this.elMenu = $('#' + this.config.id);
    },

    load: function (objectType, objectId) {
        'use strict';

        var me = this;

        // refresh settings
        me.config.objectType = objectType || me.config.objectType || App.current.objectType;
        me.config.objectId   = objectId || me.config.objectId || App.current.objectId;

        $.ajax({
            url    : me.config.url,
            data   : {
                menu       : 'testMenu',
                object_type: me.config.objectType,
                object_id  : me.config.objectId
            },
            success: function (response) {

                var menuItems            = response.data[0].items;
                var menuReportDataSource = null;
                var i, j;

                // In case we are reloading it, clear the menu up, before you load it, otherwise it would be added twice.
                me.elMenu.empty();

                var traverseReports = function (item) {
                    var result = {
                        text: App.translate(item.name)
                    };

                    // Look for action
                    if (item.action && item.action.enabled) {
                        result.encoded = false;

                        // this is used in kendoMenu later on
                        result.text = '<span data-id="' +
                                      item.action.id + '">' +
                                      App.translate(item.name) +
                                      // Does not look nice: (item.action.oneclick ? '' : '&hellip;') +
                                      '</span>'
                        ;
                    } else {
                        result.text = App.translate(item.name);
                    }

                    // Menu is nested?
                    if (item.items) {
                        result.items = [];
                        for (var i = 0; i < item.items.length; i++) {
                            result.items.push(traverseReports(item.items[i]));
                        }
                    }
                    return result;
                };

                for (i = 0; i < menuItems.length; i++) {
                    var item = menuItems[i];

                    // At the beginning hide the edit options until user clicks on an asset in asset explorer
                    switch (item.category) {
                        case 'report':
                            // Create Kendo style menu
                            if (item.items) {
                                menuReportDataSource = traverseReports(item);
                                me.elMenu.append(me.buildMainMenuSection(item));
                            }
                            break;
                        case 'edit':
                            me.elMenu.append(me.buildMainMenuSection(item));
                            break;
                        case 'help':
                            /**
                             * The help menu is located on the right of the navigation bar.
                             * Create ordinary links.
                             */
                            if (item.items) {
                                var help = $('#navigation-help');

                                for (j = item.items.length - 1; j >= 0; j--) {
                                    $(kendo.format(
                                        '<li><a href="{0}" class="item" target="_blank">{1}</a></li>',
                                        item.items[j].action.url,
                                        item.items[j].name
                                    )).prependTo(help);
                                }
                            }
                            break;
                    }
                }

                // Do we have Reports? - If yes, add a Kendo Menu.
                if (menuReportDataSource) {
                    //noinspection JSUnresolvedFunction
                    $('#menu-report').kendoMenu({
                        orientation : 'vertical',
                        closeOnClick: false,
                        dataSource  : menuReportDataSource.items,
                        select      : function (e) {
                            var reportId = $(e.item).find('> span > span[data-id]').data('id');

                            // Only do something if user clicked on the appropriate report item.
                            if (reportId) {

                                // Create proper route depending on current selection in TreeView.
                                App.router.navigate(kendo.format(
                                    '/{0}/{1}/report/{2}',
                                    App.current.objectType,
                                    App.current.objectId,
                                    App.router.encodeParam(reportId)
                                ));
                            }
                        },
                        hoverDelay  : 600
                    });

                    $('#menu-report').on('click', function (event) {
                        // Avoid following the href location when clicking
                        event.preventDefault();
                        // Avoid having the menu to close when clicking
                        event.stopPropagation();
                    });
                }
            }

        });
    },

    /**
     *
     * @param item
     * @returns {string}
     */
    buildMainMenuSection: function (item) {
        var containerId = null;

        if (item.category === 'edit') {
            containerId = 'menu-edit-container';
        }

        return this.renderMenuColumn(
            'megamenu-' + item.category,
            App.translate(item.name),
            '<li><ul id="menu-' + item.category + '"></ul></li>',
            null,
            containerId
        );
    },

    destroy: function () {

    },

    refreshActionsMenu: function () {
        'use strict';

        var me       = this,
            myTarget = null;

        // Assume that there is something selected in the tree. But double check.

        // Get current node from tree:
        var treeNode   = App.view.navigationTree.treeview.select(),
            myDataNode = App.view.navigationTree.treeview.dataSource.getByUid($(treeNode).data().uid);

        if (myDataNode.domainObjectType !== App.current.objectType && myDataNode.id !== App.current.objectId) {
            console.log('The selection of the action menu is not coherent with tree selection');
        } else {
            myTarget = treeNode;
        }

        $.ajax({
            url    : App.config.serviceUrl + 'action/contextMenu',
            data   : {
                object_type: App.current.objectType,
                object_id  : App.current.objectId
            },
            success: function (response) {
                var menuData = [];

                if (response.data.length) {
                    $.each(response.data[0].items, function (key, item) {
                        var subItems = null;

                        if (item.items && item.items.length > 0) {
                            subItems = [];
                            $.each(item.items, function (idx, subitem) {
                                subItems.push(App.application.getMenuItem(subitem, null, myDataNode, myTarget));
                            });
                            menuData.push(App.application.getMenuItem(item, subItems, myDataNode, myTarget));
                        } else if (item.action) {
                            menuData.push(App.application.getMenuItem(item, subItems, myDataNode, myTarget));
                        }
                    });

                    //noinspection JSUnresolvedFunction
                    $('#menu-edit').kendoMenu({
                        orientation: 'vertical',
                        dataSource : menuData,
                        select     : function () {
                            return false;
                        },
                        hoverDelay : 600
                    });
                }

                if (menuData.length) {
                    $('#menu-edit-container').show();
                    // Select first level of menu.
                    var items = $('#menu-edit').find('> .k-item');
                    me.setClickHandler(menuData, items);
                } else {
                    $('#menu-edit-container').hide();
                }
            }
        });

        return false;
    },
    setClickHandler   : function (items, elements) {
        'use strict';

        var me = this;
        $.each(items, function (idx, item) {

            if (item.click) {
                $(elements[idx]).click(function (e) {
                    me.item = $(e.target).parents('li');
                    item.click.call(me, e);
                });
            }

            if (item.items) {
                // Only take direct descendants into account.
                var subitems = $(elements[idx]).find('.k-group > .k-item');
                me.setClickHandler(item.items, subitems);
            }
        });
    }

});
