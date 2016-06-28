/**
 * Created by zubair on 21-Nov-15.
 */

App.component.Donutchart = stampit.compose(App.component.ChartBase, stampit()
    .props({
        config: null,
        element: null
    })
    .methods({
        formatData: function (data) {
            'use strict';

            var chartData = [];

            $.each(data.metadata.columns, function (colIdx, column) {
                var series = [],
                    seriesData;

                $.each(data.metadata.rows, function (rowIdx, row) {
                    //noinspection JSUnresolvedVariable
                    series.push({
                        category: row[0],
                        value: data.tabledata.rows[rowIdx][colIdx]
                    });
                });

                seriesData = {
                    name: column[0],
                    data: series
                };

                // add label config to outer donut
                if (colIdx === data.metadata.columns.length - 1) {
                    seriesData.labels = {
                        visible: true,
                        position: 'outsideEnd',
                        template: '#= category #: #= kendo.toString(value,"n") #'
                    };
                }

                chartData.push(seriesData);
            });

            return chartData;
        },
        refresh: function () {
            var formattedData = this.formatData(data);
            this.element.setOptions({
                series: formattedData
            });
        }
    })
    /**
     * Initializer
     */
    .init(function () {
        if (DEBUG) console.time('Donut chart initialization time');

        var formattedData = this.formatData(config);

        /**
         * Initialize the chart with the data and bind it to the DOM element
         */
        this.element = this.config.el.kendoChart({
            pdf: App.component.config.pdfOptions,
            legend: {
                visible: false,
                position: 'right'
            },
            chartArea: {
                background: ''
            },
            seriesDefaults: {
                type: 'donut',
                startAngel: 200
            },
            tooltip: {
                visible: true,
                template: '#= category # (#= series.name #): #= kendo.toString(value,"n") #'
            },
            series: formattedData
        }).data('kendoChart');

        if (DEBUG) console.timeEnd('Donut chart initialization time');
    }));