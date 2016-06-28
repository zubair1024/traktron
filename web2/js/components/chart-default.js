/**
 * Created by zubair on 21-Nov-15.
 */

App.component.Defaultchart = stampit.compose(App.component.ChartBase, stampit()
    .props({
        config: null,
        element: null
    })
    .methods({
        formatData: function (data) {
            'use strict';

            var series = [],
                rows = [],
                row = null,
                valueAxis = {
                    majorUnit: 1,
                    labels: {
                        font: 'inherit'
                    }
                };

            for (var i = 0; i < data.metadata.columns.length; i++) {
                rows = [];

                /** @namespace data.tabledata */
                for (var j = 0; j < data.tabledata.rows.length; j++) {
                    row = data.tabledata.rows[j];
                    rows.push(row[i]);
                    if (row[i] > App.component.config.tickThreshold) {
                        delete valueAxis.majorUnit;
                    }
                }

                series.push({
                    name: data.metadata.columns[i],
                    data: rows
                });
            }

            return {
                'series': series,
                'categoryAxis': {
                    justified: true,
                    categories: data.metadata.rows,
                    labels: {
                        rotation: data.chartType === 'bar' ? 0 : -90,    // Don't rotate labels if we display a bar chart.
                        visible: true
                        //font    : 'inherit'
                    },
                    majorGridLines: {
                        visible: false
                    }
                },
                'valueAxis': valueAxis
            };
        },
        refresh: function () {
            var formattedData = this.formatData(this.config);
            this.element.setOptions({
                categoryAxis: formattedData.categoryAxis,
                valueAxis: formattedData.valueAxis,
                series: formattedData.series
            });
        }
    })
    /**
     * Constructor
     */
    .init(function () {
        if (DEBUG) console.time('Default chart initialization time');

        var formattedData = this.formatData(this.config);

        /**
         * Initialize the chart with the data and bind it to the DOM element
         */
        this.element = this.config.el.kendoChart({
            pdf: App.component.config.pdfOptions,
            transitions: false,  // Disable smooth chart animations.
            legend: {
                position: 'top',
                labels: App.component.config.inheritFont,
                inactiveItems: {
                    labels: App.component.config.inheritFont
                }
            },
            seriesDefaults: {
                type: this.config.chartType,
                labels: {
                    visible: true,
                    font: 'inherit'
                },
                tooltip: App.component.config.inheritFont
            },
            series: formattedData.series,
            categoryAxis: formattedData.categoryAxis,
            valueAxis: formattedData.valueAxis,
            tooltip: {
                visible: true,
                format: 'N0'
            }
        }).data('kendoChart');

        if (DEBUG) console.timeEnd('Default chart initialization time');
    }));