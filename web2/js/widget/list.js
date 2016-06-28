/**
 * Displays list widget.
 */
App.widget.List = App.widget.Base.extend({
    widgetData        : null,
    sectionData       : {},
    values            : [],
    toolbar           : null,
    init              : function (config) {
        'use strict';
        var me           = this;
        me.config = $.extend({
            take                : 5,
            skip                : 0,
            page                : 1,
            pageSize            : 5,
            sortValue           : 'lastReportTime',
            sortOrder           : 1}, config);
        me.setWidgetData();
        var panelContent = me.config.panel.elContent;
        panelContent.css({
            maxHeight: App.config.widgetHeight
        });
        panelContent.scroll(function() {
            if ((panelContent.height() + panelContent.scrollTop()) >= (me.config.el.height() - 400)) {
                // you're at the bottom of the page
                if(me.config.originalSize - me.config.skip > 5) {
                    me.config.skip += 5;
                    me.config.page += 1;
                    me.load();
                }
            }
        });
        // Add Bootstrap grid classes to container.
        me.config.el.addClass('widget-list container-fluid');

        //this.buildToolbar();
    },
    load              : function () {
        'use strict';

        var me          = this;
        me.isRefreshing = true;
        me.jqXHR        = $.ajax({
            url    : App.config.serviceUrl + 'caesarObject/objectDataProvider3',
            data   : {
                domainObjectId      : me.config.domainObjectId,
                domainObjectValues  : JSON.stringify(me.values),
                domainObjectType    : me.config.objectType,
                domainDataView      : me.widgetData.viewType || 'allAssetsDashboard',
                take                : me.config.take,
                skip                : me.config.skip,
                page                : me.config.page,
                pageSize            : me.config.pageSize,
                sortValue           : me.config.sortValue,
                sortOrder           : me.config.sortOrder
            },
            success: function (response) {

                // Show / hide status bar.
                me.config.elStatus.toggleClass('hidden', !!response.success);

                if (response.success) {

                    // Destroy Bootstrap's tooltips beforehand if available.
                    me.config.el.find('[data-toggle="tooltip"]').tooltip('destroy');
                    me.config.originalSize = response.originalSize;
                    me.buildHTML(response);
                    me.lastRefresh = Date.now();
                } else {
                    // Notify user that there is currently nothing to see.
                    me.config.el.hide();
                    me.config.elStatus.html(App.translate('No data to display'));
                }

                me.isRefreshing = false;
            }
        });

        return me.jqXHR;
    },
    /**
     * Creates the list view HTML. Iterates over data.ui.items.
     * @param data
     * @returns {string}
     */
    buildHTML         : function (data) {
        'use strict';

        var me        = this;
        var html      = '',
            sections,
            j,
            k,
            item;
        if (data && data.ui && data.ui.items) {
            for (var i = 0; i < data.ui.items.length; i++) {
                sections = data.ui.items[i].items;
                //Build grid using classic Bootstrap
                var grid = me.buildGrid(sections);
                // Iterate over the sections. Respect their special needs like rendering and width.
                for (j = 0; j < sections.length; j++) {
                    var section    = sections[j];
                    switch (section.id) {
                        case 'performance': // Render KPIs.
                            html = '';

                            // Add section title
                            html += '<h5><small>' + section.name + '</small></h5>';

                            // Create inline list.
                            html += '<ul class="list-inline">';
                            for (k = 0; k < section.items.length; k++) {
                                item = section.items[k];

                                var value = item.currentValues[0];

                                /**
                                 * Only create KPI if value is not empty.
                                 */
                                if (value !== null) {

                                    html += '<li>';

                                    /** Lookup range. */
                                    var rangeCssClass = 'fg-notavailable';
                                    var rangeName     = null;
                                    if (typeof item.ranges !== 'undefined') {
                                        for (var l = 0; l < item.ranges.length; l++) {
                                            var range = item.ranges[l];

                                            if (
                                                (typeof range.from == 'undefined' || value >= range.from) &&
                                                (typeof range.to == 'undefined' || value <= range.to)
                                            ) {
                                                // creates ranges like fg-good', 'fg-fair', 'fg-bad', 'fg-dangerous'
                                                rangeCssClass = 'fg-' + range.id.split('.')[1];
                                                rangeName     = range.name;

                                                // Range found. stop here.
                                                break;
                                            }
                                        }
                                    }

                                    /** Format KPI */
                                    var kpi          = '',
                                        displayValue = '',
                                        icon         = '';

                                    /** @namespace item.unitType */
                                    if (item.unitType) {

                                        // The metric type determines the icon, eg. "ico-c-temperature".
                                        icon = 'ico-c-' + item.unitType;

                                        switch (item.unitType) {
                                            case 'temperature':
                                                kpi = rangeName || App.config.blankSign;
                                                break;
                                            case 'volume':
                                                // Format percentage.
                                                if ($.isNumeric(item.minValue) && $.isNumeric(item.maxValue)) {
                                                    var percentage = value / (item.maxValue - item.minValue);
                                                    kpi            = kendo.toString(percentage, 'p0');
                                                } else {
                                                    kpi = App.config.blankSign;
                                                }
                                                break;
                                            case 'accumulator':
                                                kpi = value;
                                                break;
                                            default:
                                            // Do nothing.
                                        }

                                        displayValue = App.util.format.item(item);

                                        html += '<span class="widget-list-icon pull-left icon ' + rangeCssClass + ' ' + icon + '" style="font-size:5em" data-toggle="tooltip" title="' + item.name + '"/> ';
                                        html += '<strong class="widget-list-kpi" style="font-size:18px">' + kpi + '</strong>';
                                        //if (displayValue) {
                                        html += '<br/><small>' + displayValue + '</small>';
                                        //}
                                    } else {
                                        icon = 'icon-unknown';
                                        switch (item.metric) {
                                            case 'fluidType':
                                                //var mockVals = ['butane', 'gas', 'gasoline', "jetfuel", "kerosene", 'lpg', 'oil', 'premix', 'water'];
                                                //icon = 'icon-' + mockVals[Math.floor(Math.random()*mockVals.length)];
                                                icon = ('ico-c-' + value).toLowerCase();
                                                break;
                                            default:
                                            // Display naked Value with default icon.
                                        }
                                        html += '<span class="widget-list-icon pull-left icon ' + icon + '" data-toggle="tooltip" style="font-size:5.6em" title="' + item.name + '"/>';
                                        html += '<strong class="widget-list-kpi" data-toggle="tooltip" style="font-size:18px" title="' + item.name + '">' + App.util.format.item(item) + '</strong>';
                                    }

                                    html += '</li>';
                                }
                            }
                            html += '</ul>';
                            grid[section.id].append(html);
                            break;
                        case 'graph':
                            new App.component.CapacityChart.create({el: grid[section.id], data: section.items, height: 300});
                            break;
                        case 'main':  // Contains some general infos like Image, name, lastReportTime, etc.
                        case 'activity':
                        case 'status':
                        case 'gridAllAssets':
                            html = '';
                            var minimode = section.id === 'status';
                            var listClass = minimode ? 'list-inline' : 'list-unstyled';
                            if(minimode) {
                                html += '<h5><small>' + section.name + '</small></h5>';
                            }
                            html += '<ul class="' + listClass + '" style="margin-bottom: 10px;">';
                            for(var m = 0; m < section.items.length; m++) {
                                var sectionItem = section.items[m];
                                if(sectionItem.id === 'name') {
                                    html += '<h5>' + App.util.format.item(sectionItem) + '</h5>';
                                } else if(minimode) {
                                    html += '<li class="col-lg-6" style="padding: 0;">' + App.util.format.item(sectionItem) + '</li>';
                                } else {
                                    html += '<li>' + App.translate(sectionItem.name) + ':<br/><strong>' + App.util.format.item(sectionItem) + '</strong></li>';
                                }
                            }
                            html += '</ul>';
                            grid[section.id].prepend(html);
                            break;
                        case 'image':
                            html = '';
                            html += '<div class=" widget-list-image-column"><img src="images/temp/oiltank01.jpg" class="img-responsive" alt=""></div>';
                            grid[section.id].prepend(html);
                            break;
                        default:
                            break;
                    }
                }
            }
        }


    },
    /**
     * Find item in array by its id.
     * @param {Array} haystack
     * @param {string} needle
     * @returns {*}
     */
    findItemById      : function (haystack, needle) {
        'use strict';

        var result = null;

        if ($.isArray(haystack)) {
            for (var i = 0; i < haystack.length; i++) {
                if (haystack[i].id === needle) {
                    result = haystack[i];
                    break;
                }
            }
        }
        return result;
    },
    /**
     * Add a toolbar to the top of the list.
     */
    buildToolbar      : function () {
        'use strict';
        var toolbarEl = $('<div>');
        //noinspection JSUnresolvedFunction
        this.toolbar = toolbarEl.kendoToolBar({
            items: [
                {type: 'button', text: 'MyButton'}
            ]
        }).data('kendoToolBar');
        this.config.el.parent().prepend(toolbarEl);
    },
    buildGrid      : function (data) {
        var me             = this,
            sectionColSize = {
                image        : 3,
                main         : 3,
                status       : 1,
                performance  : 3,
                graph        : 5,
                activity     : 12,
                gridAllAssets: 12,
                total        : 12,// This is a temporary field to show AllAssets view. Can be removed once response is structured as sections
                height       : 'auto'
            },
            grid           = [];
        switch (data.length) {
            case 1:
                sectionColSize.total  = 6;
                break;
            case 2:
            case 3:
                sectionColSize.main        = 6;
                sectionColSize.performance = 4;
                sectionColSize.status      = 2;
                sectionColSize.total       = 6;
                sectionColSize.height      = '200px';
                break;
            case 4:
                sectionColSize.main        = 6;
                sectionColSize.performance = 6;
                sectionColSize.status      = 3;
                sectionColSize.total       = 6;
                sectionColSize.height      = 'auto';
                break;

            case 5:
                var graphSection = this.findItemById(data, 'graph');
                var image = this.findItemById(data, 'image');
                if (image) {
                    sectionColSize.image = 3;
                    sectionColSize.main        = 4;
                    sectionColSize.status      = 1;
                    sectionColSize.performance = 4;
                } else if (graphSection && graphSection.items.length === 2) {
                    sectionColSize.performance = 8;
                    sectionColSize.main        = 6;
                    sectionColSize.status      = 2;
                    sectionColSize.graph       = 6;
                    sectionColSize.total       = 6;
                }
                break;
            default :
                break;
        }

        var row = $('<div />', {
            'class': 'grid__brick col-lg-' + sectionColSize.total,
            style  : 'border: 1px solid #bdbdbd; background-color: white; padding: 10px; height: ' + sectionColSize.height
        }).appendTo(me.config.el);
        $.each(data, function (index, section) {
            var parent       = section.id === 'activity' ? grid.main : row;
            var columnStyle  = (section.id === 'activity' || section.id === 'status') ? 'padding:0;' : '';
            grid[section.id] = $('<div />', {
                'class': ' col-lg-' + sectionColSize[section.id],
                'style': columnStyle
            }).appendTo(parent);
        });
        return grid;
    },
    refresh           : function () {
        'use strict';
        //return this.load();
    },
    destroy           : function () {
        // Stop Ajax call - only if not uninitialized (0) or finished (4).
        if (this.jqXHR && this.jqXHR.readyState !== 4 && this.jqXHR.readyState !== 0) {
            this.jqXHR.abort();
            this.jqXHR = null;
        }

        // Remove toolbar if available.
        if (this.toolbar) {
            this.toolbar.destroy();
        }

        // Remove element from DOM.
        if (this.config.el) {
            this.config.el.remove();
        }
    }
});
