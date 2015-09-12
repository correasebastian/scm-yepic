angular.module('my-activities-controllers', ['firebase'])

.controller('MyEventsCtrl', function($scope, $firebase, $rootScope, $filter, $state) {

    $scope.loadSettings = function() {
        if ($scope.myEventsModal)
            $scope.myEventsModal.hide();
        $state.go('settings');
    };

    $scope.$on('modal.shown', function(event, modal) {
        if (modal.id == 'myevents') {
            $rootScope.userEventList = $filter('orderByDateScore')($rootScope.userEvents, true, true);

        }
    });
    $rootScope.$watch('currentState', function(newVal, oldVal) {
        if (newVal != 'events') {
            $scope.myEventsModal.hide();
        }
    });
});