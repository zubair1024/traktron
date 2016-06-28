/**
 * Created by zubair on 05-Dec-15.
 */

App.component.ChartBase = stampit()
    .props({
        /**
         * Base public variables
         */
        config: null,
        element: null

    }).methods({
        /**
         * Base public functions
         */
        redraw: function () {
            this.element.redraw();
        },
        destroy: function () {
            this.config.el.remove();
        },
        show: function () {
            this.element.show();
        },
        hide: function () {
            this.element.hide();
        }
    });