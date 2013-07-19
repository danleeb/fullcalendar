fcViews.tasks = TasksListView;

function TasksListView(element, calendar) {
    var t = this;

    // exports
    t.render = render;
    t.fetchData = {
        type: 'task'
    };

    // imports
    TasksList.call(t, element, calendar, 'tasks');
    var opt = t.opt;
    var renderList = t.renderList;
    var formatDate = calendar.formatDate;

    function render(date, delta) {
        if (delta) {
            addDays(date, delta);
            //  date.setDate(1);
        }
        var start = cloneDate(date, true);
        var end = addDays(cloneDate(start, true), 1);
        var visStart = cloneDate(start, true);
        var visEnd =  addDays(cloneDate(end, true), opt('tasksListLimit'));

        t.title = opt('tasksTitle');
        t.start = null;
        t.end = null;
        t.visStart = null;
        t.visEnd = null;
        renderList(opt('tasksListLimit'));
    }
}

function TasksList(element, calendar, viewName) {
    var t = this;


    // exports
    t.renderList = renderList;
    t.setHeight = setHeight;
    t.setWidth = setWidth;
    t.renderDayOverlay = renderDayOverlay;
    t.defaultSelectionEnd = defaultSelectionEnd;
    t.renderSelection = renderSelection;
    t.clearSelection = clearSelection;
    t.reportDayClick = reportDayClick; // for selection (kinda hacky)
    t.dragStart = dragStart;
    t.dragStop = dragStop;
    t.defaultEventEnd = defaultEventEnd;
    t.getHoverListener = function() { return hoverListener };
    t.colContentLeft = colContentLeft;
    t.colContentRight = colContentRight;
    t.dayOfWeekCol = dayOfWeekCol;
    t.dateCell = dateCell;
    t.cellDate = cellDate;
    t.cellIsAllDay = function() { return true };
    t.allDayRow = allDayRow;
    t.allDayBounds = allDayBounds;
    t.getRowCnt = function() { return rowCnt };
    t.getColCnt = function() { return colCnt };
    t.getColWidth = function() { return colWidth };
    t.getDaySegmentContainer = function() { return daySegmentContainer };


    // imports
    View.call(t, element, calendar, viewName);
    OverlayManager.call(t);
    SelectionManager.call(t);
    TasksListEventRenderer.call(t);
    var opt = t.opt;
    var trigger = t.trigger;
    var clearEvents = t.clearEvents;
    var renderOverlay = t.renderOverlay;
    var clearOverlays = t.clearOverlays;
    var daySelectionMousedown = t.daySelectionMousedown;
    var formatDate = calendar.formatDate;


    // locals

    var head;
    var headCells;
    var body;
    var bodyRows;
    var bodyCells;
    var bodyFirstCells;
    var bodyCellTopInners;
    var daySegmentContainer;

    var viewWidth;
    var viewHeight;
    var colWidth;

    var rowCnt, colCnt;
    var coordinateGrid;
    var hoverListener;
    var colContentPositions;

    var rtl, dis, dit;
    var firstDay;
    var nwe;
    var tm;
    var colFormat;



    /* Rendering
     ------------------------------------------------------------*/


    disableTextSelection(element.addClass('fc-grid'));


    function renderList(maxr) {

        rowCnt = opt('tasksListLimit');
        colCnt = 1;

        updateOptions();
        var firstTime = !body;
        if (firstTime) {
            buildSkeleton(maxr);
        }else{
            clearEvents();
        }
    }



    function updateOptions() {
        rtl = opt('isRTL');
        if (rtl) {
            dis = -1;
            dit = colCnt - 1;
        }else{
            dis = 1;
            dit = 0;
        }
        firstDay = opt('firstDay');
        nwe = opt('weekends') ? 0 : 1;
        tm = opt('theme') ? 'ui' : 'fc';
        colFormat = opt('columnFormat');
    }



    function buildSkeleton(maxRowCnt) {
        //TODO#1
        var s;
        var i, j;
        var table;
        var colCnt = 1;

        s = "<table class='fc-border-separate' style='width:100%' cellspacing='0'>" +
                "<thead>" +
                "<tr>";

        s += "</tr>" +
                "</thead>" +
                "<tbody>";
        for (i=0; i<maxRowCnt; i++) {

            s += "<tr class='row-num-"+ i +"' style='padding: 10px;'>" +
                    "<td>" +
                        "<div class='fc-day-content'><div></div></div>" +
                    "</td>" +
                    "</tr>";
        }
        s += "</tbody>" +
                "</table>";
        table = $(s).appendTo(element);

        head = table.find('thead');
        headCells = head.find('th');
        body = table.find('tbody');
        bodyRows = body.find('tr');
        bodyCells = body.find('td');
        bodyFirstCells = bodyCells.filter(':first-child');
        bodyCellTopInners = bodyRows.eq(0).find('div.fc-day-content div');

        dayBind(bodyCells);

        daySegmentContainer =
            $("<div style='position:absolute;z-index:8;top:0;left:0'/>")
                .appendTo(element);

    }

    function setHeight(height) {
        viewHeight = height;

        var bodyHeight = viewHeight - head.height();
        var rowHeight;
        var rowHeightLast;
        var cell;

        if (opt('weekMode') == 'variable') {
            rowHeight = rowHeightLast = Math.floor(bodyHeight / (rowCnt==1 ? 2 : 6));
        }else{
            rowHeight = Math.floor(bodyHeight / rowCnt);
            rowHeightLast = bodyHeight - rowHeight * (rowCnt-1);
        }

        bodyFirstCells.each(function(i, _cell) {
            if (i < rowCnt) {
                cell = $(_cell);
                setMinHeight(
                    cell.find('> div'),
                    (i==rowCnt-1 ? rowHeightLast : rowHeight) - vsides(cell)
                );
            }
        });

    }


    function setWidth(width) {
        viewWidth = width;
        colContentPositions.clear();
        colWidth = Math.floor(viewWidth / colCnt);
        setOuterWidth(headCells.slice(0, -1), colWidth);
    }



    /* Day clicking and binding
     -----------------------------------------------------------*/


    function dayBind(days) {
        /*days.click(dayClick)
            .mousedown(daySelectionMousedown);*/
    }


    function dayClick(ev) {
        /*
         if (!opt('selectable')) { // if selectable, SelectionManager will worry about dayClick
         var index = parseInt(this.className.match(/fc\-day(\d+)/)[1]); // TODO: maybe use .data
         var date = indexDate(index);
         trigger('dayClick', this, date, true, ev);
         } */
    }



    /* Semi-transparent Overlay Helpers
     ------------------------------------------------------*/


    function renderDayOverlay(overlayStart, overlayEnd, refreshCoordinateGrid) { // overlayEnd is exclusive

        if (refreshCoordinateGrid) {
            coordinateGrid.build();
        }

        var rowStart = cloneDate(t.start);
        var rowEnd = addDays(cloneDate(rowStart), colCnt);
        for (var i=0; i<rowCnt; i++) {
            var stretchStart = new Date(Math.max(rowStart, overlayStart));
            var stretchEnd = new Date(Math.min(rowEnd, overlayEnd));
            if (stretchStart < stretchEnd) {
                var colStart, colEnd;
                if (rtl) {
                    colStart = dayDiff(stretchEnd, rowStart)*dis+dit+1;
                    colEnd = dayDiff(stretchStart, rowStart)*dis+dit+1;
                }else{
                    colStart = dayDiff(stretchStart, rowStart);
                    colEnd = dayDiff(stretchEnd, rowStart);
                }
                dayBind(
                    renderCellOverlay(i, colStart, i, colEnd-1)
                );
            }
            addDays(rowStart, 1);
            addDays(rowEnd, 1);
        }
    }


    function renderCellOverlay(row0, col0, row1, col1) { // row1,col1 is inclusive

        var rect = coordinateGrid.rect(row0, col0, row1, col1, element);
        return renderOverlay(rect, element);
    }



    /* Selection
     -----------------------------------------------------------------------*/


    function defaultSelectionEnd(startDate, allDay) {
        return cloneDate(startDate);
    }


    function renderSelection(startDate, endDate, allDay) {
        renderDayOverlay(startDate, addDays(cloneDate(endDate), 1), true); // rebuild every time???
    }


    function clearSelection() {
        clearOverlays();
    }


    function reportDayClick(date, allDay, ev) {
        var cell = dateCell(date);
        var _element = bodyCells[cell.row*colCnt + cell.col];
        trigger('dayClick', _element, date, allDay, ev);
    }



    /* External Dragging
     -----------------------------------------------------------------------*/


    function dragStart(_dragElement, ev, ui) {
        hoverListener.start(function(cell) {
            clearOverlays();
            if (cell) {
                renderCellOverlay(cell.row, cell.col, cell.row, cell.col);
            }
        }, ev);
    }


    function dragStop(_dragElement, ev, ui) {
        var cell = hoverListener.stop();
        clearOverlays();
        if (cell) {
            var d = cellDate(cell);
            trigger('drop', _dragElement, d, true, ev, ui);
        }
    }



    /* Utilities
     --------------------------------------------------------*/


    function defaultEventEnd(event) {
        return cloneDate(event.start);
    }


    coordinateGrid = new CoordinateGrid(function(rows, cols) {
        var e, n, p;
        headCells.each(function(i, _e) {
            e = $(_e);
            n = e.offset().left;
            if (i) {
                p[1] = n;
            }
            p = [n];
            cols[i] = p;
        });
        p[1] = n + e.outerWidth();
        bodyRows.each(function(i, _e) {
            if (i < rowCnt) {
                e = $(_e);
                n = e.offset().top;
                if (i) {
                    p[1] = n;
                }
                p = [n];
                rows[i] = p;
            }
        });
        p[1] = n + e.outerHeight();
    });


    hoverListener = new HoverListener(coordinateGrid);


    colContentPositions = new HorizontalPositionCache(function(col) {
        return bodyCellTopInners.eq(col);
    });


    function colContentLeft(col) {
        return colContentPositions.left(col);
    }


    function colContentRight(col) {
        return colContentPositions.right(col);
    }




    function dateCell(date) {
        return {
            row: Math.floor(dayDiff(date, t.visStart) / 7),
            col: dayOfWeekCol(date.getDay())
        };
    }


    function cellDate(cell) {
        return _cellDate(cell.row, cell.col);
    }


    function _cellDate(row, col) {
        return addDays(cloneDate(t.visStart), row*7 + col*dis+dit);
        // what about weekends in middle of week?
    }


    function indexDate(index) {
        return _cellDate(Math.floor(index/colCnt), index%colCnt);
    }


    function dayOfWeekCol(dayOfWeek) {
        return ((dayOfWeek - Math.max(firstDay, nwe) + colCnt) % colCnt) * dis + dit;
    }




    function allDayRow(i) {
        return bodyRows.eq(i);
    }


    function allDayBounds(i) {
        return {
            left: 0,
            right: viewWidth
        };
    }


}
