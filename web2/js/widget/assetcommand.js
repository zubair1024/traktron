/**
 * Asset command widget
 */
App.widget.AssetCommand = App.widget.Base.extend({
    elContainer      : null,
    communicatorCombo: null,

    init: function (config) {
        'use strict';

        var me    = this;
        me.config = $.extend({}, config);

        //noinspection JSUnresolvedFunction
        me.communicatorCombo = $('<input>').
            appendTo(me.config.el).kendoComboBox({
                placeholder   : App.translate('Select communicator'),
                autoBind      : true,
                dataSource    : new kendo.data.DataSource({
                    transport: {
                        read: {
                            url     : App.config.serviceUrl + 'caesarAssetCommand/communicators ',
                            dataType: 'json',
                            data    : {
                                asset: me.config.domainObjectId
                            }
                        }
                    },
                    schema   : {
                        data: 'communicators'
                    },
                    change   : function () {
                        var data = this.data();
                        // console.log(data);
                        $.each(data, function (idx, item) {
                            if (item.isDefault) {
                                me.communicatorCombo.value(item.id);
                                me.communicatorCombo.trigger('change');
                            }
                        });
                    }
                }),
                dataTextField : 'name',
                dataValueField: 'id',
                change        : $.proxy(this.onCommunicatorChange, this)
            }).data('kendoComboBox');

        me.elContainer = $('<div>', {
            'class': 'widget-detail'
        }).appendTo(me.config.el);
    },

    onCommunicatorChange: function (e) {
        'use strict';

        var communicatorId = e.sender.value(),
            me             = this;

        if (!communicatorId) {
            return;
        }

        /**
         * Fetch all commands that are available for this communicator and render them.
         */
        $.ajax({
            url    : App.config.serviceUrl + 'caesarAssetCommand/assetCommands2',
            data   : {communicatorId: communicatorId},
            success: function (response) {
                me.elContainer.empty();

                // coming over jshint 'don't make functions withing a loop' grunts
                var myfunction = function (idx, command) {
                    $('<dt>', {
                        text: App.translate(command.name)
                    }).appendTo(dl);

                    for (var j = 0; j < command.parameters.length; j++) {

                        var param = command.parameters[j],
                            dd    = $('<dd>').appendTo(dl),
                            input = $('<input>', {
                                type: 'text',
                                name: param.key,
                                id  : command.id
                            }).appendTo(dd);

                        if (param.hasMultipleValueSupport) {
                            //noinspection JSUnresolvedFunction
                            input.kendoDropDownList({
                                dataSource: {
                                    data: param.availableValues
                                }
                            });
                        }
                    }

                    dl.append($('<dd>').append($('<button>', {
                            'class': 'k-button',
                            'text' : App.translate('Send'),
                            click  : function () {
                                var params = {};

                                if (command.parameters.length) {
                                    var cmdId    = $('#' + command.id);
                                    params.key   = cmdId.attr('name');
                                    params.value = cmdId.val();
                                }

                                //noinspection JSUnresolvedVariable
                                if (command.requiresJustification) {
                                    $.when(App.dialog.okCancel({
                                        title      : App.translate('Execute Command'),
                                        height     : '180px',
                                        message    : App.translate('Do you really want to execute {0}?', command.name),
                                        labelCancel: App.translate('No'),
                                        labelOK    : App.translate('Execute'),
                                        icon       : App.dialog.iconQuestion
                                    })).done(function (response) {
                                        if (response.button === 'OK') {
                                            $.when(App.dialog.input({
                                                title  : App.translate('Requires Justification'),
                                                message: App.translate('This Asset command requires a justification. Please enter a justification below'),
                                                required   : true
                                            })).done(function (response) {
                                                if (response.button === 'OK') {
                                                    me.onCommandSendClick(command.id, communicatorId, params, response.input);
                                                }
                                            });
                                        }
                                    });
                                } else if (command.requiresConfirmation) {
                                    $.when(App.dialog.okCancel({
                                        title      : App.translate('Execute Command'),
                                        height     : '180px',
                                        message    : App.translate('Do you really want to execute {0}?', command.name),
                                        labelCancel: App.translate('No'),
                                        labelOK    : App.translate('Execute'),
                                        icon       : App.dialog.iconQuestion
                                    })).done(function (response) {
                                        if (response.button === 'OK') {
                                            me.onCommandSendClick(command.id, communicatorId, params);
                                        }
                                    });
                                } else {
                                    me.onCommandSendClick(command.id, communicatorId, params);
                                }
                            }
                        }))
                    );
                };
                /** @namespace response.commandGroups */
                for (var i = 0; i < response.commandGroups.length; i++) {

                    /** @namespace commandGroup.commands */
                    /** @namespace commandGroup.name */
                    var commandGroup = response.commandGroups[i];

                    me.elContainer.append($('<div>', {
                        'class': 'details-header',
                        text   : App.translate(commandGroup.name)
                    }));

                    var dl = $('<dl>', {
                        'class': 'dl-horizontal'
                    }).appendTo(me.elContainer);

                    //noinspection JSUnresolvedVariable
                    $.each(commandGroup.commands, myfunction);
                }
            }
        });
    },

    onCommandSendClick: function (commandId, communicatorId, parameters, msg) {
        'use strict';

        var me     = this,
            params = {
                commandId       : commandId,
                communicatorId  : communicatorId,
                parameters      : parameters,
                justification   : msg,
                domainObjectId  : me.config.domainObjectId,
                domainObjectType: me.config.objectType
            };

        $.ajax({
            url    : App.config.serviceUrl + 'caesarAssetCommand/executeCommand',
            data   : params,
            success: function () {
                var message = App.translate('Command sent successfully.');
                App.dialog.alert({
                    title  : App.translate('Command'),
                    message: message,
                    icon   : App.dialog.iconInfo
                });
                App.log.add(message, params);
            }
        });
    }
});
