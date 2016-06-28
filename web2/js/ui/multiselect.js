/**
 * Generates field for specified configuration (see field rules <add wiki link>)
 * @type {void|*}
 */
App.ui.Multiselect = kendo.Class.extend({
    leftListView : null,
    rightListView: null,
    wrapper      : null,

    init: function (config) {
        this.config = $.extend({
            data         : [],
            valueField   : 'value',
            idField      : 'id',
            dataModel    : {id: 'id'},
            height       : 150,
            leftLabel    : null,
            rightLabel   : null,
            positionField: null,
            maxValue     : null
        }, config);
    },

    render: function () {
        'use strict';

        var me = this;

        // Add html structure
        me.wrapper = $('<div>', {
            'class': 'multiselect-container row'
        }).appendTo(me.config.renderTo);

        me.filterWrapper = $('<div>', {
            'class': 'row'
        }).appendTo(me.config.renderTo);

        // Left List
        var leftContainer = $('<div>', {
            'class': 'col-sm-5'
        }).appendTo(me.wrapper);

        if (me.config.leftLabel) {
            $('<div>', {
                html: me.config.leftLabel
            }).appendTo(leftContainer);
        }
        me.leftListView = $('<div>', {
            'class'          : 'multiselect-listview',
            height           : me.config.height,
            'data-identifier': 'left_list'
        }).appendTo(leftContainer);

        // Buttons
        var buttonPanel = $('<div>', {
            'class': 'multiselect-button-panel col-sm-2'
        }).appendTo(me.wrapper);

        var addSelected = $('<button>', {
            type   : 'button',
            'class': 'k-button'
        }).appendTo(buttonPanel).on('click', $.proxy(me.moveRight, this));
        addSelected.append($('<span>', {
            text: '>'
        }));

        var addAll = $('<button>', {
            type   : 'button',
            'class': 'k-button'
        }).appendTo(buttonPanel).on('click', $.proxy(me.moveAllRight, this));
        addAll.append($('<span>', {
            text: '>>'
        }));

        var removeAll = $('<button>', {
            type   : 'button',
            'class': 'k-button'
        }).appendTo(buttonPanel).on('click', $.proxy(me.moveAllLeft, this));
        removeAll.append($('<span>', {
            text: '<<'
        }));

        var removeSelected = $('<button>', {
            type   : 'button',
            'class': 'k-button'
        }).appendTo(buttonPanel).on('click', $.proxy(me.moveLeft, this));
        removeSelected.append($('<span>', {
            text: '<'
        }));


        // Right List
        var rightContainer = $('<div>', {
            'class': 'col-sm-5'
        }).appendTo(me.wrapper);

        if (me.config.rightLabel) {
            $('<div>', {
                html: me.config.rightLabel
            }).appendTo(rightContainer);
        }

        me.rightListView = $('<div>', {
            'class'          : 'multiselect-listview',
            'data-identifier': 'right_list',
            height           : me.config.height
        }).appendTo(rightContainer);
        if (me.config.required) {
            me.rightListView.attr('required', 'true');
        }

        //Build filters
        me.leftFilter = $('<input>', {
            type       : 'text',
            placeholder: 'Filter Available',
            'class'    : 'k-textbox col-sm-5',
            'style'    : 'margin: 1em; width: 40%'
        }).appendTo(me.filterWrapper);

        me.rightFilter = $('<input>', {
            type       : 'text',
            placeholder: 'Filter Selected',
            'class'    : 'k-textbox col-sm-5',
            'style'    : 'margin: 1em; width: 40%'
        }).appendTo(me.filterWrapper);

        // Build Kendo ListViews
        //noinspection JSUnresolvedFunction
        me.leftListView.kendoListView({
            dataSource: {
                data  : me.config.data,
                schema: {
                    model: me.config.dataModel
                }
            },
            template  : '<div class="multiselect-row">#:' + me.config.valueField + '#</div>',
            selectable: false,
            select    : me.onChange
        });

        me.leftListView.delegate('.multiselect-row', 'click', function () {
            $(this).toggleClass('k-state-selected');
        });

        //noinspection JSUnresolvedFunction
        me.rightListView.kendoListView({
            dataSource: {
                data  : [],
                schema: {
                    model: me.config.dataModel
                }
            },
            template  : '<div class="multiselect-row">#:' + me.config.valueField + '#</div>',
            selectable: false,
            select    : me.onChange
        });

        me.rightListView.delegate('.multiselect-row', 'click', function () {
            $(this).toggleClass('k-state-selected');
        });

        if (me.config.positionField) {
            //noinspection JSUnresolvedVariable
            me.rightListView.data().kendoListView.dataSource.sort({
                field: me.config.positionField,
                dir  : 'asc'
            });
        }
        me.leftListView.on('dblclick', function (e) {
            me.moveRight();
        });

        me.rightListView.on('dblclick', function () {
            me.moveLeft();
        });

        me.leftFilter.on('keyup', function () {
            me.filterList(me.leftListView, this);
        });

        me.rightFilter.on('keyup', function () {
            me.filterList(me.rightListView, this);
        });

        me.initDraggable();
    },

    onChange: function (el) {
        'use strict';

        el.preventDefault();
        var data = el.sender.dataSource.view();
        $.map(this.select(), function (item) {
            console.log(data[$(item).index()].name);
            //return data[$(item).index()].ProductName;
        });
    },

    initDraggable: function () {
        'use strict';

        var me = this;

        //noinspection JSUnresolvedFunction
        me.leftListView.kendoDraggable({
            filter: 'div[role=option]',
            hint  : function (row) {
                return row.clone();
            }
        });

        //noinspection JSUnresolvedFunction
        me.rightListView.kendoDraggable({
            filter: 'div[role=option]',
            hint  : function (row) {
                return row.clone();
            }
        });

        var onDrop = function (e, source, target) {
            e.draggable.hint.hide();

            //noinspection JSUnresolvedVariable
            var sourceData = source.data().kendoListView.dataSource;

            //noinspection JSUnresolvedVariable
            var targetData = target.data().kendoListView.dataSource,
                item       = sourceData.getByUid(e.draggable.hint.data().uid);

            if (source.attr('data-identifier') === 'left_list') {
                var data = [item];
                if (!me.checkMaxValue(data, targetData.data())) {
                    return false;
                }
            }

            if (item) {
                targetData.add(item);
                sourceData.remove(item);
            } else {
                // check if item already exists at target
                var targetItem = targetData.getByUid(e.draggable.hint.data().uid);
                if (targetItem) {
                    if (me.config.positionField) {
                        var dest     = $(document.elementFromPoint(e.clientX, e.clientY)),
                            posField = me.config.positionField;

                        dest = targetData.getByUid(dest.data('uid'));

                        if (targetItem.get(me.config.idField) !== dest.get(me.config.idField)) {
                            var tmp = targetItem.get(posField);
                            if (tmp) {
                                targetItem.set(posField, dest.get(posField));
                                dest.set(posField, tmp);
                            }
                            targetData.sort({field: posField, dir: 'asc'});
                        }
                    } else {
                        return false;
                    }
                }
            }

        };

        //noinspection JSUnresolvedFunction
        me.rightListView.kendoDropTarget({
            drop: function (e) {
                onDrop(e, me.leftListView, me.rightListView);
            }
        });

        //noinspection JSUnresolvedFunction
        me.leftListView.kendoDropTarget({
            drop: function (e) {
                onDrop(e, me.rightListView, me.leftListView);
            }
        });
    },

    moveAllRight: function () {
        this.moveAll(this.leftListView, this.rightListView, 'right');
    },
    moveAllLeft : function () {
        this.moveAll(this.rightListView, this.leftListView, 'left');
    },
    moveAll     : function (source, target, dir) {
        'use strict';

        //noinspection JSUnresolvedVariable
        var sourceDataSource = source.data().kendoListView.dataSource;
        //noinspection JSUnresolvedVariable
        var targetDataSource = target.data().kendoListView.dataSource;

        var data = $.extend({}, sourceDataSource.data());

        if (dir === 'right') {
            if (!this.checkMaxValue(data, targetDataSource.data())) {
                return false;
            }
        }

        $.each(data, function (key, item) {
            targetDataSource.add(item);
            sourceDataSource.remove(item);
        });
    },

    moveRight: function () {
        this.move(this.leftListView, this.rightListView, 'right');
    },
    moveLeft : function () {
        this.move(this.rightListView, this.leftListView, 'left');
    },
    move     : function (source, target, dir) {
        'use strict';

        //noinspection JSUnresolvedVariable
        var sourceListView = source.data().kendoListView,
            sourceData     = sourceListView.dataSource;

        //noinspection JSUnresolvedVariable
        var targetData = target.data().kendoListView.dataSource,
            data       = $.extend({}, sourceListView.element.find('.multiselect-row.k-state-selected'));

        if (dir === 'right') {
            if (!this.checkMaxValue(data, targetData.data())) {
                return false;
            }
        }

        $.each(data, function () {
            var item = sourceData.getByUid($(this).data().uid);
            if (item) {
                targetData.add(item);
                sourceData.remove(item);
            }
        });
    },

    checkMaxValue: function (sourceData, targetData) {
        'use strict';

        var me = this;
        if (me.config.maxValue) {
            // check length
            if ((sourceData.length + targetData.length) > me.config.maxValue) {
                $.when(App.dialog.alert({
                        message: App.translate('You can not select more than ' + me.config.maxValue + ' items')
                    })
                );
                return false;
            }
        }
        return true;
    },

    setSelected    : function (data) {
        'use strict';

        if (data) {
            for (var i = 0; i < data.length; i++) {
                // get item by id
                //noinspection JSUnresolvedVariable
                var item = this.leftListView.data().kendoListView.dataSource.get(data[i]);
                if (item) {
                    //noinspection JSUnresolvedVariable
                    this.rightListView.data().kendoListView.dataSource.add(item);
                    //noinspection JSUnresolvedVariable
                    this.leftListView.data().kendoListView.dataSource.remove(item);
                }
            }
        }
    },
    filterList     : function (list, filter) {
        var value = $(filter).val();

        //If the value is not empty
        if (value && value !== '') {
            list.data().kendoListView.dataSource.filter({field: 'displayValue', operator: 'contains', value: value});
        } else {
            list.data().kendoListView.dataSource.filter({});
        }
    },
    getSelected    : function () {
        //noinspection JSUnresolvedVariable
        return this.rightListView.data().kendoListView.dataSource.view();
    },
    getAvailable   : function () {
        //noinspection JSUnresolvedVariable
        return this.leftListView.data().kendoListView.dataSource.data();
    },
    getSelectedIds : function () {
        return this.getIds(this.rightListView);
    },
    getAvailableIds: function () {
        return this.getIds(this.leftListView);
    },
    value          : function () {
        return this.getSelectedIds();
    },
    getIds         : function (listView) {
        'use strict';

        //noinspection JSUnresolvedVariable
        var me   = this,
            data = listView.data().kendoListView.dataSource.view(),
            ids  = [];
        $.each(data, function (idx, item) {
            ids.push(item[me.config.idField]);
        });
        return ids;
    }
});
