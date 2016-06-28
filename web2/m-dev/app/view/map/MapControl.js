Ext.define('Rms.view.map.MapControl', {
    extend    : 'Ext.Panel',
    alias     : 'widget.map_control',
    requires  : [
        'Ext.SegmentedButton',
        'Ext.field.Select',
        'Ext.field.DatePicker'
    ],
    config    : {
        layout    : {
            type: 'vbox'
        },
        scrollable: {
            direction: 'vertical'
        },
        items     : {
            xtype : 'toolbar',
            title : 'Map Controls',
            docked: 'top',
            items : [
                {
                    text  : 'Map',
                    ui    : 'back',
                    itemId: 'back'
                }
            ]
        }
    },
    initialize: function () {
        this.setItems([
            {
                xtype: 'fieldset',
                title: 'Positions',
                items: [
                    {
                        xtype        : 'segmentedbutton',
                        id           : 'position',
                        allowMultiple: false,
                        width        : '100%',
                        items        : [
                            {
                                text   : 'Latest',
                                pressed: true,
                                width  : '33%'
                            }, {
                                text : 'All',
                                width: '33%'
                            }, {
                                text : 'Interval',
                                width: '34%'
                            }
                        ]
                    }, {
                        xtype   : 'datepickerfield',
                        label   : 'From',
                        name    : 'fromDate',
                        disabled: true,
                        value   : new Date()
                    }, {
                        xtype   : 'datepickerfield',
                        label   : 'To',
                        name    : 'toDate',
                        disabled: true,
                        value   : new Date()
                    }, {
                        xtype: 'button',
                        text : 'Show',
                        id   : 'middleShow'
                    }
                ]
            }, {
                xtype: 'fieldset',
                title: 'Geofences',
                items: [
                    {
                        xtype        : 'segmentedbutton',
                        width        : '100%',
                        allowMultiple: true,
                        id           : 'geofenceselect',
                        items        : [
                            {
                                text : 'Geofences',
                                width: '100%'
                            }
                        ]
                    }, {
                        xtype   : 'button',
                        text    : 'Plot',
                        id      : 'firstShow'
                    }
                ]
            }, {
                xtype: 'fieldset',
                title: 'Locations',
                items: [
                    {
                        xtype        : 'segmentedbutton',
                        width        : '100%',
                        id           : 'locationselect',
                        allowMultiple: true,
                        items        : [
                            {
                                text : 'Locations',
                                align: 'left',
                                width: '100%'
                            }
                        ]
                    }, {
                        xtype   : 'button',
                        text    : 'Plot',
                        id      : 'secondShow'
                    }
                ]
            }
        ]);
    }
});