/*
 *# Kendo UI MenuEx by CZ
 *
 * MenuEx allows you to create:
 *  - context menus
 *  - hook to click event of menu node
 *  - extra data assigned to menu node
 *  - addnode callback (envoked when html of node generated)
 *
 *## Auto data-data insertion.
 *
 * {text: 'text', data: {id:5}}
 *
 * will be
 *
 * <li class='...' data-data='{id:5}'>text</li>
 *
 *## Node click callback
 *
 * {text: 'text', click: 'alert(this)' }
 *
 *## addnode callback
 *
 *  addnode: function ( e ) {
 *      console.log(e);
 *  }
 *
 *## All extra options
 *
 * - anchor - selector to elements menu will be linked
 * - event  - jQuery event triggers context menu (default: 'contexmenu')
 * - delay  - delay before menu will hide
 *
 *## Example
 *
 * $(document).ready(function()  {
 *      $('#testMenu').kendoMenuEx({
 *      dataSource: [
 *            {
 *                text: 'item #1',
 *                imageUrl: "../../content/shared/icons/sports/baseball.png",
 *                data: {id: 5, extra: 'extradata'},
 *                click: 'showalert(this)'
 *            }
 *        ],
 *        select: function(el) {
 *            console.log(el);
 *        },
 *        orientation: 'vertical',
 *        anchor: '#mySpan, #myButton',
 *        delay: 1500,
 *        addnode: function(el) { console.log(el); }
 *    });
 * });
 *
 *
 * Kendo UI Complete v2012.1.322 (http://kendoui.com)
 * Copyright 2012 Telerik AD. All rights reserved.
 *
 */

/*CUSTOMIZATIONS
 05.14.2013 - JLL - added offsetY, offsetX options
 05.15.2013 - JLL - added multiple context menus on same page and show/hide work properly
 - added screen detection mode
 */

(function ($, undefined) {

    var parent = window.kendo.ui.Menu.renderItem;

    $.extend(window.kendo.ui.Menu, {

        renderItem: function (options) {

            var r = parent(options);
            var injects = "";

            if (options.item.data) {

                injects = " data-data='" + JSON.stringify(options.item.data) + "'";
            }

            if (injects.length > 0) {

                var re = /(<li)([^>]*>.*)/;
                var m = re.exec(r);

                r = m[1] + injects + m[2];
            }

            return r;
        }
    });

    //var hiding = false;
    //var showing = false;

    var MenuEx = window.kendo.ui.Menu.extend({/** @lends kendo.ui.Menu.prototype */

        /**
         * target object which was clicked
         */
        target: {},
        /**
         * menu item which was clicked
         */
        item  : {},

        hiding               : false,
        showing              : false,
        enableScreenDetection: true,

        options: {
            name       : "MenuEx",
            delay      : 1000,
            event      : 'contextmenu',
            orientation: 'vertical',
            selector   : '',
            offsetY    : 0,
            offsetX    : 0
        },

        init           : function (element, options) {

            var that = this;

            window.kendo.ui.Menu.fn.init.call(that, element, options);

            that.element.addClass('k-context-menu');

            if (options.anchor) {
                $(this.element).on('mouseleave', function () {
                    delay = options.delay || that.options.delay;
                    setTimeout(function () {
                        that.hide()
                    }, delay);
                });
            }

            $(document).click($.proxy(that._documentClick, that));

            // Select first level of context menu.
            var items = that.element.children('.k-item');
            this.setClickHandler(options.dataSource, items);
        },
        setClickHandler: function (items, elements) {
            var that = this;
            $.each(items, function (idx, item) {
                if (item.click) {
                    jQuery(elements[idx]).click(function (e) {
                        that.item = $(e.target).parents('li');
                        item.click.call(that, e);
                    });
                }
                if (item.items) {
                    var subitems = $(elements[idx]).find('.k-group > .k-item');
                    that.setClickHandler(item.items, subitems);
                }
            });
        },
        hide           : function () {

            if (this.showing) {

                this.hiding = true;

                var $target = $(this.target);

                if ($target.hasClass('k-item')) {
                    $target.find('.k-in').removeClass('k-state-focused');
                }

                this.element.fadeOut($.proxy(function () {

                    this.hiding = false;
                    this.showing = false;

                }, this));
            }
        },
        show           : function (anchor, e) {

            if (this.hiding == false) {

                this.target = e.currentTarget;

                // determine if off screen
                var eleHeight = $(this.element).height();
                var eleWidth = $(this.element).width();
                var xPos = e.pageX + this.options.offsetX;
                var yPos = e.pageY + this.options.offsetY;

                var anchorOffset = $(anchor).offset();
                yPos = yPos - anchorOffset.top;

                if (this.enableScreenDetection) {
                    if (
                        (eleWidth + xPos) > (window.innerWidth + window.scrollX) ||
                            (eleHeight + yPos) > (window.innerHeight + window.scrollY)
                        ) {
                        // off screen detected, need to ignore off set settings and mouse position and position to fix the menu
                        if ((eleWidth + xPos) > (window.innerWidth + window.scrollX)) {
                            xPos = window.innerWidth + window.scrollX - eleWidth - 3;
                        }
                        if ((eleHeight + yPos) > (window.innerHeight + window.scrollY)) {
                            yPos = window.innerHeight + window.scrollY - eleHeight - 3;
                        }
                    }

                }

                // place menu
                this.element.css({ 'top': yPos, 'left': xPos });

                this.element.fadeIn($.proxy(function () {
                    this.showing = true;
                }, this));
            }
        },

        _documentClick: function (e) {

            var that = this;
            that.hide();
        }
    });

    window.kendo.ui.plugin(MenuEx);

})(jQuery);
