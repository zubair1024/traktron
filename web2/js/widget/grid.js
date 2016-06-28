/**
 * Displays grid widget.
 */
App.widget.Grid = App.widget.Base.extend({
    grid                      : null,
    dataSource                : null,
    widgetData                : null,
    /**
     * List of domainObjectValues that are dates
     * @type {Array}
     */
    dateFields                : [],
    /**
     * Contains mappings to user friendly names
     */
    stateFields               : {},
    /**
     * All columns of the grid
     * @type {Array}
     */
    columns                   : [],
    /**
     * Columns, that might be invisible, but are always send to the server.
     * @type {Array}
     */
    persistentColumns         : [],
    availablePersistentColumns: ['alarmId', 'eventId', 'hasMapPosition', 'isAcknowledged', 'jobCode'],
    /**
     * indicates the special column that contains meta information for e.g. ReferenceType cells.
     */
    metaSuffix                : '__meta',
    dsSchema                  : {},
    toolbar                   : [],
    toolbarCfg                : [],
    /**
     * @type {Array|null}
     */
    stateFilter               : null,
    customDateFilter          : {},
    selectable                : true,
    /**
     * holds the parent widget if it is a sub grid widget
     */
    parentWidget              : null,
    /**
     * stores the current expanded sub grid object
     */
    currentSubGrid            : null,
    lastDetailRow             : null,
    lastSortValue             : null,
    init                      : function (config) {
        'use strict';

        var me = this;

        me.config = $.extend({
            sortAttribute : null,
            sortDir       : null,
            domainDataView: null,
            url           : App.config.serviceUrl + 'caesarObject/objectDataProvider3'
        }, config);

        me.customDateFilter =
        {
            extra    : false,
            type     : 'date',
            operators: {
                date: {
                    betweenAnd: App.translate('Is between'),
                    lte       : App.translate('Is before or equal to'),
                    gte       : App.translate('Is after or equal to')
                }
            },
            ui       : function (element) {
                var parent          = element.parent();
                var buttonContainer = parent.find('div:last');

                // change existing input field into datepicker
                //noinspection JSUnresolvedFunction
                element.kendoDatePicker({});

                // template for new/2nd datepicker to prepend
                var template =
                        '<span class="k-widget k-datepicker k-header">' +
                        '<span class="k-picker-wrap k-state-default">' +
                        '<input data-bind="value:filters[1].value" type="text" data-role="datepicker"' +
                        ' style="width: 100%" role="textbox" aria-haspopup="true" aria-expanded="false" aria-disabled="false" ' +
                        ' aria-readonly="false" aria-label="' + App.translate('Choose a date') + '">' +
                        '<span class="k-select" role="button">' +
                        '<span class="k-icon k-i-calendar">' + App.translate('select') + '</span>' +
                        '</span>' +
                        '</span>' +
                        '</span>'
                    ;

                // prepend new/2nd  datepicker field
                buttonContainer.prepend(template);
            }
        };

        // Build columns
        me.setWidgetData();

        if (me.config.parentWidget) {
            me.parentWidget = me.config.parentWidget;
        }

        me.createGridConfig();

        // No divider needed for now, since the actions are right-aligned.
        //        if (me.toolbar.length) {
        //            me.toolbar.push({template: '<span class="toolbar-divider"/>'});
        //        }

        //Add Default Action buttons
        me.addDefaultButtons();

        // Add Specfic Action buttons
        var hasFeatures = me.hasFeatures(me.config);
        if (hasFeatures) {

            me.addFeatures();

            // Define template column with checkbox and attach click event handler.
            // But not for the master grid.
            if (!me.widgetData.detail) {
                me.columns.unshift({
                    title   : '<input type=\'checkbox\' class=\'checkbox checkAllRows\'>',
                    template: '<input type="checkbox" class="checkbox checkRow">',
                    width   : '25px'
                });
            }
        } else if (me.config.parentWidget) {
            me.columns.unshift({
                title   : '<input type=\'checkbox\' class=\'checkbox checkAllRows\'>',
                template: '<input type="checkbox" class="checkbox checkRow">',
                width   : '25px'
            });
        }

        me.selectable = false;

        // I there are no items, then set toolbar explicitly to null. Else, it renders an empty toolbar.
        if (!me.toolbar.length) {
            me.toolbar = null;
        } else {
            //me.toolbar.push('pdf');
        }

        me.dataSource = me.getDataSource();

        //noinspection JSUnresolvedFunction
        me.grid = me.config.el.kendoGrid({
            dataSource             : me.dataSource,
            toolbar                : me.toolbar,
            columnResizeHandleWidth: 6,
            selectable             : me.selectable,
            filterable             : {
                messages: {
                    info  : App.translate('Show items with value that:'),
                    filter: App.translate('Filter'),
                    clear : App.translate('Clear')
                }
            },
            sortable               : true,
            columns                : me.columns,
            resizable              : true,
            columnMenu             : {
                messages: {
                    columns       : App.translate('Columns'),
                    filter        : App.translate('Filter'),
                    sortAscending : App.translate('Sort Ascending'),
                    sortDescending: App.translate('Sort Descending')
                }
            },
            detailInit             : me.widgetData.detail ? $.proxy(me.detailInit, me) : null,
            columnHide             : function (e) {
                e.column.selected = false;
            },
            columnShow             : function (e) {
                e.column.selected = true;
                me.refresh();
            },
            detailCollapse         : function (e) {
                e.masterRow.removeClass('k-state-selected');
                me.currentSubGrid = null;
            },
            detailExpand           : function (e) {
                // select master row to prevent grid refresh
                var grid = e.detailRow.find('.k-grid').data('kendoGrid');
                var data = grid.dataSource.data();

                if (!data.length) {
                    grid.dataSource.read();
                }
                me.currentSubGrid = grid;

                // Collapse last detail row and unselect all rows, we need only one sub grid at a time.
                if (me.lastDetailRow && me.lastDetailRow.index() !== e.masterRow.index()) {

                    // unselect rows
                    var subView = me.currentSubGrid.wrapper.data('subgrid');
                    subView.grid.tbody.children('tr').removeClass('k-state-selected');

                    // uncheck checkboxes
                    me.currentSubGrid.wrapper.find('.checkRow').prop('checked', false);
                    me.updateActionButtons();

                    // collapse
                    e.sender.collapseRow(me.lastDetailRow);
                    // reset again as is set to null in collapseRow...
                    me.currentSubGrid = grid;
                }

                me.lastDetailRow = e.masterRow;
            },
            // TODO expand detail row if it was expanded before. Respect paging.
            //            dataBound              : function (e) {
            //                // expand row if it was expanded beforehand
            //                if (me.currentSubGrid) {
            //                    if (me.lastDetailRow) {
            //                        e.sender.expandRow(me.lastDetailRow);
            //                    }
            //                }
            //            },
            reorderable            : true,
            pageable               : {
                input   : true,
                numeric : false,
                messages: {
                    empty       : App.translate('No items to display'),
                    page        : App.translate('Page'),
                    of          : App.translate('of') + ' {0}',
                    display     : '{0} - {1} ' + App.translate('of') + ' {2} ' + App.translate('items'),
                    itemsPerPage: App.translate('items per page'),
                    first       : App.translate('Go to the first page'),
                    previous    : App.translate('Go to the previous page'),
                    next        : App.translate('Go to the next page'),
                    last        : App.translate('Go to the last page')
                }
            },
            excel                  : {
                allPages: false,
                proxyURL: App.config.serviceUrl + 'caesarVfsResource/proxySave',
                fileName: me.config.name + '.xlsx'
            },
            pdf                    : {
                allPages : false,
                creator  : 'ROAMWORKS UI',
                paperSize: 'A4'
            },
            columnMenuInit         : function (e) {
                var filterMenu               = e.container.find('.k-filterable'),
                    filterMenuOperatorSelect = filterMenu.find('select:first'),
                    datePicker               = filterMenu.find('.k-datepicker:last'),
                    filterMenuObject         = filterMenu.data('kendoFilterMenu');
                // noinspection JSUnresolvedVariable
                var filters = filterMenuObject ? filterMenuObject.filterModel.filters : null;

                if (datePicker.length) {

                    filterMenuOperatorSelect.bind('change', function () {

                        var filterMenu = $(this).closest('.k-filterable'),
                            datePicker = filterMenu.find('.k-datepicker:last'),
                            value      = $(this).val();

                        if (value === 'betweenAnd') {
                            datePicker.show();
                        } else {
                            datePicker.hide();
                            // Clear 2nd datePicker's input field
                            datePicker.find('input').data('kendoDatePicker').value(null);
                            // clear filterMenu's 2nd filter value
                            if (filters) {
                                filters[1].value = '';
                            }
                        }
                    });
                } else {
                    var dropDown = filterMenu.find('.k-filter-and');
                    $('<p>', {
                        text : App.translate('And'),
                        style: 'padding-top: 5px;'
                    }).insertBefore(dropDown);
                    dropDown.hide();
                }
            },
            dataBound              : function () {
                var sortOrder = me.grid.dataSource.sort();

                //Check if the sort value changed (nasty if..else if statement, is there a better way?)
                if (!me.lastSortValue && sortOrder) {
                    me.grid.wrapper.find('.k-grid-saveGrid').prop('disabled', false);
                }
                else if (sortOrder && me.lastSortValue && ((sortOrder.length != me.lastSortValue.length) ||
                                                           ((sortOrder[0] && me.lastSortValue[0]) &&
                                                            ((sortOrder[0].dir != me.lastSortValue[0].dir) ||
                                                             (sortOrder[0].field != me.lastSortValue[0].field))))) {
                    me.grid.wrapper.find('.k-grid-saveGrid').prop('disabled', false);
                    me.autoFitColumns(false);
                }

                //Save the current sort value
                me.lastSortValue = sortOrder;

                // Auto fit columns only when displaying ordinary grids, not the miniMode ones in the sidebar.
                if (!me.autoSized) {
                    me.autoFitColumns();
                    me.autoSized = true;
                }
            }
        }).data('kendoGrid');

        // Bind click event to the checkbox.
        if ((hasFeatures && !me.widgetData.detail) || me.config.parentWidget) {
            me.grid.table.on('click', '.checkRow', {widget: me}, me.selectRowByCheckbox);
            //me.grid.tbody.on('click', '>tr>td .checkRow', {widget: me}, me.selectRowByCheckbox);
            me.config.el.on('click', '.checkAllRows', {widget: me}, me.selectAllRows);
        }

        me.buildToolbar();

        //Save the current sort value
        me.lastSortValue = me.grid.dataSource.sort();

        /**
         * Listen to grid changes
         */
        me.grid
            .bind('columnShow', function () {
                me.grid.wrapper.find('.k-grid-saveGrid').prop('disabled', false);
                me.grid.one('dataBound', function () {
                    me.autoFitColumns(false);
                });
            })
            .bind('columnHide', function () {
                me.grid.wrapper.find('.k-grid-saveGrid').prop('disabled', false);
                me.grid.one('dataBound', function () {
                    me.autoFitColumns(false);
                });
            })
            .bind('change', function () {
                me.grid.wrapper.find('.k-grid-saveGrid').prop('disabled', false);
                me.grid.one('dataBound', function () {
                    me.autoFitColumns(false);
                });
            })
            .bind('columnReorder', function () {
                me.grid.wrapper.find('.k-grid-saveGrid').prop('disabled', false);
            })
            .pager.bind('change', function () {
            me.grid.one('dataBound', function () {
                me.autoFitColumns(false);
            });
        });
    },

    /**
     * Auto size the grid columns
     * @param autoSized
     */
    autoFitColumns: function (autoSized) {
        if (App.config.scrollableGrid && !autoSized) {
            if (this.config.location !== App.config.locationSideBar) {
                for (var i = 0; i < this.grid.columns.length; i++) {
                    this.grid.autoFitColumn(i);
                }
            }
        }

    },

    /**
     * Listen to changes to update the toolbar action buttons
     */
    updateActionButtons: function () {

        var me = this, masterGrid;

        // find the master grid if we are a sub grid
        if (me.parentWidget) {
            masterGrid = me.parentWidget;
        } else {
            masterGrid = me;
        }

        var selectedIds = me.getSelectedIds(),
            idCount     = selectedIds.length;

        $.each(masterGrid.toolbarCfg, function (idx, item) {
            if (item.type === 'button') {
                if (item.name == 'saveGrid') {
                   return;
                }
                if (item.name === 'showOnMap') {
                    idCount = me.getSelectedIds('map').length;
                }

                if (item.name === 'acknowledge') {
                    idCount = me.getSelectedIds('acknowledge').length;
                }
                if (idCount > 0) {
                    masterGrid.config.el.find('.k-grid-' + item.name).prop('disabled', false);
                } else {
                    masterGrid.config.el.find('.k-grid-' + item.name).prop('disabled', true);
                }
                idCount = selectedIds.length;
            }
        });
    },
    /**
     * only respect entries in this.toolbarCfg
     */
    buildToolbar       : function () {
        'use strict';

        var me = this;
        $.each(me.toolbarCfg, function (idx, item) {
            switch (item.type) {
                case 'discreteValueFilter':

                    //translate the names
                    $.each(item.values, function (i, v) {
                        v.name = App.translate(v.name);
                    });

                    // Convert input field into proper DropDown list afterwards.
                    //noinspection JSUnresolvedFunction
                    me.config.el.find('#' + item.elId).kendoDropDownList({
                        dataTextField : 'name',
                        dataValueField: 'id',
                        autoBind      : false,
                        optionLabel   : App.translate('All'),
                        template      : item.template,
                        dataSource    : {
                            data: item.values
                        },
                        change        : function () {
                            var value = this.value();
                            if (value) {
                                me.dataSource.filter({
                                    field   : item.field,
                                    operator: 'eq',
                                    value   : value
                                });
                            } else {
                                me.dataSource.filter({});
                            }
                        }
                    }).data('kendoDropDownList');
                    break;
                case 'button':
                    // Add click handler to button.
                    me.config.el.find('.k-grid-' + App.translate(item.name)).click(item.click);
                    break;
            }
        });
    },
    createGridConfig   : function () {
        'use strict';

        var me = this;

        me.columns           = [];
        me.persistentColumns = [];
        me.dateFields        = [];
        me.dsSchema          = {};
        me.stateFilter       = [];
        var toolbarElements  = [];

        me.widgetData.data.sort(App.util.sortWidget);

        $.each(me.widgetData.data, function (idx, item) {
            var id              = item.domainObjectValueId,
                metaSuffix      = me.metaSuffix,
                /**
                 * The available options for the type are "string", "number", "boolean", "date".
                 * @see http://docs.telerik.com/kendo-ui/api/javascript/data/datasource#configuration-schema.model
                 * @type {string}
                 */
                modelType       = 'string',
                filterable      = item.filterable === true,
                filterFormat,
                width           = 250,
                toolbarTemplate = '${data.name}';

            if (!item.hidden) {

                // Adjust width of grid depending on domainObjectValueTypes.
                switch (item.domainObjectValueType) {
                    case 'dateTime':
                        if (filterable) {
                            filterable   = me.customDateFilter;
                            filterFormat = '{0:' + App.config.dateTimeFormat + '}';
                        }
                        me.dateFields.push(id);
                        width     = 130;
                        modelType = 'date';
                        break;
                    case 'date':
                        if (filterable) {
                            filterable   = me.customDateFilter;
                            filterFormat = '{0:' + App.config.dateFormat + '}';
                        }
                        me.dateFields.push(id);
                        width     = 100;
                        modelType = 'date';
                        break;
                    case 'stateType':
                        toolbarTemplate = '<img src="#=App.util.format.icon(data.id)#" style="width: 16px; height: 16px;" /> ${data.name}';
                        // Since we have already a DropDown in the Toolbar, there is no additional filter feature on the column head needed.
                        filterable = false;
                        width      = 50;
                        modelType  = 'string';
                        break;
                    case 'decimal':
                    case 'numeric':
                    case 'percentage':
                        width     = 50;
                        modelType = 'number';
                        break;
                    case 'duration':
                        modelType = 'number';
                        break;
                    case 'boolean':
                        width     = 50;
                        modelType = 'boolean';
                        break;
                    default:
                    case 'domainObjectReferenceType':
                    case 'email':
                    case 'phoneNumber':
                    case 'vfsAttachment':
                    case 'vfsImage':
                        modelType = 'string';
                        break;
                }
                width = null;

                // Column
                me.columns.push({
                    field      : id,
                    title      : App.translate(item.domainObjectValueName),
                    template   : function (rec) {
                        return App.translate(App.util.format.item(rec[id + metaSuffix]));
                    },
                    sortable   : item.sortable === true,
                    filterable : filterable,
                    format     : filterFormat,
                    mini_widget: item.mini_widget,
                    // This means: if the the widget is placed on the sideBar, we show only columns that have "mini_widget" enabled.
                    hidden     : !!(me.config.location === App.config.locationSideBar && !item.mini_widget) || !item.selected,
                    selected   : item.selected,
                    width      : width
                });

                // Scheme
                me.dsSchema[id] = {
                    type: modelType
                };

                // Toolbar
                if (item.discreetValues && item.discreetValues.length) {

                    // Cache discreet values for this.getCellData().
                    me.stateFields[id] = {};
                    for (var j = 0; j < item.discreetValues.length; j++) {
                        var obj = item.discreetValues[j];
                        if (obj) {
                            me.stateFields[id][obj.id] = obj.name;
                        }
                    }

                    var toolbarElId = App.ui.static.getNewId();
                    toolbarElements.push({
                        template: kendo.format('<label for="filter_{0}">{1}</label><input type="search" id="filter_{0}"/>', toolbarElId, App.translate(item.domainObjectValueName))
                    });
                    me.toolbarCfg.push({
                        elId    : kendo.format('filter_{0}', toolbarElId),
                        field   : id,
                        values  : item.discreetValues,
                        template: toolbarTemplate,
                        type    : 'discreteValueFilter'
                    });
                }
            }
            if (me.availablePersistentColumns.indexOf(id) > -1) {
                me.persistentColumns.push(id);
            }
        });

        if (toolbarElements.length) {
            me.toolbar = me.toolbar.concat(toolbarElements);
        }

        me = null;
    },
    getDataSource      : function () {
        'use strict';

        var me = this;
        return new kendo.data.DataSource({
            transport      : {
                read: function (options) {

                    if (DEBUG) {
                        console.time('grid widget datasource timing');
                    }

                    var filters               = [],
                        filterValueBetweenAnd = [];

                    // Handle filters.
                    if (options.data.filter) {
                        $.each(options.data.filter.filters, function (idx, filter) {

                            var val = null;

                            // Sometimes the date filter is bundled in one filter item. Handle this.
                            if (filter.filters) {

                                /**
                                 * The date pickers return a string suitable for the Date() function.
                                 * We use this in order to generate a proper ISO representation.
                                 */
                                for (var i = 0; i < 2; i++) {
                                    if (filter.filters[i].field && me.dateFields.indexOf(filter.filters[i].field) > -1) {
                                        val = new Date(filter.filters[i].value);

                                        // Timezone - subtract offset.
                                        if (val) {
                                            App.util.dateToGMT(val);
                                        }

                                        filter.filters[i].value = kendo.toString(val, App.config.dateTimeFormat);
                                    }
                                }

                                /**
                                 * We use the second value only if the filter operator is "betweenAnd".
                                 * Then we hand over an array with the two dates.
                                 */
                                if (filter.filters[0].operator === 'betweenAnd') {
                                    val = [filter.filters[0].value, filter.filters[1].value];
                                } else {
                                    val = filter.filters[0].value;
                                }

                                filters.push({
                                    key  : filter.filters[0].field,
                                    value: val,
                                    type : filter.filters[0].operator
                                });

                            } else {
                                if (me.dateFields.indexOf(filter.field) > -1) {
                                    /**
                                     * The date picker returns a string suitable for the Date() function.
                                     * We use this in order to generate a proper ISO representation.
                                     */
                                    val = new Date(filter.value);

                                    // Timezone - subtract offset.
                                    if (val) {
                                        App.util.dateToGMT(val);
                                    }

                                    filter.value = kendo.toString(val, App.config.dateTimeFormat);
                                }

                                // Special handling for "betweenAnd" operator.
                                if (filter.operator === 'betweenAnd' || filterValueBetweenAnd.length === 1) {

                                    filterValueBetweenAnd.push(filter.value);

                                    if (filterValueBetweenAnd.length === 2) {
                                        filters.push({
                                            key  : filter.field,
                                            value: filterValueBetweenAnd,
                                            type : 'betweenAnd'
                                        });

                                        filterValueBetweenAnd = [];
                                    }
                                } else {
                                    filters.push({
                                        key  : filter.field,
                                        value: filter.value,
                                        type : filter.operator
                                    });
                                }
                            }

                        });
                        delete options.data.filter;
                    }

                    if (me.config.filters) {
                        if ($.isArray(me.config.filters)) {
                            filters = $.merge(filters, me.config.filters);
                        } else {
                            filters.push(me.config.filters);
                        }
                    }

                    /**
                     * List of domainObjectValues that are visible right now.
                     * @type {Array}
                     */
                    var domainObjectValues = [],
                        columnCollection   = me.grid ? me.grid.columns : me.columns;

                    for (var i = 0; i < columnCollection.length; i++) {
                        var col = columnCollection[i];
                        if (!col.hidden) {
                            var columnField = col.field;

                            if ($.type(columnField) === 'string') {
                                domainObjectValues.push(columnField);
                            }
                        }
                    }

                    // Add persistent columns.
                    domainObjectValues = $.unique(domainObjectValues.concat(me.persistentColumns));

                    var params = $.extend({
                        domainObjectId    : me.config.domainObjectId,
                        domainObjectValues: JSON.stringify(domainObjectValues),
                        domainObjectType  : me.config.objectType,
                        domainDataView    : me.config.domainDataView ? me.config.domainDataView : me.widgetData.viewType,
                        filters           : JSON.stringify(filters)
                    }, options.data);

                    var sortValue = me.config.sortAttribute ? me.config.sortAttribute : ((me.widgetData && me.widgetData.sortAttribute) ? me.widgetData.sortAttribute : null);

                    /**
                     * Set default sort direction.
                     */
                    var sortDir = me.config.sortDir ? me.config.sortDir : (me.widgetData ? me.widgetData.sortDir : 1);

                    if (options.data.sort && options.data.sort.length) {
                        sortValue = options.data.sort[0].field;
                        //noinspection JSValidateTypes
                        sortDir = options.data.sort[0].dir === 'asc' ? 0 : 1;
                    }

                    if (sortValue) {
                        params.sortValue = sortValue;
                        params.sortOrder = sortDir;
                    }

                    me.isRefreshing = true;
                    me.jqXHR        = $.ajax({
                        url    : me.config.url,
                        data   : params,
                        success: function (response) {
                            // At this point we know if it is a hierarchical grid or not.

                            /**
                             * Recreate array structure for grid.
                             * Every row is an array.
                             * Every cell is the native type plus an object, eg. "record.name" with the value in it plus "record.name__meta", that contains some meta info for the formatter.
                             * @type {Array}
                             */
                            var data = [];

                            // Iterate over the rows.
                            for (var i = 0; i < response.ui.items.length; i++) {
                                var record   = {},
                                    sections = response.ui.items[i].items;

                                // Iterate over the sections of the current row.
                                for (var j = 0; j < sections.length; j++) {
                                    var section = sections[j];

                                    // Iterate over the columns of the current section.
                                    for (var k = 0; k < section.items.length; k++) {
                                        var item                        = section.items[k];
                                        record[item.id]                 = me.getCellData(item, me.stateFields);
                                        record[item.id + me.metaSuffix] = item;
                                    }
                                }
                                data.push(record);
                            }

                            if (DEBUG) {
                                console.timeEnd('grid widget datasource timing');
                            }

                            options.success({
                                data        : data,
                                originalSize: response.originalSize
                            });

                            me.lastRefresh  = Date.now();
                            me.isRefreshing = false;
                        }
                    });
                }
            },
            serverPaging   : true,
            serverFiltering: true,
            serverSorting  : true,
            schema         : {
                model: {
                    fields: me.dsSchema
                },
                data : 'data',
                total: 'originalSize'
            },
            pageSize       : App.config.user.dataGridPageSize
        });
    },
    /**
     * Returns true if the current dataView contains alarm and maintenance features.
     * @param {{}} config
     * @returns {boolean}
     */
    hasFeatures        : function (config) {
        'use strict';

        var result         = false,
            domainDataView = config.domainDataView ? config.domainDataView : this.widgetData.viewType;

        /**
         * TODO remove after we get correct stuff from services
         */
        if (domainDataView === 'maintenanceEvents' ||
            domainDataView === 'eventHistory') {

            return true;
        }

        if (App.config.domainDataViews.length) {
            for (var i = 0; i < App.config.domainDataViews.length; i++) {
                var item = App.config.domainDataViews[i];
                if (item.id === domainDataView && item.features && item.features.length) {
                    // Stop if domainDataView matches and we have some features.
                    result = true;
                    break;
                }
            }
        }

        return result;
    },
    /**
     * add Buttons to toolbar for the alarms
     */
    addFeatures        : function () {
        'use strict';

        var me             = this,
            domainDataView = me.config.domainDataView ? me.config.domainDataView : me.widgetData.viewType,
            buttonDefaults = {
                className: 'pull-right',
                type     : 'button'
            };

        var buttons         = [],
            toolbarElements = [];

        switch (domainDataView) {
            case 'activeAlarms':
            case 'allActiveAlarms':
                var alarmAction = App.view.Alarm ? App.view.Alarm.doAction : $.noop;

                buttons = [
                    $.extend({
                        name : 'showOnMap',
                        click: function () {
                            alarmAction(me.grid, me.getSelectedIds('map'), 'showOnMap');
                        }
                    }, buttonDefaults),
                    $.extend({
                        name : 'createRoute',
                        click: function () {
                            alarmAction(me.grid, me.getSelectedIds('map'), 'createRoute');
                        }
                    }, buttonDefaults),
                    $.extend({
                        name : 'acknowledge',
                        click: function () {
                            var ids = me.getSelectedIds();
                            if (ids.length) {
                                if (App.config.alertJustificationRequired) {
                                    $.when(App.dialog.input({
                                        title   : App.translate('Acknowledge Alarm'),
                                        message : App.translate('Acknowledge reason'),
                                        labelOK : App.translate('Acknowledge Alarm'),
                                        required: true
                                    })).done(function (response) {
                                        if (response.button === 'OK') {
                                            alarmAction(me.grid, ids, 'acknowledge', response.input);
                                        }
                                    });
                                } else {
                                    alarmAction(me.grid, ids, 'acknowledge', '');
                                }
                            }
                        }
                    }, buttonDefaults),
                    $.extend({
                        name : 'reset',
                        click: function () {
                            var ids = me.getSelectedIds();
                            if (ids.length) {
                                if (App.config.alertJustificationRequired) {
                                    $.when(App.dialog.input({
                                        title   : App.translate('Reset Alarm'),
                                        message : App.translate('Reset reason'),
                                        labelOK : App.translate('Reset'),
                                        required: true
                                    })).done(function (response) {
                                        if (response.button === 'OK') {
                                            alarmAction(me.grid, ids, 'reset', response.input);
                                        }
                                    });
                                } else {
                                    alarmAction(me.grid, ids, 'reset', '');
                                }
                            }
                        }
                    }, buttonDefaults)
                ];

                toolbarElements.push({
                        template: kendo.format('<button class="k-button pull-right k-grid-{0}" disabled>{1}</button>', 'acknowledge', App.translate('Acknowledge Alarms'))
                    }, {
                        template: kendo.format('<button class="k-button pull-right k-grid-{0}" disabled>{1}</button>', 'reset', App.translate('Reset Alarms'))
                    },

                    // {
                    //    template: kendo.format('<button class="k-button pull-right k-grid-{0}" disabled>{1}</button>', 'createRoute', App.translate('Create Route'))
                    // },
                    {
                        template: kendo.format('<button class="k-button pull-right k-grid-{0}" disabled>{1}</button>', 'showOnMap', App.translate('Show on map'))
                    });
                break;

            case 'maintenanceEvents':
                buttons = [
                    $.extend({
                        name : 'completejob',
                        text : App.translate('Complete {0}', App.translate('Job')),
                        click: function () {
                            // get all selected ids from sub grid and complete
                            if (me.currentSubGrid) {
                                var subView = me.currentSubGrid.wrapper.data('subgrid');
                                var ids     = subView.getSelectedIds();
                                if (ids.length) {
                                    // do action
                                    $.ajax({
                                        url    : App.config.serviceUrl + 'caesarMaintenance/completeJob',
                                        data   : {
                                            domainObjectId: subView.config.domainObjectId,
                                            jobId         : JSON.stringify(ids)
                                        },
                                        success: function (response) {
                                            if (response.reload) {
                                                // Reload complete grid.
                                                me.dataSource.read();
                                            } else {
                                                // Only reload sub grid.
                                                subView.grid.dataSource.read();
                                            }
                                        },
                                        error  : function () {
                                            // TODO remove : runs into error because of wrong json format should be fixed from backendteam
                                            subView.grid.dataSource.read();
                                        }
                                    });
                                    me.updateActionButtons();
                                }
                            }
                        }
                    }, buttonDefaults),
                    $.extend({
                        name : 'canceljob',
                        text : App.translate('Cancel {0}', App.translate('Job')),
                        click: function () {
                            // get all selected ids from sub grid and cancel
                            if (me.currentSubGrid) {
                                var subView = me.currentSubGrid.wrapper.data('subgrid');
                                var ids     = subView.getSelectedIds();
                                if (ids.length) {
                                    $.ajax({
                                        url    : App.config.serviceUrl + 'caesarMaintenance/cancelJob',
                                        data   : {
                                            domainObjectId: subView.config.domainObjectId,
                                            jobId         : JSON.stringify(ids)
                                        },
                                        success: function () {
                                            subView.grid.dataSource.read();
                                        },
                                        error  : function () {
                                            // TODO remove : runs into error because of wrong json format should be fixed from backendteam
                                            subView.grid.dataSource.read();
                                        }
                                    });
                                    me.updateActionButtons();
                                }
                            }
                        }
                    }, buttonDefaults)
                ];

                toolbarElements.push({
                    template: kendo.format('<button class="k-button pull-right k-grid-{0}" disabled>{1}</button>', 'completejob', App.translate('Complete {0}', App.translate('Job')))
                }, {
                    template: kendo.format('<button class="k-button pull-right k-grid-{0}" disabled>{1}</button>', 'canceljob', App.translate('Cancel {0}', App.translate('Job')))
                });
                break;

            case 'eventHistory':
                buttons.push($.extend({}, buttonDefaults, {
                    name : 'showOnMap',
                    click: function () {
                        var eventIds = me.getSelectedIds('map');

                        if (me.mapWidget) {
                            me.mapWidget.destroy();
                            me.mapWidget = null;
                        }

                        me.mapWidget = new App.ui.WidgetPanel({
                            widgetType : 'map',
                            id         : 'eventHistoryMap',
                            name       : App.translate('Event History Map'),
                            pictureName: App.util.widget.defaultIcon.eventHistoryMap,
                            isTemporary: true, // Adds a closer and set widget to "not configurable".

                            location      : App.config.locationEventHistoryMap,
                            positionNumber: '-1',

                            height     : App.config.widgetHeight,
                            displayMini: true, // If displayMini is true, the splitter is collapsed.
                            widgetData : {
                                // This tells the alarm map to use the default mapProject.
                                viewType: null
                            },

                            objectType    : me.config.objectType,
                            domainObjectId: me.config.domainObjectId,
                            ids           : eventIds
                        });

                        App.view.widgets.push(me.mapWidget);
                        me.mapWidget.show();
                    }
                }));

                toolbarElements.push({
                    template: kendo.format(
                        '<button class="k-button pull-right k-grid-{0}" disabled>{1}</button>',
                        'showOnMap',
                        App.translate('Show on map'))
                });

                break;
        }

        me.toolbarCfg = me.toolbarCfg.concat(buttons);
        me.toolbar    = me.toolbar.concat(toolbarElements);
        //        me.selectable = 'multiple, row';
    },

    addDefaultButtons: function () {
        var me              = this,
            buttons         = [],
            toolbarElements = [],
            buttonDefaults  = {
                className: 'pull-right',
                type     : 'button'
            };

        buttons.push($.extend({}, buttonDefaults, {
            name : 'saveGrid',
            click: function () {
                me.updateWidgetData();
            }
        }));

        toolbarElements.push({
            template: kendo.format(
                '<button class="k-button pull-right k-grid-{0}" disabled><span class="glyphicon glyphicon-floppy-disk" data-toggle="tooltip" data-original-title="Save Grid"></span></button>',
                'saveGrid',
                App.translate('Save'))
        });

        me.toolbarCfg = me.toolbarCfg.concat(buttons);
        me.toolbar    = me.toolbar.concat(toolbarElements);

    },

    selectAllRows: function (e) {
        'use strict';

        var widget = e.data.widget,
            grid   = widget.grid;

        // check/uncheck all rows
        grid.table.find('.checkRow').prop('checked', this.checked);

        // select/deselect all rows
        if (this.checked) {
            grid.tbody.children('tr').addClass('k-state-selected');
        } else {
            grid.tbody.children('tr').removeClass('k-state-selected');
        }

        widget.updateActionButtons();
    },

    selectRowByCheckbox: function (e) {
        'use strict';

        var widget  = e.data.widget,
            checked = this.checked,
            row     = $(this).closest('tr');

        if (checked) {
            //-select the row
            row.addClass('k-state-selected');
        } else {
            //-remove selection
            row.removeClass('k-state-selected');
        }

        widget.updateActionButtons();
    },

    detailInit    : function (e) {
        'use strict';

        var me  = this;
        var $el = $('<div>', {
            'class': 'k-content'
        }).appendTo(e.detailCell);

        // FIXME Workaround to select all columns in the detail grid
        $.each(me.widgetData.detail.data, function (idx, item) {
            item.selected = true;
        });

        //noinspection JSUnresolvedVariable,JSValidateTypes
        me.currentSubGrid = new App.widget.Grid({
            widgetData    : {
                data: me.widgetData.detail.data
            },
            parentWidget  : me,
            domainDataView: me.widgetData.detail.domainDataView,
            objectType    : me.widgetData.detail.domainObjectType,
            domainObjectId: e.data.jobcardId,
            sortAttribute : '',
            filters       : '',
            el            : $el
        });

        $el.data('subgrid', me.currentSubGrid);
    },
    /**
     * Collects all ids of the currently selected rows in this grid.
     * @param {string=} filter If set to "map", then only those ids are returned that have a geoposition.
     * @returns {Array} of all selected ids
     */
    getSelectedIds: function (filter) {
        'use strict';

        var me             = this,
            ids            = [],
            grid           = me.grid,
            dataItem,
            id,
            domainDataView = me.config.domainDataView ? me.config.domainDataView : me.widgetData.viewType;

        grid.tbody.children('tr.k-state-selected').each(function () {

            /** @see this.availablePersistentColumns */
            /** @namespace dataItem.alarmId */
            /** @namespace dataItem.eventId */
            /** @namespace dataItem.hasMapPosition */
            /** @namespace dataItem.isAcknowledged */
            /** @namespace dataItem.jobCode */
            dataItem = me.grid.dataItem($(this));
            id = null;

            switch (domainDataView) {
                case 'activeAlarms':
                case 'allActiveAlarms':
                    var alarmId = dataItem['alarmId' + me.metaSuffix].currentValues[0];
                    switch (filter) {
                        case 'map':
                            if (dataItem.hasMapPosition) {
                                id = alarmId;
                            }
                            break;
                        case 'acknowledge':
                            if (!dataItem.isAcknowledged) {
                                id = alarmId;
                            }
                            break;
                        default:
                            id = alarmId;
                    }
                    break;

                case 'maintenanceJobs':
                    id = dataItem['jobCode' + me.metaSuffix].currentValues[0];
                    break;

                case 'eventHistory':
                    switch (filter) {
                        case 'map':
                            if (dataItem.hasMapPosition) {
                                id = dataItem.eventId;
                            }
                            break;
                        default:
                            id = dataItem.eventId;
                    }
                    break;
            }

            if (id) {
                ids.push(id);
            }
        });

        return ids;
    },
    /**
     * Depending on the domainobjectValueType (a.k.a. type) we convert the value to the 4 known datatypes for grids:
     * - string
     * - number
     * - boolean
     * - date
     * @param item
     * @param stateFields
     * @returns {*}
     */
    getCellData   : function (item, stateFields) {
        var result = null;

        if (item.currentValues && item.currentValues[0] !== null) {
            result = item.currentValues[0];
        }

        switch (item.type) {
            case 'date':
                result = kendo.parseDate(result, App.config.dateFormat);

                // Timezone...
                if (result instanceof Date) {
                    App.util.dateFromGMT(result);
                }
                break;
            case 'dateTime':
                result = kendo.parseDate(result, App.config.dateTimeFormat);

                // Timezone...
                if (result instanceof Date) {
                    App.util.dateFromGMT(result);
                }
                break;
            case 'domainObjectReferenceType':
                result = item.displayValue;
                break;
            case 'stateType':
                // Look up state Value Name
                if (item && item.id) {
                    if (!$.isEmptyObject(stateFields) && stateFields[item.id]) {
                        result = App.translate(stateFields[item.id][result]);
                    }
                }
                break;
            case 'decimal':
            case 'percentage':
                if (result !== null) {
                    result = parseFloat(result);
                }
                break;
            case 'duration':
            case 'numeric':
                if (result !== null) {
                    result = parseInt(result);
                }
                break;
            default:
            case 'boolean':
            case 'email':
            case 'phoneNumber':
            case 'vfsAttachment':
            case 'vfsImage':
                if (item.currentValues.length > 1) {
                    result = item.currentValues.join(', ');
                }
                break;
        }
        return result;
    },

    /**
     * Toggle the changed columns
     */
    toggleColumns: function () {
        'use strict';

        var me = this;

        // hide all columns which are not selected as mini widget
        $.each(me.grid.columns, function (idx, column) {
            if (!column.mini_widget && me.config.location === App.config.locationSideBar) {
                // store selected state
                var selected = column.selected;
                me.grid.hideColumn(column.field);
                column.selected = selected;
            } else {
                if (!column.selected) {
                    return;
                }
                me.grid.showColumn(column.field);
            }
        });
    },

    /**
     * Save widget data
     * @param params
     */
    saveWidget: function (params) {
        'use strict';

        var me = this;

        $.ajax({
            url    : App.config.serviceUrl + 'caesarWidgetProvider/updateWidget2',
            data   : params,
            success: function () {
                //App.view.toast.showNotificationSimple('Info', me.config.name, 'The grid has been saved.');

                //Show dialog on success
                App.dialog.alert({
                    message: App.translate('Grid has been sucessfully saved'),
                    icon   : App.dialog.iconInfo,
                    title  : 'Grid Saved'
                });

                /**
                 * Refresh Widget Cache for the given objectType
                 */
                App.router.refreshWidgetsCache(App.current.objectType);

                me.grid.wrapper.find('.k-grid-saveGrid').prop('disabled', true);
            },
            error  : function () {
                App.dialog.alert({
                    message: App.translate('Error'),
                    icon   : App.dialog.idAlert,
                    title  : 'Error in saving widget.'
                });

            }
        });
    },

    /**
     * Form the widget data to be saved based on the changes made to the widget itself
     */
    updateWidgetData: function () {
        'use strict';

        var me         = this,
            columnData = me.grid.columns,
            widgetData = this.widgetData,
            count      = 0,
            sort       = me.grid.dataSource ? me.grid.dataSource.sort() : null;


        /**
         * Set the sort attribute and direction
         */
        if (sort) {
            for (i = 0; i < sort.length; i++) {
                if (sort[i].field) {
                    widgetData.sortAttribute = sort[i].field;
                    widgetData.sortDir       = (sort[i].dir == 'asc') ? 0 : 1;
                }
            }
        }

        /**
         * Loop through the columns and rearrage the widgetData
         */
        for (var i = 0; i < columnData.length; i++) {
            for (var j = 0; j < widgetData.data.length; j++) {
                if (widgetData.data[j].domainObjectValueId == columnData[i].field) {
                    //Set the selection state
                    if ($.type(columnData[i].selected) == 'boolean') {
                        widgetData.data[j].selected = columnData[i].selected;
                    }
                    //Set the position Value
                    this.widgetData.data[j].positionNumber = count;
                    count++;
                    //Change the sort value if necessary
                    if (widgetData.data[j].domainObjectValueId == widgetData.sortAttribute) {
                        widgetData.data[j].sortDir = widgetData.sortDir;
                    }
                    break;
                }
            }
        }

        var params,
            viewType,
            alarmWidgetData;

        switch (me.config.domainDataView) {
            case 'activeAlarms':
                params = {
                    domainObjectType: 'customer'
                };
                $.ajax({
                    url    : App.config.serviceUrl + 'caesarWidgetProvider/getWidgets2',
                    data   : params,
                    success: function (repsonse) {

                        /**
                         * Loop through the customer widgets to get the alarm widget data
                         */
                        $.each(repsonse.data, function (idx, value) {

                            alarmWidgetData      = JSON.parse(value.widgetData);
                            viewType             = alarmWidgetData.viewType;
                            alarmWidgetData.data = widgetData.data;

                            if (viewType == 'activeAlarms') {
                                params = {
                                    id              : value.id,
                                    user            : App.config.user.id,
                                    name            : value.name,
                                    description     : value.description,
                                    widgetType      : value.widgetType,
                                    widgetData      : JSON.stringify(alarmWidgetData),
                                    location        : value.location,
                                    positionNumber  : value.positionNumber,
                                    parent          : value.parent,
                                    pictureName     : value.pictureName,
                                    domainObjectType: value.objectType
                                };
                            }
                        });

                        //Save widget information
                        me.saveWidget(params);
                    }
                });

                break;
            default:
                params        = {
                    id              : this.config.id,
                    user            : App.config.user.id,
                    name            : this.config.name,
                    description     : this.config.description,
                    widgetType      : this.config.widgetType,
                    widgetData      : JSON.stringify(widgetData),
                    location        : this.config.location,
                    positionNumber  : this.config.positionNumber,
                    parent          : this.config.parent,
                    pictureName     : this.config.pictureName,
                    domainObjectType: this.config.objectType
                };
                me.widgetData = widgetData;

                //Save widget information
                me.saveWidget(params);
                break;

        }

    },
    exportData      : function () {
        this.grid.saveAsExcel();
    },
    load            : function () {
        // Don't do anything here.
    },
    refresh         : function () {
        'use strict';

        var me = this;
        // Only refresh grid if this does not disturb the user.
        if (me.canRefresh()) {
            me.toggleColumns();
            me.grid.dataSource.read();
            if (me.grid.dataSource.pageSize() !== App.config.user.dataGridPageSize) {
                me.grid.dataSource.pageSize(App.config.user.dataGridPageSize);
            }
            return me.jqXHR;
        } else {
            return {};
        }
    },
    destroy         : function () {
        'use strict';

        this.el = null;

        // Stop Ajax call - only if not uninitialized (0) or finished (4).
        if (this.jqXHR && this.jqXHR.readyState !== 4 && this.jqXHR.readyState !== 0) {
            this.jqXHR.abort();
            this.jqXHR = null;
        }
        this.dataSource = null;
        if (this.grid) {
            try {
                this.grid.destroy();
            }
            catch (err) {
                console.log(err);
            }
        }
        this.grid       = null;
        this.columns    = null;
        this.fields     = null;
        this.dsSchema   = null;
        this.widgetData = null;
        this.config     = null;
    },
    canRefresh      : function () {
        'use strict';

        // Check if a row is selected.
        var result = this.grid && this.getSelectedIds().length === 0;

        // ...or check if a filter is being edited or something on the toolbar is going on.
        if (result) {
            // Does not work since the popup is not bound to the grid.
            // result = this.grid.wrapper.find('.k-column-menu:visible').length === 0;
            result = $('.k-column-menu .k-filterable:visible').length === 0;
        }

        return result;
    }
});
