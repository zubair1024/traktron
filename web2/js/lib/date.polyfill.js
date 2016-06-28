/**
 * This method was standardized in ECMA-262 5th edition.
 * Basic support in those browsers: Chrome 5, Firefox (Gecko) 3, Internet Explorer 9, Opera 10.5, Safari 4.
 */
if (!Date.now) {
    Date.now = function now() {
        return new Date().getTime();
    };
}