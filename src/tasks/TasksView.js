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
    t.getSegmentContainer = function() { return segmentContainer };

    View.call(t, element, calendar, viewName);
    SelectionManager.call(t);
    TasksListEventRenderer.call(t);
    var opt = t.opt;
    var clearEvents = t.clearEvents;
    var daySelectionMousedown = t.daySelectionMousedown;
    var formatDate = calendar.formatDate;

    // locals
    var segmentContainer;

    /* Rendering
     ------------------------------------------------------------*/

    function renderList(maxr) {
        if (!segmentContainer) {
            segmentContainer = $("<div/>").appendTo(element);
        } else {
            clearEvents();
        }
    }

    function setHeight(height) {
        setMinHeight(element, height);
    }

    function setWidth(width) {
        setOuterWidth(segmentContainer, width);
    }

}
