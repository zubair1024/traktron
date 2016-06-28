/**
 * Created by zubair on 27-Nov-15.
 */

App.component.Editor = stampit.compose(App.component.FieldBase, stampit()
    .props({
        config: null
    })
    /**
     * Initializer
     */
    .init(function () {
        var me = this,
            element,
            config = this.config,
            value = me.config.currentValues ? me.config.currentValues[0] : '',
            data = [];

        $.each(me.config.availablePlaceholderValues, function (idx, val) {
            data.push({
                text: val,
                value: '[' + val + ']'
            });
            var pattern = new RegExp('(< *?/*)' + val + '( +?|>)', 'g');
            value = value.replace(pattern, '&lt;' + val + '&gt;');
        });

        value = value.replace(/(<([^>]+)>)/g, '');

        element = $('<textarea>', {
            name: config.id,
            id: config.id,
            cols: 35,
            rows: 4,
            maxlength: config.maxLength
        }).text(value).appendTo(config.container);

        //noinspection JSUnresolvedFunction
        element = element.kendoEditor({
            tools: ['insertHtml'],
            encoded: true,
            messages: {
                insertHtml: App.translate('Add Placeholder')
            },
            select: function (e) {
                var val = e.sender.value();
                val = val.replace(/[\[]/g, '&lt;').replace(/[\]]/g, '&gt;');
                e.sender.value(val);
            },
            insertHtml: data
        }).data('kendoEditor');

        me.element = element;

    }));