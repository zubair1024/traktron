/**
 * global settings for all components
 * @type {{inheritFont: {font: string}, pdfOptions: {creator: string, paperSize: string, landscape: boolean}, rangeColors: {good: string, fair: string, bad: string, dangerous: string}}}
 */
App.component.config = {
    inheritFont: {font: 'inherit'},
    pdfOptions : {
        creator  : 'ROAMWORKS UI',
        paperSize: 'A4',
        landscape: true
    },
    /**
     * those colors are used for the different semantic ranges. It is the same color as in these CSS-classes:
     * - fg-fair
     * - fg-bad
     * - fg-dangerous
     * "good" is a light grey. In CSS it is a green (see fg-good).
     */
    rangeColors: {
        'good'     : '#EFEFF1',
        'fair'     : '#FDBC38',
        'bad'      : '#FC6B20',
        'dangerous': '#B20010'
    },
    /**
     * Bar chart: If the value of a row is larger than this threshold, the majorUnit of "1" is removed from its configuration.
     * @type {number}
     */
    tickThreshold: 10,
    /**
     * Build the tooltip for multiple values
     * @param data
     * @returns {string}
     */
    buildTooltip: function (data) {
        var el = '',
            formattedValue;
        if (data && data.length) {
            el = '';
            $.each(data, function (index, value) {
                formattedValue = App.util.format.item(value).length ? App.util.format.item(value) : App.config.blankSign;
                el = el + '<li>' + value.title + ': ' + formattedValue + '</li>';
            });
        }
        return el;
    }
};
