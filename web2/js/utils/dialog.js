/**
 * Basic messages like Alert, OkCancel, Input boxes
 * @type {{template: string, defaults: {width: number, height: number, modal: boolean, visible: boolean, icon: null, title: string, message: null}, iconError: string, iconInfo: string, iconExclamation: string, iconQuestion: string, idAlert: string, idOkCancel: string, idInput: string, close: Function, alert: Function, okCancel: Function, input: Function}}
 */
App.dialog = {

    template: '<div id="{0}" class="extDialog">' +
              '<div class="row">' +
              '<div class="col-sm-3 dialogIcon"><span class="glyphicon {1}"></span></div>' +
              '<div class="col-sm-9">{2}</div>' +
              '</div>' +
              '</div>',

    /**
     * default config options for the dialog
     */
    defaults: {
        width  : 303,
        height : 150,
        modal  : true,
        visible: false,
        icon   : null,
        title  : '',
        message: null
    },

    /**
     * Justification Input Character Length
     */
    justification: 512,

    /**
     * Some icons.
     */
    iconError      : 'glyphicon-remove-sign',
    iconInfo       : 'glyphicon-info-sign',
    iconExclamation: 'glyphicon-exclamation-sign',
    iconQuestion   : 'glyphicon-question-sign',

    /**
     * Every dialog class has its own documentId.
     */
    idAlert   : '#extAlertDialog',
    idOkCancel: '#extOkCancelDialog',
    idInput   : '#extInputDialog',

    /**
     * Hide Dialog
     * @param {App.dialog.idAlert|App.dialog.idOkCancel|App.dialog.idInput} id of dialog to close
     */
    close: function (id) {
        if ($(id).length) {
            $(id).data('kendoExtDialog').close();
        }
    },

    /**
     * Show simple alert.
     * @param options
     * @returns {jQuery.Deferred}
     */
    alert: function (options) {
        return new $.Deferred(function (deferred) {
            var dialog = null;

            // Remove dialog if already existent.
            if ($(App.dialog.idAlert).length > 0) {
                //noinspection JSCheckFunctionSignatures
                $(App.dialog.idAlert).parent().remove();
            }

            // button labels
            options.labelOK = options.labelOK || App.translate('OK');

            options = $.extend({},
                App.dialog.defaults,
                {
                    buttons: [
                        {
                            name : options.labelOK,
                            click: function () {
                                dialog.close();
                                deferred.resolve({button: 'OK'});
                            }
                        }
                    ],
                    icon   : App.dialog.iconError,
                    title  : App.translate('Error')
                },
                options
            );

            $(document.body).append(kendo.format(
                App.dialog.template,
                App.dialog.idAlert.substr(1),
                options.icon,
                options.message
            ));

            var el = $(App.dialog.idAlert);
            //noinspection JSUnresolvedFunction
            dialog = el.kendoExtDialog(options).data('kendoExtDialog');
            //noinspection JSCheckFunctionSignatures
            el.parent().find('div.k-window-titlebar div.k-window-actions').empty();
            dialog.center().open();
        });
    },

    /**
     * Show OkCancelDialog with two buttons: OK, Cancel.
     * @param options
     * @returns {jQuery.Deferred}
     */
    okCancel: function (options) {
        return new $.Deferred(function (deferred) {
            var dialog = null;

            // Remove dialog if already existent.
            if ($(App.dialog.idOkCancel).length > 0) {
                //noinspection JSCheckFunctionSignatures
                $(App.dialog.idOkCancel).parent().remove();
            }

            // button labels
            options.labelCancel = options.labelCancel || App.translate('Cancel');
            options.labelOK     = options.labelOK || App.translate('OK');

            options = $.extend({},
                App.dialog.defaults,
                {
                    buttons: [
                        {
                            name : options.labelCancel,
                            click: function () {
                                dialog.close();
                                deferred.resolve({button: 'Cancel'});
                            }
                        },
                        {
                            name : options.labelOK,
                            click: function () {
                                dialog.close();
                                deferred.resolve({button: 'OK'});
                            }
                        }
                    ],
                    icon   : App.dialog.iconInfo // or: glyphicon-question-sign, glyphicon-exclamation-sign, glyphicon-remove-sign
                },
                options
            );

            $(document.body).append(kendo.format(
                App.dialog.template,
                App.dialog.idOkCancel.substr(1),
                options.icon,
                options.message
            ));

            var el = $(App.dialog.idOkCancel);
            //noinspection JSUnresolvedFunction
            dialog = el.kendoExtDialog(options).data('kendoExtDialog');
            //noinspection JSCheckFunctionSignatures
            el.parent().find('div.k-window-titlebar div.k-window-actions').empty();
            el.data('kendoExtDialog').center().open();
        });
    },

    /**
     * Show InputDialog - a Dialog with a textbox, OK, Cancel.
     * @param options
     * @returns {jQuery.Deferred}
     */
    input: function (options) {
        return new $.Deferred(function (deferred) {
            var dialog  = null,
                tooltip = null;

            if ($(App.dialog.idInput).length > 0) {
                //noinspection JSCheckFunctionSignatures
                $(App.dialog.idInput).parent().remove();
            }

            // button labels
            options.labelCancel = options.labelCancel || App.translate('Cancel');
            options.labelOK     = options.labelOK || App.translate('OK');

            options = $.extend({},
                App.dialog.defaults,
                {
                    buttons    : [
                        {
                            name : options.labelCancel,
                            click: function () {
                                dialog.close();
                                deferred.resolve({button: 'Cancel'});
                            }
                        },
                        {
                            name : options.labelOK,
                            click: function () {
                                var inputField = $(App.dialog.idInput + ' .k-ext-input-dialog-input');
                                /**
                                 * Check for valid alphanumeric value
                                 */
                                var msg        = inputField.val().replace(/[^a-z0-9]/gi, '');
                                if (dialog.options.required && ( msg.length === 0 || inputField.val().length > App.dialog.justification )) {
                                    inputField.addClass(dialog.options.requiredCss);
                                    var info = 'This field is required.';
                                    if (tooltip) {
                                        inputField.parent().find('.k-tooltip').remove();
                                    }
                                    if (inputField.val().length > App.dialog.justification) {
                                        info = 'Maximum limit of ' + App.dialog.justification + ' characters allowed. Current length is ' + inputField.val().length + ' characters.';
                                    }
                                    tooltip = inputField.after('<span class="k-widget k-tooltip k-tooltip-validation k-invalid-msg" ' +
                                                               'data-for="name" role="alert">' +
                                                               '<span class="k-icon k-warning"> ' +
                                                               '</span>' + info + '</span>');
                                } else {
                                    dialog.close();
                                    deferred.resolve({
                                        button: 'OK',
                                        input : inputField.val()
                                    });
                                }
                            }
                        }
                    ],
                    value      : '',
                    required   : false,
                    requiredCss: 'k-ext-required',
                    /**
                     * make the input box a bit wider to fit the textbox better.
                     */
                    height     : 200,
                    width      : 350
                },
                options
            );

            $(document.body).append(kendo.format(
                '<div id="{0}" class="extDialog" style="position:relative;">' +
                '<div style="display:block;margin: 15px;">{1}</div>' +
                '<div style="display:block;margin: 15px;">' +
                '<input type="text" value="{2}" class="k-textbox k-ext-input-dialog-input" style="width:100%;"/>' +
                '</div></div>',
                App.dialog.idInput.substr(1),
                options.message,
                options.value
            ));

            var el = $(App.dialog.idInput);
            //noinspection JSUnresolvedFunction
            dialog = el.kendoExtDialog(options).data('kendoExtDialog');
            //noinspection JSCheckFunctionSignatures
            el.parent().find('div.k-window-titlebar div.k-window-actions').empty();
            dialog.center().open();
        });
    }
};


