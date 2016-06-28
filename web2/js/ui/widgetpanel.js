/**
 * Renders a widget in a panel styled container.
 */
App.ui.WidgetPanel = kendo.Class.extend({
    config       : {},
    el           : null,
    elContainer  : null,
    elContent    : null,
    elHeader     : null,
    elHeaderTools: null,
    elStatus     : null,
    /**
     * @type {App.widget.AssetCommand|App.widget.Dashboard|App.widget.Detail|App.widget.Grid|App.widget.Map|App.widget.OverviewMap|App.widget.SimpleGrid}
     */
    item         : null,
    init         : function (config) {
        'use strict';

        var me    = this,
            title = null,
            titleEl;

        /**
         * insert default config stuff
         */
        me.config = $.extend({
            widgetType    : null,
            /**
             * contains only 'CENTER', 'RIGHT' and 'NONE'
             */
            location      : App.config.locationMainArea,
            /**
             * If this is '-1' then the widget is prepended to all other widgets.
             */
            positionNumber: '0',
            name          : 'untitled',
            pictureName   : '',
            height        : App.config.widgetHeight,
            /**
             * true if panel is displayed in the sidebar or in a small dashboard slot.
             * @type {boolean}
             */
            displayMini   : false,
            /**
             * True if in headless mode
             * @type {boolean}
             */
            isHeadless    : false,
            /**
             * True if the widget is closable and the setting of it is not editable.
             * @type {boolean}
             */
            isTemporary   : false,
            objectName    : null
        }, config);

        /**
         * Format the title: first fill in the name of the object, then the name of the asset.
         */
        if (me.config.objectName !== null && me.config.objectName !== '') {
            title = kendo.format('{0} <strong>[{1}]</strong>', me.config.objectName, me.config.name);
        } else {
            title = kendo.format('<strong>[{0}]</strong>', me.config.name);
        }

        var area = App.view.mainArea;
        switch (me.config.location) {
            case App.config.locationSideBar:
                area                  = App.view.sideBar;
                me.config.displayMini = true;
                break;
            default:
            case App.config.locationMainArea:
                // Already set.
                break;
        }

        var isRtl = kendo.support.isRtl(area);

        /**
         * Create containers
         */
        me.elContainer = $('<div>', {
            'class'  : 'widget',
            'data-id': me.config.id
        });

        if (me.config.positionNumber === '-1') {
            me.elContainer.prependTo(area);
        } else {
            me.elContainer.appendTo(area);
        }

        me.elContainer.data('widget', this);

        me.elHeader = $('<div>', {
            'class'      : 'widget-header',
            'data-toggle': 'tooltip',
            'title'      : me.config.description
        }).appendTo(me.elContainer);

        me.elHeaderTools = $('<div>', {
            'class': 'widget-header-tools'
        }).appendTo(me.elHeader);

        var actions = [
            {
                // Export to Excel icon - Export content of widget to excel file
                'title'      : App.translate('Export to Excel'),
                'data-toggle': 'tooltip',
                'data-action': 'widget-export-excel',
                'role'       : 'button',
                'class'      : 'ico-file-excel-o',
                'constraint' : 'default,headless,temporary',
                'click'      : function () {
                    var widget = $(this).closest('.widget').data('widget');
                    if (widget) {
                        widget.exportData();
                    }
                }
            },
            {
                // Print icon
                'title'      : App.translate('Print'),
                'data-toggle': 'tooltip',
                'data-action': 'widget-print',
                'role'       : 'button',
                'class'      : 'glyphicon glyphicon-print',
                'constraint' : 'default,headless,temporary'
            },
            {
                // Settings icon
                'title'      : App.translate('Settings'),
                'data-toggle': 'tooltip',
                'data-action': 'widget-settings',
                'role'       : 'button',
                'class'      : 'glyphicon glyphicon-cog',
                'constraint' : 'default,headless'
            },
            {
                // Open in new window icon; the click handler is added in application.js
                'title'      : App.translate('Open widget in new window'),
                'data-toggle': 'tooltip',
                'data-action': 'widget-new-window',
                'role'       : 'button',
                'class'      : 'glyphicon glyphicon-new-window',
                'constraint' : 'default,temporary'
            },
            {
                // Minimize icon; the click handler is added in application.js
                'title'      : App.translate('Minimize widget'),
                'data-toggle': 'tooltip',
                'data-action': 'widget-toggle-minimize',
                'role'       : 'button',
                'class'      : 'glyphicon glyphicon-minus',
                'constraint' : 'default,temporary'
            },
            {
                // Close icon (headless mode)
                'title'      : App.translate('Close widget'),
                'data-toggle': 'tooltip',
                'role'       : 'button',
                'class'      : 'glyphicon glyphicon-remove',
                'click'      : function () {
                    window.close();
                },
                'constraint' : 'headless'
            },
            {
                // If this is a temporary widget, then make it closable... and if the other widgets in this area are hidden - show them just in case.
                'title'      : App.translate('Close widget'),
                'data-toggle': 'tooltip',
                'role'       : 'button',
                'class'      : 'glyphicon glyphicon-remove',
                'click'      : function () {
                    $(this).closest('.widget').fadeOut(function () {
                        // ...and show the other widgets again.
                        area.find('.widget[data-id!=' + me.config.id + '][data-location!=' + App.config.locationNone + ']').show();
                    });
                },
                'constraint' : 'temporary'
            }
        ];

        var constraint = 'default';
        if (me.config.isHeadless) {
            constraint = 'headless';
        } else if (me.config.isTemporary) {
            constraint = 'temporary';
        }

        /**
         * Show / hide export icon logic
         */
            // Do we need to add the Export action here?
        var widgetsWithExport = ['grid']; // later, add dashboard, detail, etc.

        // Do not show the export icon at all for Safari browsers.
        var showExportAction = true;
        if (showExportAction) {

            // Check if widget supports export feature.
            showExportAction = widgetsWithExport.indexOf(me.config.widgetType) > -1;

            // Show icon in group panel, if at least one widget in the group has the export feature.
            if (!showExportAction && me.config.widgetType === 'widgetGroup') {
                for (var i = 0; i < me.config.children.length; i++) {
                    if (widgetsWithExport.indexOf(me.config.children[i].widgetType) > -1) {
                        showExportAction = true;
                        break;
                    }
                }
            }
        }

        // Iterate over the action icons. Only add action if the "constraint" matches.
        for (var j = 0; j < actions.length; j++) {
            var action = actions[j];

            // FIXME create a proper "open in new window" route for the alarms grid instead of not displaying the "open in new window" and "settings" action button.
            if (
                action.constraint.indexOf(constraint) > -1 && !(me.config.id === 'alarms' && action['data-action'] === 'widget-new-window') && !(me.config.id === 'alarmMap' && action['data-action'] === 'widget-settings') && !(!showExportAction && action['data-action'] === 'widget-export-excel')
            ) {
                // Remove unwanted attribute for span.
                delete action.constraint;
                $('<span>', action).appendTo(me.elHeaderTools);
            }
        }

        // Left icon
        $('<img>', {
            'class': 'widget-header-icon',
            'alt'  : 'widget header icon',
            'src'  : 'images/icons/32px/' + me.config.pictureName + '.png'
        }).appendTo(me.elHeader);

        // Title
        titleEl = $('<span>', {
            'html' : title,
            'class': 'widget-header-title'
        }).appendTo(me.elHeader);

        titleEl.keyup(function () {

        });

        // Outer Widget Content container and its height if isHeadless
        var widgetContentContainerHeight = me.config.isHeadless ? '90%' : '';
        me.elContent                     = $('<div>', {
            'class' : 'widget-content',
            'height': widgetContentContainerHeight
        }).appendTo(me.elContainer);

        me.config.height = me.getHeight();

        me.el = $('<div>', {
            'class' : 'widget-body k-content',
            'height': me.config.height
        }).appendTo(me.elContent);

        // StatusBar / hidden by default
        me.elStatus = $('<div>', {
            'class': 'widget-status k-pager-wrap hidden'
        }).appendTo(me.elContent);

        titleEl.css(isRtl ? 'left' : 'right', me.elHeaderTools.outerWidth() + 2);

        // Remap the elements back to the configuration.
        me.config.el       = me.el;
        me.config.panel    = me;
        me.config.elTitle  = titleEl;
        me.config.elStatus = me.elStatus;
    },

    show: function () {
        'use strict';

        // Capitalize first letter
        var widgetType = App.util.format.capitalize(this.config.widgetType);

        if (App.widget[widgetType]) {
            this.item = new App.widget[widgetType](this.config);
            this.item.load();
        } else if (App.config.parentWidgetType === this.config.widgetType) {
            // Don't try to instantiate parent widgets, since they are only containers for now.
            // Don't do anything here.
        } else {
            App.log.error(App.translate('Widget type {0} not implemented right now.', widgetType), this.config);
        }
    },

    /**
     * TODO implement real disable / enable functionality with classes, etc.
     */
    enable    : function () {
        this.el.attr('disable', 'disable');
    },
    disable   : function () {
        this.el.removeAttr('disable');
    },
    exportData: function () {
        if (this.item && $.isFunction(this.item.exportData)) {
            this.item.exportData();
        }
    },

    /**
     * @returns {*}
     */
    refresh: function () {
        'use strict';

        var height = this.getHeight();

        // Double check if the item is really there.
        if (this.item && this.item.config) {
            // set new location to widget, right place?
            this.item.config.location = this.config.location;

            this.item.config.height = height;
        }
        if (this.el) {
            this.el.height(height);
        }
        if (this.item) {
            return this.item.refresh();
        }
    },

    /**
     * Refresh params like position, etc.
     * @param config
     */
    update: function (config) {
        'use strict';

        this.config = $.extend(this.config, config);

        var me  = this,
            cfg = $.extend({
                id              : me.config.id,
                user            : App.config.user.id,
                name            : me.config.name,
                location        : me.config.location,
                positionNumber  : me.config.positionNumber,
                widgetType      : me.config.widgetType,
                widgetData      : me.config.widgetData,
                parent          : me.config.parent,
                description     : me.config.description,
                pictureName     : me.config.pictureName,
                // The objectType is delivered by caesarWidgetProvider/getWidgets2.
                domainObjectType: me.config.objectType
            }, config);


        $.ajax({
            url    : App.config.serviceUrl + 'caesarWidgetProvider/updateWidget2',
            data   : cfg,
            success: function () {
                // do we need to do anything here?
                me.refresh();
            }
        });
    },

    /**
     * Will be called after drag and drop widget
     */
    onDrop: function () {
        'use strict';

        if (this.item && this.item.config) {
            // Update location
            this.item.config.location = this.config.location;
            this.item.onDrop();
        }
    },

    /**
     * Depending on widget type this container either has a fixed height or expands the container to fit the content.
     * @returns {string}
     */
    getHeight: function () {
        'use strict';

        var height     = null,
            widgetData = null,
            me         = this;

        if (!this.config) {
            return height;
        }

        if (this.config.isHeadless) {
            /**
             * vertical margins
             * @type {number}
             */
            /* var offset = 30;
             switch (this.config.widgetType) {
             case 'assetDashboard':
             case 'groupDashboard':
             case 'dashboard':
             offset = 60;
             }
             height = $('body').height() -
             this.elHeader.outerHeight() -
             offset;*/

            height = '100%';

            switch (this.config.widgetType) {
                case 'widgetGroup':
                    height = me.elContent.height();
                    break;
            }

        } else {

            switch (this.config.widgetType) {
                case 'assetCommand':
                case 'detail':
                case 'list':
                    // height already adjusted.
                    break;
                case 'dashboard':
                    widgetData = $.parseJSON(this.config.widgetData);
                    switch (widgetData.reportViewType) {
                        case 'radial':
                        case 'linear-vertical':
                        case 'linear-horizontal':
                            // do nothing.
                            break;
                        default:
                        case 'line':
                            height = App.config.widgetHeight;
                    }
                    break;
                case 'grid':
                    // This has been commented out due to EO-121.
                    // Only adjust height if widget is NOT temporary.
                    //if (!this.config.isTemporary) {
                    height = App.config.widgetHeight;
                    //}
                    break;
                default:
                    height = App.config.widgetHeight;
            }
        }

        return height;
    },

    destroy: function () {
        'use strict';

        if (this.item) {
            this.item.destroy();
        }
        if (this.elContainer) {
            this.elContainer.remove();
        }
        this.item          = null;
        this.el            = null;
        this.elContainer   = null;
        this.elContent     = null;
        this.elHeader      = null;
        this.elHeaderTools = null;
        this.elStatus      = null;
        this.config        = null;
    }
});

