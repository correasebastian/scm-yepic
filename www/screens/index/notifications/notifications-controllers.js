angular.module('notifications-controllers', ['firebase'])

.controller("NotificationsCtrl", function($scope, $rootScope, $timeout, $state, $stateParams, $firebase, userCache, settings, NotificationService, $window, DateTimeManager) {

    $scope.$on('modal.shown', function(event, modal) {
        if (modal.id == 'notifications') {
            if ($rootScope.user !== null) {
                $scope.numNotifications = $rootScope.user.numNotifications;
                NotificationService.resetNotificationCounter();
            }
        }
    });

    $scope.loadSettings = function() {
        if ($scope.notificationModal)
            $scope.notificationModal.hide();
        $state.go('settings');
    };

    $scope.getObjectSize = function(obj) {
        if (!obj)
            return null;
        return Object.keys(obj).length;
    };

    $scope.loadEvent = function(id) {
        if ($scope.notificationModal)
            $scope.notificationModal.hide();
        $window.location.href = '#/event/' + id;
        if ($rootScope.showNotificationPopup) {
            settings.fbRef.child('users/' + $rootScope.user.id + '/numNotifications').transaction(function(numNotifications) {
                if (numNotifications === null) {
                    numNotifications = 0;
                }

                numNotifications++;

                return numNotifications;
            });
        }
        $rootScope.showNotificationPopup = false;
    };

    $rootScope.formatTime = function(time) {
        return DateTimeManager.format(time).toLowerCase();
    };


});
