angular.module('index-controllers', ['firebase'])

.controller('EventIndexCtrl', function($scope, $filter, $rootScope, $cordovaGoogleAnalytics, Event, $firebase, $ionicModal, $timeout, $ionicSideMenuDelegate, UserService, userCache, $ionicNavBarDelegate, $window, $cordovaGeolocation, PresenceService, EventService, $state, $ionicPopup, $ionicPopover, settings, $ionicScrollDelegate, $ionicSlideBoxDelegate) {

    // google analytics tracking
    if (window.device) {
        $cordovaGoogleAnalytics.trackView('eventindex');
    }

    // if we leave the view, hide the loading spinner if its active
    $scope.$on('$destroy', function() {
        $rootScope.showLoader = false;
    });

    // new activity modal
    $ionicModal.fromTemplateUrl('screens/index/new-activity/new-activity-view.html', function(modal) {
        $scope.eventModal = modal;
    }, {
        id: 'newevent',
        scope: $scope,
        animation: 'slide-in-up',
        focusFirstInput: true
    });

    $scope.newEvent = function() {
        $scope.eventModal.show();
    };

    $scope.closeNewEvent = function() {
        $scope.eventModal.hide();
    };

    // my activities modal
    $ionicModal.fromTemplateUrl('screens/index/my-activities/my-activities-view.html', function(modal) {
        $scope.myEventsModal = modal;
    }, {
        id: 'myevents',
        scope: $scope,
        animation: 'slide-in-up'
    });

    $scope.showMyEvents = function() {
        $scope.myEventsModal.show();
    };

    $scope.hideMyEvents = function() {
        $scope.myEventsModal.hide();
    };

    // notifications modal 
    $ionicModal.fromTemplateUrl('screens/index/notifications/notifications-view.html', function(modal) {
        $scope.notificationModal = modal;
    }, {
        id: 'notifications',
        scope: $scope,
        animation: 'slide-in-up'
    });

    $scope.showNotifications = function() {
        $scope.notificationModal.show();

    };

    $scope.hideNotifications = function() {
        $scope.notificationModal.hide();
    };

    /* here we check to make sure user id is set. then we load the events 
    they are attending from firebase (so that they will still appear 
    on their activities list)  */
    $rootScope.$watch('user.id', function(newVal, oldVal) {

        if (newVal && !$rootScope.loadedUserEvents) {
            $rootScope.userEvents = [];

            // add to 'my activities' if new acitivity appears in firebase
            settings.fbRef.child('users/' + $rootScope.user.id + '/likes').startAt(Date.now() + $rootScope.serverOffset).on('child_added', function(snap) {
                var eventDetails = Event(snap.key(), true);
                eventDetails.$loaded(function() {
                    if (settings.lowBandwidthMode)
                        eventDetails.$inst().$ref().off();
                    if (eventDetails.endTime > Date.now() + $rootScope.serverOffset) {
                        $rootScope.userEvents.push(eventDetails);
                        $rootScope.userEvents.sort(function(a, b) {
                            if (a.startTime > b.startTime) {
                                return 1;
                            } else if (a.startTime < b.startTime) {
                                return -1;
                            }

                            return 0;
                        });
                    }

                });
            });

            //remove from 'my activities' if new activity removed from firebase
            // settings.fbRef.child('users/' + $rootScope.user.id + '/likes').on('child_removed', function(snap) {
            //     for (i = 0; i < $rootScope.userEvents.length; i++) {
            //         if ($rootScope.userEvents[i].$id == snap.key()) {
            //                 $rootScope.userEvents.splice(i, 1);
            //             break;
            //         }
            //     }

            // });
            $rootScope.loadedUserEvents = true;
        }
    });

    // if we haven't finished loading events, show the loading spinner
    if (!$rootScope.finishedLoadingEvents) {
        $rootScope.timePeriod = 0;
        $rootScope.$watch('loadingEvents', function(newVal, oldVal) {
            if (newVal) {
                $rootScope.showLoader = true;
                $rootScope.events.initEvents($rootScope.sortOptions.radius);
            }
        });
    }

    // when we finish sorting events, hide the loading spinner
    $rootScope.$watch('finishedSortingEvents', function(newVal, oldVal) {
        if (newVal && newVal != oldVal) {
            $rootScope.showLoader = false;
        }
    });


    // the names we give the 3 different categories on index
    $scope.timePeriodNames = ['Today', 'Tomorrow', 'Later'];
    $scope.selectedFeed = 0;


    // if slide is swiped, update timePeriod variable
    $scope.slideChanged = function($index) {
        $rootScope.timePeriod = $index;
    };

    $scope.likeEvent = function(id) {
        $rootScope.events.likeEvent(id);
    };

    $scope.convertTime = function(time) {
        return moment().format(time);
    };

})

// mini controller for each activity
.controller('EventCtrl', function($scope, $rootScope, $window, DateTimeManager) {
    $scope.likeEvent = function(id) {
        $rootScope.events.likeEvent(id);
    };
    $scope.loadEvent = function(id) {
        $window.location.href = '#/event/' + id;
    };

        $scope.openNativeMaps = function(destination){
            var start = [$rootScope.user.location.latitude,$rootScope.user.location.longitude];
            launchnavigator.navigate(destination, start);
        };

    $scope.formattedTime = DateTimeManager.formatCustomStart($scope.event.startTime, $scope.event.endTime);
});