/**
 * Renders a TabPanel into a panel.
 * @inherit App.ui.WidgetPanel
 * @type {void|*|extend|extend|extend}
 */
App.ui.WidgetGroupPanel = App.ui.WidgetPanel.extend({

    tabstrip: null,
    items   : [],

    init: function (config) {
        'use strict';

        var me = this;

        me.config = $.extend({
            /**
             * insert default config stuff
             */
            widgetData: []
        }, config);


        // Show TabStrip

        // Call parent constructor
        App.ui.WidgetPanel.fn.init.call(this, me.config);

        // Build dataSource
        var dataSource = [];
        $.each(me.config.children, function (idx, item) {
            dataSource[idx]     = {
                text          : item.name,
                content       : ' ',
                imageUrl      : 'images/icons/16px/' + item.pictureName + '.png',
                positionNumber: parseInt(item.positionNumber)
            };
            item.domainObjectId = me.config.domainObjectId;
        });

        dataSource.sort(App.util.sortWidget);

        //noinspection JSUnresolvedFunction
        me.tabstrip = me.el.kendoTabStrip({
            animation        : {
                open: {
                    effects: 'fadeIn'
                }
            },
            dataTextField    : 'text',
            dataContentField : 'content',
            dataImageUrlField: 'imageUrl',
            dataSource       : dataSource,
            activate         : function (e) {
                var i         = me.tabstrip.select().index(),
                    cfg       = me.config.children[i],
                    elContent = $(e.contentElement);

                // Resize content to 100% - tabstrip height - padding.
                elContent.height(me.el.innerHeight() - me.tabstrip.tabGroup.outerHeight() - parseInt(me.tabstrip.tabGroup.css('padding-top')) - 1);

                // If we have a grid here, adjust the grid's height.
                var gridData = elContent.children('.k-grid-content');
                if (gridData.length) {
                    var otherElements = elContent.children().not('.k-grid-content'), otherElementsHeight = 0;
                    otherElements.each(function () {
                        otherElementsHeight += $(this).outerHeight();
                    });
                    gridData.height(elContent.innerHeight() - otherElementsHeight);
                }
                var widgetType = App.util.format.capitalize(cfg.widgetType);
                cfg.el         = elContent;
                cfg.elStatus   = me.elStatus;
                var itm        = new App.widget[widgetType](cfg);
                // Only initialize once.
                if (!cfg.initialized) {

                    if (App.widget[widgetType]) {

                        itm.load();
                        me.items.push(itm);
                        cfg.showStatusBar = itm.showStatusBar ? itm.showStatusBar : false;

                        // Mark as already initialized.
                        cfg.initialized = true;
                    } else if (App.config.parentWidgetType === cfg.widgetType) {
                        // Don't try to instantiate parent widgets, since they are only containers for now.
                        // Don't do anything here.
                    } else {
                        App.log.error(App.translate('Widget type {0} not implemented right now.', widgetType), cfg);
                    }
                }
                // Set reference to current active item. Only this will be refreshed with the poller.
                me.item = itm;

                // Enable / disable export action if it is not available for the current active item
                me.elHeaderTools.find('[data-action="widget-export-excel"]').toggleClass('widget-header-action-disabled', !$.isFunction(me.item.exportData));

                // Toggle status bar.
                if (cfg.showStatusBar) {
                    if (me.config.isHeadless) {
                        me.elContent.height(me.elContent.height() - 60);
                        me.el.height(me.elContent.height() - 60);
                    }
                    me.elStatus.removeClass('hidden');
                } else {
                    me.elStatus.addClass('hidden');
                }
            }
        }).data('kendoTabStrip');

        // Add Bootstrap Tooltip.
        me.tabstrip.tabGroup.children().each(function (idx) {
            $(this).attr({
                'title'      : me.config.children[idx].description,
                'data-toggle': 'tooltip'
            });
        });

        // Select first tab.
        me.tabstrip.select(me.tabstrip.tabGroup.children('li:first'));
    },

    destroy: function () {
        'use strict';

        for (var i = 0; i < this.items.length; i++) {
            var itm = this.items[i];
            itm.destroy();
            itm     = null;
        }
        this.items = null;

        if (this.tabstrip) {
            this.tabstrip.destroy();
        }
        this.tabstrip = null;

        if (this.el) {
            this.el.empty();
            this.el = null;
        }

        this.elContainer   = null;
        this.elContent     = null;
        this.elHeader      = null;
        this.elHeaderTools = null;
        this.elStatus      = null;
        this.config        = null;
    }
});
