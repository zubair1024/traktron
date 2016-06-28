/**
 * Generates field for specified configuration (see field rules <add wiki link>)
 * @type {void|*}
 */
App.ui.NavigationTreeView = kendo.ui.Widget.extend({
    options       : {
        name: 'NavigationTreeView'
    },
    uid           : null,
    treeview      : null,
    filter        : null,
    contextMenu   : null,
    treeItemAnchor: null,
    // Buggy for now. Keep an eye on that feature. http://docs.telerik.com/kendo-ui/api/javascript/ui/treeview#configuration-autoScroll
    // autoScroll    : true,

    init: function (element, options) {
        'use strict';

        kendo.ui.Widget.fn.init.call(this, element, options);

        this.uid = App.ui.static.getNewId();

        options.dataTextField = options.dataTextField || 'name';
        // Only display horizontal tooltips on large screens.
        var tooltip  = App.config.isSmallDevice ? '' : 'data-toggle="tooltip-horizontal"',
            template = '<span class="treeview-node-indented ao-16px #=App.util.format.domainObjectTypeIcon(item.domainObjectType)#" ' +
                       'title="#=App.util.format.domainObjectType(item.domainObjectType)#: #=item.' +
                       options.dataTextField + '#" ' +
                       tooltip + '>' +
                       '#: App.translate(item.' + options.dataTextField + ') #</span>';

        options = $.extend({
            select   : this.onSelect,
            dataBound: this.onDataBound,
            template : template
        }, options);

        $(element).append(kendo.format('<div id="tree-view{0}">', this.uid));
        $(element).append(kendo.format('<div id="tree-context{0}">', this.uid));

        // Create the TreeView.
        //noinspection JSUnresolvedFunction
        this.treeview = $(kendo.format('#tree-view{0}', this.uid)).kendoTreeView(options).data('kendoTreeView');

        this.treeItemAnchor = kendo.format('#tree-view{0} li', this.uid);

        $(document).on('contextmenu', this.treeItemAnchor, $.proxy(this.onContextMenu, this));
    },

    onSelect: function (e) {
        'use strict';

        var node        = e.sender.dataItem($(e.node)),
            idChainNode = node.id.split(App.config.idDivider),

            /**
             * Contains current idPath. Start with selected node.
             * @type {{objectType: {string}, objectId: {string}}[]}
             */
            idPath      = [
                {
                    objectType: node.domainObjectType,
                    objectId  : idChainNode[1]
                }
            ];

        e.sender.select($(e.node));

        // Build id path from Kendo's tree structure.
        $(e.node).parents('li.k-item').each(function () {
            var item = e.sender.dataSource.getByUid($(this).data().uid);

            if (item) {
                var idChain = item.id.split(App.config.idDivider);

                // Prepend parent node to id path.
                idPath.unshift({
                    objectType: item.domainObjectType,
                    objectId  : idChain[1]
                });
            }
        });

        App.updateCurrent({idPath: idPath});

        App.cmd.show(node.domainObjectType, idChainNode[1], node.name);
    },

    onDataBound: function (e) {
        'use strict';
        // Select root node after login
        if (typeof e.node === 'undefined') {

            // If root node then e.node is undefined:
            // http://docs.telerik.com/kendo-ui/api/web/treeview#events-dataBound
            // We want to expand the first node by default
            // Attribute can be set in datasource response = expanded:true
            e.sender.expand('.k-item:first');
            // Specifying the role in selecting a treeitem is safer than selecting
            // based on .k-item, because menuitems or other kendo kind of items can
            // be falsely included.
            var firstNode = e.sender.wrapper.find('.k-item[role=\'treeitem\']:first');
            if (firstNode.hasClass('k-first')) {
                e.sender.select(firstNode);

                // Update App.current.*
                var node    = e.sender.dataSource.getByUid($(firstNode).data().uid),
                    idChain = node.id.split(App.config.idDivider);

                App.updateCurrent({
                    objectType: node.domainObjectType,
                    objectId  : idChain[1],
                    objectName: node.name,
                    idPath    : [
                        {
                            objectType: node.domainObjectType,
                            objectId  : idChain[1]
                        }
                    ]
                });

                /**
                 * We selected the first node in the tree.
                 * Fetch the main menu only once.
                 */
                if (!App.view.menu) {
                    App.view.menu = new App.ui.Menu();
                    App.view.menu.load();
                    /**
                     * Start poller.
                     */
                    App.startPoller();
                }
            }
        }
        /**
         * Remove all persistent tooltips in the end
         */
        $('.tooltip').remove();
    },

    onContextMenu: function (e) {
        'use strict';

        var el      = e.currentTarget,
            node    = this.treeview.dataItem($(el)),
            idChain = node.id.split(App.config.idDivider);

        e.preventDefault();

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
                object_type: node.domainObjectType,
                object_id  : idChain[1]
            },
            success: function (response) {

                if (response.data.length) {
                    var menuData = [];
                    $.each(response.data[0].items, function (key, item) {
                        var subItems = null;

                        if (item.items && item.items.length > 0) {
                            subItems = [];
                            $.each(item.items, function (idx, subitem) {
                                subItems.push(App.application.getMenuItem(subitem, null, node, el));
                            });
                            menuData.push(App.application.getMenuItem(item, subItems, node, el));
                        } else if (item.action) {
                            menuData.push(App.application.getMenuItem(item, subItems, node, el));
                        }
                    });

                    // Create context menu
                    //noinspection JSUnresolvedFunction
                    var contextMenu = menu.kendoMenuEx({
                        dataSource: menuData,
                        anchor    : el,
                        delay     : 8000, // 8 seconds
                        offsetY   : e.pageY - 10

                    }).data('kendoMenuEx');

                    // So the context menu (in right to left layout) doesn't get out of the browser.
                    if (App.i18n.rtl) {
                        contextMenu.options.offsetX = -contextMenu.wrapper.width();
                    }

                    contextMenu.show(el, e);
                }
            }
        });

        return false;
    },

    selectNodeByPath: function (path) {
        'use strict';

        var tree = this.treeview;

        var openPath = function (path) { // success
            var dataItem = tree.dataSource.get(path[0].domainObjectType + App.config.idDivider + path[0].id),
                node     = null;

            if (dataItem) {

                if (path.length) {
                    tree.select($());

                    if (!dataItem.loaded()) {

                        // Listen to the change event to know when the node has been loaded.
                        tree.dataSource.bind('change', function expandLevel(e) {
                            var id = e.node && e.node.id;

                            // Proceed if the change is caused by the last fetch.
                            if (id === path[0].domainObjectType + App.config.idDivider + path[0].id) {
                                path.shift();
                                tree.dataSource.unbind('change', expandLevel);

                                // If there are more than one levels to expand, expand them.
                                if (path.length > 1) {
                                    openPath(path);
                                } else if (path.length === 1) {

                                    // Otherwise select the node with the last id.
                                    node = tree.dataSource.get(path[0].domainObjectType + App.config.idDivider + path[0].id);
                                    if (node) {
                                        node.set('selected', true);

                                        // And scroll this into view.
                                        tree.findByUid(node.uid).scrollintoview({
                                            direction: 'vertical'
                                        });
                                    }
                                } else {
                                    // Do nothing.
                                    e.node.set('selected', true);
                                }
                            }
                        });
                    } else {
                        // Node has already been loaded.
                        if (path.length > 1) {
                            path.shift();
                            dataItem.set('expanded', true);
                            openPath(path);
                        } else if (path.length === 1) {

                            // It's the last node.
                            node = tree.dataSource.get(path[0].domainObjectType + App.config.idDivider + path[0].id);
                            if (node) {
                                node.set('selected', true);
                                // And scroll this into view.
                                tree.findByUid(node.uid).scrollintoview({
                                    direction: 'vertical'
                                });
                            }
                        } else {
                            // Do nothing.
                        }
                    }

                }
                dataItem.set('expanded', true);
            } else {
                App.log.error(App.translate('The object has not been found in the tree.'), path, true);
            }
        };

        openPath(path);
    }
});


kendo.ui.plugin(App.ui.NavigationTreeView);
