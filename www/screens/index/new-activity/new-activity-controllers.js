angular.module('new-activity-controllers', ['firebase'])

.controller('NewEventCtrl', function($scope, $firebase, $rootScope, $window, $cordovaGeolocation, $http, settings, $ionicPopup, EventService, NotificationService) {

    $scope.privacy = ['All Nearby', 'Invite Only'];

    $scope.data = {
        googleLocation: null
    };

    $scope.updateTag = function() {

        if ($scope.event.desc) {
            var possibleTag = new Array($rootScope.tags.length);
            var words = $scope.event.desc.toLowerCase().replace(/[^a-z ]/g, "").split(' ');
            for (var i = 0; i < words.length; i++) {
                for (var j = 0; j < $rootScope.tags.length; j++) {
                    if ($rootScope.tags[j].keywords) {
                        for (var k = 0; k < $rootScope.tags[j].keywords.length; k++) {
                            if ($rootScope.tags[j].keywords[k].toLowerCase().trim() == words[i]) {
                                if (!possibleTag[j])
                                    possibleTag[j] = 0;
                                possibleTag[j] ++;
                            }
                        }
                    }
                }
            }

            var highest = 0;
            possibleTag[highest] = 0;
            for (var i = 0; i < $rootScope.tags.length; i++) {
                if (possibleTag[i] > possibleTag[highest]) {
                    highest = i;
                }
            }
            $scope.event.tag = $rootScope.tags[highest];
        }
    };

    $rootScope.chooseLocation = function() {
        document.querySelector('.ion-google-place').click();
    };

    $rootScope.chooseTime = function() {


        var myPopup = $ionicPopup.show({
            templateUrl: 'screens/index/new-activity/time-picker-view.html',
            title: 'Select a Time',
            scope: $scope,
            buttons: [{
                text: '<b>Update</b>',
                type: 'button-dark',
                onTap: function(e) {
                    // $scope.addresses =
                }
            }]
        });

    };


    $scope.changeTimeOfDay = false;
    $scope.showMore = false;

    $scope.dates = [{
        timeOffset: 0,
        name: "Today"
    }, {
        timeOffset: 24,
        name: "Tomorrow"
    }, {
        timeOffset: 48,
        name: moment().day(moment().day() + 2).format('dddd')
    }, {
        timeOffset: 72,
        name: moment().day(moment().day() + 3).format('dddd')
    }];

    var currentHour = new Date().getHours();
    var currentMinute = new Date().getMinutes();

    if (currentMinute > 30) {
        currentMinute = 0.5;
    } else {
        currentMinute = 0;
    }

    currentHour += currentMinute;

    $scope.times = [{
            startTime: currentHour,
            endTime: currentHour + 3,
            name: 'Custom',
            custom: true
        },
        {
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
        }
    ];

    $scope.formatTime = function(time) {
        if (time>=24){
            time-=24;
        }
        return moment({
            hour: Math.floor(time),
            minute: (time - Math.floor(time)) * 60
        }).format('h:mm a');
    };


    $scope.customTimes = [];

    for (var i = 0; i < 24; i++) {
        for (var j = 0; j <= 30; j += 30) {
            var time = moment({
                hour: i,
                minute: j
            }).format('h:mm a');
            $scope.customTimes.push({
                value: i + (j / 60),
                title: time
            });
        }
    }

    $scope.event = {
        date: $scope.dates[0],
        time: ($scope.times[1] || $scope.times[0]),
        customLength: 3
    };

    $scope.$watch('event.time.startTime', function(newVal, oldVal) {
        if (newVal && $scope.event.time.custom) {
            $scope.event.time.endTime = $scope.event.time.startTime + $scope.event.customLength;
        }
    });

    $scope.$watch('event.customLength', function(newVal, oldVal) {
        if (newVal) {
            $scope.event.time.endTime = $scope.event.time.startTime + $scope.event.customLength;
        }
    });

    $scope.event.privacy = $scope.privacy[0];

    $scope.logTime = function() {
        console.log($scope.event.exactStartTime);
    };

    $scope.checkTime = function(time) {
        if (!time.custom && $scope.event.date.name == 'Today') {
            var currentHour = new Date(Date.now() + $rootScope.serverOffset).getHours();
            if (time.endTime - currentHour <= 3) {
                return false;
            }
        }
        return true;
    };

    var lastSet = $scope.event.time.endTime;

    $scope.changeTime = function(time) {
        if (time < lastSet) {
            $scope.event.time.startTime = time;
        } else {
            $scope.event.time.endTime = time + 1;
        }
        lastSet = time;
    };

    $scope.setFineLocation = function() {
        $scope.event.location = 'asdfasdffds';
        $scope.event.location = addresses[0].short_name + ' ' + addresses[1].short_name;
    };

    $scope.initEvent = function() {
        var latLong = Object.keys($scope.data.googleLocation.geometry.location);

        $scope.event.location = {};
        $scope.event.location.locationName = $scope.data.googleLocation.address_components[0].short_name;
        $scope.event.location.locationFullName = $scope.data.googleLocation.address_components[0].short_name + $scope.data.googleLocation.address_components[1].short_name;

        if( $scope.data.googleLocation.formatted_address ) {
            $scope.event.location.locationFullName = $scope.data.googleLocation.formatted_address;
        }

        $scope.event.location.latitude = $scope.data.googleLocation.geometry.location[latLong[0]];
        $scope.event.location.longitude = $scope.data.googleLocation.geometry.location[latLong[1]];
        $scope.event.location.latLong = [$scope.event.location.latitude,$scope.event.location.longitude];
        $scope.event.location.description = $scope.data.googleLocation.address_components[0].short_name + ' ' + $scope.data.googleLocation.address_components[1].short_name;

        // General Location
        $scope.event.location.generalLocation = $scope.data.googleLocation.address_components[3].long_name || $scope.data.googleLocation.address_components[2].long_name ||  $scope.data.googleLocation.address_components[1].long_name || '';
    };

    $scope.getAddress = function(coords) {
        $http.get('https://maps.googleapis.com/maps/api/geocode/json?latlng=' + coords.latitude + ',' + coords.longitude).then(function(response) {

            var addressInfo = response.data.results[0]['address_components'];
            $scope.addresses = addressInfo;

            // Seed ion-google-place: 3 is general area - less accurate
            $scope.data.googleLocation = response.data.results[0];

            $scope.initEvent();
        });
    };

    $scope.$watch('data.googleLocation', function(newVal, oldVal) {
        if( newVal ) {
            $scope.initEvent();
        }
    });

    $scope.getCoords = function() {
        $cordovaGeolocation.getCurrentPosition({
            enableHighAccuracy: true
        }).then(function(position) {
            $scope.coords = position.coords;
            $scope.getAddress($scope.coords);
        }, function(err) {
        });
    };

    $scope.$on('modal.shown', function(event, modal) {
        if (modal.id == 'newevent') {
            $scope.getCoords();
            $scope.times[0].startTime = currentHour;
            $scope.times[0].endTime = currentHour + 3;
            $scope.event.time = $scope.times[0];
            for (i = 1; i < $scope.times.length; i++) {
                if ($scope.times[i].endTime > currentHour + 3) {
                    $scope.event.time = $scope.times[i];
                    break;
                }
            }
        }
    });


    $scope.createEvent = function() {
        
        var fbRef = settings.fbRef;
        var eventsRef = fbRef.child('events');

        if ($scope.event.desc && $scope.event.desc.length >= 3) {

            var updateEventLocation = function(geo, event, eventId) {
                fbRef.child('events/' + eventId + '/location').set(event.location, function(error) {
                    if( error ) {
                        console.error( error );
                    }
                });

                if (!event.community || event.community == 0) {
                    geo.set(eventId, [event.location.latitude, event.location.longitude]).then(function() {
                        $window.location.href = ('#/event/' + eventId);

                        $scope.eventModal.hide();
                        $scope.event.desc = "";
                        $scope.eventId = eventId;

                        fbRef.child('users/' + event.uid + '/events/' + eventId).set({
                            exists: true
                        });

                        EventService.likeEvent(eventId);
                    }, function(error) {
                        $log.error(error);
                    });
                } else {
                    fbRef.child('communities/' + event.community + '/events/' + eventId).set(true);
                }
            };

            var event = {};

            $scope.updateTag();

            $scope.event.userStartTime = $scope.event.time.startTime;
            $scope.event.userEndTime = $scope.event.time.endTime;

            event.private = ($scope.event.privacy == 'Invite Only');

            if ($scope.event.privacy && $scope.event.privacy != 'Invite Only' && $scope.event.privacy != 'All Nearby') {
                event.community = $rootScope.user.community;
            }

            if ($scope.event.tag) {
                event.tag = $scope.event.tag.$id;
            } else {
                event.tag = 0;
            }
            var startTime = moment({
                hour: Math.floor($scope.event.userStartTime + $scope.event.date.timeOffset),
                minute: ($scope.event.userStartTime - Math.floor($scope.event.userStartTime)) * 60
            }).valueOf();
            var endTime = moment({
                hour: Math.floor($scope.event.userEndTime + $scope.event.date.timeOffset),
                minute: ($scope.event.userEndTime - Math.floor($scope.event.userEndTime)) * 60
            }).valueOf();

            event.score = 0;
            event.uid = $rootScope.user.id;
            event.numComments = 0;
            event.startTime = startTime;
            event.customTime = ($scope.event.time.custom || false);
            event['.priority'] = endTime;
            event.endTime = endTime;
            event.desc = $scope.event.desc;
            event.timestamp = Firebase.ServerValue.TIMESTAMP;
            event.location = $scope.event.location

            $scope.creatingEvent = true;

            console.log(event, angular.toJson(event));

            var ref = eventsRef.push(event, function() {
                $scope.creatingEvent = false;
                var eventId = ref.key();
                var geo = new GeoFire(settings.fbRef.child('geo'));
                updateEventLocation(geo, event, eventId);
            });
        }
    };
});