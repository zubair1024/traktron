/**
 * Generates field for specified configuration (see field rules <add wiki link>)
 * @type {void|*}
 */
App.ui.SelectionTree = kendo.Class.extend({
    container: null,
    tree     : null,

    init: function (config) {
        'use strict';

        this.config = $.extend({
            data      : {},
            selected  : [],
            valueField: 'displayValue',
            idField   : 'id',
            multi     : true,
            height    : 150
        }, config);

        var me = this;

        // Add html structure
        me.container = $('<div>', {}).appendTo(this.config.renderTo);

        me.setSelected(me.config.data, me.config.selected);

        //noinspection JSUnresolvedFunction
        me.tree = me.container.kendoTreeView({
            dataSource   : me.config.data,
            dataTextField: me.config.valueField,
            checkboxes   : {
                checkChildren: false
            }
        });

        if (!me.config.multi) {
            me.tree.on('click', 'input:checkbox', function () {
                var checkboxes = me.tree.find('input:checkbox'),
                    selected   = checkboxes.filter(':checked');

                checkboxes.not(selected).prop('disabled', selected.length === 1);
            });
            //} else {
            //    me.tree.data('kendoTreeView').bind('Selecting', function (e) {
            //            if (e.node.hasChildren) {
            //                if (e.node.checked) {
            //                    e.node.find('.k-item').disable();
            //                } else {
            //                    e.node.find('.k-item').enable();
            //                }
            //            }
            //        }
            //    );
        }
    },

    setSelected   : function (items, selected) {
        'use strict';

        var me = this;
        $.each(items, function (idx, item) {
            item.checked = $.inArray(item.id, selected) > -1;

            if (item.items) {
                me.setSelected(item.items, selected);
            }
        });
    },
    getSelectedIds: function (nodes, ids) {
        'use strict';

        var me = this;
        $.each(nodes, function (idx, node) {

            if (node.checked) {
                ids.push(node.id);
            }

            if (node.hasChildren) {
                me.getSelectedIds(node.children.data(), ids);
            }
        });
        return ids;
    },
    value         : function () {
        'use strict';

        var me = this;
        return me.getSelectedIds(me.tree.data('kendoTreeView').dataSource.view(), []);
    }
});
