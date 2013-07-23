function AgendaListEventRenderer() {
    var t = this;


    // exports
    t.renderEvents = renderEvents;
    t.clearEvents = clearEvents;
    t.bindDaySeg = bindDaySeg;


    // imports
    AgendaListViewEventRenderer.call(t);
    var opt = t.opt;
    var trigger = t.trigger;
    var reportEvents = t.reportEvents;
    var reportEventClear = t.reportEventClear;
    var eventElementHandlers = t.eventElementHandlers;
    var getDaySegmentContainer = t.getDaySegmentContainer;
    var renderDaySegs = t.renderDaySegs;


    /* Rendering
     --------------------------------------------------------------------*/

    function renderEvents(events, modifiedEventId) {
        reportEvents(events);
        renderDaySegs(compileSegs(events), modifiedEventId);
    }


    function clearEvents() {
        reportEventClear();
        getDaySegmentContainer().empty();
    }


    function compileSegs(events) {
        var rowCnt = opt('agendaListLimit');
        var d1 = cloneDate(t.visStart);
        var d2 = addDays(cloneDate(d1), 1);
        var visEventsEnds = $.map(events, exclEndDay);
        var i, row, rowLength;
        var j, level, levelLength;
        var k;
        var segs = [];

        for (i = 0; i < rowCnt; i++) {
            row = stackSegs(sliceSegs(events, visEventsEnds, d1, d2));
            rowLength = row.length;
            for (j = 0; j < rowLength; j++) {
                level = row[j];
                levelLength = level.length;
                for (k = 0; k < levelLength; k++) {
                    segs.push(level[k]);
                }
            }

            addDays(d1, 1);
            addDays(d2, 1);
        }
        return segs;
    }


    function bindDaySeg(event, eventElement, seg) {
        eventElementHandlers(event, eventElement);
    }
}


function AgendaListViewEventRenderer() {
    var t = this;


    // exports
    t.renderDaySegs = renderDaySegs;


    // imports
    var opt = t.opt;
    var trigger = t.trigger;
    var eventEnd = t.eventEnd;
    var reportEventElement = t.reportEventElement;
    var getDaySegmentContainer = t.getDaySegmentContainer;
    var bindDaySeg = t.bindDaySeg;
    var formatDates = t.calendar.formatDates;


    /* Rendering
     -----------------------------------------------------------------------------*/
    
    function renderDaySegs(segs, modifiedEventId) {
        var segmentContainer = getDaySegmentContainer();

        segmentContainer[0].innerHTML = daySegHTML(segs);
        daySegElementResolve(segs, segmentContainer.children());
        daySegElementReport(segs);
        daySegHandlers(segs, segmentContainer, modifiedEventId);
        daySegAfterRender(segs);
    }


    function daySegHTML(segs) {
        var rtl = opt('isRTL');
        var i;
        var segCnt = segs.length;
        var seg;
        var event;
        var url;
        var classes;
        var skinCss;
        var skinCssAttr;
        var html = '';

        var rowPointer = 0;
        for (i = 0; i < segCnt; i++) {
            seg = segs[i];

            event = seg.event;
            classes = ['fc-event', 'fc-event-skin', 'fc-event-hori'];

            var today = clearTime(new Date());
            var eventDay = cloneDate(seg.start, true);
            var todayClass = (+today == +eventDay) ? " fc-state-highlight fc-today" : "";

            var dateFormatText = "";
            var tableClass = "";
            if (rowPointer != +eventDay) {
                dateFormatText = htmlEscape(formatDates(seg.start, seg.end, opt('dateFormat')));
                rowPointer = +eventDay;
                tableClass = " fc-agenda-list-day";
            }

            // prepare row
            html +="<table class='fc-agenda-list-container" + tableClass + "'>";
            html += "<tr>";

            html += "<th class='fc-event fc-agenda-date" + todayClass + "'>" + dateFormatText + "</th>";
            html += "<td class='fc-event fc-agenda-time'>";
            if (!event.allDay && seg.isStart) {
                html += "<span class='fc-event-time-seg'>" + htmlEscape(formatDates(event.start, event.end, opt('timeFormat'))) +"</span>";
            }
            else {
                html += "<span class='fc-event-time-seg'>" + opt('allDayAgendaText') + "</span>";
            }
            html += "</td>";

            // prepare title
            classes = classes.concat(event.className);
            if (event.source) { 
                classes = classes.concat(event.source.className || []);
            }
            url = event.url;
            skinCss = getSkinCss(event, opt);
            skinCssAttr = (skinCss ? " style='" + skinCss + "'" : '');

            html += "<td>";
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


    function daySegElementResolve(segs, elements) {
        var i;
        var segCnt = segs.length;
        var seg;
        var event;
        var element;
        var triggerRes;
        for (i = 0; i < segCnt; i++) {
            seg = segs[i];
            event = seg.event;
            element = $(elements[i]); // faster than .eq()
            triggerRes = trigger('eventRender', event, event, element);
            if (triggerRes === false) {
                element.remove();
            } else {
                if (triggerRes && triggerRes !== true) {
                    triggerRes = $(triggerRes).css({ position: 'absolute' });
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
        for (i = 0; i < segCnt; i++) {
            seg = segs[i];
            if (seg.element) {
                reportEventElement(seg.event, seg.element);
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
        for (i = 0; i < segCnt; i++) {
            seg = segs[i];
            element = seg.element;
            if (element) {
                event = seg.event;
                if (event._id === modifiedEventId) {
                    bindDaySeg(event, element, seg);
                } else if (element[0] != undefined) {
                    element[0]._fci = i; // for lazySegBind
                    lazy = true;
                }
            }
        }
        if (lazy) {
            lazySegBind(segmentContainer, segs, bindDaySeg);
        }
    }


    function daySegAfterRender(segs) {
        var i;
        var segCnt = segs.length;
        var seg;
        var event;
        for (i = 0; i < segCnt; i++) {
            seg = segs[i];
            if (seg.element) {
                event = seg.event;
                trigger('eventAfterRender', event, event, seg.element);
            }
        }
    }
}