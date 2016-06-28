/**
 * Created by zubair on 21-Nov-15.
 */
App.component.CapacityChart = stampit.compose(App.component.ChartBase, stampit()
    .props({
        config    : null,
        element   : null,
        attributes: null,
        type      : null
    })
    .methods({
        /**
         * Format the data for capacity chart
         * @param data
         * @returns {Array}
         */
        formatData: function (data) {
            'use strict';
            var me           = this,
                rows         = data.metadata.rows,
                columns      = data.metadata.columns,
                filledSeries = [],
                emptySeries  = [],
                series       = [],
                attrSeries   = [],
                attrCount    = 0;

            //Expose the column attributes for meta information
            this.attributes = data.metadata.attributes;


            for (var i = 0; i < columns.length; i++) {
                //Reset to push new sets
                filledSeries = [];
                emptySeries  = [];
                attrSeries   = [];

                for (var j = 0; j < rows.length; j++) {
                    attrSeries.push(me.attributes[attrCount]);
                    //actual percentage
                    filledSeries.push(Math.round(data.tabledata.rows[j][i]));
                    if(Math.round(data.tabledata.rows[j][i]) > 100){
                        emptySeries.push(0);
                    }else{
                        //inverse percentage
                        emptySeries.push(Math.round(100 - data.tabledata.rows[j][i]));
                    }
                    //get the attributes
                    ++attrCount;
                }


                /**
                 * Make a column data that contains two bars on the stack
                 */
                series.push({
                    name   : 'Filled',
                    tooltip: attrSeries,
                    stack  : {
                        group: data.metadata.columns[i][0]
                    },
                    data   : filledSeries
                }, {
                    name   : 'Empty',
                    tooltip: attrSeries,
                    stack  : {
                        group: data.metadata.columns[i][0]
                    },
                    data   : emptySeries
                });

            }

            return series;
        },
        /**
         * Set the color of the bar based on condition
         * @param value
         * @param ranges
         * @returns {*}
         */
        setColor  : function (value, ranges) {
            var range = $.grep(ranges, function (e) {
                return ((e.from <= value) && (value <= e.to));
            });
            if (range[0] && range[0].type) {
                return App.component.config.rangeColors[range[0].type];
            }
        },

        getRanges      : function (e) {
            var currentCategory = e.category,
                currentColumn   = e.options.stack.group,
                currentRanges;
            for (var i = 0; i < this.attributes.length; i++) {
                if (this.attributes[i].row === currentCategory && this.attributes[i].column === currentColumn) {
                    currentRanges = this.attributes[i].ranges;
                }
            }
            return currentRanges;
        },
        /**
         * Create a custom bar/rectangle to fill with different colors based on thresholds
         * @param rect
         * @param color
         * @returns {drawing.Group}
         */
        createColumn   : function (rect, color) {
            'use strict';


            var drawing     = kendo.drawing,
                origin      = rect.origin,
                bottomRight = rect.bottomRight();

            // drawing.LinearGradient used to fill with given color based on threshold
            var gradient = new drawing.LinearGradient({
                start: [0, 0], // Left, top
                end  : [1, 1],   // Bottom, right
                stops: [{
                    offset: 0,
                    color : color
                }, {
                    offset : 0.5,
                    color  : color,
                    opacity: 0.9
                }, {
                    offset : 0.5,
                    color  : color,
                    opacity: 0.9
                }, {
                    offset: 1,
                    color : color
                }]
            });
            // Draws a triangle. Part of bar/rectangle as we cannot draw a rectangle with kendo.drawing
            var part1    = new drawing.Path({
                fill  : gradient,
                stroke: {
                    color  : color,
                    opacity: 0.5
                }
            }).moveTo(origin.x, origin.y)
                .lineTo(origin.x, bottomRight.y)
                .lineTo(bottomRight.x, origin.y);

            // Draws a triangle. Part of bar/rectangle as we cannot draw a rectangle with kendo.drawing
            var part2 = new drawing.Path({
                fill  : gradient,
                stroke: {
                    color: 'none'
                }
            }).moveTo(bottomRight.x, origin.y)
                .lineTo(origin.x, bottomRight.y)
                .lineTo(bottomRight.x, bottomRight.y);

            // Add part1 and part2 to form a rectangle
            var group = new drawing.Group();
            group.append(part1, part2);
            return group;
        },
        /**
         * Create a custom bar/rectangle to fill with different colors based on thresholds
         * @param rect
         * @param color
         * @returns {drawing.Group}
         */
        createCylinder : function (rect, color) {
            'use strict';

            var drawing     = kendo.drawing,
                geometry    = kendo.geometry,
                origin      = rect.origin,
                center      = rect.center(),
                bottomRight = rect.bottomRight(),
                radiusX     = rect.width() / 2,
                radiusY     = radiusX / 3;

            // drawing.LinearGradient used to fill with given color based on threshold
            var gradient = new drawing.LinearGradient({
                start: [0, 0], // Left, top
                end  : [1, 1],   // Bottom, right
                stops: [{
                    offset: 0,
                    color : color
                }, {
                    offset : 0.5,
                    color  : color,
                    opacity: 0.9
                }, {
                    offset : 0.5,
                    color  : color,
                    opacity: 0.9
                }, {
                    offset: 1,
                    color : color
                }]
            });
            // Draws a rectangle with bottom of it as radial.
            var part1    = new drawing.Path({
                fill  : gradient,
                stroke: {
                    color  : color,
                    opacity: 0.5
                }
            }).moveTo(origin.x, origin.y)
                .lineTo(origin.x, bottomRight.y)
                .arc(180, 0, radiusX, radiusY, true)
                .lineTo(bottomRight.x, origin.y)
                .arc(0, 180, radiusX, radiusY);

            // Draws an arc at top of rectangle
            var topArcGeometry = new geometry.Arc([center.x, origin.y], {
                startAngle: 0,
                endAngle  : 360,
                radiusX   : radiusX,
                radiusY   : radiusY
            });
            var topArc         = new drawing.Arc(topArcGeometry, {
                fill  : {
                    color: color
                },
                stroke: {
                    color: '#ebebeb'
                }
            });

            // Add rectangle and top arc to form a radial rectangle
            var group = new drawing.Group();
            group.append(part1, topArc);
            return group;
        },
        /**
         * Create column with thresold markers
         * @param rect
         * @param color
         * @param data
         * @param ranges
         * @returns {drawing.Group}
         */
        createThreshold: function (rect, color, data, ranges) {
            'use strict';

            var me          = this,
                drawing     = kendo.drawing,
                geometry    = kendo.geometry,
                origin      = rect.origin,
                bottomRight = rect.bottomRight();
            var rectRange   = new geometry.Rect(
                [origin.x, origin.y],  // Position of the top left corner
                [rect.size.width, rect.size.height * (100 / data)] // Size of the rectangle
            );
            var thresholds  = [];
            for (var i = 0; i < ranges.length - 1; i++) {
                var range    = ranges[i],
                    position = ((100 - range.to) * rectRange.size.height) / 100;
                thresholds.push(me.drawThreshold(origin.x, origin.y + position, drawing, geometry, 'th-right'));
                thresholds.push(me.drawThreshold(bottomRight.x - 6, origin.y + position, drawing, geometry, 'th-left'));
            }
            return thresholds;
        },
        drawThreshold  : function (x, y, drawing, geometry, iconName) {
            var rectRange = new geometry.Rect(
                [x, y],  // Position of the top left corner
                [5, 5] // Size of the rectangle
            );
            var src       = kendo.format('images/threshold/' + iconName + '.png');
            return new drawing.Image(src, rectRange);
        },
        refresh        : function () {
            var formattedData = this.formatData(data);
            this.element.setOptions({
                series: formattedData
            });
        }
    })
    /**
     * Initializer
     */
    .init(function () {
        if (DEBUG) {
            console.time('Capacity graph initialization time');
        }
        var me            = this,
            formattedData = this.formatData(me.config);

        if (this.height) {
            chartAreaData.height = this.height;
        }
        var element = me.config.el,
            rowData = [];

        /**
         * Get the categories for the category axis
         */
        for (var i = 0; i < me.config.metadata.rows.length; i++) {
            rowData.push(me.config.metadata.rows[i][0]);
        }

        /**
         * Initialize the chart with the data and bind it to the DOM element
         */
        this.element = element.kendoChart({
            title         : {
                text: ' '
            },
            legend        : {
                visible: false
            },
            seriesDefaults: {
                type     : 'column',
                stack    : {
                    type: '100%'
                },
                labels   : {
                    visible   : true,
                    background: 'transparent',
                    template  : ' #= value #%',
                    position  : 'center'
                },
                highlight: {
                    toggle: function (e) {
                        e.preventDefault();

                        var visual  = e.visual,
                            opacity = e.show ? 0.8 : 1;

                        visual.opacity(opacity);
                    }
                },
                visual   : function (e) {
                    var group  = {},
                        ranges = me.getRanges(e),
                        drawer = me.type == 'column' ? me.createColumn : me.createCylinder;
                    if (ranges) {
                        var thresholds = [];
                        if (e.options.index % 2 === 1) {
                            group      = drawer(e.rect, '#ccc');
                            thresholds = me.createThreshold(e.rect, e.options.color, e.dataItem, ranges);
                        } else {
                            group = drawer(e.rect, me.setColor(e.dataItem, ranges));
                        }
                        $.each(thresholds, function (index, item) {
                            group.append(item);
                        });
                        return group;
                    } else {
                        group = drawer(e.rect, e.options.color);
                        return group;
                    }
                }
            },
            series        : formattedData,
            //Set some default color for the series
            seriesColors  : ['#047F91', '#BBBBBB'],
            categoryAxis  : {
                categories: rowData,
                labels    : {
                    rotation: -90,
                    visible : true,
                    font    : 'inherit',
                    padding : {
                        right: 30
                    }
                },
            },
            valueAxis     : {
                min: 0
            },
            tooltip       : {
                visible : true,
                template: '#= series.stack.group #, #= series.name #' +
                          '#if(series.tooltip[(series.index)%2]) ' +
                          '{# #= App.component.config.buildTooltip(series.tooltip[(series.index)%2].description)# #}#'
            }
        }).data('kendoChart');
        if (DEBUG) {
            console.timeEnd('Capacity graph initialization time');
        }
    }));
