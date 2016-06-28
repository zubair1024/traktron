/*jshint unused:false */
/**
 * Wizard dialog
 * @type {*}
 */
App.ui.WizardBase = kendo.Class.extend({
    config         : {},
    stepHeight     : null,
    bodyTemplate   : '<div id="wizard"><div class="wizard-menu"></div><form class="wizard-content"><div class="wizard-description"></div></form></div>',
    /**
     * a jQuery reference to #wizard
     * @type jQuery
     */
    elDialogContent: null,
    /**
     * @type jQuery
     */
    elDescription  : null,
    /**
     * a jQuery reference to .wizard-content
     * @type jQuery
     */
    elContent      : null,
    /**
     * @type jQuery
     */
    elMenu         : null,
    /**
     * @type jQuery
     */
    elButtons      : null,
    /**
     * contains reference to kendoExtDialog
     */
    dialog         : null,
    data           : null,
    title          : null,
    objectName     : null,
    fields         : [],
    validator      : null,
    returnRoute    : null,

    /**
     *
     * @param config
     * @returns {*}
     */
    init: function (config) {
        'use strict';

        this.config = $.extend({
            title       : App.translate('Wizard'),
            minWidth    : 450,
            width       : 850,
            height      : (2 / 3) * document.body.clientHeight,
            modal       : true,
            visible     : false,
            message     : '',
            /**
             * if false, the route is not changed on dialog close. Normally, it navigates to the dummy route "/".
             */
            routeOnClose: true,
            buttons     : [
                {
                    name : App.translate('Cancel'),
                    click: $.proxy(this.onCancel, this)
                },
                {
                    name       : App.translate('Save'),
                    click      : $.proxy(this.onSave, this),
                    action     : 'save',
                    loadingText: App.translate('processing...')
                }
            ]
        }, config);

        /**
         * Add functionality to fetch external data if an API service is avaliable
         */
        if (App.config.externalSystemUrl) {
            this.config.buttons.unshift({
                name       : App.translate('Fetch'),
                click      : $.proxy(this.onFetch, this),
                action     : 'fetch',
                loadingText: App.translate('processing...')
            });
        }

        console.log(this.config);

        // Create a bunch of content divs.
        $(this.bodyTemplate).appendTo('body');
        this.elDialogContent = $('#wizard');

        this.returnRoute = App.router.currentRoute;

        return this;
    },

    /**
     * Create wizard dialog
     */
    show: function () {
        'use strict';

        var me      = this;
        //noinspection JSUnresolvedFunction
        this.dialog = this.elDialogContent.kendoExtDialog(this.config).data('kendoExtDialog');
        this.dialog.bind('deactivate', function () {
            me.destroy();

            // Re-enable body scrolling.
            me.enableBgScrolling();

            if (me.config.routeOnClose) {
                App.router.navigate(me.returnRoute);
            }
        });

        this.dialog.bind('open', function () {

            // Bind elements late.
            me.elMenu        = me.elDialogContent.find('.wizard-menu');
            me.elContent     = me.elDialogContent.find('.wizard-content');
            me.elDescription = me.elDialogContent.find('.wizard-description');
            me.elButtons     = me.elDialogContent.parent().find('.k-ext-dialog-buttons');
            //noinspection JSValidateTypes
            me.stepHeight    = me.elDialogContent.height() - me.elButtons.outerHeight();
            // To make this work, elContent needs to be a form.
            //noinspection JSUnresolvedFunction
            me.validator = me.elContent.kendoValidator(App.util.forms.validator).data('kendoValidator');

            // Show spinner.
            me.showBusy();
            me.getView();

            // Disable scrolling of the body.
            me.disableBgScrolling();
        });

        this.dialog.bind('close', $.proxy(this.onClose, this));

        this.dialog.center().open();
        // After all steps are built and visible, add next buttons to the visible steps except the last one
        //me.addNextButtons();
        // disable steps and step buttons after the invalid step, but without showing validation msgs
        //me.validateSteps(false);
        me.elContent.on('scroll', {scrolledByCode: 0}, function (e) {
            me.scrollSpy(e);
        });
    },

    scrollSpy: function (e) {
        var me = this;
        // If this event is triggered by code, basically set this flag back and do nothing.
        if (e.data.scrolledByCode) {
            e.stopPropagation();
            me.elContent.on('scroll', {scrolledByCode: 0}, function (e) {
                me.scrollSpy(e);
            });
            return;
        }
        var visiblePanels = me.elContent.find('.widget:visible');
        var visibleArea   = $(me.elContent);
        var elem;
        $.each(visiblePanels, function (stepIndex, visiblepanel) {
            elem = $(visiblepanel);
            if (me.elContent && elem) {
                var docViewTop     = visibleArea.position().top;
                var docViewBottom  = docViewTop + visibleArea.height();
                var docViewMiddle  = (docViewBottom - docViewTop) / 2;
                var elemTop        = elem.position().top;
                var elemBottom     = elemTop + elem.height();
                var stepButtons    = me.elMenu.find('.btn:visible');
                var stepButton     = $(stepButtons[stepIndex]);
                var firstElemTop   = $(visiblePanels[0]).position().top;
                var lastElemBottom = $(visiblePanels[visiblePanels.length - 1]).position().top + $(visiblePanels[visiblePanels.length - 1]).height();
                if (!stepButton.hasClass('disabled') && !stepButton.hasClass('active')) {
                    // If the scrollTop at the max top of the view, then the first element is activated
                    if (firstElemTop > docViewTop && !$(stepButtons[0]).hasClass('disabled')) {
                        stepButtons.removeClass('active');
                        $(stepButtons[0]).addClass('active').scrollintoview({
                            direction: 'vertical'
                        });
                        return false;
                    }
                    // If the scrollTop at the max bottom of the view, then the last element is activated
                    if (lastElemBottom < docViewBottom && !$(stepButtons[visiblePanels.length - 1]).hasClass('disabled')) {
                        stepButtons.removeClass('active');
                        $(stepButtons[visiblePanels.length - 1]).addClass('active').scrollintoview({
                            direction: 'vertical'
                        });
                        return false;
                    }
                    /*
                     * Testing if the element is covering the middle line of visible area
                     *  _______________ top of the element.
                     * |               |
                     *___________________middle line of visible area.
                     * |_______________| bottom of the element.
                     * Original definition for Scrolled into view assumes that the element is
                     * smaller than visible area ((elemBottom <= docViewBottom) && (elemTop >= docViewTop))
                     * To avoid this confusion we will consider the element scrolled into view if it covers
                     * the middle line of the visible area.
                     * so this check is independent from element size (> or < visible area) and if
                     * there are many elements in the view only one of them satisfies this condition
                     */
                    if (elemTop < docViewMiddle && elemBottom > docViewMiddle) {
                        stepButtons.removeClass('active');
                        stepButton.addClass('active');
                        // Scroll the step button into the middle view to point to the correct step.
                        me.elMenu.scrollTop(me.elMenu.scrollTop() + stepButton.position().top - me.elMenu.position().top - me.elMenu.height() / 2);
                        return false;
                    }
                }
            }
        });
    },
    destroy  : function () {
        'use strict';

        if (this.dialog) {
            this.dialog.destroy();
        }
        //enabled scroll bar
        this.enableBgScrolling();
    },

    /**
     * close the dialog
     *
     * @param btn
     */
    onCancel: function (btn) {
        'use strict';

        //noinspection JSCheckFunctionSignatures
        btn.dialog.close();
    },

    /**
     * Load wizard content
     */
    getView: function () {

        // fetch wizard config and call this.buildContainer as success handler afterwards

    },

    /**
     * Show Spinner
     * @param {*} el element to be covered by the loading mask
     */
    showBusy: function (el) {
        'use strict';

        kendo.ui.progress(el || this.dialog.wrapper, true);
    },

    /**
     * Hide Spinner
     * @param el element to be covered by the loading mask
     */
    hideBusy: function (el) {
        'use strict';

        kendo.ui.progress(el || this.dialog.wrapper, false);
    },

    /**
     * Build wizard elements from backend data
     *
     * @param data
     */
    buildContainer: function (data) {

    },

    /**
     * Build wizard steps
     *
     * @param id
     * @param name
     * @param data
     */
    buildStep: function (id, name, data) {

    },

    /**
     * Build wizard step container for one step
     *
     * @param id
     * @param title
     * @param {boolean=} visible
     * @returns {*|jQuery}
     */
    renderStep: function (id, title, visible) {
        'use strict';
        var me = this;
        if (visible === undefined) {
            visible = true;
        }

        // Create widget.
        var panel = $('<div>', {
            'class': 'widget',
            'id'   : id,
            'style': 'display : ' + (visible ? 'block' : 'none'),
            // Activate step button on focus in.
            focusin: function () {
                var id          = $(this).data('id');
                var stepButtons = me.elMenu.find('.btn');
                var stepButton  = stepButtons.filter(function () {
                    return $(this).data('id') == id;
                });
                if (!stepButton.hasClass('disabled') && !stepButton.hasClass('active')) {
                    // Remove "active" class from all other step buttons.
                    stepButtons.removeClass('active');

                    // Add active to the one we want to activate.
                    stepButton.addClass('active').scrollintoview({direction: 'vertical'});
                }
            }
        });

        // Create title
        $('<div class="widget-header"><span class="widget-header-title">' + App.translate(title) + '</span></div>').appendTo(panel);

        var content = $('<div class="widget-content k-content">').appendTo(panel);

        var innerContent = $('<div>').appendTo(content);

        $('<div id="nextButtonContainer">').appendTo(content);

        panel.appendTo(this.elContent);

        return innerContent;
    },

    /*addNextButtons: function () {
     var me              = this;
     var visiblePanels   = me.elContent.find('.widget:visible');
     var lastVisibleStep = me.elContent.find('.widget:visible').length;
     $.each(visiblePanels, function (idx, visibleStep) {
     // Add next buttons to all steps except the last one
     if (idx < lastVisibleStep - 1) {
     var buttonWrapper = $('<div>', {
     'class': 'widget-next-btn-wrapper'
     }).appendTo($(visibleStep).find('#nextButtonContainer'));

     var nextButton = $('<button>', {
     'class'  : 'btn',
     'display': 'none'
     }).text(App.translate('Next')).appendTo(buttonWrapper);

     nextButton.click(function (e) {
     e.preventDefault();
     var thisStepPanel = $(this).parents().filter('.widget');
     visiblePanels     = me.elContent.find('.widget:visible');
     var isValidStep   = me.isElementValid(thisStepPanel, true);
     me.validateSteps(!isValidStep);
     var nextStepPanel = $(visiblePanels[thisStepPanel.data('id')]);

     // if the step is valid move to the next step
     // else stay at this step with repositioning this step at top and show the invalid fields
     var targetPanel = isValidStep ? nextStepPanel : thisStepPanel;

     me.moveToStep(targetPanel.data('id'));
     if (targetPanel.find(':input:first').data('role') === 'dropdownlist') {
     //noinspection JSValidateTypes
     targetPanel.find(':input:first').parent().focus();
     } else {
     targetPanel.find(':input:first').focus();
     }
     });
     }
     });
     },*/
    /**
     * Verifies the element if it is valid or not
     * @param element one of the visible step panels in the wizard - or all of them or just a list of input elements.
     * @param {boolean} showMessages show/hide validation messages.
     * @returns {boolean}
     */
    isElementValid     : function (element, showMessages) {
        var me = this, isValid = true;
        if (me.validator) {
            $(element)
                .find(':input:not(:button,:checkbox)')
                .each(function (id, input) {
                    if (!me.validator.validateInput(input)) {
                        if (!showMessages) {
                            me.validator.hideMessages();
                        }
                        isValid = false;
                    }
                });
        }
        if (isValid && $('[data-identifier="right_list"]').length > 0) {
            isValid = me.validateMultiSelect();

        }

        return isValid;
    },
    validateMultiSelect: function () {
        var isValid = true;
        $('[data-identifier="right_list"]').each(function (index, element) {
            $('span.k-tooltip.k-invalid-msg').remove();
            if ($(element)[0].attributes.required && $(element).children().length === 0) {
                $(element).closest('.multiselect-container')
                    .after('<span class="k-widget k-tooltip k-tooltip-validation k-invalid-msg" ' +
                           'data-for="name" role="alert">' +
                           '<span class="k-icon k-warning"> ' +
                           '</span>This field is required</span>')
                    .scrollintoview({
                        direction: 'vertical'
                    });
                isValid = false;
                return false;
            }
        });
        return isValid;
    },
    /**
     * Find the first invalid step in the wizard and update the steps status (enabled/disabled)
     * according to it.
     *
     * @param showValidationMessages show/hide validation messages
     */
    /*validateSteps : function (showValidationMessages) {
     var me                 = this;
     var visibleSteps       = me.elContent.find('.widget:visible');
     var currentInvalidStep = 0;
     $.each(visibleSteps, function (idx, step) {
     if (!me.isElementValid(step, showValidationMessages)) {
     currentInvalidStep = idx + 1;
     return false;
     }
     });
     me.updateSteps(currentInvalidStep);
     },*/
    /**
     * updates the visible step buttons (enabled/disabled) enabled till the invalid step disabled afterwards
     * MK: Whatever this means. I don't speak alien. Does anyone understand what is going on there?
     */
    /*updateSteps   : function (currentInvalidStep) {
     var me = this;

     var enable        = function (item) {
     if (item) {
     item.attr('disabled', false);
     item.removeClass('disabled');
     //avoid readonly dropdownlists
     item.find(':input').attr('tabindex', 0);
     item.find('.k-dropdown-wrap:not(.k-state-disabled)').parents('.k-dropdown').attr('tabindex', 0);
     }
     };
     var disable       = function (item) {
     if (item) {
     item.addClass('disabled');
     item.attr('disabled', true);
     item.find(':input').attr('tabindex', -1);
     item.find('.k-dropdown').attr('tabindex', -1);
     }
     };
     var visiblePanels = me.elContent.find('.widget:visible');
     var stepButtons   = me.elMenu.find('.btn:visible');
     var saveButton    = $('.k-ext-dialog').find('[data-action="save"]');
     // current step is not invalid enable all
     if (!currentInvalidStep) {
     $.each(visiblePanels, function (idx, step) {
     // make it jquery element
     step = $(step);
     enable(step);
     //just in case next buttons are disable.
     enable(step.find('.btn'));
     });
     $.each(stepButtons, function (idx, stepButton) {

     enable($(stepButton));
     });
     //enable(saveButton);
     } else {
     if (!$.isNumeric(currentInvalidStep)) {
     console.error('current invalid step is missing');
     return;
     }
     // current step is invalid
     // * When the first required field in step i :( 1 <= i <= n) is not valid then:
     // 1- Next button in step i is disabled.
     // 2- Steps (step sections) i+1 -> n are disabled.
     // 3- Step button i+1 -> n are disabled.
     // 4- Steps 1 -> i-1 are enabled, and also next buttons in them are enabled.
     // 5- Save button is disabled.
     $.each(stepButtons, function (idx, stepButton) {
     stepButton     = $(stepButton);
     var step       = $(visiblePanels[idx]);
     var nextButton = step.find('.btn');
     if (idx + 1 > currentInvalidStep) {
     disable(stepButton);
     disable(step);
     } else {
     if (idx + 1 === currentInvalidStep) {
     enable(step);
     // just in case the current step button is going to be disabled
     // on the update move the current step button to the last enabled
     // step
     if (me.elMenu.find('.btn.active:visible').data('id') > currentInvalidStep) {
     me.moveToStep(currentInvalidStep);
     }
     } else {
     enable(step);
     enable(nextButton);
     }
     enable(stepButton);
     }
     });
     if (currentInvalidStep == visiblePanels.length) {
     enable(saveButton);
     } else {
     disable(saveButton);
     }
     }
     },*/
    /**
     * Activates the button which applies to stepNumber and put it's
     * step in the top view
     */
    moveToStep         : function (stepNumber) {
        var me = this;
        if (!stepNumber) {
            console.error('No step number to move to.');
            return;
        }
        if (!$.isNumeric(stepNumber)) {
            console.error('Step number should be numeric.');
            return;
        }
        var visiblePanels     = me.elContent.find('.widget');
        var stepButtons       = me.elMenu.find('.btn');
        var currentStep       = $(visiblePanels[stepNumber - 1]);
        var currentStepButton = $(stepButtons[stepNumber - 1]);
        if (currentStepButton) {
            stepButtons.removeClass('active');
            currentStepButton.addClass('active').scrollintoview({direction: 'vertical'});
        }
        me.elContent.off('scroll');
        // Scrolling this step panel to the top view of the wizard content.
        me.elContent.scrollTop(me.elContent.scrollTop() + currentStep.position().top - me.elContent.position().top);
        // Scrolling this step button to the top view of the wizard menu.
        me.elMenu.scrollTop(me.elMenu.scrollTop() + currentStepButton.position().top - me.elMenu.position().top - 15);
        me.elContent.one('scroll', {scrolledByCode: 1}, function (e) {
            me.scrollSpy(e);
        });
    },
    /**
     * Collect form data, validate and send to backend.
     */
    onSave             : function () {

    },
    /**
     * Collect form data from external system and validate
     */
    onFetch            : function () {
        this.setSaveButtonBusy(false);
    },
    /**
     * Called when closing dialog
     */
    onClose            : function () {
    },

    setSaveButtonLabel: function (label) {
        'use strict';

        var button = this.elButtons.find('button[data-action=save]');
        if (button.length) {
            button.text(label);
        }
    },

    setSaveButtonBusy: function (isBusy) {
        'use strict';

        var button = this.elButtons.find('button[data-action=save]');
        if (button.length) {
            if (isBusy) {
                button.button('loading');
            } else {
                button.button('reset');
            }
        }
    },

    /**
     * disables scroll for the the dimmed background.
     */
    disableBgScrolling: function () {
        'use strict';

        $('body').css({
            overflow: 'hidden'
        });
    },

    /**
     * re-enables scrolling of the body.
     */
    enableBgScrolling: function () {
        'use strict';

        $('#content-wrap').css({
            overflow: 'inherit',
            height  : 'auto'
        });
        $('body').css({
            overflow: 'visible'
        });
    },

    getFieldById: function (fieldId) {
        var me = this, field = null;
        $.each(me.fields, function (idx, item) {
            if (item.config.id === fieldId) {
                field = item;
                return false;
            }
        });

        return field;
    },

    showField: function (field, state) {
        state = Boolean(typeof state === 'undefined' ? true : state);

        if (field.el.wrapper) {
            field.el.wrapper.toggle(state);
            field.el.wrapper.closest('dd').toggle(state);
        } else {
            $(field.el).toggle(state);
            $(field.el).closest('dd').toggle(state);
        }

        // Show / hide label
        field.label.toggle(state);
        field.label.closest('dd').toggle(state);

        // Show / hide description
        if (field.description) {
            field.description.toggle(state);
        }
    }
});
