/**
 * Created by zubair on 27-Nov-15.
 */

App.component.Checkbox = stampit.compose(App.component.FieldBase, stampit()
    .props({
        config: null
    })
    /**
     * Initializer
     */
    .init(function () {
        var me = this,
            element,
            config = this.config;

        element = $('<input>', {
            type: 'checkbox',
            name: config.id,
            id: config.id
        }).appendTo(config.container);

        //set checkbox
        element.prop('checked', config.currentValues[0]);
        me.element = element.get(0);

    }));