angular.module("index-services", [])

// event factory which extends firebase object
.factory("Event", ["$FirebaseObject", "$firebase", "$rootScope", "settings", "User", '$firebaseUtils','L',
    function($FirebaseObject, $firebase, $rootScope, settings, EventService, User, $firebaseUtils,L) {

        var finishedLoadingEvents = false;
        var EventFactory = $FirebaseObject.$extendFactory({

            // return the distance from user of activity
            getDistance: function() {
                try {
                    // console.log('e.location',this.location);

                    //TODO SCM

                    var distance = GeoFire.distance([this.location.latitude, this.location.longitude], [$rootScope.user.location.latitude, $rootScope.user.location.longitude]);
                    // var distance = GeoFire.distance([this.location.latitude, this.location.longitude], [6.244203,-75.5812119 ]);
                   //return disctance in km
                    // distance = distance.toFixed(1) + ' mi';
                    distance = distance *0.621371
                    distance = distance.toFixed(1) + ' mi';

                    return distance;
                } catch (ex) {
                    // L.l('ERROR', ex)
                    return 'n/a';
                }
            },

            getId: function() {
                return this.$ref();
            },

            isHidden: function() {
                if (this.uid != $rootScope.user.id && finishedLoadingEvents) {
                    return true;
                }
                return false;
            },

            // check if user is attending activity
            userAttending: function() {
                if (this.likes !== null && this.likes[$rootScope.user.id] !== null) {
                    return true;
                }
                return false;
            }
        });

        return function(eventId, finishedLoadingEvents, archive) {
            finishedLoadingEvents = finishedLoadingEvents;
            var ref = settings.fbRef.child((archive ? 'event_archive/' : 'events/') + eventId);
            var sync = $firebase(ref, {
                objectFactory: EventFactory
            });
            var returnObj = sync.$asObject();
            return returnObj;
        };
    }
])


