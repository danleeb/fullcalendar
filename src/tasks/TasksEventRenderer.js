function TasksListEventRenderer() {
    var t = this;


    // exports
    t.renderEvents = renderEvents;
    t.clearEvents = clearEvents;
    t.bindDaySeg = bindDaySeg;


    // imports
    TasksListViewEventRenderer.call(t);
    var opt = t.opt;
    var trigger = t.trigger;
    //var setOverflowHidden = t.setOverflowHidden;
    var isEventDraggable = t.isEventDraggable;
    var isEventResizable = t.isEventResizable;
    var reportEvents = t.reportEvents;
    var reportEventClear = t.reportEventClear;
    var eventElementHandlers = t.eventElementHandlers;
    var showEvents = t.showEvents;
    var hideEvents = t.hideEvents;
    var eventDrop = t.eventDrop;
    var getDaySegmentContainer = t.getDaySegmentContainer;
    var getHoverListener = t.getHoverListener;
    var renderDayOverlay = t.renderDayOverlay;
    var clearOverlays = t.clearOverlays;
    var getRowCnt = t.getRowCnt;
    var getColCnt = t.getColCnt;
    var renderTaskSegs = t.renderTaskSegs;



    /* Rendering
     --------------------------------------------------------------------*/
    function renderEvents(events, modifiedEventId) {
        reportEvents(events);
        renderTaskSegs(compileSegs(events), modifiedEventId);
    }

    function clearEvents() {
        reportEventClear();
        getDaySegmentContainer().empty();
    }

    function compileSegs(events) {
        var cnt = events.length,
            event, i,
            segs = [];

        for (i = 0; i < cnt; i++) {

            event = events[i];
            if (event.type === 'task') {
                segs.push({ event: event });
            }

        }
        return segs;
    }


    function bindDaySeg(event, eventElement, seg) {
        /*if (isEventDraggable(event)) {
            draggableDayEvent(event, eventElement);
        }*/
        eventElementHandlers(event, eventElement);
    }



    /* Dragging
     ----------------------------------------------------------------------------*/


    function draggableDayEvent(event, eventElement) {
        var hoverListener = getHoverListener();
        var dayDelta;
        eventElement.draggable({
            zIndex: 9,
            delay: 50,
            opacity: opt('dragOpacity'),
            revertDuration: opt('dragRevertDuration'),
            start: function(ev, ui) {
                trigger('eventDragStart', eventElement, event, ev, ui);
                hideEvents(event, eventElement);
                hoverListener.start(function(cell, origCell, rowDelta, colDelta) {
                    eventElement.draggable('option', 'revert', !cell || !rowDelta && !colDelta);
                    clearOverlays();
                    if (cell) {
                        //setOverflowHidden(true);
                        dayDelta = rowDelta*7 + colDelta * (opt('isRTL') ? -1 : 1);
                        renderDayOverlay(
                            addDays(cloneDate(event.start), dayDelta),
                            addDays(exclEndDay(event), dayDelta)
                        );
                    }else{
                        //setOverflowHidden(false);
                        dayDelta = 0;
                    }
                }, ev, 'drag');
            },
            stop: function(ev, ui) {
                hoverListener.stop();
                clearOverlays();
                trigger('eventDragStop', eventElement, event, ev, ui);
                if (dayDelta) {
                    eventDrop(this, event, dayDelta, 0, event.allDay, ev, ui);
                }else{
                    eventElement.css('filter', ''); // clear IE opacity side-effects
                    showEvents(event, eventElement);
                }
                //setOverflowHidden(false);
            }
        });
    }
}


