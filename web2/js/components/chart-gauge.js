/**
 * Created by zubair on 21-Nov-15.
 */

App.component.Gaugechart = stampit.compose(App.component.ChartBase, stampit()
    .props({
        config : null,
        element: null
    })
    .methods({
        destroy   : function () {
            this.config.el.remove();
            // remove interval if available
            if (this.config.dangleIntervalId) {
                clearInterval(this.config.dangleIntervalId);
            }
        },
        formatData: function (data) {
            'use strict';

            var ranges = [];

            $.each(data.metadata.ranges, function (idx, row) {
                row.color = App.component.config.rangeColors[row.type];
                ranges.push(row);
            });

            return {
                'ranges': ranges,
                'value' : parseInt(data.value, 10),
                'min'   : parseInt(data.metadata.min, 10),
                'max'   : parseInt(data.metadata.max, 10)
            };
        },
        refresh   : function () {
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
        if (DEBUG) {
            console.time('Gauge chart initialization time');
        }

        var me            = this,
            config        = this.config,
            element       = this.element,
            formattedData = this.formatData(config);

        /**
         * Initialize the chart with the data and bind it to the DOM element
         */

        config.settings = {
            pointer: {
                value: formattedData.value,
                color: '#0F76C0'
            },

            scale: {
                majorUnit : config.majorUnit,
                minorUnit: config.minorUnit,
                startAngle: -30,
                endAngle  : 210,
                vertical  : config.vertical,
                min       : formattedData.min,
                max       : formattedData.max,
                labels    : {
                    position: 'outside'
                },
                ranges    : formattedData.ranges,
                majorTicks: {
                    color: '#CBCBCD'
                },
                minorTicks: {
                    color: '#CBCBCD'
                }
            }
        };

        switch (config.chartType) {
            case 'radial':
                //noinspection JSUnresolvedFunction
                element                        = config.el.kendoRadialGauge(config.settings).data('kendoRadialGauge');
                config.settings.scale.vertical = 0;
                break;
            case 'linear-vertical':
                config.settings.pointer.shape  = 'arrow';
                config.settings.scale.vertical = 1;
                //noinspection JSUnresolvedFunction
                element = config.el.kendoLinearGauge(config.settings).data('kendoLinearGauge');
                break;
            case 'linear-horizontal':
                config.settings.pointer.shape  = 'arrow';
                config.settings.scale.vertical = 0;
                //noinspection JSUnresolvedFunction
                element = config.el.kendoLinearGauge(config.settings).data('kendoLinearGauge');
                break;
        }

        /**
         * Custom legend for the gauge based on ranges
         */
        var legendTemplate = kendo.template('' +
                                            '<ul class="gauge-legend">' +
                                            '# for (var i = 0; i < ranges.length; i++) { #' +
                                            '<li class="gauge-legend-#=ranges[i].type#"><span>#= App.translate(ranges[i].type) #</span></li>' +
                                            '# } #' +
                                            '</ul>');


        config.el.prepend(legendTemplate({
            ranges: formattedData.ranges
        }));

        /**
         * Create flickering animation to make it seem more real-time
         */
        config.dangleIntervalId = setInterval(function () {
            //noinspection JSUnresolvedVariable
            var value = parseFloat(config.value);

            // Let the data vary around 1%.
            //noinspection JSUnresolvedVariable
            var offset = (config.metadata.max - config.metadata.min) / 100,
                rnd    = Math.random() * offset;

            if ((Math.random() * 2) % 2 === 0) {
                value += rnd;
            } else {
                value -= rnd;
            }
            element.value(value);
        }, 1000);

        me.element = element;

        if (DEBUG) {
            console.timeEnd('Gauge chart initialization time');
        }
    }));