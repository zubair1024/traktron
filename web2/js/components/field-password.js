/**
 * Created by zubair on 27-Nov-15.
 */

App.component.Password = stampit.compose(App.component.FieldBase, stampit()
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
        var me     = this,
            element,
            config = this.config;

        //construct the password field
        element = $('<input>', {
            type       : 'password',
            'class': 'k-textbox',
            name   : config.id,
            value  : config.currentValues[0],
            id     : config.id,
            maxlength: config.maxLength,
            placeholder: config.description,
            'data-type': config.type
        }).appendTo(config.container);

        // password repeat field
        $('<dt>').text(config.fieldLabel + ' ' + App.translate('confirm')).appendTo(config.renderTo).attr('required', true);
        var container = $('<dd>').appendTo(config.renderTo);

        $('<input>', {
            type       : 'password',
            'class': 'k-textbox',
            name   : config.id + '_confirm',
            id     : config.id + '_confirm',
            maxlength: config.maxLength,
            placeholder: config.description,
            'data-type': config.type + '_confirm'
        }).appendTo(container);

        me.element = element.get(0);
    }));