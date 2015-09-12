angular.module('app-directives', ['ionic'])

// event directive, for both all the events on the index page, and the event on the detail page
.directive("event", [

    function() {
        return {
            restrict: 'E',
            controller: 'EventCtrl',
            scope: {
                event: '=info',
                eid: '=eid',
                detail: '=detail'
            },
            templateUrl: 'screens/directives/activity-directive-view.html'
        };
    }
])

// comment directive, for comments on the event page
.directive("comment", [
    function() {
        return {
            restrict: 'E',
            scope: {
                comment: '=info',
                event: '=event'
            },
            templateUrl: 'screens/directives/comment-directive-view.html'
        };
    }
]);