Ext.define('Rms.view.asset.AssetDetails', {
    extend         : 'Ext.form.Panel',
    alias          : 'widget.asset_details',
    requires       : [
        'Ext.TitleBar',
        'Ext.dataview.List',
        'Ext.ActionSheet'
    ],
    config         : {
        record    : null,
        scrollable: {
            direction: 'vertical'
        },
        items     : {
            xtype : 'toolbar',
            cls   : 'toolbar-title-font',
            docked: 'top',
            items : [
                {
                    text  : 'Back',
                    ui    : 'back',
                    itemId: 'back'
                },
                {
                    text  : 'Map',
                    ui    : 'back',
                    itemId: 'map',
                    hidden: true
                },
                {
                    text  : 'Near',
                    ui    : 'back',
                    itemId: 'near',
                    hidden: true
                },
                {
                    text  : 'Near',
                    ui    : 'back',
                    itemId: 'assetNear',
                    hidden: true
                },
                {
                    xtype: 'spacer'
                },
                {
                    xtype: 'button',
                    text : 'Options'
                },
                {
                    xtype : 'toolbar',
                    docked: 'bottom',
                    layout: {
                        pack: 'center'
                    },
                    items : [
                        {
                            xtype: 'button',
                            text : 'Navigate To Asset'
                        },
                        {
                            xtype: 'button',
                            text : 'Navigate To Me',
                            id   : 'navBtn'
                        }
                    ]
                }
            ]
        }
    },
    initialize     : function () {
        this.domainObjectId = 0;
        this.callParent(arguments);
    },
    updateData     : function (data, domainObjectType, domainObjectId, domainObjectName) {
        this.domainObjectId   = domainObjectId;
        this.domainObjectName = domainObjectName;
        this.domainObjectType = domainObjectType;
        Ext.Viewport.setMasked({
            xtype  : 'loadmask',
            message: 'Loading asset details...'
        });
        //Setting the 'Navigate to Me' button
        Ext.getCmp('navBtn').setHidden(true);
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
            //console.log(data.ui.items[0]);
            //Skip a section if not available
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
                    value = formatter(field);
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
            // OK, items have been nicely arranged in fieldsets. Now add those to the panel.
            this.setItems(items);
        } else {
            this.setItems({
                html            : '<h3>There is no data for that asset.</h3>',
                styleHtmlContent: true
            });
        }
        Ext.Viewport.setMasked(false);
    },
    addAssetOptions: function () {
        var items = [];
        if (positions) {
            items.push({
                text: 'Nearest Assets', itemId: 'nearestAssets', data: [positions, this.domainObjectId]
            });
        }
        if (this.domainObjectType == 'pump' || this.domainObjectType == 'generator') {
            items.push({
                text  : 'Engine Coolant Temperature',
                itemId: 'engineCoolantTemperature'
            }, {text: "Engine RPM Chart", itemId: "engineRPMChart"});
        }
        items.push({text: 'View on Map', itemId: 'map'}, {text: 'View Alarms', itemId: 'alarm'});
        if (!App.controls.defaultSettings) {
            if (App.controls.map.mapControlOption || App.controls.actionsheet.viewGeofences) {
                items.push({text: 'View Geofences', itemId: 'geofence'});
            }
            if (App.controls.actionsheet.sendCommands) {
                items.push({text: 'Send Commands', itemId: 'command'});
            }
        } else {
            items.push({text: 'View Geofences', itemId: 'geofence'}, {text: 'Send Commands', itemId: 'command'});
        }
        this.assetOptions = Ext.Viewport.add({
            xtype        : 'actionsheet',
            modal        : true,
            hideOnMaskTap: true,
            items        : items
        });
        this.assetOptions.show();
    }
});
