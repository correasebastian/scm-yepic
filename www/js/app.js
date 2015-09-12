var resumeLocation = '';
var justResumed = false;

// we call this when the user logs out, so they don't receive push notifications
function killPushwoosh() {
    var pushNotification = window.plugins.pushNotification;
    pushNotification.unregisterDevice(
        function(status) {
        },
        function(status) {
        }
    );
}

// when a user taps a push notifications, the app is opened and this function runs
function handleOpenURL(url) {
    url = url.split('yepic://');
    window.location.href = url[1];
    console.log("received url: " + url);
}

// js prototype functino to capitalize first letter of word
String.prototype.capitalize = function() {
    return this.charAt(0).toUpperCase() + this.slice(1);
};

angular.module('yepic', ['ionic', 'app-config', 'app-directives', 'app-filters', 'new-activity-controllers', 'my-activities-controllers', 'app-services', 'auth-controllers', 'index-controllers', 'notifications-controllers', 'profile-controllers', 'index-services', 'activity-controllers', 'index-filters', 'notifications-services', 'profile-services', 'invite-controllers', 'participants-controllers', 'settings-controllers', 'interests-controllers', 'feedback-controllers', 'invite-services', 'angularMoment', 'ngCordova', 'monospaced.elastic', 'ion-google-place', 'twygmbh.auto-height', 'angulartics', 'angulartics.google.analytics.cordova'])

.directive('disableTap', function($timeout) {
    return {
        link: function() {

            $timeout(function() {
                document.querySelector('.pac-container').setAttribute('data-tap-disabled', 'true');
            }, 500);
        }
    };
})

// settings, mostly just firebase
.constant('settings', {
    fbRoot: 'https://sizzling-fire-2797.firebaseio.com/',
    fbRef: new Firebase('https://sizzling-fire-2797.firebaseio.com/'),
    lowBandwidthMode: false
})

