/**
 * Created by zubair on 29-Nov-15.
 */

App.component.Multiplaceholder = stampit.compose(App.component.FieldBase, stampit()
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

        element = $('<select>', {
            name: config.id,
            id: config.id
        }).appendTo(config.container);

        //noinspection JSUnresolvedFunction
        element = element.kendoMultiSelect({
            placeholder: App.translate('Click to select...'),
            autoBind: true,
            dataSource: config.availablePlaceholderValues,
            value: config.currentValues
        }).data('kendoMultiSelect');

        me.element = element;

    }));
