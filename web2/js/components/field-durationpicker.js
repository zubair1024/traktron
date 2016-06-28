/**
 * Created by zubair on 27-Nov-15.
 */

App.component.Durationpicker = stampit.compose(App.component.FieldBase, stampit()
    .props({
        config: null,
        state : null
    })
    .methods({
        enable: function (state) {
            return this.element.enable(!state);
        }
    })
    /**
     * Initializer
     */
    .init(function () {
        var me      = this,
            config  = this.config,
            value   = '',
            element = $('<input>', {
                type       : 'time',
                name: config.id,
                placeholder: config.description
            }).appendTo(config.container);


        if (config.currentValues && config.currentValues.length) {
            // TODO clean up.
            value = App.util.format.hourMinute(config.currentValues[0]);
        }

        //noinspection JSUnresolvedFunction
        element = element.kendoTimePicker({
            value   : value,
            interval: 30,
            format  : 'HH:mm'
        }).data('kendoTimePicker');

        me.element = element;
    }));
