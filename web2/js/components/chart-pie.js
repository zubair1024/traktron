/**
 * Created by zubair on 21-Nov-15.
 */
App.component.Piechart = stampit.compose(App.component.ChartBase, stampit()
    .props({
        config: null,
        element: null
    })
    .methods({
        formatData: function (data) {
            'use strict';
            var chartData = [];
            $.each(data.metadata.columns, function (colIdx, column) {
                chartData.push({
                    category: column,
                    value   : data.tabledata.rows[0][colIdx]
                });
            });
            return [
                {
                    data: chartData
                }
            ];
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
        if (DEBUG) console.time('Pie chart initialization time');

        var formattedData = this.formatData(this.config);

        /**
         * Initialize the chart with the data and bind it to the DOM element
         */
        this.element = this.config.el.kendoChart({
            pdf           : App.component.config.pdfOptions,
            legend        : {
                position: 'top'
            },
            chartArea     : {
                background: ''
            },
            seriesDefaults: {
                type  : 'pie',
                labels: {
                    visible   : true,
                    background: 'transparent',
                    template  : '#=category#: #=value#',
                    align     : 'circle'
                }
            },
            series        : formattedData
        }).data('kendoChart');

        if (DEBUG) console.timeEnd('Pie chart initialization time');
    }));