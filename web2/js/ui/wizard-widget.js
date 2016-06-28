/**
 * Widget Catalog Edit wizard dialog
 * @type {*}
 */
App.ui.WizardWidget = App.ui.WizardBase.extend({

    /**
     * Widget Object App.ui.WidgetCatalog.Item
     */
    widget                   : null,
    panels                   : [],
    widgetTypeOptionMapping  : {
        'grid'       : 'gridTypeCombo',
        'list'       : 'listTypeCombo',
        'dashboard'  : 'dashboardTypeCombo',
        'detail'     : 'detailTypeCombo',
        'map'        : 'mapTypeCombo',
        'overviewMap': 'mapTypeCombo'
    },
    widgetColumnGrid         : null,
    columnWarnMsgShown       : false,
    supportedViews           : [],
    parentAssignment         : null,
    widgetData               : {},
    selectedWidgetType       : null,
    selectedWidgetTypeOption : null,
    columnWidgetStepContainer: null,
    buttonContainer          : null,
    iconSelector             : null,

    /**
     * Stores hierarchical data for grids that are returned by availableValues service
     */
    detailDomainObjectValues: null,
    detailDomainObjectType  : null,
    detailDomainDataView    : null,

    /**
     * All icons used as a widget icon.
     */
    widgetIconSets: [
        {name: 'Business', pfx: 'Business-', count: 97},
        {name: 'Communication', pfx: 'Communication-', count: 114},
        {name: 'Content', pfx: 'Content-', count: 48},
        {name: 'Design', pfx: 'Design-', count: 36},
        {name: 'Edition', pfx: 'Edition-', count: 68},
        {name: 'Files', pfx: 'Files-', count: 106},
        {name: 'Food', pfx: 'Food-', count: 21},
        {name: 'Hardware', pfx: 'Hardware-', count: 57},
        {name: 'Health', pfx: 'Health-', count: 28},
        {name: 'Interface', pfx: 'Interface-', count: 98},
        {name: 'Keyboard', pfx: 'Keyboard-', count: 26},
        {name: 'Leisure', pfx: 'Leisure-', count: 18},
        {name: 'Multimedia', pfx: 'Multimedia-', count: 83},
        {name: 'Objects', pfx: 'Objects-', count: 67},
        {name: 'Places', pfx: 'Places-', count: 54},
        {name: 'Programming', pfx: 'Programing-', count: 67},
        {name: 'Setting', pfx: 'Setting-', count: 17},
        {name: 'Status', pfx: 'Status-', count: 31},
        {name: 'Text', pfx: 'Text-', count: 63},
        {name: 'Time', pfx: 'Time-', count: 12},
        {name: 'Transfers', pfx: 'Transfers-', count: 81},
        {name: 'Transportation', pfx: 'Transportation-', count: 12},
        {name: 'Users', pfx: 'Users-', count: 78},
        {name: 'Vote', pfx: 'Vote-', count: 61},
        {name: 'Weather', pfx: 'Weather-', count: 11}
    ],

    /**
     * true if there has been already an icon selected for that widget type.
     * If not, then the corresponding icon from App.util.widget.defaultIcon is used for that.
     * @type {boolean}
     */
    iconSelected: false,

    init: function (config) {
        'use strict';

        // Call parent constructor with config
        App.ui.WizardBase.fn.init.call(this, $.extend({
            title           : App.translate('Asset Administration'),
            domainObjectType: null,
            objectId        : null,
            parentObjectId  : null,
            parentObjectType: null,
            parentRef       : null,
            myId            : null
        }, config));

        if (this.config.data.widgetData) {
            if ($.isPlainObject(this.config.data.widgetData)) {
                this.widgetData = this.config.data.widgetData;
            } else {
                this.widgetData = $.parseJSON(this.config.data.widgetData);
            }
        }

        /**
         * Panel configuration
         *
         * @type {Array}
         */
        this.panels = [
            {
                title   : App.translate('Widget Types'),
                subTitle: '',
                id      : 'widget_layout',
                hidden  : false,
                fn      : this.getWidgetLayoutPanel
            },
            /*{
             title   : App.translate('Widget Detail'),
             subTitle: '',
             id      : 'widget_columns',
             hidden  : true, // disabled by default
             fn      : this.getWidgetColumnPanel
             },*/
            {
                title   : App.translate('Widget Information'),
                subTitle: '',
                id      : 'widget_information',
                hidden  : false,
                fn      : this.getWidgetInformationPanel
            }
        ];

        return this;
    },

    /**
     * Show dialog
     */
    getView: function () {
        'use strict';

        var me          = this,
            buttonLabel = '';
        this.dialog.bind('deactivate', function () {
            me.destroy();
            if (!me.config.parentRef) {
                App.router.navigate(App.router.lastRoute);
            }
        });
        if (me.config.myId) {
            if (me.config.data.name) {
                buttonLabel = App.translate('Update {0} "{1}"', App.translate('Widget'), me.config.data.name);
            } else {
                buttonLabel = App.translate('Update {0}', App.translate('Widget'));
            }
        } else {
            buttonLabel = App.translate('Create {0}', App.translate('Widget'));
        }

        // Adjust title and button label
        me.setSaveButtonLabel(buttonLabel);
        //noinspection JSValidateTypes
        me.dialog.title(buttonLabel);

        me.buildContainer();
    },

    /**
     * Step 1 shows widget information form
     *
     * @param panel
     * @param scope
     */
    getWidgetInformationPanel: function (panel, scope) {
        'use strict';

        var me = scope || this;

        me.widgetInformationPanel = $('<div>').appendTo(panel.contentEl);

        var dl       = $('<dl>', {
            'class': 'dl-horizontal'
        }).appendTo(me.widgetInformationPanel);

        $('<dt>').text(App.translate('Name')).appendTo(dl).attr('required', true);
        var dd       = $('<dd>').appendTo(dl),
            input    = $('<input>', {
                type   : 'text',
                'class': 'k-textbox',
                id     : 'widget-catalog-name',
                name   : 'widget-catalog-name'
            }).appendTo(dd);

        input.attr('required', 'true');

        $('<dt>').text(App.translate('Description')).appendTo(dl).attr('required', true);
        dd           = $('<dd>').appendTo(dl);
        var textarea = $('<textarea>', {
            id     : 'widget-catalog-description',
            name   : 'widget-catalog-description',
            'class': 'k-textbox',
            cols   : 35,
            rows   : 4
        }).appendTo(dd);

        textarea.attr('required', 'true');

        input.change(function () {
            if (textarea.val() === '') {
                textarea.val(input.val());
            }
        });

        // Icon Picker
        $('<dt>').text(App.translate('Icon')).appendTo(dl);
        dd           = $('<dd>').appendTo(dl);

        var iconPicker = me.initIconPicker();

        me.iconSelector = $('<img>', {
            'class': 'button-change-icon btn btn-default',
            /**
             * if no widgetType is selected, then show this.
             */
            src    : 'images/icons/32px/' + App.util.widget.defaultIcon.widgetGroup + '.png'
        })
            .data('name', App.util.widget.defaultIcon.widgetGroup)
            .appendTo(dd)
            .popover({
                title    : App.translate('Choose icon'),
                html     : true,
                placement: 'auto',
                content  : iconPicker
            });

        // Install click handlers.
        iconPicker.find('img').on('click', function () {
            var img         = $(this).attr('title');
            me.iconSelector
                .attr('src', 'images/icons/32px/' + img + '.png')
                .data('name', img)
                .popover('hide');
            me.iconSelected = true;
        });
    },

    /**
     * Step: widget type selection
     *
     * @param panel
     * @param scope
     */
    getWidgetLayoutPanel: function (panel, scope) {
        'use strict';

        var me = scope || this;

        // radio group template
        var template = kendo.template(
            '<ul>' +
            ' # for (var i = 0; i < data.length; i++) { #' +
            '<li><label><input type="radio" data-type="widget-type" name="widget_type" value="#= data[i].id #"/> #= data[i].name #</label></li>' +
            '# } #' +
            '</ul>',
            {useWithBlock: false});

        me.widgetLayoutPanel = $('<div>').text(App.translate('Choose a Widget Type')).appendTo(panel.contentEl);

        var domainObjectType = me.config.domainObjectType,
            data             = null;

        // Are there any widgets configured for that domainObjectType?
        for (var i = 0; i < App.config.domainObjectTypesTree.length; i++) {
            var section = App.config.domainObjectTypesTree[i];

            for (var j = 0; j < section.items.length; j++) {
                var dot = section.items[j];

                if (dot.id === domainObjectType) {
                    data = dot.widgetTypes;
                }
            }
        }

        if (data) {
            me.widgetLayoutPanel.append(template(data));

            me.buildWidgetTypeOptions();

            me.widgetColumnPanel = $('<div>', {
                id   : 'widget_columns',
                style: 'margin-top:10px'
            }).appendTo(me.widgetLayoutPanel);

            // Add change listener.
            $('input[name="widget_type"]').change($.proxy(me.onWidgetTypeChange, me));
        }
    },

    /**
     * Step: select columns / widgets (parent)
     *
     * @param panel
     * @param scope
     */
    getWidgetColumnPanel: function (panel, scope) {
        'use strict';

        var me = scope || this;

        // just add an empty container because content depends on option selection
        me.widgetColumnPanel = $('<div>').appendTo(panel.contentEl);
    },

    /**
     * Change handler for widget type
     *
     * @param e
     */
    onWidgetTypeChange: function (e) {
        'use strict';

        var me            = this,
            widgetType    = $(e.target).val(),
            widgetColumns = $('#widget_columns');

        me.selectedWidgetType       = widgetType;
        me.selectedWidgetTypeOption = null;
        me.supportedViews           = [];

        // Hide step 3
        me.buttonContainer.children('.step-3').hide();
        widgetColumns.hide();

        // First hide all combos
        $.each(me.widgetTypeOptionMapping, function (key, item) {
            me[item].wrapper.hide();
        });

        // Hide report view type combo
        /** @namespace me.reportViewTypeCombo */
        me.reportViewTypeCombo.wrapper.hide();

        // Clean up column panel
        me.widgetColumnPanel.empty();
        me.widgetColumnPanel.removeClass();
        if (me.widgetColumnGrid) {
            me.widgetColumnGrid.destroy();
            me.widgetColumnGrid = null;
        }

        // Set default icon for that widget type.
        if (App.util.widget.defaultIcon[widgetType] && !me.iconSelected) {
            var myImage = App.util.widget.defaultIcon[widgetType];
            me.iconSelector
                .attr('src', 'images/icons/32px/' + myImage + '.png')
                .data('name', myImage);
        }

        if (widgetType === App.config.parentWidgetType) {
            // Show our MultiSelect in widget column panel
            me.buildParentAssignmentPanel();
            me.buttonContainer.children('.step-3').show();
            widgetColumns.show();
        } else {
            me.widgetColumnPanel.show();

            // Show combo
            var optionCombo = me.widgetTypeOptionMapping[widgetType];
            if (optionCombo) {
                me[optionCombo].wrapper.show();
                me[optionCombo].trigger('change');
            }
        }
    },

    /**
     * Renders drop down for additional widget type selection
     */
    buildWidgetTypeOptions: function () {
        'use strict';

        var me       = this,
            el,
            defaults = {
                autoBind      : false,
                dataTextField : 'name',
                dataValueField: 'id'
            };


        /**
         * Grid
         */
        el = $('<input>', {style: 'margin-top:10px;'}).appendTo(me.widgetLayoutPanel);
        //noinspection JSUnresolvedFunction
        me.gridTypeCombo = el.kendoDropDownList($.extend({}, defaults, {
            optionLabel: App.translate('Choose a data provider'),
            dataSource : {
                transport: {
                    read: {
                        url : App.config.serviceUrl + 'caesarObject/availableDomainDataViews',
                        data: {
                            domainObjectType: me.config.domainObjectType,
                            viewType        : 'dataGrid'
                        }
                    }
                },
                schema   : {
                    data: 'domainDataViews'
                }
            },
            change     : function (el) {
                var value = el.sender.value();
                if (el.sender.selectedIndex > 0) {
                    me.selectedWidgetTypeOption = value;
                    $.proxy(me.getDomainObjectValues(value), me);
                    me.buttonContainer.children('.step-3').show();
                    $('#widget_columns').show();
                }
            }
        })).data('kendoDropDownList');
        me.gridTypeCombo.wrapper.hide();


        /**
         * Grid
         */
        el = $('<input>', {style: 'margin-top:10px;'}).appendTo(me.widgetLayoutPanel);
        //noinspection JSUnresolvedFunction
        me.listTypeCombo = el.kendoDropDownList($.extend({}, defaults, {
            optionLabel: App.translate('Choose a data provider'),
            dataSource : {
                transport: {
                    read: {
                        url : App.config.serviceUrl + 'caesarObject/availableDomainDataViews',
                        data: {
                            domainObjectType: me.config.domainObjectType,
                            viewType        : 'list'
                        }
                    }
                },
                schema   : {
                    data: 'domainDataViews'
                }
            },
            change     : function (el) {
                var value = el.sender.value();
                if (el.sender.selectedIndex > 0) {
                    me.selectedWidgetTypeOption = value;
                }
            }
        })).data('kendoDropDownList');
        me.listTypeCombo.wrapper.hide();


        /**
         * Dashboard
         */
        el = $('<input>', {style: 'margin-top:10px;'}).appendTo(me.widgetLayoutPanel);
        //noinspection JSUnresolvedFunction
        me.dashboardTypeCombo = el.kendoDropDownList($.extend({}, defaults, {
            optionLabel: App.translate('Choose report type'),
            dataSource : {
                transport: {
                    read: {
                        url : App.config.serviceUrl + 'rbireports/availableReports',
                        data: {domainObjectType: me.config.domainObjectType}
                    }
                },
                schema   : {
                    data: 'reports'
                }
            },
            change     : function (el) {
                var value         = el.sender.value(),
                    selectedIndex = el.sender.selectedIndex,
                    data          = el.sender.dataSource.data();

                if (selectedIndex > 0) {
                    //noinspection JSUnresolvedVariable
                    me.supportedViews      = data[(selectedIndex - 1)].supportedViewTypes;
                    me.reportViewTypeCombo.wrapper.show();
                    var supportedViewTypes = [];
                    //noinspection JSUnresolvedVariable
                    $.each(data[(selectedIndex - 1)].supportedViewTypes, function (idx, item) {
                        supportedViewTypes.push({
                            name: item
                        });
                    });
                    me.reportViewTypeCombo.dataSource.data(supportedViewTypes);

                    // This is the only way to "reset" a Kendo DropDown.
                    me.reportViewTypeCombo.options.optionLabel = App.translate('Choose chart type');
                    me.reportViewTypeCombo.refresh();
                    me.reportViewTypeCombo.select(me.reportViewTypeCombo.ul.children().eq(0));
                    me.selectedWidgetTypeOption                = value;
                } else {
                    me.reportViewTypeCombo.wrapper.hide();
                }
            }
        })).data('kendoDropDownList');
        me.dashboardTypeCombo.wrapper.hide();


        /**
         * Report
         */
        el = $('<input>', {style: 'margin-top:10px;'}).appendTo(me.widgetLayoutPanel);
        //noinspection JSUnresolvedFunction
        me.reportViewTypeCombo = el.kendoDropDownList($.extend({}, defaults, {
            dataSource: new kendo.data.DataSource(),
            change    : function (el) {
                console.log(el.sender.value());
            }
        })).data('kendoDropDownList');
        me.reportViewTypeCombo.wrapper.hide();


        /**
         * mapType
         */
        // Create DataSource for mapProject DropDown.
        var dsMapProjects = [
            {
                datumName: null,
                'default': false,
                id       : 'default',
                mapUrl   : null,
                mapViewer: null,
                name     : App.translate('Default')
            }
        ];
        $.each(App.config.map.projects, function (key, item) {
            dsMapProjects.push(item);
        });
        el                = $('<input>', {style: 'margin-top:10px;'}).appendTo(me.widgetLayoutPanel);
        //noinspection JSUnresolvedFunction
        me.mapTypeCombo = el.kendoDropDownList($.extend({}, defaults, {
            // optionLabel: App.translate('Choose map type'),
            autoBind  : true,
            dataSource: dsMapProjects,
            value     : 'default',
            change    : function (el) {
                if (el.sender.selectedIndex > 0) {
                    me.selectedWidgetTypeOption = el.sender.value();
                }
            }
        })).data('kendoDropDownList');
        me.mapTypeCombo.wrapper.hide();


        /**
         * Detail
         */
        el = $('<input>', {style: 'margin-top:10px;'}).appendTo(me.widgetLayoutPanel);
        //noinspection JSUnresolvedFunction
        me.detailTypeCombo = el.kendoDropDownList($.extend({}, defaults, {
            optionLabel: App.translate('Choose a data provider'),
            dataSource : {
                transport: {
                    read: {
                        url : App.config.serviceUrl + 'caesarObject/availableDomainDataViews',
                        data: {
                            domainObjectType: me.config.domainObjectType,
                            viewType        : 'detail'
                        }
                    }
                },
                schema   : {
                    data: 'domainDataViews'
                }
            },
            change     : function (el) {
                var value = el.sender.value();
                if (el.sender.selectedIndex > 0) {
                    me.selectedWidgetTypeOption = value;
                    $.proxy(me.getDomainObjectValues(value), me);
                    me.buttonContainer.children('.step-3').show();
                    $('#widget_columns').show();
                }
            }
        })).data('kendoDropDownList');
        me.detailTypeCombo.wrapper.hide();

    },

    /**
     * Builds panels and step buttons
     */
    buildContainer: function () {
        'use strict';

        var me = this;
        me.hideBusy();

        me.buttonContainer = $('<div>', {
            'class': 'wizard-steps'
        }).appendTo(me.elMenu);

        // Loop through panel configuration and add step button and panel
        $.each(me.panels, function (key, panel) {
            // Add step button
            var stepButton = $('<a>', {
                'text' : panel.title,
                'class': 'btn step-' + (key + 1),
                'click': function () {

                    // move to this step
                    me.moveToStep(key + 1);
                    // Move the focus on the first control in the stepPanel
                    var thisStepPanel = me.elContent.find('.widget:visible').filter(function () {
                        return $(this).data('id') == key + 1;
                    });
                    if (thisStepPanel.find(':input:first').data('role') === 'dropdownlist') {
                        //noinspection JSValidateTypes
                        thisStepPanel.find(':input:first').parent().focus();
                    } else {
                        thisStepPanel.find(':input:first').focus();
                    }
                }
            }).appendTo(me.buttonContainer);
            // Associate Step button and step together
            stepButton.data('id', key + 1);
            $.proxy(me.buildStep(panel), me);
            // Associate Step button and step together
            panel.contentEl.parents('.widget').data('id', key + 1);
        });

        // Activate first step.
        me.moveToStep(1);

        // Hide step 3 by default
        me.buttonContainer.children('.step-3').hide();
        $('#widget_columns').hide();

        // me.togglePanels(me.panels[0]);
        if (me.config.myId) {
            me.setValues();
        }
    },

    /**
     * Get values for selected domain object type and build columns
     *
     * @param viewType
     */
    getDomainObjectValues: function (viewType) {
        'use strict';

        console.log(viewType);

        var me = this;
        $.ajax({
            url    : App.config.serviceUrl + 'caesarObject/availableValues',
            data   : {
                applicationName : App.config.name,
                domainObjectType: me.config.domainObjectType,
                domainDataView  : viewType
            },
            success: function (response) {
                me.detailDomainObjectValues = null;
                if (response.detailDomainObjectValues) {
                    /** @namespace response.detailMetadata */
                    me.detailDomainObjectValues = response.detailDomainObjectValues;
                    me.detailDomainObjectType   = response.detailMetadata.domainObjectType;
                    me.detailDomainDataView     = response.detailMetadata.domainDataView;
                }
                me.buildWidgetColumns(response.domainObjectValues);
            }
        });
    },

    /**
     * Builds view with MultiSelect to assign widgets for step 3
     */
    buildParentAssignmentPanel: function () {
        'use strict';

        var me = this;

        me.widgetColumnPanel.empty();
        me.widgetColumnPanel.removeClass();

        // Get all widgets for domain object type
        $.ajax({
            url    : App.config.serviceUrl + 'caesarWidgetProvider/getWidgets2',
            data   : {
                domainObjectType: me.config.domainObjectType
            },
            success: function (response) {
                var data              = response.data,
                    availableWidgets  = [],
                    selectedWidgetIds = [];

                $.each(data, function (idx, widget) {
                    if (widget.parent === '' && widget.widgetType !== App.config.parentWidgetType) {
                        availableWidgets.push(widget);
                    }
                    if (widget.parent === me.config.data.id) {
                        availableWidgets.push(widget);
                        selectedWidgetIds.push(widget.id);
                    }
                });

                // Add MultiSelect to widget column panel (step 3)
                //noinspection JSValidateTypes
                me.parentAssignment = new App.ui.Multiselect({
                    valueField   : 'name',
                    renderTo     : me.widgetColumnPanel,
                    data         : availableWidgets,
                    leftLabel    : App.translate('Available Widgets'),
                    rightLabel   : App.translate('Selected Widgets'),
                    positionField: 'positionNumber'
                });
                me.parentAssignment.render();
                me.parentAssignment.setSelected(selectedWidgetIds);
            }
        });

    },

    /**
     * Build selectable columns for step 3
     *
     * @param data
     */
    buildWidgetColumns: function (data) {
        'use strict';

        var me            = this,
            group,
            minicount     = 0,
            selectedCount = 0;

        me.widgetColumnPanel.empty();
        me.widgetColumnPanel.removeClass();

        // TEMP fixed string boolean values / fixed pos number
        // TODO remove later
        var boolCheck = function (val, idx, key) {
            if (val === 'false') {
                data[idx][key] = false;
            } else if (val === 'true') {
                data[idx][key] = true;
            }
        };
        $.each(data, function (idx, item) {
            boolCheck(item.sortable, idx, 'sortable');
            boolCheck(item.mini_widget, idx, 'mini_widget');
            boolCheck(item.defaultSort, idx, 'defaultSort');
            boolCheck(item.filterable, idx, 'filterable');

            // Set positionNumber
            if (!item.positionNumber) {
                item.positionNumber = idx;
            }

            // Check mini widget columns
            if (item.mini_widget) {
                minicount++;
            } else {
                data[idx].mini_widget = false;
            }

            if (!me.config.myId && me.selectedWidgetType !== 'detail') {
                item.selected = false;

                if (selectedCount < App.config.maxGridColumnSize) {
                    item.selected = true;
                    selectedCount++;
                }
            }

            // Check sort direction
            if (!item.sortDir && item.sortable) {
                item.sortDir = item.sortable ? 0 : '';
            }
        });

        // set default sort attribute
        $.each(data, function (idx, item) {
            var sort   = false,
                result = true;

            if (me.widgetData.sortAttribute) {
                if (me.widgetData.sortAttribute === item.domainObjectValueId) {
                    sort = true;
                }
            } else if (item.sortable) {
                // no default sort available, just select first row
                sort = true;
            }

            if (sort) {
                data[idx].defaultSort = true;
                result                = false;
            }

            return result;
        });

        // Handle mini count rules.
        if (minicount === 0) {

            // Select first two rows by default.
            if (data[0]) {
                data[0].mini_widget = true;
            }

            if (data[1]) {
                data[1].mini_widget = true;
            }
        } else if (minicount > 2) {

            // clean up only two selections are allowed
            // and we have a lot saved widgets with more selections at the moment
            // TODO remove
            $.each(data, function (idx) {
                if (idx > 1) {
                    data[idx].mini_widget = false;
                }
            });
        }

        var columns = [
            {
                field   : 'domainObjectValueName',
                title   : App.translate('Attributes to Display'),
                template: function (rec) {
                    var checked  = '',
                        disabled = '';

                    if (rec.selected) {
                        checked = 'checked="checked"';
                        rec.set('selected', true);
                    } else {
                        rec.set('selected', false);
                    }
                    return '<input data-bind="selected" type="checkbox" ' + checked + ' ' + disabled + '/>' + rec.domainObjectValueName;
                }

            },
            {
                title     : App.translate('Visible on Mini Widget'),
                template  : function (rec) {
                    var checked  = '',
                        disabled = '';

                    if (rec.mini_widget) {
                        checked = 'checked="checked"';
                    } else {
                        var selected = me.widgetColumnPanel.find('input[data-bind="mini_widget"]:checked');
                        if (selected.length === 2) {
                            disabled = 'disabled="disabled"';
                        }
                    }
                    return '<input data-bind="mini_widget" type="checkbox" ' + checked + ' ' + disabled + '/>';
                },
                attributes: {
                    style: 'text-align: center;'
                }
            },
            {
                field              : 'section',
                groupHeaderTemplate: function (rec) {
                    if (typeof rec.value === 'undefined' || rec.value === '') {
                        rec.value = App.translate('Details');
                    }
                    return rec.value;
                },
                hidden             : true
            }
        ];

        if (me.selectedWidgetType === 'detail') {
            group = {
                field: 'section'
            };
        } else {
            columns.push(
                {
                    field     : 'defaultSort',
                    title     : App.translate('Default Sort Attribute'),
                    template  : function (rec) {

                        if (!rec.sortable) {
                            return '';
                        }

                        var checked = '';

                        if (rec.defaultSort) {
                            checked = 'checked="checked"';
                        }
                        return '<input data-bind="defaultSort" type="radio" name="defaultSort"' + checked + ' />';
                    },
                    attributes: {
                        style: 'text-align: center;'
                    }
                }, {
                    field   : 'sortDir',
                    title   : App.translate('Sort Direction'),
                    editor  : function (container, options) {

                        if (options.model.sortable) {

                            var input = $('<input>', {
                                name: options.field
                            }).appendTo(container);

                            //noinspection JSUnresolvedFunction
                            input.kendoDropDownList({
                                dataTextField : 'value',
                                dataValueField: 'id',
                                value         : options.model.sortDir,
                                dataSource    : {
                                    data: [
                                        {id: 0, value: 'ASC'},
                                        {id: 1, value: 'DESC'}
                                    ]
                                }
                            });
                        }
                    },
                    template: function (rec) {
                        return rec.sortable ? (rec.sortDir === 0 ? 'ASC' : 'DESC') : '';
                    }
                });
        }

        // init grid
        //noinspection JSUnresolvedFunction
        me.widgetColumnGrid = me.widgetColumnPanel.kendoGrid({
            dataSource: {
                data          : data,
                schema        : {
                    model: {
                        fields: {
                            domainObjectValueId  : {
                                type    : 'string',
                                editable: false
                            },
                            domainObjectValueName: {
                                type    : 'string',
                                editable: false
                            },
                            sortable             : {
                                type    : 'boolean',
                                editable: true
                            },
                            selected             : {
                                type    : 'boolean',
                                editable: true
                            },
                            section              : {
                                type    : 'string',
                                editable: false
                            },
                            mini_widget          : {
                                type    : 'boolean',
                                editable: true
                            },
                            defaultSort          : {
                                type    : 'boolean',
                                editable: false
                            },
                            sortDir              : {editable: true},
                            positionNumber       : {
                                type    : 'positionNumber',
                                editable: true
                            },
                            hidden               : {
                                type    : 'boolean',
                                editable: false
                            }
                        }
                    }
                },
                group         : group,
                serverGrouping: false
            },
            columns   : columns,
            editable  : true,
            sortable  : false,
            scrollable: false,
            pageable  : false,
            dataBound : function () {
                var grid = this;
                $.each(grid.dataSource.data(), function (idx, rec) {
                    if (rec.hidden) {
                        grid.tbody.find('tr[data-uid="' + rec.uid + '"]').hide();
                    }
                });
            }
        }).data('kendoGrid');

        // init drag & drop
        me.initGridSorting(me.widgetColumnGrid);

        me.widgetColumnGrid.dataSource.sort({
            field: 'positionNumber',
            dir  : 'asc'
        });
        // change listener
        me.widgetColumnGrid.tbody.on('change', $.proxy(me.onWidgetColumnGridChange, me));

        // defaultSort radio group click handler
        me.widgetColumnPanel.find('input[data-bind="defaultSort"]').on('click', function () {
            var container      = $(this).closest('tr'),
                id             = container.attr(kendo.attr('uid')),
                record         = me.widgetColumnGrid.dataSource.getByUid(id);

            $.each(me.widgetColumnGrid.dataSource.data(), function (idx, rec) {
                rec.defaultSort = false;
            });
            record.defaultSort = true;
        });

        // click listener for selected columns
        if (me.selectedWidgetType !== 'detail') {
            me.widgetColumnPanel.find('input[data-bind="selected"]').on('click', function () {
                var selected = me.widgetColumnPanel.find('input[data-bind="selected"]:checked');

                if (selected.length === App.config.maxGridColumnSize + 1) {

                    if (!me.columnWarnMsgShown) {
                        $.when(App.dialog.alert({
                            title   : App.translate('Info'),
                            height  : 150,
                            minWidth: 200,
                            width   : 350,
                            message : App.translate('We recommend a max column amount of {0}', App.config.maxGridColumnSize),
                            icon    : App.dialog.iconInfo
                        })).done(function () {
                            me.columnWarnMsgShown = true;
                        });
                    }
                }
            });
        }
    },

    onWidgetColumnGridChange: function (e) {
        'use strict';

        var me    = this,
            row   = $(e.target).closest('tr'),
            field = $(e.target).data('bind'),
            role  = $(e.target).data('role');
        if (!role) {
            role = 'no role';
        }
        var item = me.widgetColumnGrid.dataItem(row);
        // the dropdownlist doesn't have a property checked, so
        // setting this property to the binding value this is
        // assigning 0 (the first element of the dropdownlist)
        // all the time.
        if (role != 'dropdownlist') {
            item.set(field, $(e.target).is(':checked') ? 1 : 0);
        }
    },

    getGridColumns: function () {

    },

    initGridSorting: function (grid) {
        'use strict';

        var me = this;

        //noinspection JSUnresolvedFunction
        grid.table.kendoDraggable({
            filter   : 'tbody > tr',
            group    : 'gridGroup',
            threshold: 100,
            hint     : function (e) {
                return $('<div class="k-grid k-widget"><table><tbody><tr>' + e.html() + '</tr></tbody></table></div>');
            },
            drag     : function (e) {

                var top    = $(me.elContent).offset().top,
                    bottom = top + $(me.elContent).innerHeight();

                if ((e.clientY - 40) < top) {
                    $(me.elContent).scrollTop($(me.elContent).scrollTop() - 10);
                } else if ((e.clientY + 40) > bottom) {
                    $(me.elContent).scrollTop($(me.elContent).scrollTop() + 10);
                }
            }
        });

        //noinspection JSUnresolvedFunction
        grid.table.kendoDropTarget({
            group: 'gridGroup',
            drop : function (e) {
                e.draggable.hint.hide();

                // We have 2 use cases here:
                // a) drag field around - for the detail widget: make sure that the field can only be dragged around within its section.
                // b) drag section around - make sure that sections are dropped properly afterwards

                var drag = e.draggable.currentTarget,
                    drop = $(document.elementFromPoint(e.clientX, e.clientY));

                var dragIsSection = drag.hasClass('k-grouping-row'),
                    dropIsSection = drop.hasClass('k-grouping-row') || drop.closest('tr').hasClass('k-grouping-row');

                // Do not allow dragging onto the Header.
                if (drop.prop('tagName') !== 'TH') {

                    if (dragIsSection && dropIsSection) {
                        // Handle drag & drop for sections

                    } else if (dragIsSection && !dropIsSection) {
                        // Ignore.
                    } else if (!dragIsSection && dropIsSection) {
                        // Ignore.
                    } else {

                        // Drag & drop of fields
                        var dragData = grid.dataSource.getByUid(drag.data('uid'));
                        //noinspection JSCheckFunctionSignatures
                        var dropData = grid.dataSource.getByUid(drop.parent().data('uid'));
                        if (dragData && dropData) {

                            // Do not D&D on same item.
                            if (dragData.get('domainObjectValueId') !== dropData.get('domainObjectValueId')) {

                                // Swap items
                                var tmp = dragData.get('positionNumber');
                                if (tmp >= 0) {
                                    dragData.set('positionNumber', dropData.get('positionNumber'));
                                    dropData.set('positionNumber', tmp);
                                }
                                grid.dataSource.sort({
                                    field: 'positionNumber',
                                    dir  : 'asc'
                                });
                            }
                        }
                    }

                }
            }
        });
    },

    /**
     * adds panel with widget wrapper to content area
     *
     * @param panel
     */
    buildStep: function (panel) {
        'use strict';
        //var me          = this;
        panel.contentEl = this.renderStep(panel.id, panel.title);
        // Call function if defined
        if (panel.fn) {
            panel.fn(panel, this);
        }
        //After adding fields add input validators to user actions with the input, so the
        // validation happens individually
        /*panel.contentEl.find(':input:not(:button)').on('change focusout keyup blur', function () {
            if (!me.validator.validateInput($(this))) {
                me.updateSteps($(this).parents('.widget').data('id'));
            }
            else {
                me.validateSteps(false);
            }
        });*/
    },

    /**
     * Set values
     */
    setValues: function () {
        'use strict';

        var me            = this,
            widgetType    = this.config.data.widgetType,
            widgetColumns = $('#widget_columns');

        me.buttonContainer.children('.step-3').hide();
        widgetColumns.hide();

        me.selectedWidgetType = widgetType;

        if (me.widgetData) {
            me.supportedViews           = me.widgetData.supportedViews;
            me.selectedWidgetTypeOption = me.widgetData.viewType;

            if (me.widgetData.data && me.widgetData.data.length) {
                me.buildWidgetColumns(me.widgetData.data);
                me.buttonContainer.children('.step-3').show();
                widgetColumns.show();
            }

            if (me.widgetData.detail && me.widgetData.detail.length) {
                me.detailDomainObjectValues = me.widgetData.detail.data;
                me.detailDomainObjectType   = me.widgetData.detail.domainObjectType;
                me.detailDomainDataView     = me.widgetData.detail.domainDataView;
            }
        }

        // Step 1 name, description, icon
        $('#widget-catalog-name').val(me.config.data.name);
        $('#widget-catalog-description').val(me.config.data.description);
        me.iconSelector
            .attr('src', 'images/icons/32px/' + me.config.data.pictureName + '.png')
            .data('name', me.config.data.pictureName);
        me.iconSelected       = true;

        // Step 2 set widget type
        $('input[name="widget_type"][value="' + widgetType + '"]').prop('checked', true);

        // Step 3 set view type
        $.each(me.widgetTypeOptionMapping, function (key, optionCombo) {

            if (widgetType === key) {
                me[optionCombo].dataSource.fetch(function () {
                    if (me.widgetData) {
                        me[optionCombo].value(me.widgetData.viewType);
                    }
                });

                me[optionCombo].wrapper.show();

                if (optionCombo === 'dashboardTypeCombo') {
                    me.reportViewTypeCombo.wrapper.show();
                    var supportedViewTypes = [];
                    $.each(me.supportedViews, function (idx, item) {
                        supportedViewTypes.push({
                            name: item
                        });
                    });
                    me.reportViewTypeCombo.dataSource.data(supportedViewTypes);

                    if (me.widgetData.reportViewType) {
                        me.reportViewTypeCombo.value(me.widgetData.reportViewType);
                    }
                }
                // CAES-510 Disable widget type and provider for update widget
                me[optionCombo].enable(false);
            }
        });

        if (widgetType === App.config.parentWidgetType) {
            me.buildParentAssignmentPanel();
            me.buttonContainer.children('.step-3').show();
            widgetColumns.show();
        }

        // CAES-510 Disable widget type and provider for update widget
        me.widgetLayoutPanel.find('input:radio[data-type="widget-type"]').attr('disabled', true);
    },

    /**
     * TODO save logic should be handled in App.ui.WidgetCatalog.Item
     * submit form save widget
     */
    onSave: function () {
        'use strict';

        var me = this;

        // To make this work, elContent needs to be a form.
        //noinspection JSUnresolvedFunction
        var validator = me.elContent.kendoValidator({
            messages: {
                required: App.translate('This field is required')
            },
            validate: function (e) {
                if (!e.valid) {
                    var elementId;

                    for (var prop in e.sender._errors) {
                        elementId = prop;
                        break;
                    }

                    if (elementId) {
                        $('#' + elementId).scrollintoview({
                            direction: 'vertical'
                        });
                    }
                }
            }
        }).data('kendoValidator');

        if (validator && validator.validate()) {
            me.config.data.name        = $('#widget-catalog-name').val();
            me.config.data.description = $('#widget-catalog-description').val();

            // Build widget data.
            var widgetData = {
                viewType: me.selectedWidgetTypeOption
            };

            if (me.selectedWidgetType === 'dashboard') {
                widgetData.supportedViews = me.supportedViews;
                widgetData.reportViewType = me.reportViewTypeCombo.value();
            }

            if (me.widgetColumnGrid) {

                widgetData.data = [];

                $.each(me.widgetColumnGrid.dataSource.data(), function (idx, rec) {
                    widgetData.data.push({
                        domainObjectValueId  : rec.domainObjectValueId,
                        domainObjectValueType: rec.type ? rec.type : rec.domainObjectValueType,
                        domainObjectValueName: rec.domainObjectValueName,
                        discreetValues       : rec.discreetValues,
                        filterable           : rec.filterable,
                        sortable             : rec.sortable,
                        section              : rec.section,
                        selected             : rec.selected,
                        mini_widget          : rec.mini_widget,
                        positionNumber       : rec.positionNumber,
                        sortDir              : rec.sortDir,
                        hidden               : rec.hidden
                    });

                    if (rec.defaultSort) {
                        widgetData.sortAttribute = rec.domainObjectValueId;
                        widgetData.sortDir       = rec.sortDir;
                    }
                });
            }

            if (me.detailDomainObjectValues) {
                widgetData.detail = {
                    data            : me.detailDomainObjectValues,
                    domainObjectType: me.detailDomainObjectType,
                    domainDataView  : me.detailDomainDataView
                };
            }
            me.config.data.widgetType  = me.selectedWidgetType;
            me.config.data.widgetData  = JSON.stringify(widgetData);
            me.config.data.pictureName = me.iconSelector.data('name');

            var params = me.getParams(me.config.data);
            me.doSave(params);
        }
    },

    getParams: function (data) {
        'use strict';

        var me = this;

        // Just to be sure.
        if (typeof data.widgetData === 'object') {
            data.widgetData = JSON.stringify(data.widgetData);
        }
        return {
            id              : data.id,
            user            : App.config.user.id,
            name            : data.name,
            description     : data.description,
            widgetType      : data.widgetType,
            widgetData      : data.widgetData,
            location        : data.location ? data.location : App.config.locationNone,
            positionNumber  : data.positionNumber ? data.positionNumber : 0,
            parent          : data.parent ? data.parent : '',
            pictureName     : data.pictureName ? data.pictureName : '',
            domainObjectType: me.config.domainObjectType
        };
    },

    /**
     * Save Widget
     *
     * TODO save logic should be handled in App.ui.WidgetCatalog.Item
     * @param params
     */
    doSave            : function (params) {
        'use strict';

        var me     = this,
            action = 'createWidget2';

        if (me.config.data.id && me.config.data.id !== '') {
            action    = 'updateWidget2';
            params.id = me.config.data.id;
        }

        me.setSaveButtonBusy(true);
        me.showBusy(me.elDialogContent);

        $.ajax({
            url    : App.config.serviceUrl + 'caesarWidgetProvider/' + action,
            data   : params,
            success: function (response) {


                if (me.parentAssignment) {

                    /**
                     * Old widget catalog workflow:
                     * each widget will be updated, means for every widget update request will be fired
                     * Suggestions
                     * - widgetUpdate service should support bulk save OR
                     * - regular update / create service should support param for assigned children
                     */
                    var parentId     = response.id ? response.id : me.config.data.id,
                        unassigned   = me.parentAssignment.getAvailableIds(),
                        selected     = me.parentAssignment.getSelected(),
                        requestCount = 0;
                    //var params = data; // to be used in non widget catalog cases.
                    var requestMaxCount = unassigned.length + selected.length;

                    var callback = function () {
                        requestCount++;
                        if (requestCount === requestMaxCount) {
                            $.proxy(me.config.parentRef.getWidgetsByObjectTypeId(me.config.domainObjectType), me.config.parentRef);
                            //noinspection JSCheckFunctionSignatures
                            me.dialog.close();
                        }
                    };
                    // update widget catalog content
                    if (me.config.parentRef) {
                        $.each(selected, function (idx, selectedWidget) {
                            $.each(me.config.parentRef.widgets, function (key, widget) {
                                if (widget.config.id === selectedWidget.get('id')) {
                                    widget.config.parent         = parentId;
                                    widget.config.positionNumber = idx;
                                    widget.doSave(callback);
                                }
                            });
                        });

                        $.each(unassigned, function (idx, widgetId) {
                            $.each(me.config.parentRef.widgets, function (key, widget) {
                                if (widget.config.id === widgetId) {
                                    widget.config.parent = '';
                                    widget.doSave(callback);
                                }
                            });
                        });
                    }
                    // if ( ! me.config.parentRef) then assigning parents is happening
                    // without widget catalog being open, for this we need to grab the widgets
                    // and assign parents.
                    else {
                        requestCount = 0;
                        callback     = function () {
                            requestCount++;
                            if (requestCount === requestMaxCount) {
                                //noinspection JSCheckFunctionSignatures
                                me.dialog.close();
                            }
                        };

                        $.ajax({
                            url    : App.config.serviceUrl + 'caesarWidgetProvider/getWidgets2',
                            data   : {
                                domainObjectType: me.config.domainObjectType
                            },
                            success: function (response) {
                                var widgets = response.data;

                                $.each(selected, function (idx, selectedWidget) {
                                    $.each(widgets, function (key, widget) {
                                        if (widget.id === selectedWidget.get('id')) {
                                            widget.parent         = parentId;
                                            widget.positionNumber = idx;
                                            me.doSaveParentWidget(widget, callback);
                                        }
                                    });
                                });

                                $.each(unassigned, function (idx, widgetId) {
                                    $.each(widgets, function (key, widget) {
                                        if (widget.id === widgetId) {
                                            widget.parent = '';
                                            me.doSaveParentWidget(widget, callback);
                                        }
                                    });
                                });

                            }
                        });
                    }
                } else {
                    if (me.config.parentRef) {
                        $.proxy(me.config.parentRef.getWidgetsByObjectTypeId(me.config.domainObjectType), me.config.parentRef);
                    }
                    //noinspection JSCheckFunctionSignatures
                    me.dialog.close();
                }

                // Clear cached widget configuration.
                App.config.widgets[me.config.domainObjectType] = null;

                me.setSaveButtonBusy(false);
                me.hideBusy(me.elDialogContent);
            },
            error  : function () {
                me.setSaveButtonBusy(false);
                me.hideBusy(me.elDialogContent);
            }
        });
    },
    doSaveParentWidget: function (widget, callback) {
        var me     = this;
        var params = {
            id              : widget.id,
            user            : App.config.user.id,
            name            : widget.name,
            description     : widget.description,
            widgetType      : widget.widgetType,
            widgetData      : widget.widgetData,
            location        : widget.location,
            positionNumber  : widget.positionNumber,
            parent          : widget.parent,
            pictureName     : widget.pictureName,
            domainObjectType: me.config.domainObjectType
        };
        $.ajax({
            url    : App.config.serviceUrl + 'caesarWidgetProvider/updateWidget2',
            data   : params,
            success: callback
        });
    },

    initIconPicker: function () {
        'use strict';

        var container = $('#icon-picker-container'),
            el;

        // Only create popover once.
        if (!container.length) {
            container = $('<div>', {
                id     : 'icon-picker-container',
                'class': 'hidden'
            }).appendTo('body');

            el = $('<div>', {
                'class': 'icon-popover'
            }).appendTo(container);

            var html = '', i;

            $.each(this.widgetIconSets, function (idx, item) {
                html += '<h4><small>' + App.translate(item.name) + '</small></h4>';
                for (i = 1; i < item.count; i++) {
                    html += '<img src="images/icons/32px/' + item.pfx + i + '.png" title="' + item.pfx + i + '" class="btn">';
                }
            });
            el.html(html);
        } else {
            el = container.find('.icon-popover');
        }

        // Instead of just moving DOM nodes around (Bootstrap's popover() uses append for this), just clone the whole thing.
        return el.clone();
    }
});
