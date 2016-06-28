/**
 * Generates field for specified configuration (see field rules <add wiki link>)
 *
 *
 * @type {void|*|extend|extend|extend}
 */
App.ui.Field = kendo.Class.extend({
    el         : null,
    label      : null,
    description: null,

    init       : function (config) {
        'use strict';

        this.config = $.extend({
            renderTo                  : null,
            id                        : null,
            currentValues             : [],
            availablePlaceholderValues: [],
            isMandatory               : false,
            type                      : null,
            baseValue                 : null,
            objectType                : null,
            objectId                  : null,
            parentObjectType          : null,
            parentObjectId            : null,
            maxLength                 : null,
            hasMultipleValueSupport   : false,
            refOwner                  : null,
            /**
             * Dummy - remove later
             */
            fileUploadUrl             : App.config.serviceUrl + 'caesarVfs/create',
            fileDeleteUrl             : App.config.serviceUrl + 'caesarVfs/delete'
        }, config);

        var me = this;
        if (me.config.type == 'tripStages' && !me.config.parentObjectId) {
            console.error('Missing Parent Object Id in field trip stages.');
        }

        //me.label       = $('<dt>').text(App.translate(me.config.fieldLabel)).appendTo(me.config.renderTo).attr('required', me.config.isMandatory);

        /**
         * Does it have availableValues values? -> Dropdown, multiselect, tripstages.
         */
        if (me.config.hasOwnProperty('availableValues')) {
            if (me.config.type == 'tripStages') {
                me.el = App.component.TripStages.create({config: me.config});
            } else if (me.config.hasMultipleValueSupport) {
                me.el = App.component.Mutiselect.create({config: me.config});
            } else {
                me.el = App.component.Dropdown.create({config: me.config});
            }
        } else {
            /**
             * ... or render field depending on parameter value type id.
             */
            switch (me.config.type) {
                case 'boolean':
                    me.el = App.component.Checkbox.create({config: me.config});
                    break;
                case 'date':
                    if (me.config.hasMultipleValueSupport) {
                        me.el = App.component.Datelist.create({config: me.config});
                    } else {
                        me.el = App.component.Datepicker.create({config: me.config, type: 'date'});

                    }
                    break;
                case 'dateTime':
                    me.el = App.component.Datepicker.create({config: me.config, type: 'dateTime'});
                    break;
                case 'decimal':
                    //noinspection JSUnresolvedVariable
                    me.el = App.component.FieldNumeric.create({config: me.config, decimals: me.config.decimalPlaces});
                    break;
                case 'duration':
                    me.el = App.component.Durationpicker.create({config: me.config});
                    break;
                case 'hourMinute':
                    me.el = App.component.Timepicker.create({config: me.config});
                    break;
                case 'numeric':
                    me.el = App.component.FieldNumeric.create({config: me.config, decimals: 0});
                    break;
                case 'password':
                    me.el = App.component.Password.create({config: me.config});
                    break;
                case 'vfsImage':
                    me.el = App.component.FileUpload.create({config: me.config, isImage: true});
                    break;
                case 'vfsAttachment':
                    me.el = App.component.FileUpload.create({config: me.config, isImage: false});
                    break;
                case 'multiset':
                    me.el = App.component.Multiset.create({config: me.config});
                    break;
                case 'hierarchySelection':
                    me.el = App.component.HierarchySelection.create({config: me.config});
                    break;
                default: // e.g. string
                    if (me.config.availablePlaceholderValues.length) {

                        //noinspection JSUnresolvedVariable
                        if (me.config.hasLinebreakSupport) {
                            me.el = App.component.Editor.create({config: me.config});
                        } else {
                            me.el = App.component.Multiplaceholder.create({config: me.config});
                        }
                    } else {
                        me.el = App.component.Input.create({config: me.config});
                    }
                    break;
            }
        }

        if (me.config.objectId) {
            me.setHandlers();
        }

        return me;
    },
    setHandlers: function () {
        'use strict';

        var me      = this;
        var element = me.el.element;
        if (me.config.hasOwnProperty('availableValues') && !element.tree) {
            if (me.config.hasMultipleValueSupport) {
                element.wrapper.find('button').on('click', function () {
                    me.enableUpdate();
                });
                element.leftListView.on('dblclick', '.multiselect-row', function () {
                    me.enableUpdate();
                });
                element.rightListView.on('dblclick', '.multiselect-row', function () {
                    me.enableUpdate();
                });
                element.leftListView.data('kendoListView').bind('dataBound', me.enableUpdate);
            } else {
                element.bind('change', me.enableUpdate);
            }
        } else {
            /**
             * ... or render field depending on parameter value type id.
             */
            switch (me.config.type) {
                case 'multiset':
                    if (me.config.hasMultipleValueSupport) {
                        me.el.config.container.on('click', 'button', function (e) {
                            me.enableUpdate();
                        });
                        element.element.on('click', '.k-delete', function (e) {
                            me.enableUpdate();
                        });
                    } else {
                        element.bind('change', me.enableUpdate);
                    }
                    break;
                case 'boolean':
                    $(element).bind('change', me.enableUpdate);
                    break;
                case 'date':
                case 'dateTime':
                case 'hourMinute':
                case 'duration':
                    if (me.config.hasMultipleValueSupport) {
                        me.el.config.container.on('click', 'button', function (e) {
                            me.enableUpdate();
                        });
                        element.element.on('click', '.k-delete', function (e) {
                            me.enableUpdate();
                        });
                    } else {
                        element.bind('change', me.enableUpdate);
                    }
                    break;
                case 'decimal':
                case 'numeric':
                    element.bind('change', me.enableUpdate).bind('spin', me.enableUpdate);
                    break;
                case 'password':
                    $(element).bind('keyup', me.enableUpdate);
                    break;
                case 'vfsImage':
                case 'vfsAttachment':
                    element.bind('select', me.enableUpdate);
                    break;
                case 'hierarchySelection':
                    me.el.tree.bind('check', me.enableUpdate);
                    break;
                default: // e.g. string, selectionTree etc
                    if (me.config.availablePlaceholderValues.length) {

                        //noinspection JSUnresolvedVariable
                        if (me.config.hasLinebreakSupport) {
                            element.bind('keyup', me.enableUpdate);
                        } else {
                            element.bind('change', me.enableUpdate);
                        }
                    } else if (element.tree) {
                        element.tree.data('kendoTreeView').dataSource.bind('change', me.enableUpdate);
                    } else {
                        $(element).bind('keyup', me.enableUpdate);
                    }
                    break;
            }
        }
    },
    /**
     * returns value, formatted for date fields
     */
    getValue   : function () {
        'use strict';
        var me    = this,
            value = null,
            date  = null,
            fieldValue,
            data,
            items = [];

        switch (me.config.type) {
            case 'boolean':
                value = $(me.el.element).is(':checked') ? 'on' : false;
                break;
            case 'date':
                if (me.config.hasMultipleValueSupport) {
                      data = me.el.element.dataSource.view();

                    $.each(data, function (idx, item) {
                        fieldValue = (item.currentValues) ? item.currentValues[0] : item.displayValue;
                        items.push(fieldValue);
                    });
                    value = items;
                } else {
                    //noinspection JSUnresolvedFunction
                    date = kendo.parseDate(me.el.getValue());
                    if (date) {
                        value = kendo.toString(date, App.config.dateFormat);
                    }
                    if (value && value.length === 0) {
                        value = null;
                    }
                }
                break;
            case 'multiset':

                data = me.el.element.dataSource.view();
                if (data.length === 0) {
                    value = null;
                } else {
                    //Eventually to be formatted at the server side
                    var ServerFormat = '#(';
                    for (var j = 0; j < data.length; j++) {
                        if (j === data.length - 1) {
                            ServerFormat += '#(' + data[j].baseValue + '))';
                        } else {
                            ServerFormat += '#(' + data[j].baseValue + ') ';
                        }

                    }
                    value = ServerFormat;
                }

                break;
            case 'dateTime':
                //noinspection JSUnresolvedFunction
                date = kendo.parseDate(me.el.getValue());
                if (date) {
                    // Timezone - subtract offset.
                    App.util.dateToGMT(date);

                    value = kendo.toString(date, App.config.dateTimeFormat);
                }
                if (value && value.length === 0) {
                    value = null;
                }
                break;
            case 'duration':
                //var days = me.dayPicker.value();
                date = kendo.parseDate(me.el.getValue());
                if (date !== null) {
                    //value = days * 86400;
                    value = date.getHours() * 3600;
                    value += date.getMinutes() * 60;

                    if (value === 0) {
                        value = null;
                    }
                }
                break;
            case 'hourMinute':
                //noinspection JSUnresolvedFunction
                date = kendo.parseDate(me.el.getValue());
                if (date !== null) {
                    value = date.getHours() * 3600;
                    value += date.getMinutes() * 60;

                    if (value === 0) {
                        value = null;
                    }
                }
                break;
            case 'vfsAttachment':
            case 'vfsImage':
                // trigger file upload
                value = me.el.element.options.fileName;
                if (typeof value === 'string' && value.length === 0) {
                    value = null;
                }
                break;
            // FIXME temporary workaround
            case 'numeric':
                value = me.el.getValue();
                break;
            default:
                if (typeof me.el.getValue === 'function') {
                    value = me.el.getValue();

                    // Check for snippet editor and replace square brackets
                    if (me.config.availablePlaceholderValues.length) {

                        //noinspection JSUnresolvedVariable
                        if (me.config.hasLinebreakSupport) {
                            value = value.replace(/&lt;/g, '<').replace(/&gt;/g, '>');
                        } else {
                            value = value.join(';');
                        }
                    }
                } else {
                    value = $(me.el).val();
                }

                if (typeof value === 'string' && value.length === 0) {
                    value = null;

                    if (me.config.type === 'numeric' ||
                        me.config.type === 'decimal') {
                        value = 0;
                    }
                }

                break;
        }
        return value;
    },

    /**
     * Enables / disables field
     *
     * @param state
     */
    enable: function (state) {
        'use strict';

        var me = this;
        if (me.el && typeof me.el.enable === 'function') {
            me.el.enable(state);
        } else {
            if (!state) {
                $(me.el).attr('disabled', 'true');
            } else {
                $(me.el).removeAttr('disabled');
            }
        }
    },

    isVisible: function () {
        'use strict';

        var me      = this,
            visible = true;

        if (me.el.wrapper) {
            visible = me.el.wrapper.is(':visible');
        } else {
            visible = me.el.visible ? me.el.visible : $(me.el).is(':visible');
        }

        return visible;
    },

    renderTooltip: function (description) {
        'use strict';

        if (this.el && typeof this.el.renderTooltip === 'function') {
            $.extend(this.el, {
                description: description
            });
            this.el.renderTooltip();
        }
    },
    enableUpdate : function () {
        var saveButton = $('.k-ext-dialog').find('[data-action="save"]');
        saveButton.attr('disabled', false);
        saveButton.removeClass('disabled');
        //avoid readonly dropdownlists
        saveButton.find(':input').attr('tabindex', 0);
        saveButton.find('.k-dropdown-wrap:not(.k-state-disabled)').parents('.k-dropdown').attr('tabindex', 0);
    }
});
