/**
 * Created by zubair on 27-Nov-15.
 */

App.component.Dropdown = stampit.compose(App.component.FieldBase, stampit()
    .props({
        config: null,
        state : null
    })
    .methods({
        getValue: function () {
            return this.element.value();
        },
        enable  : function (state) {
            return this.element.enable(!state);
        }
    })
    /**
     * Initializer
     */
    .init(function () {
        var me           = this,
            config       = this.config,
            value        = config.currentValues.length ? config.currentValues[0] : null,
            defaultValue = config.availableValues.length ? config.availableValues[0].baseValue : null,
            defaultText  = config.availableValues.length ? config.availableValues[0].displayValue : '',
            element      = $('<input>').appendTo(config.container);

        if (config.isMandatory) {
            element.attr('required', 'true');
        }

        var setting = {
            dataValueField: 'baseValue',
            dataTextField : 'displayValue',
            id            : config.id
        };

        if (defaultValue === null) {
            // Remove first entry of list, since it is the default text.
            config.availableValues.shift();

            setting.autoBind    = false;
            setting.optionLabel = defaultText;
        } else {
            setting.value = defaultValue;
        }

        setting.dataSource = config.availableValues;
        //noinspection JSUnresolvedFunction
        element = element.kendoDropDownList(setting).data('kendoDropDownList');

        if (value !== null) {
            element.value(value);
        }

        me.element = element;
    }));