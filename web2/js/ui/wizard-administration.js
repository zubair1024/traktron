/**
 * Administration wizard dialog
 * @type {void|*}
 */
App.ui.WizardAdmin = App.ui.WizardBase.extend({
    fileUploadFields: [],
    fileUploadCount : 0,
    useLock         : true,
    constraints     : {},

    componentTypes:{
        'numeric': 'NumericField'
    },

    /**
     * @param config
     * @returns {*}
     */
    init: function (config) {
        'use strict';

        var me = this;

        me.fileUploadFields = [];
        me.fileUploadCount  = 0;

        // Call parent constructor with config
        App.ui.WizardBase.fn.init.call(this, $.extend({
            title           : App.translate('Asset Administration'),
            objectType      : null,
            parentObjectId  : null,
            parentObjectType: null,
            objectId        : null,
            label           : null
        }, config));

        // If the parentObjectId is null and there is a parent node available then fetch it from there.
        if (App.current.treeRefreshNode && App.current.treeRefreshNode.id && !me.config.parentObjectId) {
            me.config.parentObjectId = App.current.treeRefreshNode.id.split(App.config.idDivider)[1];
        }
        return me;
    },

    /**
     * Load wizard content
     */
    getView       : function () {
        'use strict';

        // check if create or update
        var me            = this,
            titleTemplate = App.translate('Add') + ' {0}',
            service       = 'getCreateView',
            params        = {};

        if (me.config.objectId) {
            switch (me.config.label) {
                case 'account':
                    titleTemplate = 'Update My Profile';
                    me.hasI18n    = true;
                    break;
                default:
                    titleTemplate = App.translate('Update') + ' {0}';
                    break;
            }
            service = 'getUpdateView';
            params  = {
                objectType      : me.config.objectType,
                objectId        : me.config.objectId,
                parentObjectId  : me.config.parentObjectId,
                parentObjectType: me.config.parentObjectType
            };
        } else {
            params = {
                objectType      : me.config.objectType,
                parentObjectId  : me.config.parentObjectId,
                parentObjectType: me.config.parentObjectType
            };
        }

        // Adjust title and button label.
        var buttonLabel = App.translate(titleTemplate, App.util.format.domainObjectType(me.config.objectType));
        me.setSaveButtonLabel(buttonLabel);
        //noinspection JSValidateTypes
        me.dialog.title(buttonLabel);

        $.ajax({
            url    : App.config.serviceUrl + 'generalAdmin/' + service,
            data   : params,
            global : false,
            success: $.proxy(me.buildContainer, me),
            error  : function (jqXHR, textStatus, thrownError) {
                var msg = '';

                if (textStatus === 'parsererror') {
                    App.log.checkJsonResponse(jqXHR, thrownError, params);
                } else {
                    if (jqXHR.responseText) {
                        if (jqXHR.responseText.indexOf('{"messages"') === 0) {
                            var result = $.parseJSON(jqXHR.responseText);
                            msg += result.messages.join('<br>');
                        } else {
                            msg += jqXHR.responseText;
                        }
                    } else {
                        msg += jqXHR.statusText;
                    }
                    App.log.error(msg, null, true);
                }
                me.hideBusy();
                $.proxy(me.onCancel(me), me);
            }
        });
    },
    /**
     * Build wizard elements from backend data
     *
     * @param data
     */
    buildContainer: function (data) {
        'use strict';

        var me = this;

        if (!data.success) {
            App.log.error(data.messages[0], data, true);
            $.proxy(me.onCancel(me), me);
            return;
        }
        me.hideBusy();

        var buttonContainer = $('<div>', {
            'class': 'wizard-steps'
        }).appendTo(me.elMenu);

        if (me.useLock) {
            me.setLocked(true);
        }

        me.fields = [];

        me.elDescription.text(App.translate(data.ui.description));

        var stepCounter = 0;
        $.each(data.ui.children, function (key, item) {

            if (item.children.length) {
                stepCounter++;
                var stepButton = $('<a>', {
                    'text' : App.translate(item.name),
                    'class': 'btn',
                    'click': function () {
                        // move to this step
                        var stepButton = $(this);
                        me.moveToStep(stepButton.data('id'));
                        // Move the focus on the first control in the stepPanel
                        var thisStepPanel = me.elContent.find('.widget:visible').filter(function () {
                            return $(this).data('id') == stepButton.data('id');
                        });
                        if (thisStepPanel.find(':input:first').data('role') === 'dropdownlist') {
                            //noinspection JSValidateTypes
                            thisStepPanel.find(':input:first').parent().focus();
                        } else {
                            thisStepPanel.find(':input:first').focus();
                        }
                    }
                }).appendTo(buttonContainer);
                // Associate Step button and step together
                stepButton.data('id', stepCounter);
                if (item.description) {
                    stepButton.append('<br><span>' + App.translate(item.description) + '</span>');
                }
                me.buildStep(key, item.name, item.children, stepCounter);
            }
        });

        // Activate first step.
        me.moveToStep(1);

        // Loop through constraints and hide / show.
        $.each(me.constraints, function (key, constraint) {

            $.each(me.fields, function (idx, field) {

                if (field.config.id === constraint.id) {
                    $(field.el).bind('change', function () {
                        // Backend can only send string instead of bool
                        $.proxy(me.doConstraintCheck($(this).is(':checked') ? 'true' : 'false'), me);
                    });

                    var constraintField = me.getFieldById(key),
                        val             = $(field.el).is(':checked') ? 'true' : 'false';

                    if (val === constraint.value) {
                        me.showField(constraintField);
                    } else {
                        me.showField(constraintField, false);
                    }
                }
            });
        });
        // After all steps are built, add next buttons to the visible steps except the last one
        //me.addNextButtons();
        //me.validateSteps(false);
        if (me.config.objectId) {
            var saveButton    = $('.k-ext-dialog').find('[data-action="save"]');
            saveButton.addClass('disabled');
            saveButton.attr('disabled', true);
            saveButton.find(':input').attr('tabindex', -1);
            saveButton.find('.k-dropdown').attr('tabindex', -1);
        }

    },
    /**
     * Build wizard steps
     *
     * @param id
     * @param name
     * @param data
     * @param stepCounter
     */
    buildStep     : function (id, name, data, stepCounter) {
        'use strict';

        var me              = this,
            dependencies    = {},
            step            = me.renderStep(id, name),
            hasI18nControls = false;

        var dl = $('<dl>', {
            'class': 'dl-horizontal'
        }).appendTo(step);

        $.each(data, function (key, item) {

            // Collect constraints
            /** @namespace item.constraint */
            if (item.constraint) {
                me.constraints[item.id] = item.constraint;
            }

            if (me.hasI18n) {
                hasI18nControls = App.i18n.addControls(item) || hasI18nControls;
            }

            // TODO create description in a <dt> and wrap field/component in a <dd>
            var label = $('<dt>')
                .text(App.translate(item.name))
                .appendTo(dl)
                .attr('required', item.isMandatory);

            var container = $('<dd>').appendTo(dl);

            // TODO instantiate components directly.
            // TODO Later on, this is something like "new App.component[this.componentTypes[item.type]](config)"
            var field     = new App.ui.Field($.extend({
                renderTo        : dl,
                fieldLabel      : item.name,
                objectType      : me.config.objectType,
                objectId        : me.config.objectId,
                parentObjectType: me.config.parentObjectType,
                parentObjectId  : me.config.parentObjectId,
                refOwner        : me,
                container       : container
            }, item));
            field.label = label;
            //if (item.description) {
            //    me.description = $('<span>', {
            //        'class'      : 'glyphicon glyphicon-question-sign',
            //        'data-toggle': 'tooltip',
            //        'title'      : item.description
            //    }).appendTo(container);
            //
            //    // We need to define a tooltip here since the container of this dialog has a different z-index than the body.
            //    me.description.tooltip({container: me.elDialogContent, placement: 'top'});
            //}

            if (item.activationDependency) {
                if (!dependencies[item.activationDependency]) {
                    dependencies[item.activationDependency] = [];
                }
                dependencies[item.activationDependency].push(field);
                if (!$('#' + item.activationDependency).is(':checked')) {
                    field.enable(false);
                }
            }

            field.enable(item.readOnly);
            field.renderTooltip(item.description);
            me.fields.push(field);



        });

        me.buildDependencies(dependencies);

        // Associate step button with step.
        step.parents('.widget').data('id', stepCounter);

        // FIXME Commented out since it is not performant at all. Find a better way. see CAES-863
        //// After adding fields add input validators to user actions with the input, so the validation happens individually
        //step.find(':input:not(:button)').on('change focusout keyup blur keydown keypress', function (e) {
        //    // To prevent the form from submit event on enter or Num-bad enter.
        //    if(e.keyCode === kendo.keys.ENTER || e.keyCode === kendo.keys.NUMPAD_ENTER) {
        //        e.preventDefault();
        //    }
        //    if (!me.validator.validateInput($(this))) {
        //        me.updateSteps(step.parents('.widget').data('id'));
        //    }
        //    else {
        //        me.validateSteps(false);
        //    }
        //});

        // Look for user settings specific elements... and enrich if necessary.
        if (hasI18nControls) {
            App.i18n.addPreview(step, me.fields);
        }
    },

    doConstraintCheck: function (value) {
        'use strict';

        var me = this;
        $.each(me.constraints, function (key, constraint) {
            var field = me.getFieldById(key);
            if (value === constraint.value) {
                me.showField(field);
            } else {
                me.showField(field, false);
            }
        });
    },

    /**
     *
     */
    buildDependencies: function (dependencies) {
        'use strict';

        $.each(dependencies, function (key, items) {
            $('#' + key).on('change', function () {
                var that = this;
                $.each(items, function (idx, field) {
                    field.enable(that.checked);
                });
            });
        });
    },

    onSave: function () {
        'use strict';

        console.log('onSave');

        // collect data / validate
        var me                = this,
            currentObjectType = me.config.objectType,
            currentObjectId   = me.config.objectId;

        if (me.isElementValid(me.elContent, true)) {

            if (!me.config.objectId) {
                currentObjectType = me.config.parentObjectType;
                currentObjectId   = me.config.parentObjectId;
            }

            $.ajax({
                url    : App.config.serviceUrl + 'generalAdmin/checkLock',
                data   : {
                    objectType: currentObjectType,
                    objectId  : currentObjectId
                },
                success: function (response) {

                    if (!response.locked) {

                        // check if wizard contains file upload fields otherwise save form
                        if (me.fileUploadFields.length) {
                            me.doFileUpload();
                        } else {
                            me.doSave(true);
                        }
                    }
                }
            });
        }
    },

    doFileUpload: function () {
        'use strict';

        var me           = this,
            deferreds    = [],
            uploadFields = [];

        me.setSaveButtonBusy(true);

        // First determine if file upload fields should be delete data and / or upload
        $.each(me.fileUploadFields, function (idx, field) {

            if (field.options.deleteFile) {
                deferreds.push($.ajax({
                    url : App.config.serviceUrl + 'caesarVfs/delete',
                    data: {
                        domainObjectId  : me.config.objectId,
                        domainObjectType: me.config.objectType,
                        filename        : field.el.options.fileName
                    }
                }));

                field.options.fileName = '';
            }

            uploadFields.push(field);
        });

        if (deferreds.length) {
            // We have some deletions
            $.when.apply($, deferreds).always(function () {
                me.setSaveButtonBusy(false);
                me.doSave(true);

                if (uploadFields.length) {
                    // If something exists for upload process upload
                    me.processUpload(uploadFields);
                } else {
                    // If not, save form
                    me.doSave(true);
                }
            });
        } else if (uploadFields.length) {
            // Process Upload for file fields
            me.processUpload(uploadFields);
        } else {
            // Nothing to delete / upload save directly
            me.doSave(true);
        }
    },

    processUpload: function (uploadFields) {
        $.each(uploadFields, function (idx, field) {
            // Not possibly to use something like $.when...
            // onUploadSuccess counts processes and triggers doSave
            field._module.onSaveSelected();
        });
    },

    doSave: function (cancel) {
        'use strict';

        var me         = this,
            service    = 'generalAdmin/createObject',
            objectData = me.getObjectData();

        var params = {
            objectType: me.config.objectType,
            parentType: me.config.parentObjectType,
            parentId  : me.config.parentObjectId,
            objectData: JSON.stringify(objectData)
        };

        // Update object
        if (me.config.objectId) {
            service         = 'generalAdmin/updateObject';
            params.objectId = me.config.objectId;
        }

        me.setSaveButtonBusy(true);
        me.showBusy(me.elDialogContent);

        $.ajax({
            url    : App.config.serviceUrl + service,
            data   : params,
            success: function (response) {
                var object = response.object;

                if (cancel) {
                    // Close dialog.
                    $.proxy(me.onCancel(me), me);

                    if (me.config.label === 'account') {
                        me.updateUserSettings(objectData);
                    } else {
                        var objectType = object.domainObjectType,
                            objectId   = object.id,
                            name       = object.name;

                        // TODO remove Sonderlocke later
                        if (object.domainObjectType === 'jobcard') {
                            objectType = me.config.parentObjectType;
                            objectId   = me.config.parentObjectId;
                            name       = App.current.objectName;
                        }

                        // get path from object
                        $.ajax({
                            url    : App.config.serviceUrl + 'caesarOrganizationStructure/objectHierarchy',
                            data   : {
                                domainObjectId  : objectId,
                                domainObjectType: objectType
                            },
                            success: function (response) {
                                //response.pop();
                                var parent = response[response.length - 1],
                                    tree   = App.view.navigationTree.treeview;

                                if (App.current.treeRefreshNode && (parent.domainObjectTypeId !== App.current.treeRefreshNode.id)) {

                                    // parent changed
                                    var dataItem = tree.dataSource.get(parent.domainObjectTypeId);
                                    if (dataItem.loaded()) {

                                        // reload new parent
                                        tree.dataSource.bind('change', function updateLevel(e) {
                                            var groupId = e.node && e.node.id;

                                            if (groupId === dataItem.id) {
                                                tree.dataSource.unbind('change', updateLevel);
                                                me._refreshParentNode(false);
                                                App.cmd.show(objectType, objectId, name);
                                                App.config.lastTreeRefresh = new Date();
                                            }
                                        });
                                        dataItem.loaded(false);
                                        dataItem.load();
                                    } else {
                                        // nothing to load route to object
                                        me._refreshParentNode(true, objectType, objectId, App.router.encodeParam(name));
                                    }
                                } else {
                                    me._refreshParentNode(true, objectType, objectId, App.router.encodeParam(name));
                                }
                            }
                        });
                    }
                }
                me.setSaveButtonBusy(false);
                me.hideBusy(me.elDialogContent);
            },
            error  : function () {
                me.setSaveButtonBusy(false);
                me.hideBusy(me.elDialogContent);
            }
        });
    },

    _refreshParentNode: function (navigateCurrent, domainObjectType, id, name) {
        var me = this;

        // reload current parent and navigate
        if (App.current.treeRefreshNode) {

            // Just to get sure if the parent node is not expanded we re-set the current expanded node
            // we need to store expanded node data because of sending objectType and objectId
            // kendo only allows "id" by default but we need both values when loading data from backend
            App.view.navigationTree.expandedNode = App.current.treeRefreshNode;
            App.current.treeRefreshNode.loaded(false);

            if (!me.config.objectId) {

                // we want to add an object to an other object
                // if the parent has no children then kendo does not load by calling load()
                // so we have to set hasChildren
                App.current.treeRefreshNode.hasChildren = true;
            }

            if (navigateCurrent) {
                var tree = App.view.navigationTree.treeview;
                tree.dataSource.bind('change', function updateLevel(e) {
                    var groupId = e.node && e.node.id;

                    if (groupId === App.current.treeRefreshNode.id) {
                        tree.dataSource.unbind('change', updateLevel);
                        App.cmd.show(domainObjectType, id, name);
                        App.config.lastTreeRefresh = new Date();
                    }
                });
            }
            App.current.treeRefreshNode.load();
        } else {
            App.cmd.show(domainObjectType, id, name);
        }
    },

    onUploadSuccess: function (e) {
        'use strict';

        var me       = this,
            filename = e.response.filename;

        me.fileUploadCount++;
        e.sender.options.fileName = filename;

        var previewEl = $('#preview_' + e.sender.options.id);
        previewEl.empty();

        var params                     = {
            domainObjectId  : me.config.objectId,
            domainObjectType: me.config.objectType,
            filename        : filename
        };
        params[App.config.sessionName] = App.config.sessionId;
        var url                        = App.config.serviceUrl + 'caesarVfsResource/get?' + $.param(params);

        if (e.sender.options.isImage) {
            $('<img class="img-thumbnail" alt="" src="' + url + '">').appendTo(previewEl);
        } else {
            $('<a target="_blank" href="' + url + '">' + filename + '</a>').appendTo(previewEl);
        }

        if (me.fileUploadCount === me.fileUploadFields.length) {
            me.doSave(true);
        }
    },

    getObjectData: function () {
        'use strict';

        var objectData = [];
        for (var i = 0; i < this.fields.length; i++) {
            objectData.push({
                id   : this.fields[i].config.id,
                value: this.fields[i].getValue()
            });
        }
        return objectData;
    },

    setLocked: function (state) {
        'use strict';

        var me                = this,
            service           = App.config.serviceUrl + (state ? 'generalAdmin/updateLock' : 'generalAdmin/removeLock'),
            currentObjectType = me.config.objectType,
            currentObjectId   = me.config.objectId;

        if (!me.config.objectId) {
            currentObjectType = me.config.parentObjectType;
            currentObjectId   = me.config.parentObjectId;
        }

        $.ajax({
            url    : service,
            data   : {
                objectType: currentObjectType,
                objectId  : currentObjectId
            },
            success: function (response) {
                if (response.result !== 'ok') {
                    // show something
                }
            }
        });
    },

    updateUserSettings: function (data) {
        'use strict';

        // Simplify data structure.
        var userSettings = {};
        for (var i = 0; i < data.length; i++) {
            var item              = data[i];
            userSettings[item.id] = item.value;
        }

        App.config.user.culture            = userSettings.culture;
        App.config.user.dataGridPageSize   = userSettings.dataGridPageSize;
        App.config.user.geoReferenceSystem = userSettings.geoReferenceSystem;
        App.config.user.language           = userSettings.language;
        App.config.user.measurementSystem  = userSettings.measurementSystem;

        // If timeZone has been changed, update config with the real offset.
        if (App.config.user.timeZone !== userSettings.timeZone) {
            $.each(this.fields, function (idx, field) {
                if (field.config.id === 'timeZone') {
                    App.config.user.timeZoneOffset = parseInt(field.el.dataItem().offset);
                }
            });
            App.config.user.timeZone = userSettings.timeZone;
        }

        App.i18n.load(App.config.user.language, function () {
            App.i18n.update(App.config.culture, function () {
                // Refresh all widgets and sub widgets.
                $.each(App.view.widgets, function (idx, widget) {
                    // Does widget have subwidgets?
                    if (widget.items && widget.items.length > 0) {

                        // yes, refresh them, too.
                        $.each(widget.items, function (subidx, subwidget) {
                            subwidget.refresh();
                        });
                    }
                    widget.refresh();
                });
            });
            //refresh the navigation tree
            App.loadNavigationTreeView();
            //refresh the alarm bar
            App.view.Alarm.refresh();
            //go to the last known route
            App.router.navigate(App.router.lastRoute);
        });
    },

    onClose: function () {
        'use strict';

        var me = this;
        if (me.useLock) {
            me.setLocked(false);
        }
    }

});
