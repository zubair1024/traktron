/**
 * Created by zubair on 27-Nov-15.
 */

App.component.TripStages = stampit.compose(App.component.FieldBase, stampit()
    .props({
        config: null,
        state : null
    })
    .methods({
        enable       : function (state) {
            return this.element.enable(!state);
        },
        renderTooltip: function () {
            //do nothing
        }
    })
    /**
     * Initializer
     */
    .init(function () {
        if (DEBUG) {
            console.time('Trip Stages field initialization time');
        }

        var me         = this,
            config     = this.config,
            element    = $('<div>', {
                'class': 'container-fluid'
            }).appendTo(config.container),
            tripStages = [],
            stopOverNr = 1;


        $.each(config.availableValues, function (idx, item) {

            if (idx === 0) {

                // First element.
                $('<div class="row">')
                    .append($('<span>', {
                        'class': 'label map-marker-label',
                        text   : 'A'
                    }))
                    .append($('<strong>', {
                        text: item.name
                    }))
                    .appendTo(element);

            } else if (idx === config.availableValues.length - 1) {

                // Last element
                $('<div class="row">')
                    .append($('<span>', {
                        'class': 'label map-marker-label',
                        text   : 'B'
                    }))
                    .append($('<strong>', {
                        text: item.name
                    }))
                    .appendTo(element);

            } else {

                // Middle element

                // Create title for this stopOver.
                var stageRow = $('<div>', {
                    'class': 'row'
                }).appendTo(element);

                var labelColumn = $('<div>', {
                    'class': 'col-md-6'
                }).appendTo(stageRow);

                labelColumn
                    .append($('<span>', {
                        'class': 'label map-marker-label',
                        text   : stopOverNr
                    }))
                    .append($('<span>', {
                        text: item.name
                    }));

                var dayPickerColumn = $('<div>', {
                    'class': 'col-md-3'
                }).appendTo(stageRow);

                var timePickerColumn = $('<div>', {
                    'class': 'col-md-3'
                }).appendTo(stageRow);

                // Calculate days and HH:mm.
                var days = Math.floor(item.value / 86400);
                var time = App.util.format.hourMinute(item.value - days * 86400);


                // Create a day- and dateTimePicker for that.
                var dayPickerEl = $('<input>').appendTo(dayPickerColumn);
                dayPickerEl.kendoNumericTextBox({
                    value : days,
                    min  : 0,
                    format: '0 ' + App.translate('days'),
                    change: function () {
                        updateRouteSummary();
                    }
                });

                var timePickerEl = $('<input>', {type: 'time'}).appendTo(timePickerColumn);
                //noinspection JSUnresolvedFunction
                timePickerEl.kendoTimePicker({
                    value   : time,
                    interval: 15,
                    format  : 'HH:mm',
                    change  : function () {
                        updateRouteSummary();
                    }
                });

                tripStages.push({
                    'routeStage': item.id,
                    'dayPicker' : dayPickerEl.data('kendoNumericTextBox'),
                    'timePicker': timePickerEl.data('kendoTimePicker')
                });
                stopOverNr++;
            }
        });

        // Specify which controls should be disabled/enabled on trip readonly
        element.enable = function (state) {
            for (var i = 0; i < tripStages.length; i++) {
                tripStages[i].dayPicker.enable(state);
                tripStages[i].timePicker.enable(state);
                if (state) {
                    tripStages[i].dayPicker.element.attr('tabindex', 0);
                    tripStages[i].timePicker.element.attr('tabindex', 1);
                }
                else {
                    tripStages[i].dayPicker.element.attr('tabindex', -1);
                    tripStages[i].timePicker.element.attr('tabindex', -1);
                }
            }
        };

        /**
         * Add Route summary.
         */
        var summaryRow = $('<div>', {
            'class': 'row'
        }).appendTo(element);

        var summaryCol = $('<div>', {
            'class': 'col-md-12'
        }).appendTo(summaryRow);

        $('<h5>', {
            text: App.translate('Route Summary')
        }).appendTo(summaryCol);

        var summaryPanelEl = $('<div>', {
            'class': 'routing-summary'
        }).appendTo(summaryCol);

        updateRouteSummary = function () {
            $.ajax({
                url    : App.config.serviceUrl + 'tripSummary/tripSummary',
                data: {
                    // Fetch the parentObjectId from the underlying admin wizard.
                    route            : config.refOwner.config.parentObjectId,
                    stopoverDurations: JSON.stringify(element.value())
                },
                success: function (response) {
                    //noinspection JSUnresolvedVariable
                    summaryPanelEl.html(App.util.format.routeSummary({
                        duration             : response.durationWithoutStopovers,
                        durationWithStopovers: response.durationWithStopovers,
                        distance             : response.distance
                    }));
                }
            });
        };

        /**
         * Fetch the data from all date pickers in one go and return an array.
         * We need to expose this function since it is used in me.getValue().
         * me.el is a jQuery Object, but value() is not used. Do not mix with val().
         *
         * @returns {{routeStage:string, duration: number}[]}
         */
        element.value = function () {
            var data = [];

            for (var i = 0; i < tripStages.length; i++) {

                // Convert to seconds.
                var stage = tripStages[i];
                var value = stage.dayPicker.value() * 86400;

                var dateTime = stage.timePicker.value();
                if (dateTime) {
                    value += dateTime.getHours() * 3600;
                    value += dateTime.getMinutes() * 60;
                }

                data.push({
                    routeStage: stage.routeStage,
                    duration  : value
                });
            }

            return data;
        };

        // Fetch data initially.
        updateRouteSummary();

        me.element = element;
        if (DEBUG) {
            console.timeEnd('Trip Stages field initialization time');
        }
    }));