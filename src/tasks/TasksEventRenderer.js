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
    var reportEvents = t.reportEvents;
    var reportEventClear = t.reportEventClear;
    var eventElementHandlers = t.eventElementHandlers;
    var getSegmentContainer = t.getSegmentContainer;
    var renderTaskSegs = t.renderTaskSegs;


    function renderEvents(events, modifiedEventId) {
        reportEvents(events);
        renderTaskSegs(compileSegs(events), modifiedEventId);
    }

    function clearEvents() {
        reportEventClear();
        getSegmentContainer().empty();
    }

    function compileSegs(events) {
        var cnt = events.length,
            event, i,
            segs = [];
        for (i = 0; i < cnt && i < opt('tasksListLimit'); i++) {
            event = events[i];
            if (event.type === 'task') {
                segs.push({ event: event });
            }
        }
        return segs;
    }

    function bindDaySeg(event, eventElement, seg) {
        var $tr = eventElement.closest('tr');
        $tr.find('.fc-task-checkbox input[type="checkbox"]').on('change', function() {
            if ($(this).is(':checked')) {
                $tr.addClass('fc-state-highlight');
            } else {
                $tr.removeClass('fc-state-highlight');
            }
        });
        eventElementHandlers(event, eventElement);
    }

}

function TasksListViewEventRenderer() {
    var t = this;

    // exports
    t.renderTaskSegs = renderTaskSegs;

    // imports
    var opt = t.opt;
    var trigger = t.trigger;
    var reportEventElement = t.reportEventElement;
    var getSegmentContainer = t.getSegmentContainer;
    var bindDaySeg = t.bindDaySeg;
    var formatDates = t.calendar.formatDates;


    function renderTaskSegs(segs, modifiedEventId) {
        var segmentContainer = getSegmentContainer();

        segmentContainer[0].innerHTML = tasksSegHTML(segs); // faster than .html()
        segElementResolve(segs, segmentContainer.find('.fc-task-title'));
        segElementReport(segs);
        segHandlers(segs, segmentContainer, modifiedEventId);

        triggerEventAfterRender(segs);
    }

    function tasksSegHTML(segs) {
        var i;
        var segCnt = segs.length;
        var seg;
        var event;
        var url;
        var classes;
        var skinCss;
        var skinCssAttr;
        
        var html = '<table class="fc-tasks-list-container">';

        for (i = 0; i < segCnt; i++) {
            seg = segs[i];

            event = seg.event;
            classes = ['fc-task', 'fc-event-skin'];

            var today = clearTime(new Date());
            var eventDay = cloneDate(event.start, true);
            var todayClass = (+today == +eventDay) ? " fc-state-highlight fc-today" : "";

            html += '<tr>';
            html += '<td class="fc-task-checkbox"><input type="checkbox" /></td>';

            classes = classes.concat(event.className);
            if (event.source) {
                classes = classes.concat(event.source.className || []);
            }
            url = event.url;
            skinCss = getSkinCss(event, opt);
            skinCssAttr = (skinCss ? ' style="' + skinCss + '"' : "");

            html += '<td>';
            html += '<span class="fc-task-title"> ' +
                        (url ? ('<a href="' + htmlEscape(url) + '"') : '<span') + skinCssAttr +
                        ' class="' + classes.join(" ") + '">' +
                        htmlEscape(event.title) +
                        '</' + (url ? 'a' : 'span' ) + '>' +
                    '</span>';
            html += '</td>';
            html += '<td class="fc-task-date' + todayClass + '">' + htmlEscape(formatDates(event.start, event.end, opt('dateFormat')));
            if (!event.allDay && event.start) {
                html += ' - <span class="fc-task-time-seg">' + htmlEscape(formatDates(event.start, event.end, opt("timeFormat"))) + '</span>';
            }
            else {
                html += '';
            }
            html += '</td>';
            html += '</tr>';
        }

        html += '</table>';

        return html;
    }

    function segElementResolve(segs, elements) {
        var i;
        var segCnt = segs.length;
        var seg;
        var event;
        var element;
        var triggerRes;
        for (i = 0; i < segCnt; i++) {
            seg = segs[i];
            event = seg.event;
            element = $(elements[i]);
            triggerRes = trigger('eventRender', event, event, element);
            if (triggerRes === false) {
                element.remove();
            } else {
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

    function segElementReport(segs) {
        var i;
        var segCnt = segs.length;
        var seg;
        var element;
        for (i = 0; i < segCnt; i++) {
            seg = segs[i];
            element = seg.element;
            if (element) {
                reportEventElement(seg.event, element);
            }
        }
    }

    function segHandlers(segs, segmentContainer, modifiedEventId) {
        var i;
        var segCnt = segs.length;
        var seg;
        var element;
        var event;
        for (i = 0; i < segCnt; i++) {
            seg = segs[i];
            if (seg.element) {
                bindDaySeg(seg.event, seg.element, seg);
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