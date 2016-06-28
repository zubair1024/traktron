App.widget.MapInfo = kendo.Class.extend({
    /**
     * Widget configuration
     */
    config           : {},
    /**
     * contains widget specific configuration
     */
    widgetData       : {},
    /**
     * Contains the jQuery element of the widget.
     * @type {*|jQuery}
     */
    el               : null,
    /**
     * Contains the popover element.
     */
    popover          : null,
    visible          : false,
    onInitialized    : $.noop,
    /**
     *
     * @param config
     * @param onInitialized
     */
    init             : function (config, onInitialized) {
        'use strict';

        var me = this;

        me.config = $.extend({
            /**
             * insert default config stuff
             */
            domainObjectType: null,
            domainObjectId  : null,
            objectName      : null,
            dataView        : 'mapDetails',
            url             : App.config.serviceUrl + 'caesarObject/objectDataProvider3'
        }, config);

        me.onInitialized = onInitialized;


        /*
         * create "anchor" element for the popover only once
         */
        if (!me.el) {
            var parentElem = config.parentElement,
                position   = config.position;

            me.el = $('<div>')
                .css({
                    top     : position.top,
                    left    : position.left,
                    position: 'absolute'
                })
                .appendTo(parentElem)
            ;
        }

        /**
         * Fetch the DataView only once and store this config globally.
         * This is mainly used in order to get the labels of the values right.
         */
        if (!App.config.map.dataView[me.config.domainObjectType]) {
            $.ajax({
                url    : App.config.serviceUrl + 'caesarObject/availableValues',
                data   : {
                    domainDataView  : me.config.dataView,
                    domainObjectType: me.config.domainObjectType
                },
                success: function (response) {
                    App.config.map.dataView[me.config.domainObjectType] = response.domainObjectValues;
                    me.getView();
                }
            });
        } else {
            me.getView();
        }
    },
    /**
     * Use this param to implement a single instance version of the mapInfoBox.
     */
    show             : function () {
        if (this.popover) {
            this.el.popover('show');
            this.visible = true;
        }
    },
    /**
     * Hide and destroy Bootstrap's popover.
     */
    hide             : function () {
        if (this.popover) {
            this.el.popover('hide');
            this.visible = false;
        }
    },
    setPosition      : function (position) {
        if (this.popover) {

            /*
             * the positioning of the element actually has nothing to do with
             * the appearance of the popover, just trying to be consistent here
             */
            this.el.css({
                top : position.top,
                left: position.left
            });

            var tooltipElem = this.popover.tip();
            tooltipElem.css({
                top : position.top,
                // Works only if placement="bottom" is chosen, so the tip arrow is located at the top center.
                left: position.left - (tooltipElem.width() / 2)
            });
        }
    },
    isVisible        : function () {
        return this.visible;
    },
    getView          : function () {
        var me = this;

        $.ajax({
            url    : me.config.url,
            data   : {
                domainObjectType: me.config.domainObjectType,
                domainObjectId  : me.config.domainObjectId,
                domainDataView  : me.config.dataView
            },
            success: $.proxy(me.buildContainer, me)
        });
    },
    buildContainer   : function (data) {
        var me            = this,
            i,
            html          = '',
            nav           = '',
            tabContent    = '',
            sectionData   = {},
            noSectionData = [],
            title         = '';

        for (i = 0; i < data.ui.items[0].items.length; i++) {
            var item = data.ui.items[0].items[i];

            if (item.section === '') {
                noSectionData.push(item);
            } else {
                if (!sectionData[item.name]) {
                    sectionData[item.name] = [];
                }
                sectionData[item.name].push(item.items);
            }
        }

        // Create TabPanel
        if (!$.isEmptyObject(sectionData)) {
            i = 0;
            $.each(sectionData, function (section, items) {
                var tabIdx = 'tab' + i;
                nav += '<li class="' + (i === 0 ? 'active' : 'tab') + '"><a href=".' + tabIdx + '" data-toggle="tab">' + section + '</a></li>';
                tabContent += '<div class="tab-pane ' + tabIdx + ' ' + (i === 0 ? 'active' : '') + '">' + me.getTabPaneContent(items[0]) + '</div>';
                i++;
            });
            html += '<div class="tabbable">';
            html += '<ul class="nav nav-tabs">' + nav + '</ul>';
            html += '<div class="tab-content">' + tabContent + '</ul>';
            html += '</div>';
        }

        if (noSectionData.length > 0) {
            // We assume that at least is data in the non-section data section.

            // Create simple definition list.
            html += me.getTabPaneContent(noSectionData);
        }

        title = me.config.objectName + '<button class="close"><span aria-hidden="true">&times;</span><span class="sr-only">Close</span></button>';

        /**
         * Build the popover element only once, too. Reuse, and only set the
         * title, contents, and position if it already exists.
         */
        if (!me.popover) {
            me.el.popover({
                container: 'body',
                content  : html,
                html     : true,
                placement: 'bottom',
                trigger  : 'manual',
                title    : title,
                template : '<div class="popover mapinfo" role="tooltip"><div class="arrow"></div><h3 class="popover-title"></h3><div class="popover-content"></div></div>'
            });

            me.popover = me.el.data('bs.popover');
            me.popover.tip().on('click', 'button.close', function () {
                me.hide();
            });

        } else {
            me.popover.options.content = html;
            me.popover.options.title   = title;
            me.setPosition(me.config.position);
        }

        me.onInitialized(this);
    },
    getTabPaneContent: function (data) {

        var html     = '<dl class="dl-horizontal dl-tab-content">',
            dataView = App.config.map.dataView[this.config.domainObjectType];

        for (var i = 0; i < data.length; i++) {

            var item = data[i];

            // Find corresponding field in domain data view config.
            for (var j = 0; j < dataView.length; j++) {
                var dataViewValue = dataView[j];

                if (dataViewValue.domainObjectValueId === item.id) {
                    html += '<dt>' + App.translate(dataViewValue.domainObjectValueName) + '</dt>';
                    html += '<dd>' + App.util.format.item(item) + '</dd>';
                }
            }
        }

        html += '</dl>';

        return html;
    },
    /**
     * Geo position (as opposed to screen/pixel position) of the map object that
     * this map info box displays the info for.
     */
    geoPosition      : null,
    getGeoPosition   : function () {
        return this.geoPosition;
    },
    setGeoPosition   : function (position) {
        this.geoPosition = position;
    },
    destroy          : function () {
        if (this.popover) {
            this.el.popover('destroy');
            this.el.remove();
            this.visible = false;
        }
    }
});
