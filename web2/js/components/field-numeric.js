/**
 * Created by zubair on 27-Nov-15.
 */

App.component.FieldNumeric = stampit.compose(App.component.FieldBase, stampit()
    .props({
        config: null,
        decimals: null
    })
    /**
     * Initializer
     */
    .init(function () {
        var me = this,
            element,
            config = this.config;

        // this.init is not needed. It should be inside this constructor.
        var step = 1;

        config.decimals = !me.decimals ? 0 : me.decimals;

        if (config.decimals > 0) {
            step = Math.pow(10, -(config.decimals));
        }

        element = $('<input>', {
            type: 'number',
            name: config.id // Otherwise the validation messages won't be shown properly
            // Either they would be tilting or shown for one numericInput instead for all.
        }).appendTo(config.container);

        if (config.isMandatory) {
            element.attr('required', 'true');
        }

        // noinspection JSUnresolvedFunction
        element = element.kendoNumericTextBox({
            format: 'n' + config.decimals,
            decimals: config.decimals,
            spinners: true, // to decrease/ increase value
            placeholder: config.description,
            value: config.currentValues[0],
            max: config.maxValue ? config.maxValue : null,
            min: config.minValue ? config.minValue : null,
            step: step
        }).data('kendoNumericTextBox');

        me.element = element;
    }));