/**
 * Wizard dialog
 * @type {*}
 */
App.ui.MenuBase = kendo.Class.extend({
    config: {},

    /**
     * Holds Menu element
     */
    elMenu: null,

    /**
     *
     * @param config
     * @returns {*}
     */
    init: function (config) {
        'use strict';

        this.config = $.extend({}, config);

        /**
         * make kendoui menu a little bit "lazier" for sloppy people...
         */
        //var originalMouseLeave = kendo.ui.Menu.fn._mouseleave;
        //kendo.ui.Menu.fn._mouseleave = function (e) {
        //    var me = this;
        //    clearTimeout(this._timeoutHandle);
        //    this._timeoutHandle = setTimeout(function () {
        //        originalMouseLeave.call(me, e);
        //    }, 2000);
        //};

        return this;
    },

    /**
     * Build menu column container for one menu column
     *
     * @param icon
     * @param title
     * @param content
     * @param titleAction
     * @param containerId
     * @returns {*}
     */
    renderMenuColumn: function (icon, title, content, titleAction, containerId) {
        'use strict';

        //glyphicon mapping
        switch (icon) {
            case 'megamenu-edit':
                icon = 'edit';
                break;
            case 'megamenu-report':
                icon = 'signal';
                break;
            case 'alarmsmenu-active':
                icon = 'bell fg-dangerous';
                break;
            case 'alarmsmenu-acknowledged':
                icon = 'bell fg-bad';
                break;
            case 'alarmsmenu-normal':
                icon = 'bell fg-good';
                break;
            case 'notificationsmenu-events':
                icon = 'time';
                break;
            case 'notificationsmenu-alarms':
                icon = 'bell';
                break;
            case 'notificationsmenu-errors':
                icon = 'warning-sign';
                break;
        }
        var template = kendo.template(
            '<li#if(containerId){# id="#=containerId#"#}#>' +
            '<ul>' +
            '<li>' +
            '<div class="menu-column-header-glyphicon">' +
            '<span class="glyphicon glyphicon-#=icon#"></span>' +
            '<span class="menu-column-header-text"><span class="navbar-left">#=title#</span>#if(titleAction){# #=titleAction##}#</span>' +
            '</div>' +
            '<ul class="menu-column-content menu-column-content-glyphicon">#=content#</ul>' +
            '</li>' +
            '</ul>' +
            '</li>'
        );

        return template({
            title      : title,
            icon       : icon,
            content    : content,
            containerId: containerId,
            titleAction: titleAction
        });
    }
});
