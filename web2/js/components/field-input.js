/**
 * Created by zubair on 27-Nov-15.
 */

App.component.Input = stampit.compose(App.component.FieldBase, stampit()
    .props({
        config: null
    })
    .methods({
        getValue: function () {
            return $(this.element).val();
        }
    })
    /**
     * Initializer
     */
    .init(function () {
        var me           = this,
            element      = this.element,
            config       = this.config,
            displayValue = config.currentValues ? config.currentValues[0] : '';

        //noinspection JSUnresolvedVariable
        if (config.hasLinebreakSupport) {

            element = $('<textarea>', {
                name     : config.id,
                id  : config.id,
                'class': 'k-textbox',
                cols   : 35,
                rows   : 4,
                maxlength: config.maxLength
            }).text(displayValue).appendTo(config.container);

        } else {

            element = $('<input>', {
                type       : 'text',
                'class': 'k-textbox',
                value  : displayValue,
                name   : config.id,
                id     : config.id,
                placeholder: config.description,
                maxlength  : config.maxLength
            }).appendTo(config.container);
        }

        element.attr('data-type', config.type);

        if (config.isMandatory) {
            element.attr('required', 'true');
        }

        me.element = element.get(0);
    }));