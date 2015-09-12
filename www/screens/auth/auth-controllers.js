angular.module('auth-controllers', ['firebase'])

.controller('AuthCtrl', function($scope, $rootScope, $cordovaGoogleAnalytics, settings) {

    if (window.device) {
        $cordovaGoogleAnalytics.trackView('auth');
    }

    $scope.login = function(provider) {

        if (!window.cordova) {
            settings.fbRef.authWithOAuthPopup(provider, function(error, authData) {}, {
                scope: "public_profile,email,user_friends,user_birthday,user_likes,user_about_me,user_events"
            });
        } else {
            facebookConnectPlugin.login(["public_profile,email,user_friends,user_birthday,user_likes,user_about_me,user_events"],
                function(response) {
                    //console.log('response', response);
                    console.log(response.authResponse.accessToken);
                    settings.fbRef.authWithOAuthToken(provider, response.authResponse.accessToken, function(error, authData) {
                        if( error ) {
                            console.log( error );
                        } else {
                            console.log( authData );
                        }
                    });
                },
                function(response) {
                    alert(JSON.stringify(response));
                });
        }

    };

    $scope.logout = function() {
        $rootScope.auth.$logout();
    };

    if ($rootScope.user && $rootScope.user.id) {
        $state.go('events');
    }

});
