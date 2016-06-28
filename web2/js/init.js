/**
 * Initial main application entry point.
 */
$(function () {
    'use strict';

    /**
     * Add host specific configuration here.
     * @type {{sessionId: (*|null), culture: (*|null), debug_i18n: boolean, theme: (string|null)}}
     */
    App.init({
        sessionId : $.cookie(App.config.sessionName),
        language  : App.router.getUrlParameterByName('lg'),
        theme     : App.router.getUrlParameterByName('theme'),
        debug_i18n: App.router.getUrlParameterByName('debug_i18n') === '1'
    });
});
