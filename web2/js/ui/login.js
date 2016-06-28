/**
 * Holds and creates Login Dialog.
 */
App.ui.login = {
    dialog              : null,
    applicationProviders: [],
    returnRoute         : null,
    html                : '<form autocomplete="on">' +
                          '<ul class="list-unstyled">' +
                          '<li><input id="applicationsCombo" validationMessage="Please select an application" name="applicationProviderId" style="width: 280px;"/>' +
                          '<span class="k-invalid-msg" data-for="applicationsCombo"></span></li>' +
                          '<li><input type="text" id="username" required validationMessage="Please enter your username" class="k-textbox" name="username" value="" placeholder="User Name"/>' +
                          '<span class="k-invalid-msg" data-for="username"></span></li>' +
                          '<li><input type="password" id="password" required validationMessage="Please enter your password" class="k-textbox" name="password" value="" placeholder="Password"/>' +
                          '<span class="k-invalid-msg" data-for="password"></span></li>' +
                          '<li id="validation-error"></li>' +
                          '</ul>' +
                          '</form>',

    /**
     * show login dialog.
     */
    show: function (returnRoute) {
        'use strict';

        var me = this;

        me.returnRoute = returnRoute;

        // Since the login mechanism is refactored to avoid the reload. We make
        // sure that if the login dialog is not destroyed after it is closed,
        // that we remove it from the dom tree, so selectors used in the login
        // window, return unique results as their purpose is.
        if ($('#loginDialog').is('div')) {
            $('#loginDialog').remove();
        }

        /**
         * Test if server is reachable by calling "applicationProviders" service.
         * This service needs no authentication.
         */
        $.ajax({
            url    : App.config.serviceUrl + 'caesarAuthentication/applicationProviders',
            cache  : false,
            timeout: 5000,
            success: function (response, state, jqXHR) {

                if (response === '') {

                    // Server is down.
                    App.log.emergencyEject(jqXHR);
                    return;
                }

                // Server is reachable - go on.
                var body = $('body');

                me.elContent = $('<div>', {
                    id  : 'loginDialog',
                    html: me.html
                }).appendTo(body);

                // noinspection JSUnresolvedFunction
                me.dialog = me.elContent.kendoExtDialog({
                    minWidth: 300,
                    width   : App.config.isSmallDevice ? 310 : 500,
                    height  : App.config.isSmallDevice ? 240 : 380,
                    buttons : [
                        {
                            name : App.translate('Login'),
                            click: function () {
                                me.onFormSubmit();
                            }
                        }
                    ],
                    actions : [],
                    modal   : true,
                    title   : App.translate('Login'),
                    visible : false,
                    message : ''
                }).data('kendoExtDialog');

                var appDropDown = $('#applicationsCombo');

                // We have already an ApplicationId.
                if (App.config.appId) {
                    // Don't show DropDown.
                    appDropDown.hide();
                } else {

                    // We need to add this attribute to get Kendo's validator working.
                    appDropDown.attr('required', 'required');
                    // noinspection JSUnresolvedFunction
                    appDropDown.kendoDropDownList({
                        optionLabel   : App.translate('Select Application'),
                        dataTextField : 'applicationName',
                        dataValueField: 'id',
                        // filter        : 'contains',
                        autoBind      : false,
                        minLength     : 3,
                        height        : 220,
                        dataSource    : {
                            serverFiltering: false,
                            transport      : {
                                read: {
                                    url: App.config.serviceUrl + 'caesarAuthentication/applicationProviders'
                                }
                            }
                        }
                    });
                }

                // Map Return key to form submit.
                me.elContent.keypress(function (e) {
                    var result = true;
                    if (e.which === 13) {
                        me.onFormSubmit();
                        result = false;
                    }
                    return result;
                });

                // Adjust login dialog for small devices.
                if (App.config.isSmallDevice) {
                    me.elContent.css('background-image', 'none');
                    me.elContent.find('form').css('margin-top', 0);
                    me.elContent.find('form .k-textbox, form .k-combobox, form .k-dropdown').css('width', '100%');
                    body.css({
                        'font-size': '14px'
                    });
                }

                me.dialog.center().open();

                //Listen for a session


            },
            error  : function (jqXHR) {
                App.log.emergencyEject(jqXHR);
            }
        });

    },

    /**
     * Form Submit handler
     */
    onFormSubmit: function () {
        'use strict';

        //noinspection JSUnresolvedFunction
        var me              = this,
            validationError = $('#validation-error'),
            validator       = me.elContent.find('form').kendoValidator().data('kendoValidator');

        validationError.empty().hide();

        if (validator.validate()) {
            validationError.hide();

            var appId = App.config.appId;
            if (!appId) {
                var appDropDown = $('#applicationsCombo');

                if (appDropDown.length) {
                    appId = appDropDown.data('kendoDropDownList').value();
                }
            }

            App.user.doLogin({
                username   : $('#username').val(),
                password   : $('#password').val(),
                appId      : appId,
                returnRoute: me.returnRoute,
                error      : function (response) {
                    switch (response.status) {
                        case 500:
                            me.addValidationMessage('Logon failed due to server error.');
                            break;
                        default:
                            if (response.responseText !== '') {
                                var msg = $.parseJSON(response.responseText);

                                // Iterate over the error messages.
                                $.each(msg.messages, function (index, value) {

                                    // Code duplication from addValidationMessage() due to scope bug in this iterator.
                                    $('<span>', {
                                        'class': 'k-widget k-tooltip k-tooltip-validation k-invalid-msg',
                                        html   : '<span class="k-icon k-warning"> </span> ' + value
                                    }).appendTo(validationError);
                                });
                            }
                    }
                    validationError.show();
                }
            });
        }
    },

    addValidationMessage: function (message) {
        'use strict';

        $('<span>', {
            'class': 'k-widget k-tooltip k-tooltip-validation k-invalid-msg',
            html   : '<span class="k-icon k-warning"> </span> ' + message
        }).appendTo('#validation-error');
    }
};
