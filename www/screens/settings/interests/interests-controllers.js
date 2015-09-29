angular.module('interests-controllers', ['firebase'])

.controller('TagsCtrl', function($scope, $rootScope, $firebase, $state, settings) {
    console.log($rootScope)

    console.log('tags', angular.toJson($rootScope.tags))
    console.log('communities', angular.toJson($rootScope.communities))

    $rootScope.showLoader = false;


    settings.fbRef.child('users/' + $rootScope.user.id + '/tags').once('value', function(snap) {
        if (snap.val() !== null) {
            for (var i = 0; i < snap.val().length; i++) {
                if (snap.val()[i]) {
                    $scope.tags[i].checked = true;
                } else {
                    $scope.tags[i].checked = null;
                }
            }
        }
    });

    $scope.saveTags = function() {

        var tagList = [];
        for (var i = 0; i < $rootScope.tags.length; i++) {
            if ($scope.tags[i].checked) {
                tagList.push({
                    checked: true
                });
            } else {
                tagList.push({
                    checked: null
                });
            }
        }
        settings.fbRef.child('users/' + $rootScope.user.id + '/tags').set(
            tagList,
            function() {
                $state.go('events');
            });

    };
});
