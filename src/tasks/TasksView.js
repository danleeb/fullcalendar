fcViews.tasks = TasksListView;

function TasksListView(element, calendar) {
    var t = this;

    // exports
    t.render = render;
    t.fetchData = getFetchData;

    // imports
    TasksList.call(t, element, calendar, 'tasks');
    var opt = t.opt;
    var renderList = t.renderList;
    var formatDate = calendar.formatDate;

    function render(date, delta) {
        t.title = opt('tasksTitle');
        t.start = null;
        t.end = null;
        t.visStart = null;
        t.visEnd = null;
        renderList();
    }

    function getFetchData() {
        return {
            type: 'task',
            done: opt('tasksShowDone'),
            canceled: opt('tasksShowCanceled')
        };
    }
}

function TasksList(element, calendar, viewName) {
    var t = this;

    // exports
    t.renderList = renderList;
    t.setHeight = setHeight;
    t.setWidth = setWidth;
    t.getSegmentContainer = function() { return segmentContainer };
    t.getActionContainer = function() { return selectActionContainer };

    View.call(t, element, calendar, viewName);
    SelectionManager.call(t);
    TasksListEventRenderer.call(t);
    var opt = t.opt;
    var clearEvents = t.clearEvents;
    var daySelectionMousedown = t.daySelectionMousedown;
    var formatDate = calendar.formatDate;
    var rerenderEvents = calendar.rerenderEvents;
    var trigger = calendar.trigger;
    var applyToSelectedTasks = t.applyToSelectedTasks;
    var getSelectedTasks = t.getSelectedTasks;
    var unselectAllTasks = t.unselectAllTasks;


    // locals
    var segmentContainer;
    var selectActionContainer;
    var actionContainer;


    var changeView = calendar.changeView;
    calendar.changeView = function(newViewname) {
        if (newViewname !== 'tasks') {
            actionContainer.hide();
        }
        changeView(newViewname);
    };


    /* Rendering
     ------------------------------------------------------------*/

    function renderList() {
        if (!segmentContainer) {
            actionContainer = trigger('tasksRenderActions') || $('<div class="fc-tasks-actions"></div>');
            actionContainer.appendTo(element.parent());
            renderSelectActions();
            segmentContainer = $('<div class="fc-tasks-container"/>').appendTo(element);
        } else {
            actionContainer.show();
            clearEvents(true);
        }
    }

    function setHeight(height) {
        var h = height - selectActionContainer.height();
        setMinHeight(segmentContainer, h);
        segmentContainer.height(h);
    }

    function setWidth(width) {
        setOuterWidth(element, width);
    }

    function renderSelectActions() {
        var self = this;
        selectActionContainer = $('<div class="fc-tasks-select-actions" />').appendTo(element);
        $(opt('taskSelectActionsText').unselect).appendTo(selectActionContainer)
            .on('change', function() {
                    if (!$(this).is(':checked')) {
                        unselectAllTasks();
                        $(this).prop('checked', true);
                    }
                });
        $(opt('taskSelectActionsText').indentSub).appendTo(selectActionContainer)
            .on('click', function() {
                    applyToSelectedTasks(function(event) {
                        if (event.indent > 0) {
                            event.indent--;
                        }
                    });
                    rerenderEvents();
                    trigger('tasksIndentSub', calendar, getSelectedTasks());
                });
        $(opt('taskSelectActionsText').indentAdd).appendTo(selectActionContainer)
            .on('click', function() {
                    applyToSelectedTasks(function(event) {
                        if (!event.indent) {
                            event.indent = 1;
                        } else if (event.indent < opt('tasksMaxIndent')) {
                            event.indent++;
                        }
                    });
                    rerenderEvents();
                    trigger('tasksIndentAdd', calendar, getSelectedTasks());
                });
        $(opt('taskSelectActionsText').open).appendTo(selectActionContainer)
            .on('click', function() {
                    applyToSelectedTasks(function(event) {
                        event.done = false;
                        event.canceled = false;
                    });
                    rerenderEvents();
                    trigger('tasksUndone', calendar, getSelectedTasks());
                });
        $(opt('taskSelectActionsText').done).appendTo(selectActionContainer)
            .on('click', function() {
                    applyToSelectedTasks(function(event) {
                        event.done = true;
                        event.canceled = false;
                    });
                    rerenderEvents();
                    trigger('tasksDone', calendar, getSelectedTasks());
                });
        $(opt('taskSelectActionsText').cancel).appendTo(selectActionContainer)
            .on('click', function() {
                    applyToSelectedTasks(function(event) {
                        event.done = false;
                        event.canceled = true;
                    });
                    rerenderEvents();
                    trigger('tasksCancel', calendar, getSelectedTasks());
                });
    }
}
