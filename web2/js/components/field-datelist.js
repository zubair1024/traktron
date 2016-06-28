/**
 * Created by zubair on 27-Nov-15.
 */

App.component.Datelist = stampit.compose(App.component.FieldBase, stampit()
    .props({
        config: null
    })
    .methods({
        renderTooltip: function () {
            //do nothing
        }
    })
    /**
     * Initializer
     */
    .init(function () {
        var me = this,
            element = this.element,
            config = this.config;

        var row = $('<div>', {
            style: 'margin-bottom: 5px;',
            'class': 'multiselect-container row'
        }).appendTo(config.container);

        var tagListWrapper = $('<div>', {
            style: 'width: 99%',
            'class': 'k-widget k-multiselect k-header'
        }).appendTo(config.container);

        var tagListContainer = $('<div>', {
            'class': 'k-multiselect-wrap k-floatwrap',
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
            template: '<li class="k-button" unselectable="on"><span unselectable="on">#:displayValue#</span><span unselectable="on" class="k-icon k-delete">delete</span></li>'
        }).data('kendoListView');

        if (config.currentValues) {
            $.each(config.currentValues, function (idx, item) {
                element.dataSource.add({
                    baseValue: item,
                    displayValue: App.translate(item)
                });
            });
        }

        var dateEl = $('<input>').appendTo($('<div>', {
            'class': 'col-sm-4'
        }).appendTo(row));

        //noinspection JSUnresolvedFunction
        var date = dateEl.kendoDatePicker({
            format: App.config.dateFormat
        }).data('kendoDatePicker');


        dateList.on('click', '.k-delete', function (e) {
            //noinspection JSCheckFunctionSignatures
            var parent = $(e.currentTarget).parent(),
                item = element.dataSource.getByUid(parent.attr('data-uid'));
            element.dataSource.remove(item);
        });

        $('<button>', {
            type: 'button',
            style: 'margin-left: 5px;',
            'class': 'k-button col-sm-2'
        }).text(App.translate('Add')).appendTo(row).on('click', function () {
            //noinspection JSUnresolvedFunction
            var dateVal = kendo.parseDate(date.value());
            if (dateVal) {
                var value = kendo.toString(dateVal, App.config.dateFormat);
                element.dataSource.add({
                    baseValue: value,
                    displayValue: value
                });
            }
        });

        me.element = element;
    }));