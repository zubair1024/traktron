Ext.define('Rms.view.common.GeofenceDetailsPanel', {
    extend    : 'Ext.form.Panel',
    alias     : 'widget.geofence_details',
    requires  : ['Ext.TitleBar'],
    config    : {
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
                }
            ]
        }
    },
    setRecords: function (record) {

        var defaults = {
            xtype    : 'field',
            labelWrap: true,
            cls      : 'label-field'
        };

        this.getAt(0).setTitle(Ext.util.Format.ellipsis(record.get('name'), 10));
        this.setItems({
            xtype   : 'fieldset',
            title   : 'Geofence Details',
            defaults: defaults,
            items   : [
                {
                    label: 'Geofence Name',
                    html : record.get('name')
                }, {
                    label: 'Config Name',
                    html : record.get('configName')
                }, {

                    label: 'Shape Type',
                    html : record.get('shapeType')
                }, {

                    label  : 'Active',
                    xtype  : 'checkboxfield',
                    checked: !!record.get('isActive'),
                    cls    : null
                }, {
                    label: 'Description',
                    html : record.get('fenceDescription')
                }
            ]
        });
    }
});