.run(function($ionicPlatform, $rootScope, $cordovaGoogleAnalytics, $ionicSideMenuDelegate, $firebase, $window, $ionicLoading, $state, PresenceService, EventService, UserService, userCache, $location, settings, NotificationService, $cordovaPush, $ionicNavBarDelegate, ContactManager, $http, $filter) {

    // initiates the pushwoosh plugin
    function initPushwoosh( user ) {
        var pushNotification = window.plugins.pushNotification;

        document.addEventListener('push-notification', function(event) {
            //var notification = event.notification;
            //var title = event.notification.title;
            //var userData = event.notification.userdata;
            //var msg = event.notification.message;

            //pushNotification.setApplicationIconBadgeNumber(0);
        });

        pushNotification.onDeviceReady({
            pw_appid: "EAF46-4EC26",
            projectid: '664013138485'
        });

        pushNotification.registerDevice(
            function(status) {
                var deviceToken = null;

                if( status.deviceToken ) {
                    // iOS
                    settings.fbRef.child('users/' + user.uid + '/core/device').set( status.deviceToken );    
                } else {
                    // Android
                    settings.fbRef.child('users/' + user.uid + '/core/device').set( status );    
                }
            },
            function(status) {
            }
        );

        //pushNotification.setApplicationIconBadgeNumber(0);
    };

    $ionicPlatform.ready(function() {

        // sorting options for home screen events, static for this version
        $rootScope.sortOptions = {
            group: true,
            sort: 'score',
            radius: 80
        };

        // determine what paltform we're running on
        if (window.device) {
            $rootScope.devicePlatform = device.platform;
        } else {
            $rootScope.devicePlatform = 'web';
        }

        UserService.getLocation();

        // loading screen methods
        $rootScope.show = function(text) {
            $rootScope.loading = $ionicLoading.show({
                template: text ? text : 'Loading..'
            });
        };
        $rootScope.hide = function() {
            $ionicLoading.hide();
        };
        $rootScope.notify = function(text) {
            $rootScope.show(text);
            $window.setTimeout(function() {
                $rootScope.hide();
            }, 999);
        };

        // determine firebase offset from user time
        $rootScope.serverOffset = 0;
        var offsetRef = settings.fbRef.child('.info/serverTimeOffset');
        offsetRef.on('value', function(snap) {
            $rootScope.serverOffset = snap.val();
        });

        // if the sort options change (they never will in this version), update the event list accordingly
        $rootScope.$watch('sortOptions', function(newVal, oldVal) {
            if (oldVal) {
                if (newVal.radius != oldVal.radius) {
                    EventService.updateRadius();
                } else {
                    EventService.updateEvents();
                }
            }
        }, true);

        // keep track of where we are, for easy reference
        $rootScope.previousState;
        $rootScope.currentState;
        $rootScope.$on('$stateChangeSuccess', function(ev, to, toParams, from, fromParams) {
            $rootScope.previousState = from.name;
            $rootScope.currentState = to.name;
        });

        //moment.js language settings
        moment.lang('en', {
            relativeTime: {
                future: "in %s",
                past: "%s ago",
                s: "secs",
                m: "a min",
                mm: "%d mins",
                h: "an hr",
                hh: "%d hrs",
                d: "a day",
                dd: "%d days",
                M: "a month",
                MM: "%d months",
                y: "a year",
                yy: "%d years"
            }
        });
        $rootScope.formatAgo = function(time) {
            return moment(time).fromNow();
        };

        $rootScope.user = null;

        $rootScope.getObjectSize = function(obj) {
            if (!obj)
                return null;
            return Object.keys(obj).length;
        };

        $rootScope.auth = settings.fbRef.getAuth();

        $rootScope.authHappened = function( authData ) {
            if (authData) {
                var user = authData;

                // get their facebook friends
                $http({
                    method: 'GET',
                    url: 'https://graph.facebook.com/' + user.facebook.id + '/friends?fields=picture,name&access_token=' + user.facebook.accessToken
                }).
                success(function(data, status, headers, config) {
                    $rootScope.userFriends = data.data;
                    var friends = {};

                    // loop thru friends and add friends to firebase db
                    for (var i=0;i<$rootScope.userFriends.length;i++){
                        friends['facebook:'+$rootScope.userFriends[i].id]={exists:true};
                    }
                    $rootScope.userFriendsIndexed = friends;
                    settings.fbRef.child('users/'+user.uid).update({friends:friends});
                }).
                error(function(data, status, headers, config) {
                    console.error( data );
                });


                if (window.device) {

                    $cordovaGoogleAnalytics.startTrackerWithId('UA-576458-9');

                    initPushwoosh( user );
                }

                userCache.load(user.uid);

                $rootScope.user = user;
                $rootScope.userNotificationsFeed = $firebase(settings.fbRef.child('users/' + user.uid + '/notifications/feed').limitToLast(10)).$asArray();
                $rootScope.userNotifications = $firebase(settings.fbRef.child('users/' + user.uid + '/notifications')).$asObject();

                PresenceService.updatePresence();

                settings.fbRef.child('users/' + user.uid).update({
                    gender: user.facebook.cachedUserProfile.gender
                });

                if (user.facebook.cachedUserProfile.birthday) {
                    settings.fbRef.child('users/' + user.uid).update({
                        birthday: user.facebook.cachedUserProfile.birthday
                    });
                }

                settings.fbRef.child('users/' + user.uid + '/core').update({
                    name: user.facebook.displayName,
                    pic: 'http://graph.facebook.com/' + user.facebook.id + '/picture?width=200&height=200',
                    thumbnail: 'http://graph.facebook.com/' + user.facebook.id + '/picture?width=40&height=40'
                });

                settings.fbRef.child('users/' + user.uid).once('value', function(snapshot) {
                    $rootScope.user = snapshot.val();
                    $rootScope.user.accessToken = user.facebook.accessToken;
                    $rootScope.user.likes = $firebase(settings.fbRef.child('users/' + user.uid + '/likes')).$asObject();
                    $rootScope.user.location = $firebase(settings.fbRef.child('users/' + user.uid + '/location')).$asObject();
                    $rootScope.user.id = user.uid;

                    settings.fbRef.child('users/' + user.uid + '/numNotifications').on('value', function(snap) {
                        $rootScope.user.numNotifications = snap.val();
                        if (window.plugins && window.plugins.pushNotification)
                            window.plugins.pushNotification.setApplicationIconBadgeNumber($rootScope.user.numNotifications);
                    });


                });

                $rootScope.hide();
                settings.fbRef.child('users/' + user.uid).once('value', function(snap) {
                    if (!snap.val().hasRegistered) {
                        settings.fbRef.child('users/' + user.uid).update({hasRegistered:true,location:{latitude:41.4995,longitude:-81.69541}});
                        $state.go('tags');
                    } else {
                        if ($state.current.name == 'auth') {
                            $state.go('events');
                        }
                    }
                });
            } else {
                if (window.plugins)
                    killPushwoosh();
                $rootScope.loggedOut = true;
                $rootScope.user = null;
                    $state.go('auth');
            }
        };

        // if the user logs in
        settings.fbRef.onAuth(function(authData) {
            $rootScope.authHappened( authData );
        });
        $rootScope.userNotificationService = NotificationService;

        $rootScope.events = EventService;
        $rootScope.eventHash = [];

        $rootScope.tags = $firebase(settings.fbRef.child('tags')).$asArray();
        $rootScope.communities = $firebase(settings.fbRef.child('communities')).$asArray();

        $rootScope.tags.$loaded(function() {
            for (var i = 0; i < $rootScope.tags.length; i++) {
                if ($rootScope.tags[i].keywords) {
                    var keywords = $rootScope.tags[i].keywords.split(',');
                    $rootScope.tags[i].keywords = keywords;
                }
            }
        });

        $rootScope.userCache = userCache;
        $rootScope.users = userCache.cachedUsers;

        PresenceService.checkFirebaseConnection();

        $rootScope.timePeriod = 0;

        $rootScope.contactManager = ContactManager;


        $rootScope.$on('onResumeCordova', function(event) {
            $rootScope.sortedEventList = $filter('orderByDateScore')($rootScope.eventList);
            PresenceService.updateLocation();
        });

        document.addEventListener("resume", resume, false);

        function resume() {
            var div = document.getElementsByTagName('body')[0];
            var scope = angular.element(div).scope();
            var rootScope = scope.$root;
            rootScope.$apply(function() {
                rootScope.$broadcast('onResumeCordova');
            });
        }

        if (window.cordova && window.cordova.plugins.Keyboard) {
            cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
            cordova.plugins.Keyboard.disableScroll(true);
        }


        $rootScope.userEmail = null;

        $rootScope.eventList = [];
        $rootScope.eventIndex = [];

        $rootScope.loadingEvents = true;

        $rootScope.goBack = function() {
            $ionicNavBarDelegate.back();
        };


        $rootScope.logout = function() {
            $rootScope.auth.$logout();
            $rootScope.user = null;
        };

    });
});