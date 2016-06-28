/**
 * Created by zubair on 29-Nov-15.
 */

App.component.FileUpload = stampit.compose(App.component.FieldBase, stampit()
    .props({
        config: null,
        isImage: null
    })
    /**
     * Initializer
     */
    .init(function () {
        var me = this,
            element,
            config = this.config,
            files = [],
            filename = config.currentValues[0];


        var previewEl = $('<div>', {
            id: 'preview_' + config.id
        }).appendTo(config.container);

        if (filename && filename.length > 0) {

            var params = {
                domainObjectId: config.objectId,
                domainObjectType: config.objectType,
                filename: filename
            };
            params[App.config.sessionName] = App.config.sessionId;
            var url = App.config.serviceUrl + 'caesarVfsResource/get?' + $.param(params);

            if (me.isImage) {
                $('<img class="img-thumbnail" alt="" src="' + url + '">').appendTo(previewEl);
            } else {
                $('<a target="_blank" href="' + url + '">' + filename + '</a>').appendTo(previewEl);
            }

            files.push({
                name: filename,
                extension: filename.substr(filename.lastIndexOf('.') + 1)
            });
        }

        element = $('<input>', {
            name: 'fileData',
            id: config.id,
            type: 'file'
        }).appendTo(config.container);

        // When the user clicks the upload button, validation should be postponed till takes another action like selecting
        // a file or canceling the selection.
        /*element.click(function () {
            config.refOwner.validator.hideMessages();
            element.one('blur', function () {
                config.refOwner.validator.hideMessages();
                element.on('blur', function (e) {
                    // To prevent the form from submit event on enter or Num-bad enter.
                    if (e.keyCode === kendo.keys.ENTER || e.keyCode === kendo.keys.NUMPAD_ENTER) {
                        e.preventDefault();
                    }
                    if (!config.refOwner.validator.validateInput($(this))) {
                        config.refOwner.updateSteps(element.parents('.widget').data('id'));
                    }
                    else {
                        config.refOwner.validateSteps(false);
                    }
                });
            });
        });*/

        if (config.isMandatory) {
            element
                .attr('isMandatory', true)
                .attr('validationmessage', App.translate('Please provide a file'))
                .after('<span class="k-invalid-msg" data-for="fileData"></span>');
        }

        //noinspection JSUnresolvedFunction
        element = element.kendoUpload({
            async: {
                saveUrl: config.fileUploadUrl,
                //removeUrl : me.config.fileDeleteUrl,
                autoUpload: false
            },
            isImage: me.isImage,
            localization: {
                select: App.translate('Select File')
            },
            id: config.id,
            showFileList: true,
            files: files,
            fileName: filename, // stores our file name
            multiple: false,
            deleteFile: false,
            error: $.isFunction(config.error) ? config.error : null,
            cancel: function (e) {
                // To prevent the form from submit event on enter or Num-bad enter.
                if (e.keyCode === kendo.keys.ENTER || e.keyCode === kendo.keys.NUMPAD_ENTER) {
                    e.preventDefault();
                }
                /*if (!config.refOwner.validator.validateInput($(this))) {
                    config.refOwner.updateSteps(el.parents('.widget').data('id'));
                }
                else {
                    config.refOwner.validateSteps(false);
                }*/
            },
            remove: function (e) {
                e.preventDefault();
                var fileRow = e.sender.wrapper.find('li span[title="' + e.files[0].name + '"]');
                fileRow.parent().remove();

                // remove image
                e.sender.options.files = {};
                e.sender.options.deleteFile = true;

                if (config.refOwner.fileUploadFields) {
                    var found = false;
                    $.each(config.refOwner.fileUploadFields, function (idx, field) {

                        if (field.el.options.id === e.sender.options.id) {
                            found = true;
                        }
                    });

                    if (!found) {
                        config.refOwner.fileUploadFields.push(me);
                    }
                }
                return false;
            },
            select: function (e) {
                if (e.files.length) {

                    // hide upload button
                    $('button.k-upload-selected').addClass('hidden');

                    // remove old files from list which are not uploaded yet
                    var files = $(e.sender.wrapper).find('li.k-file:not(.k-file-success)');
                    $.each(files, function (idx, item) {
                        $(item).remove();
                    });

                    // after file is selected added field to wizard upload field store
                    if (config.refOwner.fileUploadFields) {
                        var found = false;

                        $.each(config.refOwner.fileUploadFields, function (idx, field) {

                            if (field.el.options.id === e.sender.options.id) {
                                found = true;
                            }
                        });

                        if (!found) {
                            config.refOwner.fileUploadFields.push(this);
                        }
                    }
                }
            },
            upload: function (e) {
                var filename = e.files[0].name,
                    extension = e.files[0].extension.replace('.', ''),
                    objectType = null,
                    objectId = null;

                // Check if a file already exists and delete
                if (!e.sender.multiple) {
                    $.each(e.sender.options.files, function (idx, file) {
                        $.ajax({
                            url: App.config.serviceUrl + 'caesarVfs/delete',
                            data: {
                                domainObjectId: config.objectId,
                                domainObjectType: config.objectType,
                                filename: file.name
                            },
                            success: function () {
                                var fileRow = e.sender.wrapper.find('li span[title="' + file.name + '"]');
                                fileRow.parent().remove();
                                e.sender.options.files = e.files;
                            }
                        });

                    });
                }

                //DH-2014-01-02 CAES-431 : Workaround. Current code does not set parent. Code should consider selected object for create, not target object.
                if ((config.objectType && config.objectType !== '') && (config.objectId && config.objectId !== '')) {
                    objectType = config.objectType;
                    objectId = config.objectId;
                } else {
                    objectType = config.parentObjectType;
                    objectId = config.parentObjectId;
                }

                e.data = {
                    domainObjectId: objectId,
                    domainObjectType: objectType,
                    filename: filename.replace(e.files[0].extension, ''),
                    fileExtension: extension
                };
                e.data[App.config.sessionName] = App.config.sessionId;
            },
            success: $.proxy(config.refOwner.onUploadSuccess, config.refOwner)
        }).data('kendoUpload');
        //to allow the tooltip sign to be aligned with next to the upload div
        element.wrapper.addClass('multiselect-container row');
        element.wrapper.removeClass('k-widget');
        element._showUploadButton = function () {
            // override - do nothing
            console.log('our override');
        };

        me.element = element;

    }));