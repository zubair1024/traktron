/**
 * About Window
 * @type {*}
 */
App.ui.AboutWindow = kendo.Class.extend({
    elWindowContent : null,
    elContent       : null,
    elWindowWrapper : null,
    elTitleBar      : null,
    dialog          : null,
    titleBarTemplate: null,
    sectionTemplate : null,

    init: function (config) {
        var me    = this;
        me.config = $.extend({
            title   : App.translate('About Window'),
            actions : [],
            minWidth: 630,
            width   : 630,
            height  : 300,
            visible : false,
            buttons : [
                {
                    name : App.translate('Contact Helpdesk'),
                    click: function () {
                        me.onContactHelpdesk();
                    }
                },
                {
                    name : App.translate('Close'),
                    click: me.onCancel
                }
            ]
        }, config);

        me.build();

        me.dialog.center().open();

        return this;
    },

    build: function () {
        'use strict';

        $('#about-window').remove();

        this.elWindowContent = $('<div>', {
            id: 'about-window'
        }).appendTo('body');

        this.elContent = $('<div>', {
            'class': 'about-window-content'
        }).appendTo(this.elWindowContent);

        this.sectionTemplate = kendo.template(
            '<h5>#=title#</h5>' +
            '<p>#=text#</p>'
        );

        this.elContent.append(this.sectionTemplate({
            title: App.translate('Legal Notice'),
            text : 'The Webfonts “Lineicons” (designed by Sergey Shmidt), “Entypo” (designed by Daniel Bruce), and “Iconic” (designed by P.J. Onory) are licensed under a Creative Commons Attribution-ShareAlike 3.0 United States License (CC BY-SA 3.0 US). ' +
                   'The Webfont “Icomoon Ultimate” (designed by Keyamoon) is licensed under a Royalty Free License. ' +
                   'The Webfont “Eight Shades” (designed by Victor Erixon) is licensed under a Custom License. ' +
                   'The Webfont “Font Awesome” (designed by Dave Gandy) is licensed under a Creative Commons Attribution 3.0 Unported License (CC BY 3.0) ' +
                   'Biohazard Icon created by parkjisun from Noun Project'
        }));

        //noinspection JSUnresolvedFunction
        this.dialog = this.elWindowContent.kendoExtDialog(this.config).data('kendoExtDialog');

        this.elWindowWrapper = this.elWindowContent.parent();

        // this is necessary to be able to style all window elements including title
        this.elWindowWrapper.addClass('about-window');

        var imageContainer = kendo.template(
            '<div class="about-window-image-container"></div>'
        );

        this.elWindowWrapper.append(imageContainer({
            name: 'fleetmanagement' // TODO get this out of App.config.*
        }));

        // replace default window titlebar with our own
        this.elTitleBar = this.elWindowWrapper.find('.k-window-titlebar');
        this.elTitleBar.empty();

        var titleBarTemplate = kendo.template(
            '<div class="row">' +
            '<div class="col-sm-7">' +
            '<div class="about-application-logo"><img src="images/logos/about-#=name#.png"></div>' +
            '</div>' +
            '<div class="col-sm-5">' +
            '<div class="about-logo pull-right"></div>' +
            '</div>' +
            '</div>' +
            '<div class="row">' +
            '<div class="col-sm-12">' +
            '<div class="about-version">Version <b>#=version#</b> | #=copyrights#</div>' +
            '</div>' +
            '</div>'
        );

        this.elTitleBar.append(titleBarTemplate({
            name      : 'fleetmanagement', // TODO get this out of App.config.*
            version   : App.config.version,
            copyrights: App.config.copyrights
        }));

        this.dialog.bind('deactivate', function () {
            App.router.navigate('/');
        });

        return this;
    },

    /**
     * Close the dialog
     *
     * @param btn
     */
    onCancel         : function (btn) {
        btn.dialog.close();
    },
    onContactHelpdesk: function () {
        window.location.href = 'mailto:' + App.config.mailHelpdesk;
    }
});
