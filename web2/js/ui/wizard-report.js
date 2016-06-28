/**
 * Report wizard dialog
 * @type {void|*}
 */
App.ui.WizardReport = App.ui.WizardBase.extend({
    reportItems  : null,
    reportObjects: null,
    constraints  : {},

    /**
     *
     * @param config
     * @returns {*}
     */
    init: function (config) {
        'use strict';

        // Call parent constructor with config
        App.ui.WizardBase.fn.init.call(this, $.extend({
            reportId  : null,
            objectType: null,
            objectId  : null,
            title     : App.translate('Report Wizard')
        }, config));

        return this;
    },

    /**
     * Load wizard content
     */
    getView: function () {
        'use strict';

        var me = this;

        me.setSaveButtonLabel(App.translate('Create {0}', App.translate('Report')));

        if (!me.config.reportId) {
            me.hideBusy();
            App.log.error(App.translate('No Report ID given.'), me.config);
        } else {
            $.ajax({
                url    : App.config.serviceUrl + 'caesarReporting/createReportConfigView',
                data   : {
                    reportId        : me.config.reportId,
                    domainObjectId  : me.config.objectId,
                    domainObjectType: me.config.objectType
                },
                success: $.proxy(me.buildContainer, this),
                error  : function (jqXHR) {
                    var msg = '';
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
                    App.log.error(msg, me.config, true);
                    me.hideBusy();
                    $.proxy(me.onCancel(me), me);
                }
            });
        }
    },

    buildContainer: function (data) {
        'use strict';

        var me = this;
        if (!data.success) {
            App.log.error(data.messages[0], data, true);
            $.proxy(me.onCancel(this), this);
            return;
        }

        me.hideBusy();

        var buttonContainer = $('<div>', {
            'class': 'wizard-steps'
        }).appendTo(me.elMenu);

        //noinspection JSValidateTypes,JSUnresolvedVariable
        me.dialog.title(App.translate('{0} [Report]', data.reportName));

        if (me.useLock) {
            me.setLocked(true);
        }

        me.fields = [];

        me.elDescription.text(App.translate(data.ui.description));

        var stepCounter = 0;
        $.each(data.ui.items, function (key, item) {

            if (item.items.length) {
                var visible = true;
                stepCounter++;
                // collect constraints
                /** @namespace item.constraint */
                if (item.constraint) {
                    me.constraints[item.id] = item.constraint;
                    // hide item by default
                    visible = false;
                }

                var stepButton = $('<a>', {
                    'text' : item.name,
                    'id'   : item.id + 'Btn',
                    'class': 'btn',
                    'style': 'display : ' + (visible ? 'block' : 'none'),
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
                    stepButton.append('<br><span>' + item.description + '</span>');
                }

                me.buildStep(item.id, item.name, item.items, visible, stepCounter);
            }
        });

        // Activate first step.
        me.moveToStep(1);

        // Loop through constraints and hide / show.
        $.each(me.constraints, function (key, constraint) {

            $.each(me.fields, function (idx, field) {
                if (field.config.id === constraint.id) {
                    field.el.element.bind('change', function () {
                        var value = this.value();
                        $.proxy(me.doConstraintCheck(value), me);
                    });

                    if (field.getValue() === constraint.value) {
                        // Show button and content.
                        $('#' + key + 'Btn').show();
                        $('#' + key).show();
                    }
                }
            });
        });
        // After all steps are built, add next buttons to the visible steps except the last one
        //me.addNextButtons();
        //me.validateSteps(false);
    },

    doConstraintCheck: function (value) {
        'use strict';

        var me = this;
        $.each(me.constraints, function (idx, constraint) {
            if (value === constraint.value) {
                $('#' + idx + 'Btn').show();
                $('#' + idx).show();
            } else {
                $('#' + idx + 'Btn').hide();
                $('#' + idx).hide();
            }
        });
        //me.validateSteps(false);
    },

    buildStep: function (id, name, data, visible, stepCounter) {
        'use strict';

        var me           = this,
            dependencies = {},
            step         = me.renderStep(id, name, visible),
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


            var field = new App.ui.Field($.extend({
                renderTo        : dl,
                fieldLabel      : label,
                objectType      : me.config.objectType,
                objectId        : me.config.objectId,
                parentObjectType: me.config.parentObjectType,
                parentObjectId  : me.config.parentObjectId,
                refOwner        : me,
                container        : container
            }, item));

            /** @namespace item.activationDependency */
            if (item.activationDependency) {
                if (!dependencies[item.activationDependency]) {
                    dependencies[item.activationDependency] = [];
                }
                dependencies[item.activationDependency].push(field);
                if (!$('#' + item.activationDependency).is(':checked')) {
                    field.enable(false);
                }
            }

            if (item.readOnly) {
                field.enable(false);
            }
            me.fields.push(field);
        });

        me.buildDependencies(dependencies);
        // Associate Step button and step together
        step.parents('.widget').data('id', stepCounter);
        //After adding fields add input validators to user actions with the input, so the
        // validation happens individually
        /*step.find(':input:not(:button)').on('change focusout keyup blur', function () {
            if (!me.validator.validateInput($(this))) {
                me.updateSteps(step.parents('.widget').data('id'));
            } else {
                me.validateSteps(false);
            }
        });*/
    },

    /**
     *
     * @param dependencies
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

        if (this.validator && this.validator.validate()) {
            this.doSave();
        }
    },

    doSave: function () {
        'use strict';

        var me     = this,
            params = {
                domainObjectType: me.config.objectType,
                domainObjectId  : me.config.objectId,
                reportId        : me.config.reportId,
                objectData      : JSON.stringify(me.getObjectData())
            };

        me.setSaveButtonBusy(true);
        me.showBusy(me.elDialogContent);

        $.ajax({
            url    : App.config.serviceUrl + 'caesarReporting/createReport',
            data   : params,
            success: function (response) {
                me.setSaveButtonBusy(false);
                me.hideBusy(me.elDialogContent);
                $.proxy(me.onCancel(me), me);

                if (App.view.Notification) {
                    App.view.Notification.refresh();
                }

                if (response.refresh) {
                    App.checkChangedNavigationObjects(true);
                }
            },
            error  : function (response) {
                // Notify User.
                me.setSaveButtonBusy(false);
                me.hideBusy(me.elDialogContent);
                App.log.error(App.translate('Your report could not be created. Reason: {0}', response.responseText), response, true);
            }
        });
    },

    getObjectData: function () {
        'use strict';

        var me         = this,
            objectData = [];

        $.each(me.fields, function (idx, field) {
            if (field.el.isVisible()) {
                objectData.push({
                    id   : field.config.id,
                    value: field.getValue()
                });
            }
        });

        return objectData;
    }
});
