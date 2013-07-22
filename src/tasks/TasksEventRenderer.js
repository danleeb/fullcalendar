function TasksListEventRenderer() {
    var t = this;

    // exports
    t.renderEvents = renderEvents;
    t.clearEvents = clearEvents;
    t.bindDaySeg = bindDaySeg;
    t.getSelectedTasks = getSelectedTasks;
    t.applyToSelectedTasks = applyToSelectedTasks;
    t.unselectAllTasks = unselectAllTasks;

    // imports
    TasksListViewEventRenderer.call(t);
    var opt = t.opt;
    var trigger = t.trigger;
    var reportEvents = t.reportEvents;
    var reportEventClear = t.reportEventClear;
    var eventElementHandlers = t.eventElementHandlers;
    var getSegmentContainer = t.getSegmentContainer;
    var getActionContainer = t.getActionContainer;
    var renderTaskSegs = t.renderTaskSegs;

    // locals
    var selectedTasks = [];


    function renderEvents(events, modifiedEventId) {
        reportEvents(events);
        renderTaskSegs(compileSegs(events), selectedTasks, modifiedEventId);
    }

    function clearEvents(unselect) {
        reportEventClear();
        getSegmentContainer().empty();
        if (unselect === true) {
            selectedTasks = [];
            getActionContainer().removeClass('fc-tasks-select-actions-active');
        }
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
        segs.sort(function (a, b) {
            return a.event.position - b.event.position;
        });
        return segs;
    }

    function bindDaySeg(event, eventElement, seg) {
        var $li = eventElement.closest('li');
        $li.find('.fc-task-checkbox input[type="checkbox"]').on('change', function(ev) {
            if ($(this).is(':checked')) {
                $li.addClass('fc-state-highlight');
                selectedTasks.push(event);
                getActionContainer().addClass('fc-tasks-select-actions-active');
                trigger('taskSelect', event, event, ev);
            } else {
                $li.removeClass('fc-state-highlight');
                var index = selectedTasks.indexOf(event);
                selectedTasks.splice(index, 1);
                if (!selectedTasks.length) {
                    getActionContainer().removeClass('fc-tasks-select-actions-active');
                }
                trigger('taskUnselect', event, event, ev);
            }
        });
        eventElementHandlers(event, eventElement);
    }

    function getSelectedTasks() {
        return selectedTasks;
    }

    function applyToSelectedTasks(func) {
        var i, cnt = selectedTasks.length;
        for (i = 0; i < cnt; i++) {
            func(selectedTasks[i]);
        }
    }

    function unselectAllTasks() {
        getSegmentContainer().find('.fc-task-checkbox input[type="checkbox"]:checked').trigger('click');
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


    function renderTaskSegs(segs, selectedTasks, modifiedEventId) {
        var segmentContainer = getSegmentContainer();

        segmentContainer[0].innerHTML = tasksSegHTML(segs, selectedTasks); // faster than .html()
        segElementResolve(segs, segmentContainer.find('.fc-task-title'));
        segElementReport(segs);
        segHandlers(segs, segmentContainer, modifiedEventId);

        triggerEventAfterRender(segs);
    }

    function tasksSegHTML(segs, selectedTasks) {
        var i, j;
        var seg, segCnt = segs.length;
        var event;
        var classes, taskClasses, timeClasses;

        var html = '<ul class="fc-tasks-list-container">';

        for (i = 0; i < segCnt; i++) {
            seg = segs[i];

            event = seg.event;
            classes = [];
            taskClasses = ['fc-task', 'fc-event-skin'];
            timeClasses = ['fc-task-date'];

            var selected = (selectedTasks.indexOf(event) >= 0);
            if (selected) {
                classes.push('fc-state-highlight')
            }
            taskClasses = taskClasses.concat(event.className);
            if (event.source) {
                taskClasses = taskClasses.concat(event.source.className || []);
            }
            if (event.canceled) {
                taskClasses.push('fc-task-canceled');
                timeClasses.push('fc-task-canceled');
            } else if (event.done) {
                taskClasses.push('fc-task-done');
                timeClasses.push('fc-task-done');
            }

            var today = clearTime(new Date());
            var eventDay = cloneDate(event.start, true);
            if (+today == +eventDay) {
                timeClasses.push('fc-state-highlight fc-today');
            }

            html += '<li class="' + classes.join(" ") + '">';
            if (event.indent) {
                for (j = 0; j < event.indent; j++) {
                    html += '<span class="fc-task-indent"></span>';
                }
            }
            html += '<span class="fc-task-checkbox"><input type="checkbox"';
            if (selected) {
                html += ' checked="checked"';
            }
            html += '/></span>';

            var url = event.url;
            var skinCss = getSkinCss(event, opt);
            var skinCssAttr = (skinCss ? ' style="' + skinCss + '"' : "");

            html += '<span class="fc-task-title"> ';
            if (event.canceled) {
                html += '<span>' + opt("tasksCanceled") + '</span> ';
            }
            html +=     (url ? ('<a href="' + htmlEscape(url) + '"') : '<span') + skinCssAttr +
                        ' class="' + taskClasses.join(" ") + '">' +
                        htmlEscape(event.title) +
                        '</' + (url ? 'a' : 'span' ) + '>' +
                    '</span>';
            html += '<span';
            if (event.allDay && event.start) {
                html += ' class="' + timeClasses.join(" ") + '">' + htmlEscape(formatDates(event.start, event.end, opt('dateFormat')));
                html += ' <span class="fc-task-time-seg">' + htmlEscape(formatDates(event.start, event.end, opt("timeFormat"))) + '</span>';
            }
            else {
                html += '>';
            }
            html += '</span>';
            html += '</li>';
        }

        html += '</ul>';

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
                element.data('fcEvent', seg.event);
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
        if ($.fn.sortable) {
            var $sortable = segmentContainer.find("ul"), oldIndex;
            $sortable.sortable({
                start: function(ev, ui) {
                    oldIndex = $(ui.item).index();
                },
                update: function(ev, ui) {
                    var $sortables = $sortable.children(),
                        i, newIndex = $(ui.item).index(),
                        evnt = $(ui.item).find('.fc-task-title').data('fcEvent');
                    if (newIndex < oldIndex) {
                        evnt.position = $sortables.eq(newIndex + 1).find('.fc-task-title').data('fcEvent').position;
                        for (i = newIndex + 1; i <= oldIndex; i++) {
                            $sortables.eq(i).find('.fc-task-title').data('fcEvent').position++;
                        }
                    } else {
                        evnt.position = $sortables.eq(newIndex - 1).find('.fc-task-title').data('fcEvent').position;
                        for (i = oldIndex; i < newIndex; i++) {
                            $sortables.eq(i).find('.fc-task-title').data('fcEvent').position--;
                        }
                    }
                    trigger('taskSortUpdate', evnt, evnt, ev, ui);
                }
            }).disableSelection();
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