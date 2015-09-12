angular.module('participants-controllers', ['firebase'])

.controller('ParticipantsCtrl', function($scope, $rootScope, $firebase, $stateParams, settings, $ionicLoading, $compile, PresenceService) {

    PresenceService.updateLocation();

    $scope.showMap = $stateParams.map;

    $scope.eventId = $stateParams.eventId;
    $scope.participants = $firebase(settings.fbRef.child('events/' + $scope.eventId + '/likes')).$asArray();
    $scope.eventParticipants = [];
    $scope.eventParticipantsWatch = [];
    var markers = [];

    $scope.$on('$destroy', function() {

        for (i = 0; i < $scope.eventParticipantsWatch.length; i++) {
            $scope.eventParticipantsWatch[i]();
        }

    });

    $scope.participants.$loaded(function() {
        if ($scope.participants.length == 0) {
            $scope.participants = $firebase(settings.fbRef.child('event_archive/' + $scope.eventId + '/likes')).$asArray();

        }
    });

    $scope.$watch('showMap', function(newVal, oldVal) {

        if (newVal && !$scope.map) {
            var mapOptions = {
                zoom: 16,
                mapTypeId: google.maps.MapTypeId.ROADMAP,
                disableDefaultUI: true
            };
            console.log('map', document.getElementById("map"));
            var map = new google.maps.Map(document.getElementById("map"), mapOptions);
            $scope.map = map;
            settings.fbRef.child('events/' + $scope.eventId + '/location').once('value', function(snap) {
                var myLatlng = new google.maps.LatLng(snap.val().latitude, snap.val().longitude);

                var contentString = "<div><a ng-click='clickTest()'>Click me!</a></div>";
                var compiled = $compile(contentString)($scope);

                var infowindow = new google.maps.InfoWindow({
                    content: compiled[0]
                });

                var marker = new google.maps.Marker({
                    position: myLatlng,
                    map: $scope.map,
                });

                markers.push(marker);


                $scope.map = map;

                google.maps.event.addListener(map, 'zoom_changed', function() {
                    zoomChangeBoundsListener =
                        google.maps.event.addListener($scope.map, 'bounds_changed', function(event) {
                            if (this.getZoom() > 19 && this.initialZoom == true) {
                                // Change max/min zoom here
                                this.setZoom(19);
                                this.initialZoom = false;
                            }
                            google.maps.event.removeListener(zoomChangeBoundsListener);
                        });
                });

                $scope.map.initialZoom = true;


                setTimeout(function() {

                    google.maps.event.trigger(map, 'resize');

                }, 200);


            });

            $scope.$watch('participants', function(newVal, oldVal) {

                setTimeout(function() {

                    console.log($scope.participants);

                    new_boundary = new google.maps.LatLngBounds();

                    var numFound = 0;
                    var numLoaded = 0;

                    for (i = 0; i < $scope.participants.length; i++) {

                        var userId = $scope.participants[i].$id;

                        if (!$scope.eventParticipants[userId] || !markers[userId]) {

                            $scope.eventParticipants[userId] = $firebase(settings.fbRef.child('users/' + $scope.participants[i].$id)).$asObject();

                            numFound++;

                            $scope.eventParticipantsWatch.push($scope.eventParticipants[userId].$watch(function(newVal, oldVal) {
                                if (newVal) {
                                    if (!$scope.eventParticipants[newVal.key] || !$scope.eventParticipants[newVal.key].likes[$scope.eventId]) {

                                        if (markers[userId])
                                            markers[userId].close();
                                        $scope.eventParticipants[userId] = null;
                                        markers[userId] = null;
                                        new_boundary = new google.maps.LatLngBounds();

                                        for (index in markers) {
                                            if (markers[index]) {
                                                position = markers[index].position;
                                                new_boundary.extend(position);
                                            }
                                        }
                                        $scope.map.fitBounds(new_boundary);
                                    } else {
                                        if (markers[newVal.key]) {
                                            var myLatLng = new google.maps.LatLng($scope.eventParticipants[newVal.key].location.latitude, $scope.eventParticipants[newVal.key].location.longitude);
                                            console.log(markers[newVal.key]);
                                            markers[newVal.key].position = myLatLng;
                                            markers[newVal.key].draw();
                                        }
                                    }
                                }
                            }));

                            $scope.eventParticipants[userId].$loaded(function(participant) {

                                numLoaded++;

                                if (participant.location) {
                                    console.log(participant);
                                    var image = participant.pic;
                                    var myLatLng = new google.maps.LatLng(participant.location.latitude, participant.location.longitude);

                                    var marker = new InfoBubble({
                                        map: $scope.map,
                                        content: '<div style="height:40px;width:40px;border-radius:20px;background:url(' + participant.core.thumbnail + ');background-size:100% 100%"/></div>',
                                        position: myLatLng,
                                        padding: 0,
                                        backgroundColor: '#333',
                                        arrowSize: 10,
                                        borderWidth: 1,
                                        borderRadius: 20,
                                        borderColor: '#333',
                                        disableAutoPan: true,
                                        hideCloseButton: true,
                                        arrowPosition: 32,
                                        arrowStyle: 2,
                                        shadowStyle: 0
                                    });

                                    var populationOptions = {
                                        strokeColor: '#FF0000',
                                        strokeOpacity: 0.8,
                                        strokeWeight: 0,
                                        fillColor: 'hsla(' + (Math.random() * 360) + ', 100%, 50%, 1)',
                                        fillOpacity: 0.2,
                                        map: $scope.map,
                                        center: myLatLng,
                                        radius: participant.location.accuracy
                                    };

                                    console.log('marker ' + numLoaded, marker);
                                    marker.open();

                                    markers[participant.$id] = marker;

                                    if (numFound == numLoaded) {

                                        for (index in markers) {
                                            position = markers[index].position;
                                            new_boundary.extend(position);
                                        }

                                        $scope.map.fitBounds(new_boundary);
                                    }
                                }
                            })
                        }
                    }
                }, 200);
            }, true);

        }
    });
})
