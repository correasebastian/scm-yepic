angular.module("directives", [])

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
            templateUrl: 'templates/directives/event.html'
        };
    }
])

.directive("comment", [

    function() {
        return {
            restrict: 'E',
            scope: {
                comment: '=info',
                event: '=event'
            },
            templateUrl: 'templates/directives/comment.html'
        };
    }
]);