.factory('EventService', ['$rootScope', '$firebase', '$cordovaGeolocation', 'NotificationService', 'PresenceService', '$filter', 'settings', 'Event', '$timeout', 'L',

    function($rootScope, $firebase, $cordovaGeolocation, NotificationService, PresenceService, $filter, settings, Event, $timeout, L) {

        // function to use with javascript sort that sorts by activity start time
        function timestampSort(a, b) {
            return (a.startTime - b.startTime);
        };

        // function to check if specific activity exists in activity list
        function eventExistsInTimeline(key) {
            for (var i = 0; i < $rootScope.sortedEventList.length; i++) {
                if ($rootScope.sortedEventList[i].$id && $rootScope.sortedEventList[i].$id == key) {
                    return true;
                }
            }
            return false;
        }

        $rootScope.eventList = [];
        var newEventList = [];
        var geoQuery;
        $rootScope.loadedFirstEvent = false;
        $rootScope.finishedAnimatingEvents = false;
        $rootScope.alertMessage = '';
        // TODO SCM PUEDE SER UN ALISTA INMENSA, ENTONCES DEBE RESTINGIRSE PUEDE SE POR TIEMPOS TAMBIEN 
        var geoFire = new GeoFire(settings.fbRef.child('geo'));
        $rootScope.newEventsAdded = 0;

        // function that moves activity in firebase to archive location (helps with performance)
        archiveEvent = function(eid) {
            geoFire.remove(eid);
            settings.fbRef.child('events/' + eid).once('value', function(snapshot) {
                settings.fbRef.child('event_archive/' + eid).set(snapshot.val());
                settings.fbRef.child('events/' + eid).remove();
            });
        };

        // function that calls the filter
        filterEvents = function() {
            $rootScope.sortedEventList = $filter('orderByDateScore')($rootScope.eventList);
        };

        return {

            updateEvents: function() {
                for (var i = 0; i < $rootScope.eventList.length; i++) {
                    if ($rootScope.eventList[i].highlight) {
                        $rootScope.eventList[i].highlight = false;
                    }
                    if ($rootScope.eventList[i].hidden) {
                        $rootScope.eventList[i].hidden = false;
                        $rootScope.eventList[i].highlight = true;
                    }
                }
                filterEvents();
                $rootScope.newEventsAdded = 0;
            },

            // function that updates the search radius for activities
            updateRadius: function() {
                $cordovaGeolocation.getCurrentPosition({
                    enableHighAccuracy: true
                }).then(function(position) {
                    PresenceService.updateLocation(position.coords);
                    geoQuery.updateCriteria({
                        center: [position.coords.latitude, position.coords.longitude],
                        radius: parseInt($rootScope.sortOptions.radius)
                    });

                }, function(err) {
                    $rootScope.alertMessage = "We couldn't find your position...";
                    $rootScope.showLoader = false;

                });
            },

            // function that initiates the activity search (based on user location)
            initEvents: function() {
                $rootScope.length = 0;
                var numLoaded = 0;
                var numFound = 0;

                // first we grab user location
                $cordovaGeolocation.getCurrentPosition({
                    enableHighAccuracy: true
                }).then(function(position) {
                    if (!position || !position.coords.latitude || !position.coords.longitude) {
                        position.coords = $rootScope.user.location;
                    } else {
                        PresenceService.updateLocation(position.coords);
                    }

                    // then we make the geoquery call to fireabse
                    geoQuery = geoFire.query({
                        center: [position.coords.latitude, position.coords.longitude],
                        radius: parseInt($rootScope.sortOptions.radius)
                    });

                    $rootScope.finishedLoadingEvents = false;

                    // functions that we call based on certain angularjs events, ie when an activity is found
                    var geoQueryKeyEnter = geoQuery.on('key_entered', newEventFound);
                    var geoQueryKeyExit = geoQuery.on('key_exited', eventExit);
                    var geoQueryReady = geoQuery.on('ready', eventsReady);

                }, function(err) {

                    // function that watches the user location and if it changes, updates the search location
                    var watchUser = $rootScope.$watch('user.location.latitude', function(newVal, oldVal) {
                        if (newVal) {


                            var position = {};
                            position.coords = $rootScope.user.location;

                            geoQuery = geoFire.query({
                                center: [position.coords.latitude, position.coords.longitude],
                                radius: parseInt($rootScope.sortOptions.radius)
                            });

                            $rootScope.finishedLoadingEvents = false;

                            var geoQueryKeyEnter = geoQuery.on('key_entered', newEventFound);
                            var geoQueryKeyExit = geoQuery.on('key_exited', eventExit);
                            var geoQueryReady = geoQuery.on('ready', eventsReady);
                            watchUser();
                        }
                    });

                });

                // function that watches the user's community, and if it changes, loads all current activites that are part of that community
                $rootScope.$watch('user.community', function(newVal, oldVal) {
                    if (newVal) {
                        settings.fbRef.child('communities/' + $rootScope.user.community + '/events').on('child_added', function(snap) {
                            newEventFound(snap.key(), snap.val().location, 0);
                        });
                    }
                });


                // function that is called when an activity exists (outside of search radius / deleted in firebase)
                eventExit = function(key, location, distance) {
                    for (var i = 0; i < $rootScope.eventList.length; i++) {
                        if ($rootScope.eventList[i].$id == key) {
                            $rootScope.eventList.splice(i, 1);
                        }
                    }
                    filterEvents();
                };

                // geoquery found a new activity within our search radius!
                newEventFound = function(key, location, distance) {

                    L.l('newEventFound', key)
                    L.l('newEventFound location', location)
                    L.l('newEventFound distance', distance)

                    finishedLoadingEvents = $rootScope.finishedLoadingEvents;

                    // initiate load activity details from firebase
                    var eventDetails = Event(key, finishedLoadingEvents);

                    // increment number of activities found, to determine when to hide the loader (when the number of activities found matches the number of activities loaded)
                    numFound++;
                    L.l('numFound', numFound)

                    // callback when activity details are loaded from firebase
                    eventDetails.$loaded(function() {
                        L.l('newEventFound eventDetails', eventDetails)

                        // array that references activities by their id
                        $rootScope.eventHash[eventDetails.$id] = eventDetails;

                        // if in low bandwidth mode, we stop 'watching' activites on firebase once they have been loaded, essentially turning off 'real time' features. doesn't work that well, some weird bugs
                        if (settings.lowBandwidthMode) {
                            eventDetails.$inst().$ref().off();
                        }

                        numLoaded++;

                        var filterEventsNow = true;

                        // if we found a current activity
                        //TODO SCM
                        // if (eventDetails.endTime >= moment().unix() * 1000) {
                        L.l('eventDetails.endTime', eventDetails.endTime)
                        var myDate = new Date(eventDetails.endTime);
                        var formatedTime = myDate.toJSON();
                        var m=new Date(moment().hours(-72).unix() * 1000)
                        // L.l('myDate', myDate)
                        // L.l('formatedTime', formatedTime)

                        console.log(myDate,m  , (eventDetails.endTime >= moment().hours(-72).unix() * 1000) ? true:false )
                        if (eventDetails.endTime >= moment().hours(-72).unix() * 1000) {


                            // add activity to activity list, sorted and shown on homescreen
                            $rootScope.eventList.push(eventDetails);
                            $rootScope.eventList.sort(timestampSort);

                            // hide loader when number of activities found matches the number loaded from firebase
                            if (numLoaded == numFound) {
                                $rootScope.showLoader = false;
                            }
                        }

                        // if the first activity has loaded or there is only 1, and we have finished loading activities, then we show the activities and filter
                        if (filterEventsNow && ($rootScope.loadedFirstEvent || $rootScope.eventList.length == 1) && $rootScope.finishedLoadingEvents && numLoaded == numFound) {
                            $rootScope.renderEvents = true;
                            filterEvents();
                            $rootScope.showLoader = false;
                            $rootScope.hide();
                        }

                        $rootScope.loadedFirstEvent = true;
                    });
                };

                // once all the acitivities have been loaded thru geoquery
                eventsReady = function() {
                    if (numFound <= 1) {
                        $rootScope.sortedEventList = $filter('orderByDateScore')($rootScope.eventList);
                    }
                    $rootScope.finishedLoadingEvents = true;
                    $timeout(function() {
                        $rootScope.finishedAnimatingEvents = true;
                    }, 2000);
                    newEventList = $rootScope.eventList.slice(0);
                };

            },

            sortEvents: function(eventList) {

            },

            // function for when a user 'likes' an activity (synonymous with attending)
            likeEvent: function(id) {

                // load acitivity info from firebase
                eventInfo = settings.fbRef.child('events/' + id).once('value', function(eventSnap) {

                    // check to make sure its not the users own activity, unless for some reason the activity has no likes
                    if (eventSnap.val().uid != $rootScope.user.id || !eventSnap.val().likes) {
                        userLikeRef = settings.fbRef.child('users/' + $rootScope.user.id + '/likes/' + id);
                        userLikeRef.once('value', function(snap) {

                            // if they haven't already like the activity, add a like
                            if (snap.val() === null) {
                                userLikeRef.setWithPriority({
                                    exists: true
                                }, eventSnap.val().endTime, function() {
                                    settings.fbRef.child('events/' + id + '/likes').once('value', function(snap) {
                                        settings.fbRef.child('events/' + id + '/score').set(snap.numChildren());
                                    });
                                });
                                settings.fbRef.child('events/' + id + '/likes/' + $rootScope.user.id).setWithPriority({
                                    timestamp: Firebase.ServerValue.TIMESTAMP
                                }, Firebase.ServerValue.TIMESTAMP);

                                NotificationService.addUserJoinedNotification(id, $rootScope.user.id);

                                // if they have already liked the acitivy, remove a like
                            } else {
                                userLikeRef.remove(function() {
                                    settings.fbRef.child('events/' + id + '/likes').once('value', function(snap) {
                                        settings.fbRef.child('events/' + id + '/score').set(snap.numChildren());
                                    });
                                });
                                settings.fbRef.child('events/' + id + '/likes/' + $rootScope.user.id).remove();
                                NotificationService.removeUserJoinedNotification(id, $rootScope.user.id);
                            }
                        });
                    }
                });
            }
        };
    }
]);
