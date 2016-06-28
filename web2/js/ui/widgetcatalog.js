/**
 * Widget Catalog
 * @type {*}
 */
App.ui.WidgetCatalog = kendo.Class.extend({
    elDialogContent         : null,
    elContent               : null,
    elBtnCreateWidget       : null,
    selectedDomainObjectType: null,
    centerWidgets           : null,
    sidebarWidgets          : null,
    availableWidgets        : null,
    widgets                 : [],
    defaultDomainObjectType : 'group',

    init: function (config) {
        'use strict';

        var me      = this;
        this.config = $.extend({
            title   : App.translate('Widget Catalog'),
            minWidth: 800,
            width   : 950,
            height  : (2 / 3) * document.body.clientHeight,
            modal   : true,
            visible : false,
            buttons : [
                {
                    name : App.translate('Reset Widgets'),
                    click: function () {
                        $.proxy(me.doReset(), me);
                    }
                },
                {
                    name : App.translate('Close Catalog'),
                    click: this.onCancel
                }
            ]
        }, config);

        $('#widget-catalog').remove();

        this.elDialogContent = $('<div>', {
            id: 'widget-catalog'
        }).appendTo('body');

        this.elContent = $('<div>', {
            'class': 'widget-catalog-content'
        });

        this.elContent.appendTo(this.elDialogContent);

        // Add click handlers to the edit / delete icons in the Main Area / Sidebar / Available Widgets
        this.elDialogContent.on('click', '[data-action=delete]', function (e) {
            e.preventDefault();
            var el     = $(this).closest('li');
            var widget = me.getWidgetById(el.data('id'));
            if (widget) {
                widget.doDelete();
            }
        }).on('click', '[data-action=edit]', function (e) {
            e.preventDefault();
            var el     = $(this).closest('li');
            var widget = me.getWidgetById(el.data('id'));
            if (widget) {
                widget.doEdit();
            }
        });

        // Show tooltips for the edit and delete icons.
        //.
        //tooltip({
        //    selector : '[data-toggle="tooltip-horizontal"]',
        //    container: this.elDialogContent,
        //    placement: 'right'
        //});
        //
        //
        //this.bodyTemplate =
        //'<div class="row">' +
        //'<div class="col-sm-3">mycontent</div>' +
        //'<div class="col-sm-6">6 cols </div>' +
        //'<div class="col-sm-3">mycontent</div>' +
        //'</div>';
        //$(this.bodyTemplate).appendTo(this.elContent);

        return this;
    },

    getApplicationObjects: function (panel) {
        'use strict';

        $('<div>', {
            'class': 'intro-text'
        }).text(App.translate('Please select which application object you want to configure.')).appendTo(panel);

        var myDiv = $('<div>').appendTo(panel);

        //noinspection JSUnresolvedFunction
        var tree     = myDiv.kendoTreeView({
            dataSource  : {
                data  : App.config.domainObjectTypesTree,
                schema: {
                    model: {
                        id         : 'id',
                        hasChildren: function (item) {
                            return (item.items && item.items.length);
                        },
                        children   : { // define options for second level
                            schema: {
                                data : 'items',
                                model: {
                                    id: 'id'
                                }
                            }
                        }
                    }
                }
            },
            template    : '#if (!item.hasChildren) {#<span class="treeview-node-indented ao-16px #=App.util.format.domainObjectTypeIcon(item.id)#">#} else {#<span>#}##=App.translate(item.name)#</span>',
            select      : $.proxy(this.onAppObjectsChange, this),
            loadOnDemand: false
        });
        var tv       = tree.data('kendoTreeView'),
            treeItem,
            dataItem = tv.dataSource.get(App.current.objectType);

        if (dataItem) {

            // Try to get current select element from navigation tree and select thi
            treeItem = tv.findByUid(dataItem.uid);
            tv.expand(tv.findByUid(dataItem.parentNode().uid));
        } else {

            // Expand first node.
            tv.expand('.k-item:first');

            // Find the first item in that expanded node.
            treeItem = tree.find('.k-item:first ul.k-group .k-item:first');
        }

        // Select that item...
        tv.select(treeItem);

        // ...and trigger the select event.
        tv.trigger('select', {node: treeItem[0]});
    },

    getWidgetPositioning: function (panel) {
        'use strict';

        $('<div>', {
            'class': 'intro-text',
            html   : App.translate('Place widgets into the Application Area you want by dragging and dropping widgets from the Available Widget list.')
        }).appendTo(panel);

        // Add mainArea
        var elMainArea = $('<div>', {
            'class': 'pull-left',
            style  : 'width: 45%;'
        }).appendTo(panel);

        $('<h3>', {
            html: App.translate('Main Area')
        }).appendTo(elMainArea);

        this.centerWidgets = $('<ul>', {
            'data-location': App.config.locationMainArea
        }).appendTo(elMainArea);

        // Add sideBar
        var elSidebar = $('<div>', {
            'class': 'pull-right',
            style  : 'width: 45%;'
        }).appendTo(panel);

        $('<h3>', {
            html: App.translate('Sidebar')
        }).appendTo(elSidebar);

        this.sidebarWidgets = $('<ul>', {
            'data-location': App.config.locationSideBar
        }).appendTo(elSidebar);

    },

    getAvailablePanel: function (panel) {
        'use strict';

        var me = this;

        $('<div>', {
            'class': 'intro-text',
            html   : App.translate('Drag one of the widgets below, or create a new widget.')
        }).appendTo(panel);

        me.elBtnCreateWidget = $('<button>', {
            'class': 'k-button',
            html   : App.translate('Create Widget'),
            click  : function () {
                // Only execute if button is not disabled.
                if (!$(this).is(':disabled')) {
                    var win = new App.ui.WizardWidget({
                        data            : [],
                        domainObjectType: me.selectedDomainObjectType,
                        parentRef       : me
                    });

                    win.show();
                }
            }
        }).appendTo(panel);

        this.availableWidgets = $('<ul>', {
            'data-location': App.config.locationNone
        }).appendTo(panel);
    },

    show: function () {
        'use strict';

        var me = this,
            pnl,
            el,
            panel;

        //noinspection JSUnresolvedFunction
        this.dialog = this.elDialogContent.kendoExtDialog(this.config).data('kendoExtDialog');
        this.dialog.bind('deactivate', function () {
            me.destroy();
            App.router.navigate(App.router.lastRoute);
        });


        var contentPanels = [
            {
                name: App.translate('Application Objects'),
                cls : 'app-objects',
                fn  : this.getApplicationObjects
            },
            {
                name: App.translate('Widget Positioning'),
                cls : 'positioning wc-sortable',
                fn  : this.getWidgetPositioning
            },
            {
                name: App.translate('Available Widgets'),
                cls : 'available wc-sortable',
                fn  : this.getAvailablePanel
            }
        ];

        // Build panels.
        for (var i = 0; i < contentPanels.length; i++) {
            pnl = contentPanels[i];

            el = $('<div>', {
                'class': 'widget ' + pnl.cls
            }).appendTo($('.widget-catalog-content'));

            el.append($('<div>', {
                'class': 'widget-header'
            }).append($('<span>', {
                'class': 'widget-header-title'
            }).text(pnl.name)));

            panel = $('<div>', {
                'class': 'widget-content'
            }).appendTo(el);

            pnl.fn.call(me, panel);
        }

        this.dialog.center().open();

    },

    /**
     * close the dialog
     *
     * @param btn
     */
    onCancel: function (btn) {
        'use strict';

        btn.dialog.close();
    },

    destroy: function () {
        'use strict';

        if (this.dialog) {
            $('#icon-picker-container').remove();
            this.dialog.destroy();
        }
    },

    onAppObjectsChange: function (e) {
        'use strict';

        // Sometimes e.node is not a valid object. For example, if the widgetcatalog's route is triggered without being logged in.
        if (e.node && e.node.attributes) {

            var node = e.sender.dataSource.getByUid($(e.node).data().uid);

            if (node.id) {
                this.selectedDomainObjectType = node.id;

                /**
                 * Do we have widgets in there? If not, then disable the positioning and available area.
                 */
                if (node.widgetTypes && node.widgetTypes.length) {
                    if (this.elBtnCreateWidget) {
                        this.elBtnCreateWidget.prop('disabled', false).removeClass('k-state-disabled');
                    }
                    $('.widget.positioning').removeClass('disabled');
                    $('.widget.available').removeClass('disabled');
                } else {
                    if (this.elBtnCreateWidget) {
                        this.elBtnCreateWidget.prop('disabled', true).addClass('k-state-disabled');
                    }
                    $('.widget.positioning').addClass('disabled');
                    $('.widget.available').addClass('disabled');
                }
                this.getWidgetsByObjectTypeId(this.selectedDomainObjectType);
            } else {
                e.preventDefault();
            }
        }
    },

    /**
     * Initialize sorting.
     * Should be called after every domainObjectType refresh.
     *
     */
    makeSortable: function () {
        var me = this;

        $('.wc-sortable ul').sortable({
            connectWith: '.wc-sortable ul',
            placeholder: 'ui-state-highlight',
            tolerance  : 'pointer',
            stop       : function (event, ui) {
                var item = $(ui.item),
                    widget;

                // Find ul with location information.
                var location = item.parents('[data-location]').data('location');


                //noinspection JSCheckFunctionSignatures
                /** contains an <ul> element. It is either the widget container for "CENTER", "RIGHT", "NONE" or a widget group.
                 * @type jQuery
                 */
                var parent = item.parent();

                // Renumber widgets on the same level.
                $.each(parent.children('li'), function (idx, widgetEl) {

                    // Look for that specific widget
                    widget = me.getWidgetById($(widgetEl).data('id'));
                    if (widget) {

                        // Update location.
                        if (location) {
                            widget.config.location = location;
                            //noinspection JSCheckFunctionSignatures
                            /**
                             * We need to get the parent of that <ul> element. If it is a group panel, then the id is here:
                             * <li data-id="123">     <-- Here is the id of the widget group aka "parent".
                             *   <ul>                 <-- this is in var parent
                             *     <li data-id="234"> <-- this is in var widgetEl
                             * @type {number|string}
                             */
                            widget.config.parent = parent.parent().data('id') || '';
                        }

                        widget.config.positionNumber = idx;
                        widget.doSave(function () {
                            // Clear cached widget configuration.
                            App.config.widgets[widget.config.objectType] = null;
                        });
                    }
                });

                // Check all group widgets... maybe we need to show or hide the delete icon.
                $('.wc-sortable li').each(function () {
                    var itm = $(this),
                        ul  = itm.find('ul');

                    // If we have a group widget, then check delete icon.
                    itm.find('>[data-action=delete]').toggleClass('hidden', (ul.length > 0 && ul.children().length > 0));
                });
            }
        });
    },

    /**
     * Load widgets by domainObjectType and render them in the lists.
     * @param domainObjectType
     */
    getWidgetsByObjectTypeId: function (domainObjectType) {
        'use strict';

        var me = this;

        // Show spinner
        kendo.ui.progress(this.elDialogContent, true);

        $.ajax({
            url    : App.config.serviceUrl + 'caesarWidgetProvider/getWidgets2',
            data   : {
                domainObjectType: domainObjectType
            },
            success: function (response) {
                me.centerWidgets.empty();
                me.sidebarWidgets.empty();
                me.availableWidgets.empty();

                me.widgets = [];
                var data   = response.data;

                // Look for Parent items
                var items = data.filter(function (item) {
                    return App.config.parentWidgetType === item.widgetType;
                });

                // Look for children and put these into the parent items.
                for (var i = 0; i < items.length; i++) {
                    items[i].children = [];

                    for (var j = 0; j < data.length; j++) {
                        var itm = data[j];

                        if (itm.parent === items[i].id) {
                            items[i].children.push(itm);
                        }
                    }
                }

                // Add items without parent - filter for "non parent items"
                $.each(data.filter(function (item) {
                    return App.config.parentWidgetType !== item.widgetType && item.parent === '';
                }), function (idx, record) {
                    items.push(record);
                });

                items.sort(App.util.sortWidget);

                $.each(items, function (idx, item) {
                    var renderTo = me.availableWidgets,
                        widget,
                        childWidget;

                    // add draggable widget item to specified location
                    switch (item.location) {
                        case App.config.locationMainArea:
                            renderTo = me.centerWidgets;
                            break;
                        case App.config.locationSideBar:
                            renderTo = me.sidebarWidgets;
                            break;
                        case App.config.locationNone:
                        // already pointing to availableWidgets. Nothing to do here.
                    }

                    widget = new App.ui.WidgetCatalog.Item($.extend(item, {
                        renderTo : renderTo,
                        parentRef: me
                    }));

                    me.widgets.push(widget);

                    // Add child widgets if available.
                    if (item.children) {

                        item.children.sort(App.util.sortWidget);

                        // Add children
                        for (var i = 0; i < item.children.length; i++) {
                            childWidget = new App.ui.WidgetCatalog.Item(
                                $.extend(item.children[i], {
                                    renderTo : widget.items,
                                    parentRef: me
                                })
                            );
                            me.widgets.push(childWidget);
                        }
                    }
                });

                me.makeSortable();

                // Hide spinner
                kendo.ui.progress(me.elDialogContent, false);
            }
        });
    },

    /**
     * Return existing widget instance by its id.
     * @param {string} id
     * @returns {null|App.ui.WidgetCatalog.Item}
     */
    getWidgetById: function (id) {
        var widget = null;

        for (var i = 0; i < this.widgets.length; i++) {

            if (this.widgets[i].config.id === id) {
                widget = this.widgets[i];
                break;
            }
        }
        return widget;
    },

    doReset: function () {
        'use strict';

        var me = this;

        $.when(App.dialog.okCancel({
            title  : App.translate('Reset all widgets'),
            message: App.translate('Are you sure you want to reset all widgets?'),
            labelOK: App.translate('Reset Widgets'),
            width  : 320,
            icon   : App.dialog.iconQuestion
        })).done(function (response) {
            if (response.button === 'OK') {
                $.ajax({
                    url    : App.config.serviceUrl + 'caesarUserWidgetsToDefault/resetWidgetsForUser',
                    success: function () {
                        me.getWidgetsByObjectTypeId(me.selectedDomainObjectType);

                        // Probably the old configuration is already invalid. Check this.
                        App.util.widget.syncWithDefault();
                    }
                });
            }
        });
    }
});

