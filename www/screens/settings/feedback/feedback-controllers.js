angular.module('feedback-controllers', ['firebase'])

.controller('FeedbackCtrl', function($scope, $rootScope, $ionicPopup, $firebase, $state, settings) {

    $scope.feedback = {};

    $scope.sendFeedback = function() {
        $scope.feedback.user = $rootScope.user.id;
        var feedback = $firebase(settings.fbRef.child('feedback')).$asArray();
        feedback.$add($scope.feedback, function() {
            $scope.feedback = '';
        });
        $rootScope.goBack();
    };

});
