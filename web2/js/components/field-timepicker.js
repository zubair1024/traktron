/**
 * Created by zubair on 28-Nov-15.
 */


App.component.Timepicker = stampit.compose(App.component.FieldBase, stampit()
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
        var me     = this,
            element,
            config = this.config;

        element = $('<input>', {
            type       : 'time',
            name: config.id,
            placeholder: config.description
        }).appendTo(config.el);

        var value = '';
        if (config.currentValues && config.currentValues.length) {
            // TODO clean up.
            value = kendo.parseDate(App.util.format.hourMinute(config.currentValues[0]));
        }

        //noinspection JSUnresolvedFunction
        me.element = element.kendoTimePicker({
            value: value
        }).data('kendoTimePicker');
    }));