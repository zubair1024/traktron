/**
 * Created by nirupamb on 24-03-2016.
 */
App.component.Multiset = stampit.compose(App.component.FieldBase, stampit()
    .props({
        config: null
    })
    .methods({
        renderTooltip: function () {
            //do nothing
        },
        //To be removed once the backend can decrypt the field
        DecryptCoords: function (item) {
            var result = [];
            var res    = item.split('#(');
            for (var i = 0; i < res.length; i++) {
                if (res[i].length > 0) {
                    result.push(res[i].split(')')[0]);
                }
            }
            return result;
        },
        //To clear up the input boxes
        clearBoxes   : function () {
            this.firstBox.value('');
            this.secondBox.value('');
        },

    })
    /**
     * Initializer
     */
    .init(function () {
        var me      = this,
            element = this.element,
            config  = this.config;

        var row = $('<div>', {
            style  : 'margin-bottom: 5px;',
            'class': 'multiselect-container row'
        }).appendTo(config.container);

        var tagListWrapper = $('<div>', {
            style  : 'width: 99%',
            'class': 'k-widget k-multiselect k-header'
        }).appendTo(config.container);


        var tagListContainer = $('<div>', {
            'class'     : 'k-multiselect-wrap k-floatwrap',
            unselectable: 'on'
        }).appendTo(tagListWrapper);

        var dateList = $('<ul role="listbox" unselectable="on" class="k-reset k-multiselect-wrap"/>', {}).appendTo(tagListContainer);


        //noinspection JSUnresolvedFunction
        element = dateList.kendoListView({
            dataSource: {
                schema: {
                    model: {id: 'baseValue'}
                }
            },
            template  : '<li class="k-button" unselectable="on">' +
                        '<span unselectable="on">#:displayValue#</span>' +
                        '<span unselectable="on" class="k-icon k-delete">delete</span></li>'
        }).data('kendoListView');


        if (config.currentValues && config.currentValues[0] !== '#()') {
            var convert = me.DecryptCoords(config.currentValues[0]);

            $.each(convert, function (idx, item) {
                element.dataSource.add({
                    baseValue   : item,
                    displayValue: App.translate(item)
                });
            });
        }

        var first = $('<input>').appendTo($('<div>', {
            'class': 'col-sm-4'
        }).appendTo(row));

        var second = $('<input>').appendTo($('<div>', {
            'class': 'col-sm-4'
        }).appendTo(row));

        //noinspection JSUnresolvedFunction


        me.firstBox = first.kendoNumericTextBox({
            format  : '#.00',
            decimals: 3
        }).data('kendoNumericTextBox');


        me.secondBox = second.kendoNumericTextBox({
            format  : '#.00',
            decimals: 3
        }).data('kendoNumericTextBox');

        dateList.on('click', '.k-delete', function (e) {
            //noinspection JSCheckFunctionSignatures

            var parent = $(e.currentTarget).parent(),
                item   = me.element.dataSource.getByUid(parent.attr('data-uid'));
            me.element.dataSource.remove(item);
        });

        $('<button>', {
            type   : 'button',
            style  : 'margin-left: 5px;',
            'class': 'k-button col-sm-2'
        }).text(App.translate('Add')).appendTo(row).on('click', function () {
            //noinspection JSUnresolvedFunction

            var coords = me.firstBox.value() + ' ' + me.secondBox.value();
            if (coords && me.firstBox.value() !== null && me.secondBox.value() !== null) {
                var value = kendo.toString(coords);
                element.dataSource.add({
                    baseValue   : value,
                    displayValue: value
                });
                me.clearBoxes();
            }
        });

        me.element = element;
    }));