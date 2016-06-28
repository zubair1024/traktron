/**
 * Created by zubair on 27-Nov-15.
 */

App.component.Datepicker = stampit.compose(App.component.FieldBase, stampit()
    .props({
        config: null,
        type  : null,
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
        var me     = this,
            element,
            config = this.config, dateRange = {},
            value  = null;

        element = $('<input>', {
            id         : config.id,
            name: config.id,
            placeholder: config.description
        }).attr('required', config.isMandatory).appendTo(config.container);

        if (config.isMandatory) {
            config.container.append('<div></div><span class="k-invalid-msg" data-for="' + config.id + '"></span>');
            element.attr('required', 'true');
        }

        if (config.maxValue) {
            //noinspection JSUnresolvedFunction
            dateRange.max = kendo.parseDate(config.maxValue, App.config.dateTimeFormat);
        }

        if (config.minValue) {
            //noinspection JSUnresolvedFunction
            dateRange.min = kendo.parseDate(config.minValue, App.config.dateTimeFormat);
        }


        switch (me.type) {
            case 'date':
                //noinspection JSUnresolvedFunction
                value = kendo.parseDate(config.currentValues[0], App.config.dateFormat);
                element.attr('type', 'date');
                //noinspection JSUnresolvedFunction
                element = element.kendoDatePicker($.extend({
                    value: value
                }, dateRange)).data('kendoDatePicker');
                break;
            case 'dateTime':
                //noinspection JSUnresolvedFunction
                value = kendo.parseDate(config.currentValues[0], App.config.dateTimeFormat);

                if (value) {
                    // Timezone - add offset.
                    App.util.dateFromGMT(value);
                }

                element.attr('type', 'datetime-local');
                //noinspection JSUnresolvedFunction
                element = element.kendoDateTimePicker($.extend({
                    value: value
                }, dateRange)).data('kendoDateTimePicker');
                break;
        }

        me.element = element;
    }));