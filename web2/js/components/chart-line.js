/**
 * Created by zubair on 21-Nov-15.
 */

App.component.Linechart = stampit.compose(App.component.ChartBase, stampit()
    .props({
        config: null,
        element: null
    })
    .methods({
        formatData: function (data) {
            'use strict';

            var series = [],
                valueAxis,
                valuesMin = 0,
                valuesMax = 0,
                rangesMax = 0,
                rangesMin = 0,
                resultingMax,
                resultingMin,
                categoryAxis,
                ranges = [],
                step = 1,
                fieldNameForCategoryAxis,
                firstDate,
                lastDate,
                diffDate,
                diffDateInBaseUnit,
                i = 0;

            if (data.values && $.isArray(data.values) && data.values.length > 0) {

                fieldNameForCategoryAxis = data.metadata.categoryAxis.field;
                //noinspection JSUnresolvedFunction
                firstDate = kendo.parseDate(data.values[0][fieldNameForCategoryAxis], App.config.dateTimeFormat);
                //noinspection JSUnresolvedFunction
                lastDate = kendo.parseDate(data.values[data.values.length - 1][fieldNameForCategoryAxis], App.config.dateTimeFormat);
                diffDate = lastDate - firstDate;

                switch (data.metadata.categoryAxis.baseUnit) {
                    case 'minutes':
                        diffDateInBaseUnit = Math.round(diffDate / 1000 / 60);
                        step = Math.ceil(diffDateInBaseUnit / 10);
                        break;
                    case 'hours':
                        diffDateInBaseUnit = Math.round(diffDate / 1000 / 60 / 60);
                        step = Math.ceil(diffDateInBaseUnit / 10);
                        break;
                    case 'days':
                        diffDateInBaseUnit = Math.round(diffDate / 1000 / 60 / 60 / 24);
                        step = Math.ceil(diffDateInBaseUnit / 10);
                        break;
                    case 'week':
                        diffDateInBaseUnit = Math.round(diffDate / 1000 / 60 / 60 / 24 / 7);
                        step = Math.ceil(diffDateInBaseUnit / 10);
                        break;
                    case 'months':
                        diffDateInBaseUnit = Math.round(diffDate / 1000 / 60 / 60 / 24 / 7 / 30);
                        step = Math.ceil(diffDateInBaseUnit / 10);
                        break;
                }

                // Convert categoryValues to the user's timezone.
                for (i = 0; i < data.values.length; i++) {
                    data.values[i][fieldNameForCategoryAxis] = App.util.format.dateTime(data.values[i][fieldNameForCategoryAxis], App.config.dateTimeFormat);
                }
            }

            if (step <= 0) {
                step = 1;
            }

            categoryAxis = $.extend({
                justified: true,
                labels: {
                    step: step,
                    visible: true,
                    font: 'inherit',
                    dateFormats: {
                        minutes: 'HH:mm',
                        hours: 'dd HH',
                        years: 'yyyy',
                        days: 'MM-dd'
                    }
                },
                majorGridLines: {
                    visible: false
                },
                majorTicks: {
                    step: step
                },
                minorTicks: {
                    step: Math.ceil(step / 5),
                    visible: true
                }
            }, data.metadata.categoryAxis);

            if (data.metadata.ranges) {

                for (i = 0; i < data.metadata.ranges.length; i++) {
                    var row = data.metadata.ranges[i];

                    row.color = App.component.config.rangeColors[row.type];
                    row.opacity = 0.3;
                    row.to = row.to - 1;
                    ranges.push(row);

                    var topBorderRange = {
                        opacity: 1,
                        from: row.to,
                        to: row.to + 1,
                        color: row.color
                    };

                    ranges.push(topBorderRange);

                    rangesMin = Math.min(row.from, rangesMin);
                    rangesMax = Math.max(row.to, rangesMax);
                }
            }

            $.each(data.metadata.columns, function (idx, column) {
                series.push({
                    name: column.name,
                    type: 'line',
                    style: 'smooth',
                    markers: {
                        visible: false
                    },
                    field: idx,
                    categoryField: categoryAxis.field
                });

                valuesMin = Math.max(column.min, valuesMin);
                valuesMax = Math.max(column.max, valuesMax);
            });

            resultingMin = Math.max(valuesMin, rangesMin);
            resultingMax = Math.max(valuesMax, rangesMax);

            valueAxis = {
                labels: {
                    font: 'inherit'
                },
                min: resultingMin,
                max: resultingMax,
                plotBands: ranges
            };

            return {
                categoryAxis: categoryAxis,
                valueAxis: valueAxis,
                series: series,
                values: data.values
            };
        },
        refresh: function () {
            var formattedData = this.formatData(data);
            this.element.setOptions({
                categoryAxis: formattedData.categoryAxis,
                valueAxis: formattedData.valueAxis,
                series: formattedData.series
            });
            chart.dataSource.data(formattedData.values);
        }
    })
    /**
     * Initializer
     */
    .init(function () {
        if (DEBUG) console.time('Line chart initialization time');

        var config = this.config,
            formattedData = this.formatData(config);

        this.element = config.el.kendoChart({
            pdf: App.component.config.pdfOptions,
            legend: {
                position: 'top',
                labels: App.component.config.inheritFont,
                inactiveItems: {
                    labels: App.component.config.inheritFont
                }
            },
            seriesDefaults: {
                type: config.chartType,
                labels: App.component.config.inheritFont,
                tooltip: App.component.config.inheritFont,
                color: '#0F76C0'
            },
            dataSource: {
                data: config.values
            },
            transitions: false,  // Disable smooth chart animations.
            series: formattedData.series,
            categoryAxis: formattedData.categoryAxis,
            valueAxis: formattedData.valueAxis,
            tooltip: {
                visible: true,
                format: 'N0'
            }
        }).data('kendoChart');

        if (DEBUG) console.timeEnd('Line chart initialization time');
    }));


