/**
 * Batch upload dialog
 * @type {*}
 */
App.ui.BatchUpload = App.ui.WizardAdmin.extend({

    init: function (config) {

        var me = this;

        me.fileUploadFields = [];
        me.fileUploadCount  = 0;

        // Call parent constructor with config
        App.ui.WizardAdmin.fn.init.call(this, $.extend({
            objectType      : null,
            parentObjectId  : null,
            parentObjectType: null,
            objectId        : null
        }, config));

        return me;
    },

    /**
     * Load wizard content
     */
    getView: function () {
        'use strict';

        // check if create or update
        var me = this,
            params;

        params = {
            objectType      : me.config.objectType,
            parentObjectId  : me.config.parentObjectId,
            parentObjectType: me.config.parentObjectType
        };

        $.ajax({
            url    : App.config.serviceUrl + 'generalAdmin/getBatchUploadView',
            data   : params,
            success: $.proxy(this.buildContainer, this)
        });

        // Set title & button label.
        var buttonLabel = App.translate('Batch Upload {0}', App.util.format.domainObjectType(me.config.objectType));
        this.setSaveButtonLabel(buttonLabel);
        //noinspection JSValidateTypes
        this.dialog.title(buttonLabel);
    },

    onSave: function () {
        'use strict';

        // collect data / validate
        var me = this;

        if (me.validator && me.validator.validate()) {

            if (me.fileUploadFields.length) {
                me.doFileUpload();
            } else {
                me.doSave();
            }

        }
    },

    doSave: function () {
        'use strict';

        console.log('doSave');

        var me      = this,
            service = 'generalAdmin/batchUpload';

        me.setSaveButtonBusy(true);
        me.showBusy(me.elDialogContent);

        var params = {
            objectType: me.config.objectType,
            parentType: me.config.parentObjectType,
            parentId  : me.config.parentObjectId,
            objectData: JSON.stringify(me.getObjectData())
        };

        $.ajax({
            url    : App.config.serviceUrl + service,
            data   : params,
            success: function (response) {
                /*var object = response.object;*/

                console.log(response);
                /** @namespace response.responseFile */
                if (response.responseFile) {
                    $.proxy(me.handleUploadResponse(response.responseFile), me);
                } else {
                    $.proxy(me.onCancel(me), me);
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

    handleUploadResponse: function (responseFile) {
        var me = this;

        $.when(App.dialog.okCancel({
            title      : App.translate('File Upload'),
            height     : 180,
            minWidth   : 270,
            width      : 450,
            message    : App.translate('Your upload generates a report file. Do you want to open this file?'),
            labelCancel: App.translate('No'),
            labelOK    : App.translate('Yes'),
            icon       : App.dialog.iconQuestion
        })).done(function (response) {
            if (response.button === 'OK') {
                var params                     = {
                    domainObjectId  : responseFile.domainObjectId,
                    domainObjectType: responseFile.domainObjectType,
                    filename        : responseFile.filename
                };
                params[App.config.sessionName] = App.config.sessionId;

                var url = App.config.serviceUrl + 'caesarVfsResource/get?' + $.param(params),
                    previewEl;
                window.open(url, '_blank'); // or create iFrame

                $.each(me.fileUploadFields, function (idx, field) {
                    var el = field.el.wrapper;
                    el.find('.k-upload-files').remove();
                    el.find('.k-upload-status').remove();
                    el.addClass('k-upload-empty');
                    el.find('.k-upload-button').removeClass('k-state-focused');

                    previewEl = $('#preview_' + field.config.id);
                    previewEl.empty();
                });

                me.fileUploadCount = 0;
            } else {
                $.proxy(me.onCancel(me), me);
            }
        });
    }
});