/**
 * Widget Item
 *
 * @type {void|*}
 */
App.ui.WidgetCatalog.Item = kendo.Class.extend({
    el   : null,
    items: null,

    init: function (config) {
        'use strict';

        this.config = $.extend({
            renderTo : null,
            parentRef: null
        }, config);

        var isParent    = App.config.parentWidgetType === this.config.widgetType,
            hasChildren = this.config.children && this.config.children.length;

        this.el = $('<li>', {
            'data-id': this.config.id
        }).appendTo(this.config.renderTo);

        // Check for modern browsers. Else, use the 16px icon.
        var size = '32px';
        if ($('body').hasClass('k-ie8')) {
            size = '16px';
        }

        // Left Icon
        $('<img>', {
            src: 'images/icons/' + size + '/' + this.config.pictureName + '.png'
        }).appendTo(this.el);

        // Title
        $('<span>', {
            'class': 'title',
            html   : this.config.name
        }).appendTo(this.el);


        // Action icons
        $('<a>', {
            'class'      : 'pull-right glyphicon glyphicon-remove' + (isParent && hasChildren ? ' hidden' : ''),
            'data-action': 'delete'
        }).appendTo(this.el);

        $('<a>', {
            'class'      : 'pull-right glyphicon glyphicon-pencil',
            'data-action': 'edit'
        }).appendTo(this.el);

        // Sublist
        if (isParent) {
            this.items = $('<ul>').appendTo(this.el);
        }

    },

    doEdit: function () {
        'use strict';

        var win = new App.ui.WizardWidget({
            myId            : this.config.id,
            data            : this.config,
            domainObjectType: this.config.objectType,
            parentRef       : this.config.parentRef
        });
        win.show();
    },

    doSave: function (callback) {
        'use strict';

        // Only hand over very specific parameters.
        var params = {
            id              : this.config.id,
            user            : App.config.user.id,
            name            : this.config.name,
            description     : this.config.description,
            widgetType      : this.config.widgetType,
            widgetData      : this.config.widgetData,
            location        : this.config.location,
            positionNumber  : this.config.positionNumber,
            parent          : this.config.parent,
            pictureName     : this.config.pictureName,
            domainObjectType: this.config.parentRef.selectedDomainObjectType
        };

        $.ajax({
            url    : App.config.serviceUrl + 'caesarWidgetProvider/updateWidget2',
            data   : params,
            success: callback
        });
    },

    doDelete: function () {
        'use strict';

        var me = this;
        if (me.config.location === App.config.locationMainArea ||
            me.config.location === App.config.locationSideBar ||
            me.config.parent !== ''
        ) {

            // First, move widget out of the widget areas to the "none" Area on the right side...
            me.config.location = App.config.locationNone;
            me.config.parent   = '';
            me.doSave(function () {
                $.proxy(me.config.parentRef.getWidgetsByObjectTypeId(me.config.parentRef.selectedDomainObjectType), me.config.parentRef);
            });
        } else {

            // ... and then really delete them.
            $.ajax({
                url    : App.config.serviceUrl + 'caesarWidgetProvider/deleteWidget',
                data   : {id: me.config.id},
                success: function () {
                    $.proxy(me.config.parentRef.getWidgetsByObjectTypeId(me.config.parentRef.selectedDomainObjectType), me.config.parentRef);
                }
            });
        }
    }
});
