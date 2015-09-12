angular.module('settings-controllers', ['firebase'])

.controller('SettingsCtrl', function($scope, $rootScope, $ionicPopup, $state, settings) {

    $scope.logout = function() {
        settings.fbRef.unauth();
        $state.go('auth');
    };

});