/**
 * Displays a simple grid.
 */
App.widget.SimpleGrid = kendo.Class.extend({
    config : {},
    el     : null,
    elTbody: null,
    /**
     * contains the object that is returned by a load() or refresh() call
     * @type {jqXHR|null}
     */
    jqXHR  : null,

    init: function (config) {
        'use strict';

        var me    = this;
        me.config = $.extend({
            renderTo        : null,
            /**
             * if true, then the <table> element generation is skipped. only <thead> and <tbody> are generated.
             */
            rowsOnly        : true,
            objectType      : null,
            objectId        : null,
            domainDataView  : null,
            objectValues    : [],
            columns         : [],
            dataGridPageSize: App.config.user.dataGridPageSize ? App.config.user.dataGridPageSize : 100,
            url             : App.config.serviceUrl + 'caesarObject/objectDataProvider3'
        }, config);

        if (me.config.rowsOnly) {
            me.el = me.config.renderTo;
        } else {
            me.el = $('<table>', {
                'class': 'table'
            }).appendTo(me.config.renderTo);
        }

        var header = $('<tr>').appendTo($('<thead>').appendTo(me.el));

        for (var i = 0; i < me.config.columns.length; i++) {
            var column = me.config.columns[i];
            $('<th>').text(column.title).appendTo(header);
        }

        me.elTbody = $('<tbody>').appendTo(me.el);

        me.elTbody.on('click', 'tr', me.onRowClick);

        me.renderTableData();
    },

    renderTableData: function () {
        var me     = this,
            params = {
                domainObjectType  : me.config.objectType,
                domainObjectId    : me.config.objectId,
                domainDataView    : me.config.domainDataView,
                domainObjectValues: me.config.objectValues,
                filters           : '[]',
                page              : 1,
                pageSize          : me.config.dataGridPageSize,
                skip              : 0,
                take              : me.config.dataGridPageSize
            };

        me.isRefreshing = true;
        me.jqXHR        = $.ajax({
            url    : me.config.url,
            data   : params,
            success: function (response) {
                'use strict';

                //noinspection JSUnresolvedVariable
                var data        = response.domainObjectData;

                // Iterate over the rows.
                $.each(data, function (rowIdx, row) {
                    var tr = $('<tr>').appendTo(me.elTbody);

                    // Iterate over the columns.
                    $.each(me.config.columns, function (colIdx, column) {

                        $.each(row, function (recIdx, rec) {

                            if (rec.domainObjectValueId === 'jobCode') {
                                tr.attr('data-id', rec.displayValue);
                            }

                            // Only show columns that are in the column configuration.
                            if (column.domainObjectValueId === rec.domainObjectValueId) {
                                var td = $('<td>', {}).appendTo(tr),
                                    icon;

                                if (column.domainObjectValueId === 'jobStatus') {
                                    td.attr('align', 'center');
                                    switch (rec.displayValue) {
                                        case 'Open':
                                            // Don't do anything here.
                                            break;
                                        case 'Completed':
                                            icon = $('<span>', {
                                                'class': 'glyphicon glyphicon-ok text-success'
                                            }).appendTo(td);
                                            break;
                                        case 'Cancelled':
                                            icon = $('<span>', {
                                                'class': 'glyphicon glyphicon-remove text-danger'
                                            }).appendTo(td);
                                            break;
                                    }
                                } else {
                                    td.text(rec.displayValue);
                                }
                            }
                        });
                    });


                });
                me.lastRefresh  = Date.now();
                me.isRefreshing = false;
            }
        });
    },

    /**
     * Just toggle highlighting.
     * @param e
     */
    onRowClick: function (e) {
        'use strict';

        $(e.currentTarget).toggleClass('success');
    },

    getSelectedIds: function () {
        'use strict';

        var rows = this.elTbody.find('tr.success'),
            ids  = [];
        $.each(rows, function (idx, row) {
            ids.push($(row).attr('data-id'));
        });
        return ids;
    },

    destroy: function () {

        // Stop Ajax call - only if not uninitialized (0) or finished (4).
        if (this.jqXHR && this.jqXHR.readyState !== 4 && this.jqXHR.readyState !== 0) {
            this.jqXHR.abort();
            this.jqXHR = null;
        }

        // ...and remove element from DOM.
        if (this.el) {
            this.el.remove();
        }
    }
});
