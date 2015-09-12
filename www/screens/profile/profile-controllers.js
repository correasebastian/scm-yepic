angular.module('profile-controllers', ['firebase'])


.controller('UserProfileCtrl', function($rootScope, $scope, $http, $firebase, $stateParams, $ionicNavBarDelegate, $ionicScrollDelegate, settings, $filter, DateTimeManager) {

    $scope.loadTagName = function(id) {
        if (!$rootScope.tags.hasOwnProperty(id)) {
            settings.fbRef.child('tags/' + id).once('value', function(snap) {
                $rootScope.tags[id] = snap.val().name;
            });
        }
    };

    $scope.switchTab = function(id) {
        $scope.userProfileTab = id;
        $ionicScrollDelegate.resize();
    };

    $scope.uid = $stateParams.userId;

     $http({
        method: 'GET',
        url: 'https://graph.facebook.com/' + $scope.uid.substr(9) + '?fields=context.fields%28mutual_friends%29&access_token='+$rootScope.user.accessToken
    }).
    success(function(data, status, headers, config) {
        $scope.mutualFriends=data.context.mutual_friends.data;
    }).
    error(function(data, status, headers, config) {
    });

    $scope.formatBirthday = function(date) {
        return moment().diff(date, 'years');
    };

    $scope.userInfo = $firebase(settings.fbRef.child('users/' + $stateParams.userId)).$asObject();

    $scope.userInfo.$loaded(function() {
        if( $scope.userInfo.location ) {
            $scope.userDistance = GeoFire.distance([$scope.userInfo.location.latitude, $scope.userInfo.location.longitude], [$rootScope.user.location.latitude, $rootScope.user.location.longitude]).toFixed(1);
            $scope.lastOnline = $rootScope.formatAgo($scope.userInfo.lastOnline);
            console.log('user', $scope.userInfo);
            console.log($scope.userInfo.tags);
        } else {
            console.error( "userInfo.location is undefined" );
        }
    });

    $scope.userFollowing = false;

    var eventIndex = settings.fbRef.child('events');

    $scope.feedback = $firebase(settings.fbRef.child('users/' + $stateParams.userId + '/feedback')).$asArray();

    $scope.userProfileTab = 0;

    console.log($scope.following);


    $scope.followUser = function() {
        $scope.userInfo.$child('followers/' + $rootScope.user.id).$set({
            exists: true
        });
        $scope.fbRef.$child('users/' + $rootScope.user.id + '/follows/' + $stateParams.userId).$set({
            exists: true
        });
        $scope.userFollowing = true;
    };

    $scope.addFeedback = function(feedback) {
        feedback.uid = $rootScope.user.id;
        $scope.feedback.$add(feedback);

        var countRef = settings.fbRef.child('users/' + $stateParams.userId + '/numFeedback');

        countRef.transaction(function(currentCount) {
            if (!currentCount) return 1;
            return currentCount + 1;
        });

        $ionicScrollDelegate.scrollBottom(true);
        $scope.feedback.msg = '';
    };

});