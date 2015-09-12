angular.module('profile-services', ['firebase'])


.factory("User", ["$FirebaseObject", "$firebase", "$rootScope", "settings", '$firebaseUtils',
    function($FirebaseObject, $firebase, $rootScope, settings, EventService, $firebaseUtils) {

        var UserFactory = $FirebaseObject.$extendFactory({
            getDistance: function() {
                distance = GeoFire.distance([this.location.latitude, this.location.longitude], [41.4626343, -81.56485959999999]);
                if (distance < .01) {
                    return 'Nearby';
                } else {
                    return distance.toFixed(1) + 'm';
                }
            },

            $$updated: function(snap) {
                if (snap.val() != null && this.uid == null) {
                    var user = snap.val();
                    this.uid = snap.key();
                    this.name = user.name;
                    this.pic = user.pic;
                    this.location = user.location;
                    this.online = user.online;
                }

            }

        });

        return function(userId) {
            var ref = settings.fbRef.child('users/' + userId);
            var sync = $firebase(ref, {
                objectFactory: UserFactory
            });

            return sync.$asObject();
        }
    }
])

.factory('userCache', ['$firebase', 'User', '$rootScope', 'settings', '$timeout',
    function($firebase, User, $rootScope, settings, $timeout) {
        var cachedUsers = {};

        return {
            cachedUsers: cachedUsers,

            loadLive: function(id) {
                if (id) {
                    if (!cachedUsers.hasOwnProperty(id) || cachedUsers[id].static) {
                        cachedUsers[id] = $firebase(settings.fbRef.child('users/' + id)).$asObject();
                    }
                }
            },


            load: function(id) {
                if (id) {
                    if (!cachedUsers.hasOwnProperty(id)) {
                        cachedUsers[id] = true;
                        settings.fbRef.child('users/' + id + '/core').once('value', function(snapshot) {
                            $timeout(function() {
                                $rootScope.$apply(function() {
                                    cachedUsers[id] = snapshot.val();
                                    if (!cachedUsers[id])
                                        cachedUsers[id]={};
                                    cachedUsers[id].uid = snapshot.key();
                                    cachedUsers[id].lastCheckOnline = Date.now();
                                });
                            });
                        });
                    } else {
                        if (Date.now() > (cachedUsers[id].lastCheckOnline + (1000 * 60 * 3))) {
                            settings.fbRef.child('users/' + id + '/core/online').once('value', function(snapshot) {
                                $timeout(function() {
                                    $rootScope.$apply(function() {
                                        cachedUsers[id].online = snapshot.val();
                                        cachedUsers[id].lastCheckOnline = Date.now();
                                    });
                                });
                            });
                        }
                    }
                }

            },

            dispose: function() {
                angular.forEach(cachedUsers, function(user) {
                    user.$off();
                });
            },

            fullName: function(id) {
                if (cachedUsers[id] && cachedUsers[id].name) {
                    return cachedUsers[id].name;
                }
            },

            shortName: function(id) {

                if (cachedUsers[id] && cachedUsers[id].name) {
                    if (cachedUsers[id].shortName) {
                        return cachedUsers[id].shortName;
                    }
                    names = cachedUsers[id].name.split(' ');
                    cachedUsers[id].shortName = names[0] + ' ' + names[1].substr(0, 1);
                    return (cachedUsers[id].shortName || cachedUsers[id].name);
                }

            }
        };
    }
])

.factory("UserService", ['$rootScope', '$state', 'PresenceService', '$cordovaGeolocation', '$firebase', 'settings', 'User',

    function($rootScope, $state, PresenceService, $cordovaGeolocation, $firebase, settings, User) {

        var user = {};
        var userDetails;
        var userNearbyList = [];
        var geoFire = new GeoFire(settings.fbRef.child('user_geo'));

        function loadUserDetails(id) {
            $rootScope.userNotificationService.initNotifications(id);
            var userInfoRef = settings.fbRef.child('users/' + id);
            userInfoRef.once('value', function(snapshot) {
                $rootScope.user = snapshot.val();
                $rootScope.user.id = id;
                var userNotificationRef = settings.fbRef.child('users/' + id + '/numNotifications');
                userNotificationRef.on('value', function(snapshot) {
                    $rootScope.user.numNotifications = snapshot.val();
                });
                PresenceService.updatePresence();
            });
        }

        return {

            user: user,
            userNearbyList: userNearbyList,

            addPushId: function(id) {
                console.log("rying to save push id: " + id);
                var pushIdWatch = $rootScope.$watch('user.id', function(uid) {
                    console.log("Added push id " + id);
                    var userPushIdRef = settings.fbRef.child('users/' + uid + '/pushId').set(
                        id
                    );
                    pushIdWatch();
                });
            },

            getLocation: function() {
                if( window.cordova ) {
                    $cordovaGeolocation.getCurrentPosition({
                        enableHighAccuracy: true
                    }).then(function(position) {
                        $rootScope.user.location = position;
                    }, function(err) {
                        $rootScope.alertMessage = "We couldn't find your position...";
                        console.log(err);
                    });
                } else {
                    function showPosition(position) {
                        $rootScope.user.location = {
                            latitude: position.coords.latitude,
                            longitude: position.coords.longitude
                        };
                    };
                    navigator.geolocation.getCurrentPosition(showPosition);
                }
            },

            initUser: function() {

            },

            findPeopleNearby: function() {

                $cordovaGeolocation.getCurrentPosition({
                    enableHighAccuracy: true
                }).then(function(position) {
                    PresenceService.updateLocation(position.coords);

                    var userGeoQuery = geoFire.query({
                        center: [position.coords.latitude, position.coords.longitude],
                        radius: $rootScope.searchRadius
                    });

                    var geoQueryKeyEnter = userGeoQuery.on('key_entered', newUserFound);
                    var geoQueryKeyExit = userGeoQuery.on('key_exited', userExit);
                    var geoQueryReady = userGeoQuery.on('ready', usersReady);

                    $rootScope.finishedLoadingNearbyUsers = false;

                }, function(err) {
                    $rootScope.alertMessage = "We couldn't find your position...";
                });

                eventExit = function(key, location, distance) {
                    for (var i = 0; i < userNearbyList.length; i++) {
                        if (userNearbyList[i].uid == key) {
                            userNearbyList.splice(i, 1);
                        }
                    }
                };

                newUserFound = function(key, location, distance) {
                    var userDetails = User(key);
                    userNearbyList.push(userDetails);
                    userNearbyList.sort(distance);
                };

                usersReady = function() {
                    $rootScope.finishedLoadingNearbyUsers = true;
                };

            }

        };
    }
]);
