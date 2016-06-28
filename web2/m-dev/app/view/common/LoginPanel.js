Ext.define('Rms.view.common.LoginPanel', {
    extend: 'Ext.Panel',
    alias : 'widget.loginPage',
    config: {
        layout    : {
            type: 'vbox',
            pack: 'center'
        },
        scrollable: {
            direction    : 'vertical',
            directionLock: true
        },
        items     : [
            {
                xtype : 'image',
                src   : '../images/logos/login-default.png',
                height: 94,
                width : '100%'
            }, {
                xtype: 'fieldset',
                style: '  margin: 0 0.8em 0 0.8em;box-shadow: 0px 1px 10px 0 #000;',
                items: [
                    {
                        xtype       : 'selectfield',
                        label       : 'Application',
                        itemId      : 'applicationId',
                        valueField  : 'id',
                        displayField: 'applicationName',
                        labelWidth: '30%',
                        labelWrap: true
                    }, {
                        xtype : 'textfield',
                        label : 'Username',
                        name  : 'username',
                        itemId: 'username',
                        labelWidth: '30%',
                        labelWrap: true
                    }, {
                        xtype    : 'passwordfield',
                        label    : 'Password',
                        name     : 'password',
                        itemId   : 'password',
                        clearIcon: false,
                        labelWidth: '30%',
                        labelWrap: true
                    },
                    {
                        xtype: 'togglefield',
                        name: 'savePassword',
                        label: 'Save Password',
                        labelWidth: '60%',
                        labelAlign:'center'
                    }
                ]
            }, {
                xtype : 'button',
                border: 2,
                margin: '40 10 0 10',
//                width : '45%',
                text  : 'Login',
                id    : 'btnLogin',
               ui: 'confirm'
            }
        ]
    }
});