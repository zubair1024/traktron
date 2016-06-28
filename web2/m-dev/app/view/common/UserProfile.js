Ext.define('Rms.view.common.UserProfile', {
    extend: 'Ext.Panel',
    alias: 'widget.user_profile',
    config: {
        layout: {
            type: 'vbox',
            pack: 'center'
        },
        scrollable: {
            direction: 'vertical',
            directionLock: true
        },
        items: [{
            xtype: 'toolbar',
            docked: 'top',
            title: 'Profile'
        },
            {
                xtype: 'fieldset',
                items: [
                    {
                        xtype: 'textfield',
                        label: 'First Name',
                        name: 'firstName',
                        itemId: 'firstName',
                        labelWidth: '30%',
                        labelWrap: true
                    },
                    {
                        xtype: 'textfield',
                        label: 'Last Name',
                        name: 'lastName',
                        itemId: 'lastName',
                        labelWidth: '30%',
                        labelWrap: true
                    },
                    {
                        xtype: 'textfield',
                        label: 'Mobile Number',
                        name: 'mobile',
                        itemId: 'mobile',
                        labelWidth: '30%',
                        labelWrap: true
                    },
                    {
                        xtype: 'textfield',
                        label: 'Username',
                        name: 'username',
                        itemId: 'username',
                        labelWidth: '30%',
                        labelWrap: true,
                        readOnly: true
                    },
                    {
                        xtype: 'textfield',
                        label: 'Email',
                        name: 'email',
                        itemId: 'email',
                        labelWidth: '30%',
                        labelWrap: true
                    }
                    ,
                    {
                        xtype: 'selectfield',
                        label: 'Date Time Format',
                        id: 'dateTimeFormat',
                        labelWidth: '30%',
                        labelWrap: true
                    },
                    {
                        xtype: 'selectfield',
                        label: 'Timezone',
                        id: 'timezone',
                        labelWidth: '30%',
                        labelWrap: true
                    }
                ]
            }, {
                xtype: 'button',
                border: 2,
                margin: '40 10 0 10',
                //width : '45%',
                text: 'Apply',
                id: 'btnChange',
                ui: 'confirm'
            }
        ]
    }
});