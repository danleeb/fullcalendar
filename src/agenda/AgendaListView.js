fcViews.agenda = AgendaListView;

function AgendaListView(element, calendar) {
    var t = this;


    // exports
    t.render = render;


    // imports
    AgendaList.call(t, element, calendar, 'agenda');
    var opt = t.opt;
    var renderList = t.renderList;
    var skipHiddenDays = t.skipHiddenDays;
    var formatDate = calendar.formatDate;


    function render(date, delta) {
        if (delta) {
            addDays(date, delta);
        }
        skipHiddenDays(date, delta < 0 ? -1 : 1);
        
        var start = cloneDate(date, true);
        var end = addDays(cloneDate(start, true), 1);
        var visStart = cloneDate(start, true);
        var visEnd =  addDays(cloneDate(end, true), opt('agendaListLimit'));

        t.title = formatDate(start, opt('titleFormat'));
        t.start = start;
        t.end = end;
        t.visStart = visStart;
        t.visEnd = visEnd;
        renderList();
    }
}


function AgendaList(element, calendar, viewName) {
    var t = this;


    // exports
    t.renderList = renderList;
    t.setHeight = setHeight;
    t.setWidth = setWidth;
    t.getDaySegmentContainer = function() { return daySegmentContainer };


    // imports
    View.call(t, element, calendar, viewName);
    OverlayManager.call(t);
    SelectionManager.call(t);
    AgendaListEventRenderer.call(t);
    var clearEvents = t.clearEvents;


    // locals
    var daySegmentContainer;


    /* Rendering
     ------------------------------------------------------------*/

    disableTextSelection(element.addClass('fc-grid'));


    function renderList() {
        if (!daySegmentContainer) {
            daySegmentContainer = $('<div class="fc-agenda-container"/>').appendTo(element);
        } else {
            clearEvents();
        }
    }


    function setHeight(height) {
        setMinHeight(daySegmentContainer, height);
        daySegmentContainer.height(height);
        setOuterWidth(daySegmentContainer, 0);
    }


    function setWidth(width) {
        setOuterWidth(daySegmentContainer, width);
    }
}
