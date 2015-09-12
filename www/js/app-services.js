angular.module('app-services', ['ionic'])


// factory that formats the time in a bunch of different ways
.factory('DateTimeManager', ['settings', '$rootScope',
    function(settings, $rootScope) {
        var times = [{
            startTime: 0,
            endTime: 5,
            name: "Twilight"
        }, {
            startTime: 5,
            endTime: 12,
            name: "Morning"
        }, {
            startTime: 12,
            endTime: 18,
            name: "Afternoon"
        }, {
            startTime: 18,
            endTime: 24,
            name: "Evening"
        }];

        return {
            format: function(timestamp) {
                for (i = 0; i < times.length; i++) {
                    if (times[i].endTime > moment(timestamp).hour()) {
                        var day = moment(timestamp).calendar().split(' ');
                        if (day[0] == 'Last') {
                            day = day[0] + ' ' + day[1];
                        } else {
                            day = day[0];
                        }
                        if (day == 'Today')
                            day = 'This'
                        return day + ' ' + times[i].name;
                    }
                }
            },
            formatCustom: function(start, end) {
                var day = moment(start).calendar().split(' ');
                if (day[0] == 'Last') {
                    day = day[0] + ' ' + day[1];
                } else {
                    day = day[0];
                }
                if (day == 'Today')
                    day = '';

                var time = moment(start).format('h:mm a') + ' to ' + moment(end).format('h:mm a');
                return day + ' ' + time;
            },
            formatCustomStart: function(start, end) {
                var whichTime = false;
                var time = start;
                if (Date.now() > start + $rootScope.serverOffset) {
                    whichTime = true;
                    time = end;

                }
                var time = (whichTime ? '\'til ' : 'at ') + moment(time).format('h:mm a');
                return time;
            },
            getTime: function() {

            }
        };
    }
])

// factory that manages a user's active presence, and updates their location
.factory('PresenceService', ['$rootScope', 'settings', '$cordovaGeolocation',

    function($rootScope, settings, $cordovaGeolocation) {
        return {

            checkFirebaseConnection: function() {
                settings.fbRef.child('.info/connected').on('value', function(connectedSnap) {
                    if (connectedSnap.val() === true) {
                        $rootScope.firebaseConnected = true;
                    } else {
                        $rootScope.firebaseConnected = false;
                        Firebase.goOnline();
                    }
                });
            },

            updateLocation: function(location) {
                function updateL(location, uid) {
                    if (location && location.latitude && location.longitude) {
                        userLocationRef = settings.fbRef.child('users/' + uid + '/location').set(location);
                        var geo = new GeoFire(settings.fbRef.child('user_geo'));
                        geo.set(uid, [location.latitude, location.longitude])
                            .catch(function(err) {
                                $log.error(err);
                            });
                    }
                };
                $rootScope.$watch('user.id', function(uid) {
                    if (uid) {
                        if (!location) {
                            $cordovaGeolocation.getCurrentPosition({
                                enableHighAccuracy: true
                            }).then(function(position) {
                                updateL(position.coords, uid);
                            });

                        } else {
                            updateL(location, uid);
                        }
                    }
                });
            },

            updatePresence: function() {
                $rootScope.$watch('user.id', function() {
                    var myConnectionsRef = settings.fbRef.child('users/' + $rootScope.user.id + '/core/online');
                    var lastOnlineRef = settings.fbRef.child('users/' + $rootScope.user.id + '/lastOnline');

                    var connectedRef = settings.fbRef.child('.info/connected');

                    connectedRef.on('value', function(snap) {
                        if (snap.val() === true) {
                            var con = myConnectionsRef.set(true);
                            myConnectionsRef.onDisconnect().remove();
                            lastOnlineRef.onDisconnect().set(Firebase.ServerValue.TIMESTAMP);
                        }
                    });
                })

            }
        }
    }
]);