function TasksListViewEventRenderer() {
    var t = this;


    // exports
    t.renderTaskSegs = renderTaskSegs;


    // imports
    var opt = t.opt;
    var trigger = t.trigger;
    var isEventDraggable = t.isEventDraggable;
    var isEventResizable = t.isEventResizable;
    var eventEnd = t.eventEnd;
    var reportEventElement = t.reportEventElement;
    var showEvents = t.showEvents;
    var hideEvents = t.hideEvents;
    var eventResize = t.eventResize;
    var getRowCnt = t.getRowCnt;
    var getColCnt = t.getColCnt;
    var getColWidth = t.getColWidth;
    var allDayRow = t.allDayRow;
    var allDayBounds = t.allDayBounds;
    var colContentLeft = t.colContentLeft;
    var colContentRight = t.colContentRight;
    var dayOfWeekCol = t.dayOfWeekCol;
    var dateCell = t.dateCell;
    var compileDaySegs = t.compileDaySegs;
    var getDaySegmentContainer = t.getDaySegmentContainer;
    var bindDaySeg = t.bindDaySeg; //TODO: streamline this
    var formatDates = t.calendar.formatDates;
    var renderDayOverlay = t.renderDayOverlay;
    var clearOverlays = t.clearOverlays;
    var clearSelection = t.clearSelection;



    /* Rendering
     -----------------------------------------------------------------------------*/


    function renderTaskSegs(segs, modifiedEventId) {
        var segmentContainer = getDaySegmentContainer();
        var rowCnt = getRowCnt();
        var colCnt = getColCnt();
        var i = 0;
        var rowI;
        var levelI;
        var colHeights;
        var j;
        var segCnt = segs.length;
        var seg;
        var top;
        var k;

        segmentContainer[0].innerHTML = tasksSegHTML(segs); // faster than .html()
        daySegElementResolve(segs, segmentContainer.children());
        daySegElementReport(segs);
        daySegHandlers(segs, segmentContainer, modifiedEventId);
        daySegCalcHSides(segs);

        triggerEventAfterRender(segs);
    }

    function tasksSegHTML(segs) {

        var rtl = opt('isRTL');
        var i;
        var segCnt = segs.length;
        var seg;
        var event;
        var url;
        var classes;
        var bounds = allDayBounds();
        var minLeft = bounds.left;
        var maxLeft = bounds.right;
        var leftCol;
        var rightCol;
        var left;
        var right;
        var skinCss;
        var skinCssAttr;
        var html = '';

        var rowPointer = 0;
        // calculate desired position/dimensions, create html
        for (i = 0; i < segCnt; i++) {
            seg = segs[i];

            event = seg.event;
            classes = ['fc-event', 'fc-event-skin', 'fc-event-hori'];
            if (isEventDraggable(event)) {
                classes.push('fc-event-draggable');
            }

            var today = clearTime(new Date());
            var eventDay = cloneDate(seg.start, true);
            var todayClass = (+today == +eventDay) ? " fc-state-highlight fc-today" : ""; //fc-state-highlight fc-today

            var dateFormatText = "";
            var tableClass = "";
            if (rowPointer != +eventDay) {
                dateFormatText = htmlEscape(formatDates(seg.start, seg.end, opt('dateFormat')));
                rowPointer = +eventDay;
                tableClass = " fc-agenda-list-day";
            }

            // prepare row
            html +="<table class='fc-agenda-list-container"+tableClass+"' style='padding-bottom:5px;'>";
            html += "<tr>";

            html += "<th class='fc-event"+todayClass+"' style='text-align: left;'>"+ dateFormatText +"</th>";
            html += "<td style='width:120px;' class='fc-event'>";
            if (!event.allDay && seg.isStart) {
                html += "<span class='fc-event-time-seg'>" + htmlEscape(formatDates(event.start, event.end, opt('timeFormat'))) +"</span>";
            }
            else {
                html += "<span class='fc-event-time-seg'>" + opt('allDayAgendaText') + "</span>";
            }
            html += "</td>";

            // prepare title
            classes = classes.concat(event.className);
            if (event.source) { classes = classes.concat(event.source.className || []); }
            url = event.url;
            skinCss = getSkinCss(event, opt);
            skinCssAttr = (skinCss ? " style='" + skinCss + "'" : '');

            html += "<td style=''>";
            html += "<span class='fc-event-title'> " +
                        (url ? ("<a href='" + htmlEscape(url) + "'") : "<span") + skinCssAttr +
                        " class='" + classes.join(' ') + "'>" +
                        htmlEscape(event.title) +
                        "</" + (url ? "a" : "span" ) + ">" +
                    "</span>";
            html += "</td>";
            html += "</tr></table>";
        }


        return html;
    }


    function daySegElementResolve(segs, elements) { // sets seg.element
        var i;
        var segCnt = segs.length;
        var seg;
        var event;
        var element;
        var triggerRes;
        for (i=0; i<segCnt; i++) {
            seg = segs[i];
            event = seg.event;
            element = $(elements[i]); // faster than .eq()
            triggerRes = trigger('eventRender', event, event, element);
            if (triggerRes === false) {
                element.remove();
            }else{
                if (triggerRes && triggerRes !== true) {
                    triggerRes = $(triggerRes)
                        .css({
                            position: 'absolute',
                            left: seg.left
                        });
                    element.replaceWith(triggerRes);
                    element = triggerRes;
                }
                seg.element = element;
            }
        }
    }


    function daySegElementReport(segs) {
        var i;
        var segCnt = segs.length;
        var seg;
        var element;
        for (i=0; i<segCnt; i++) {
            seg = segs[i];
            element = seg.element;
            if (element) {
                reportEventElement(seg.event, element);
            }
        }
    }


    function daySegHandlers(segs, segmentContainer, modifiedEventId) {
        var i;
        var segCnt = segs.length;
        var seg;
        var element;
        var event;
        var lazy = false;
        // retrieve elements, run through eventRender callback, bind handlers
        for (i=0; i<segCnt; i++) {
            seg = segs[i];
            element = seg.element;
            if (element) {
                event = seg.event;
                if (event._id === modifiedEventId) {
                    bindDaySeg(event, element, seg);
                }else if (element[0] != undefined) {
                    element[0]._fci = i; // for lazySegBind
                    lazy = true;
                }
            }
        }
        if (lazy) {
            lazySegBind(segmentContainer, segs, bindDaySeg);
        }
    }


// TODO: needed?
    function daySegCalcHSides(segs) { // also sets seg.key
        var i;
        var segCnt = segs.length;
        var seg;
        var element;
        var key, val;
        var hsideCache = {};
        // record event horizontal sides
        for (i=0; i<segCnt; i++) {
            seg = segs[i];
            element = seg.element;
            if (element) {
                key = seg.key = cssKey(element[0]);
                val = hsideCache[key];
                if (val === undefined) {
                    val = hsideCache[key] = hsides(element, true);
                }
                seg.hsides = val;
            }
        }
    }


    function triggerEventAfterRender(segs) {
        var i;
        var segCnt = segs.length;
        var seg;
        var element;
        for (i=0; i<segCnt; i++) {
            seg = segs[i];
            element = seg.element;
            if (element) {
                trigger('eventAfterRender', seg.event, seg.event, element);
            }
        }
    }

}