//noinspection JSUnresolvedVariable
/**
 * Inherits from Kendo's Window.
 * Will be extended with a button bar on the bottom of the dialog.
 */
kendo.ui.plugin(kendo.ui.Window.extend({
    buttonBarHeight : 68,
    _buttonTemplate : kendo.template(
        '<div class="k-ext-dialog-buttons">' +
        '<div># $.each (buttons, function (idx, button) { #<button class="btn btn-default">#= button.name #</button># }) # </div>' +
        '</div>'
    ),
    _contentTemplate: kendo.template('<div class="k-ext-dialog-content" style="height:#= parseInt(height) - buttonBarHeight #px; width:#= parseInt(width) #px;">'),

    /**
     * Initialize the dialog.
     * @param element
     * @param options
     */
    init: function (element, options) {
        var me = this;

        // Add default values for some settings.
        options.visible         = options.visible || false;
        options.buttonBarHeight = options.buttonBarHeight || this.buttonBarHeight;
        options.open            = function () {
            // Recalculate padding and margins
            var titleBar       = this.wrapper.find('div.k-window-titlebar'),
                titleBarHeight = titleBar.outerHeight();
            this.wrapper.css('padding-top', titleBarHeight);
            titleBar.css('margin-top', -titleBarHeight);
        };
        // Compensating for the missing feature from kendo (tabbing inside a modal)
        function onActivate() {
            var windowElement = this.wrapper,
                windowContent = this.element;
            // If the dialog has a close action include them in the tab
            // TODO: if other actions are added in dialogs add them to the tabbing order and find a way to fire them
            // TODO: when space or enter is hit and they have the focus
            if (windowElement.find('a[role=\'button\']  > .k-i-close').length > 0) {
                // We are interested only in the icon, the text jammed through kendo dialog actions should be removed.
                windowElement.find('a[role=\'button\']  > .k-i-close').text('');
                windowElement.find('a[role=\'button\']  > .k-i-close').parent().prop('tabindex', 0);
            }
            $(document).on('keyup.kendoWindow', function (e) {
                var focusedElement = $(document.activeElement);
                // As actions are anchors but not buttons or inputs, the don't fire their click events on space or enter
                // So so had to fix it this way.
                if ((e.keyCode == kendo.keys.ENTER || e.keyCode == kendo.keys.SPACEBAR ) && (focusedElement.is(windowContent))) {
                    me.close();
                }
                // We resolve here the navigation through shift + tab
                if (e.keyCode == kendo.keys.TAB) {
                    if (e.shiftKey) {
                        // Recognize between dialogs which has a close action button and which don't.
                        if (windowElement.find('a[role=\'button\'] > .k-i-close').length > 0) {
                            if (focusedElement.is(windowElement.find('a[role=\'button\'] > .k-i-close').parent())) {
                                windowElement.find(':input:enabled:last').focus();
                            }
                        }
                        else {
                            if (focusedElement.is(windowContent)) {
                                windowElement.find(':input:enabled:last').focus();
                            }
                        }
                    }
                }

            });
            $(document).on('keydown.kendoWindow', function (e) {
                var focusedElement = $(document.activeElement);
                // We resolve here the navigation through shift + tab
                if (e.keyCode == kendo.keys.TAB) {
                    // Recognize between dialogs which has a close action button and which don't.
                    if (windowElement.find('a[role=\'button\']  > .k-i-close').length > 0) {
                        if (!e.shiftKey && focusedElement.is(windowElement.find(':input:enabled:last'))) {
                            windowElement.find('a[role=\'button\']  > .k-i-close').parent().focus();
                        }
                    }
                    else {
                        if (!e.shiftKey && focusedElement.is(windowElement.find(':input:enabled:last'))) {
                            windowContent.focus();
                        }
                        if (e.shiftKey && focusedElement.is(windowContent)) {
                            windowElement.find(':input:enabled:last').focus();
                        }
                    }
                }

            });
        }

        function onClose() {
            $(document).off('keyup.kendoWindow');
            $(document).off('keydown.kendoWindow');
        }

        options.activate = onActivate;
        options.close    = onClose;
        // Define standard Actions here. Enrich close icon with glyphicon styles.
        if (!$.isArray(options.actions)) {
            options.actions = ['Close glyphicon glyphicon glyphicon-remove'];
        }
        //noinspection JSUnresolvedVariable
        kendo.ui.Window.fn.init.call(me, element, options);
        /*$(element).data('kendoWindow', me);*/

        // Add custom dialog class to the window for easier styling.
        me.wrapper.addClass('k-ext-dialog');
        // So closing a dialog wouldn't reset the route.
        $(me.wrapper.find('.k-window-action')).removeAttr('href');

        var html = $(element).html();
        $(element).html(me._contentTemplate(options));
        $(element).find('div.k-ext-dialog-content').append(html);

        $(element).after(me._buttonTemplate(options));

        $.each(options.buttons, function (idx, button) {
            //noinspection JSCheckFunctionSignatures
            var buttonEl = $($(element).parent().find('.k-ext-dialog-buttons .btn')[idx]);
            if (button.click) {
                buttonEl.on('click', {handler: button.click}, function (e) {
                    e.data.handler({button: this, dialog: me});
                });
            }
            if (button.action) {
                buttonEl.attr('data-action', button.action);
            }
            if (button.loadingText) {
                buttonEl.attr('data-loading-text', button.loadingText);
            }
        });

        me.bind('resize', function () {
            me.resizeDialog();
        });
    },

    resizeDialog: function () {
        var me     = this,
            dialog = $(me.element),
            width  = dialog.width(),
            height = dialog.height();

        //noinspection JSCheckFunctionSignatures
        dialog.parent().find('.k-ext-dialog-content').width(width).height(height - me.buttonBarHeight);
    },

    options: {
        name: 'ExtDialog'
    }
}));
