Ext.define('Rms.view.driver.DriverDetails', {
    extend    : 'Ext.form.Panel',
    alias     : 'widget.driver_details',
    requires  : [
        'Ext.TitleBar',
        'Ext.dataview.List',
        'Ext.ActionSheet'
    ],
    config    : {
        record    : null,
        scrollable: {
            direction: 'vertical'
        },
        items     : {
            xtype : 'toolbar',
            cls   : 'toolbar-title-font',
            id    : 'driverDetailsToolbar',
            title : 'Details',
            docked: 'top',
            items : [
                {
                    text  : 'Back',
                    ui    : 'back',
                    itemId: 'back'
                },
                {
                    xtype: 'spacer'
                },
                {
                    xtype : 'button',
                    text  : 'Options',
                    itemId: 'driverOptions',
                    hidden: !App.controls.driver.options
                }
            ]
        }
    },
    initialize: function () {
        this.domainObjectId   = 0;
        this.commonController = Rms.app.getController('CommonController');
        this.callParent(arguments);
    },
    updateData: function (data, type, id) {
        Ext.Viewport.setMasked({
            xtype  : 'loadmask',
            message: 'Loading driver details...'
        });
        var formatter = Rms.app.getController('CommonController').format;
        /**
         * Since we are in detailed mode, we only have _one_ record. Look in this record and
         * create FieldSets accordingly.
         * Every section is a fieldset.
         */
        if (data.ui.items.length > 0) {
            var items = [];
            /**
             * Iterate over the sections.
             */
            for (var i = 0; i < data.ui.items[0].items.length; i++) {
                var section  = data.ui.items[0].items[i];
                var fieldset = {
                    xtype   : 'fieldset',
                    title   : section.name,
                    defaults: {
                        // No "textfield" xtype, since we only want to display something here.
                        xtype    : 'field',
                        labelWrap: true,
                        cls      : 'label-field',
                        listeners: {
                            change: function (field, newVal, oldVal) {
                                console.log('change');
                            }
                        }
                    },
                    items   : []
                };
                /**
                 * Iterate over the fields.
                 */
                for (var j = 0; j < section.items.length; j++) {
                    var field = section.items[j],
                        value = App.config.blankSign;
                    //Format value.
                    value = formatter(field, type, id);
                    // Create a simple readonly-TextField.
                    fieldset.items.push({
                        label     : field.name,
                        html      : value,
                        labelWidth: '40%',
                        labelWrap : true
                    });
                }
                items.push(fieldset);
            }
            this.setItems(items);
        } else {
            this.setItems({
                html            : '<h3>There is no data for that driver.</h3>',
                styleHtmlContent: true
            });
        }
        Ext.Viewport.setMasked(false);
    },

    addDriverOptions: function () {
        var items = [],
            data  = this.commonController.getData(App.config.serviceUrl + 'rbireports/availableReports',
                {domainObjectType: 'driver'}, false);
        /**
         * Loop through the report types
         */
        if (data.reports && data.reports.length) {
            for (var i = 0; i < data.reports.length; i++) {
                items.push({
                    text  : data.reports[i].name,
                    itemId: data.reports[i].id
                });
            }
        } else {
            items.push({
                text: 'Unavaliable'
            });
        }
        if (!this.driverOptions) {
            this.driverOptions = Ext.Viewport.add({
                xtype        : 'actionsheet',
                id           : 'driverActionsheet',
                modal        : true,
                hideOnMaskTap: true,
                items        : items
            });
        }
        this.driverOptions.show();
    }
});
