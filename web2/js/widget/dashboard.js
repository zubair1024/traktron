/**
 * Displays dashboard widget.
 */
App.widget.Dashboard = App.widget.Base.extend({
    chart           : null,
    showStatusBar   : true,
    /**
     * @type {string|null}
     */
    dateRange       : null,
    dateRangeCustom : 'custom',
    chartType       : 'column',
    /**
     * holds the interval ID if random movement is activated for the gauge
     * @type {number|null}
     */
    dangleIntervalId: null,


    /**
     * Holds reference to custom date range popover content.
     */
    elDaterangeCustom: null,

    /**
     * init widget
     * @param config
     */
    init: function (config) {
        'use strict';

        this.config = $.extend({}, config);

        /**
         * Since Kendo DataViz does NOT support RTL, switch it off.
         * Vote here: http://kendoui-feedback.telerik.com/forums/127393-telerik-kendo-ui-feedback/suggestions/3716047-rtl-support-for-kendoui-dataviz-suite
         */
        this.config.el.css('direction', 'ltr');

        this.setWidgetData();

        // should be filled always, but due to data inconsistency of widgets reportViewType could be null
        if (this.widgetData.reportViewType) {
            this.chartType = this.widgetData.reportViewType;
        }

        this.refreshData();
    },

    /**
     * Render graph/gauge or refresh its data.
     * @param {bool=} dataOnly If true, do not re-render the graph.
     */
    refreshData: function (dataOnly) {

        var me = this;

        if (!dataOnly) {
            me.el = me.config.el;
        }

        var params = {
            reportId          : me.widgetData.viewType,
            lastSelectedObject: App.current.objectId
        };

        if (me.dateRange !== null) {
            if (me.dateRange == me.dateRangeCustom) {
                params.filters = [
                    {
                        key      : 'daterange',
                        type     : 'betweenAnd',
                        value    : me.dateRange,
                        subvalues: [
                            me.config.customDateRangeFrom,
                            me.config.customDateRangeTo
                        ]
                    }
                ];
            } else {
                params.filters = [
                    {
                        key  : 'daterange',
                        type : 'eq',
                        value: me.dateRange
                    }
                ];
            }
        }

        // Stringify filters:
        if (params.filters) {
            params.filters = JSON.stringify(params.filters);
        }

        me.isRefreshing = true;
        $.ajax({
            url    : App.config.serviceUrl + 'rbireports/createReport',
            global : false,
            data   : params,
            success: function (response) {

                /** @namespace data.metadata */
                /** @namespace data.metadata.lastUpdateTime */
                /** @namespace data.metadata.nextUpdateInSeconds */
                /** @namespace data.metadata.max */
                /** @namespace data.metadata.min */
                /** @namespace data.value */
                /** @namespace data.values */
                var data = response.data,
                    msg  = '';

                if (!dataOnly) {

                    me.createStatusbar(data);

                    /** Translate columns **/
                    if (data.metadata.columns) {
                        $.each(data.metadata.columns, function (idx, value) {
                            $.each(value, function (j, column) {
                                if ($.type(column) === 'string') {
                                    data.metadata.columns[idx][j] = App.translate(column);
                                }
                            });
                        });
                    }

                    /** Translate rows **/
                    if (data.metadata.rows) {
                        $.each(data.metadata.rows, function (idx, value) {
                            $.each(value, function (j, row) {
                                if ($.type(row) === 'string') {
                                    data.metadata.rows[idx][j] = App.translate(row);
                                }
                            });
                        });
                    }

                    /**
                     *  Create chart
                     */
                    data.chartType = me.chartType;
                    data.el = me.el;
                    switch (me.chartType) {
                        case 'pie':
                            me.chart = new App.component.Piechart.create({config: data});
                            break;
                        case 'donut':
                            me.chart = new App.component.Donutchart.create({config: data});
                            break;
                        case 'linear-vertical':
                        case 'linear-horizontal':
                        case 'radial':
                            me.chart = new App.component.Gaugechart.create({config: data});
                            break;
                        case 'line':
                            me.chart = new App.component.Linechart.create({config: data});
                            break;
                        case 'Capacity (Cylindrical Graph)':
                            me.chart = new App.component.CapacityChart.create({config: data, type: 'cylinder'});
                            break;
                        case 'Capacity (Column Graph)':
                            me.chart = new App.component.CapacityChart.create({config: data, type: 'column'});
                            break;
                        default: // column / bar
                            me.chart = new App.component.Defaultchart.create({config: data});
                            break;
                    }

                    // Resize chart manually. A Kendo "feature".
                    me.resize = function () {
                        if (me.chart) {
                            me.chart.redraw();
                        }
                    };
                    $(window).resize(me.resize);
                } else {

                    /**
                     * Refresh data only.
                     */
                    if (data.values && data.values.length > 0) {
                        me.el.show();
                        me.chart.refresh(data);
                    }
                }

                // Create a status message.
                if ((data.values && data.values.length === 0) || (data.tabledata && data.tabledata.rows.length === 0)) {
                    me.el.hide();
                    msg = App.translate('No data to display');
                } else if (data.metadata.lastUpdateTime === null) {
                    msg = App.translate('No recent activity');
                } else {
                    msg = kendo.format(
                        '<span><strong>{0}</strong>: {1}</span>',
                        App.translate('Last Update'),
                        App.util.format.dateTime(data.metadata.lastUpdateTime)
                    );
                }

                me.updateStatusbar(data, msg);
                me.lastRefresh = Date.now();
                if (data.metadata.nextUpdateInSeconds) {
                    me.lastRefresh += data.metadata.nextUpdateInSeconds * 1000;
                }
                me.isRefreshing = false;
            },
            error  : function () {
                /** Disable the "server not available" error, since it is already handled below. */
                //if (jqXHR.status === 200) {
                //    App.log.checkJsonResponse(jqXHR, thrownError, params);
                //}
                me.updateStatusbar({}, kendo.format(
                    '<strong>{0}</strong>',
                    App.translate('Service temporarily unavailable')
                ));
                me.lastRefresh  = Date.now();
                me.isRefreshing = false;
            }
        });
    },

    createStatusbar: function (data, msg) {
        var me          = this,
            statusItems = [],
            elStatus    = me.config.elStatus,
            i           = 0,
            filter      = null;

        elStatus.empty();
        elStatus.removeClass('hidden');

        statusItems.push({
            template  : '<span data-id="statusMessage"></span>',
            overflow  : 'never',
            attributes: {'class': 'widget-status-item-right'}
        });


        /**
         * StatusBar filter / items renderer
         */
        var filters = {
            daterange: {
                items    : [
                    {
                        template  : '<span>' + App.translate('Date Range:') + '</span>',
                        attributes: {style: 'margin-left:.5em'},
                        overflow  : 'auto'
                    }, {
                        template: '<input data-id="daterangeDropdown" style="width:100px;"/>',
                        overflow: 'auto'
                    }
                ],
                installer: function (filter) {

                    me.dateRange = filter.value;

                    /**
                     * Create custom DateRange Pickers
                     * @param popoverContainer
                     */
                    var createDaterangeCustom = function (popoverContainer) {
                        me.elDaterangeCustom = $(kendo.format(
                            '<span>{0} <input data-id="daterangeCustomFrom" /><br/>' +
                            '{1} <input data-id="daterangeCustomTo" /><br/>' +
                            '<button data-id="ok" class="k-button pull-right">{2}</button>' +
                            '</span>',
                            App.translate('Start date:'),
                            App.translate('End date:'),
                            App.translate('OK')
                        ));

                        // ...and augment it.

                        // noinspection JSUnresolvedFunction
                        var pickerFrom = me.elDaterangeCustom
                            .find('[data-id=daterangeCustomFrom]')
                            .kendoDateTimePicker({
                                max: new Date()
                            })
                            .data('kendoDateTimePicker');

                        // noinspection JSUnresolvedFunction
                        var pickerTo = me.elDaterangeCustom.find('[data-id=daterangeCustomTo]')
                            .kendoDateTimePicker({
                                max: new Date()
                            })
                            .data('kendoDateTimePicker');

                        me.elDaterangeCustom
                            .find('[data-id=ok]')
                            .click(function () {
                                popoverContainer.popover('hide');
                                var from = pickerFrom.value();
                                if (from) {
                                    // Timezone - subtract offset.
                                    App.util.dateToGMT(from);
                                    me.config.customDateRangeFrom = kendo.toString(from, App.config.dateTimeFormat);
                                } else {
                                    me.config.customDateRangeFrom = null;
                                }

                                var to = pickerTo.value();
                                if (to) {
                                    // Timezone - subtract offset.
                                    App.util.dateToGMT(to);
                                    me.config.customDateRangeTo = kendo.toString(to, App.config.dateTimeFormat);
                                } else {
                                    me.config.customDateRangeTo = null;
                                }

                                if (me.config.customDateRangeFrom && me.config.customDateRangeTo) {
                                    // Do a refresh if both dates have been filled out.
                                    me.dateRange = me.dateRangeCustom;
                                    me.refreshData(true);
                                }
                            });

                        popoverContainer.popover({
                            content  : me.elDaterangeCustom,
                            html     : true,
                            placement: 'auto top',
                            trigger  : 'manual',
                            title    : App.translate('Select start and end date'),
                            container: 'body'
                        });
                    };

                    // noinspection JSUnresolvedFunction
                    /** @namespace filter.choices */
                    elStatus.find('[data-id=daterangeDropdown]').kendoDropDownList({
                        dataValueField: 'id',
                        dataTextField : 'name',
                        dataSource    : filter.choices,
                        change        : function () {
                            var value = this.value();

                            if (value == me.dateRangeCustom) {
                                // Add Custom date range popover only once.
                                if (!me.elDaterangeCustom) {
                                    createDaterangeCustom(this.span);
                                }
                                this.span.popover('show');
                            } else if (value) {
                                this.span.popover('hide');
                                me.dateRange = value;
                                me.refreshData(true);
                            }
                        },
                        select        : function () {
                            if (this.value() == me.dateRangeCustom) {
                                if (!me.elDaterangeCustom) {
                                    createDaterangeCustom(this.span);
                                }
                                this.span.popover('show');
                            }
                        }
                    });
                }
            }
        };

        // Add HTML elements
        // Currently we are only looking for the daterange filter.
        if (data && data.metadata && data.metadata.filters && data.metadata.filters.length > 0) {
            for (i = 0; i < data.metadata.filters.length; i++) {

                filter = data.metadata.filters[i];
                if (filters.hasOwnProperty(filter.key)) {
                    statusItems = statusItems.concat(filters[filter.key].items);
                }
            }
        }

        // Add Toolbar
        // noinspection JSUnresolvedFunction
        elStatus.kendoToolBar({
            //resizable: true,
            items: statusItems
        });

        if (msg) {
            elStatus.find('[data-id=statusMessage]').html(msg);
        }

        // Add events to the newly added items.
        if (data && data.metadata && data.metadata.filters && data.metadata.filters.length > 0) {
            for (i = 0; i < data.metadata.filters.length; i++) {
                filter = data.metadata.filters[i];
                if (filters.hasOwnProperty(filter.key)) {
                    filters[filter.key].installer(filter);
                }
            }
        }
    },
    updateStatusbar: function (data, msg) {

        // Create StatusBar...
        if (!this.config.elStatus.find('[data-id=statusMessage]').length) {
            this.createStatusbar(data, msg);
        } else {
            // ...or update StatusBar.

            // Update status message.
            this.config.elStatus.find('[data-id=statusMessage]').html(msg);

            // Update filters.
            if (data.metadata && data.metadata.filters && data.metadata.filters.length) {
                for (var i = 0; i < data.metadata.filters.length; i++) {
                    var filter = data.metadata.filters[i];

                    switch (filter.key) {
                        case 'daterange':
                            // Update selection of current date range.
                            var combo = this.config.elStatus.find('[data-id=daterangeDropdown]');
                            if (combo) {
                                combo.data('kendoDropDownList').value(filter.value);
                            }
                            break;
                        default:
                        // Do nothing.
                    }
                }
            }
        }
    },

    //exportData: function () {
    //    if (this.chart) {
    //        this.chart.saveAsPDF();
    //    }
    //},

    /**
     * Only called if this.refreshData() has not been called.
     */
    resize: function () {
        'use strict';

        console.log('Check resize dashboard charts');

        if (this.chart) {
            this.chart.redraw();
        }
    },

    /**
     * refresh graph data
     */
    refresh: function () {
        this.refreshData(true);
    },

    /**
     * Destroy this widget.
     */
    destroy: function () {
        'use strict';

        if (this.chart) {
            this.chart.destroy();
        }
        $(window).off('resize', this.resize);
    }
});
