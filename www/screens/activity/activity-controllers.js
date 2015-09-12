angular.module('activity-controllers', ['firebase'])

.controller('EventDetailCtrl', function($scope, Event, $cordovaGoogleAnalytics, $ionicPosition, $cordovaSocialSharing, $rootScope, $firebase, $location, $anchorScroll, $timeout, $ionicNavBarDelegate, $stateParams, $ionicScrollDelegate, NotificationService, $ionicPopup, settings, DateTimeManager) {

    if (window.device) {
        $cordovaGoogleAnalytics.trackView('eventdetail');
    }

    $scope.$on('$destroy', function() {
        if ($scope.commentsWatch)
            $scope.commentsWatch();
    });

    $scope.eventId = $stateParams.eventId;
    $scope.directLink = false;

    if (!$rootScope.previousState) {
        $scope.directLink = true;
    }

    $scope.shareEvent = function() {
        $cordovaSocialSharing.share('Check out my activity! http://app.getyepic.com/#/event/' + $scope.eventId);
    };

    $scope.editTime = function() {
        $scope.data = {};

        var myPopup = $ionicPopup.show({
            template: '<div class="row"><div class="col">Start</div><div class="col">End</div></div><div class="row"><div class="col"><input type="time" name="starttime" style="font-size:16px;padding-bottom:2px"></div><div class="col"><input type="time" name="endtime"></div></div>',
            title: 'Update Start and End Time',
            scope: $scope,
            buttons: [{
                text: 'Cancel'
            }, {
                text: '<b>Update</b>',
                type: 'button-positive',
                onTap: function(e) {
                    if (!$rootScope.searchRadius) {
                        //don't allow the user to close unless he enters wifi password
                        e.preventDefault();
                    } else {
                        EventService.updateRadius(parseInt($rootScope.searchRadius));
                        return $rootScope.searchRadius;
                    }
                }
            }, ]
        });

    };

    function tasksAfterLoad() {

        $rootScope.showLoader = false;
        $scope.showEventInfo = true;

        if ($scope.event.location && $scope.event.location.fullName)
            $scope.event.location.fullName = encodeURIComponent($scope.event.location.fullName);

        $scope.formattedStartTime = ($scope.event.customTime ? DateTimeManager.formatCustom($scope.event.startTime, $scope.event.endTime) : DateTimeManager.format($scope.event.startTime));

        $scope.currentEvent = false;

        if ($scope.event.startTime > moment().unix() * 1000) {
            $scope.currentEvent = true;
        }

        $scope.userAttending = $rootScope.user.likes[$scope.eventId];

        var newUserRef = settings.fbRef.child('users/' + $rootScope.user.id);

        $scope.creator = $firebase(settings.fbRef.child('users/' + $scope.event.uid)).$asObject();

        $timeout(function() {

            var windowHeight = document.getElementById('detailview').offsetHeight;
            var eventInfoHeight = document.getElementById('eventinfo').offsetHeight;

            if (eventInfoHeight / (windowHeight - 86) > .6) {
                var descriptionContainerHeight = ((windowHeight - 86) / 2) - 100;
                document.getElementById('descriptionbox').style.height = descriptionContainerHeight + 'px';
            }

            $scope.compHeight = (document.getElementById('detailview').offsetHeight - document.getElementById('eventinfo').offsetHeight) - 82;
            document.getElementById('commentdiv').style.height = $scope.compHeight + 'px';
            $scope.commentsWatch = $scope.$watch('event.numComments', function(newVal, oldVal) {
                if (newVal) {
                    $timeout(function() {
                        $ionicScrollDelegate.$getByHandle('comments').resize();
                        $ionicScrollDelegate.$getByHandle('comments').scrollBottom(newVal != oldVal && oldVal);
                    });
                }
            }, true);

        });
    }

    $scope.archive = false;

    $scope.event = Event($scope.eventId, true);
    var commentsRef = settings.fbRef.child('/events/' + $scope.eventId + '/comments');

    $timeout(function() {
        if (!$scope.showEventInfo)
            $rootScope.showLoader = true;
    }, 50);

    $scope.event.$loaded().then(function() {

        if ($scope.event.desc == null) {
            settings.fbRef.child('event_archive/' + $scope.eventId).once('value', function(snapshot) {
                if (snapshot.val() != null) {
                    $scope.archive = true;
                    console.log('new archive ref for event');
                    $scope.event = Event($scope.eventId, true, true);
                    $scope.event.$loaded(function() {
                        tasksAfterLoad();
                    });
                }
            });
        } else {

            tasksAfterLoad();

        }

    });


    $scope.getEventDetails = function(eventId) {

    };

    $scope.getRepColor = function(rep) {

        if (rep > 0) {
            return 'green';
        }
        if (rep < 0) {
            return 'red';
        }
        return 'black';
    };

    $scope.maximizeComments = function() {
        document.getElementById('eventinfo').style.display = 'none';
        $timeout(function() {
            var compHeight = window.innerHeight - 82;

            document.getElementById('commentdiv').style.height = compHeight + 'px';
            $ionicScrollDelegate.$getByHandle('comments').resize();
            $ionicScrollDelegate.scrollBottom(false);
        });
    };

    $scope.minimizeComments = function() {
        document.getElementById('eventinfo').style.display = '';
        $timeout(function() {
            document.getElementById('commentdiv').style.height = $scope.compHeight + 'px';
            $ionicScrollDelegate.scrollBottom(false);
        });
    };

    $scope.gotoBottom = function() {
        $location.hash('bottom');
        $anchorScroll();
    };


    $scope.showFullEvent = false;

    $scope.addComment = function(comment) {

        if (comment.msg.length > 0) {
            comment.uid = $rootScope.user.id;
            comment.timestamp = Firebase.ServerValue.TIMESTAMP;

            if ($scope.event.comments) {
                var lastComment = Object.keys($scope.event.comments);
                lastComment = $scope.event.comments[lastComment[$scope.event.numComments - 1]];

            }

            commentsRef.push(comment);

            var countRef = settings.fbRef.child('/events/' + $scope.eventId + '/numComments');

            countRef.transaction(function(currentCount) {
                if (!currentCount) return 1;
                return currentCount + 1;
            });


            $scope.comment.msg = '';

            if ($scope.event.comments && lastComment.uid != $rootScope.user.id && lastComment.uid != $scope.event.uid) {
                NotificationService.addUserAlsoCommentedNotification($scope.eventId, $rootScope.user.id, lastComment.uid);
            }

            NotificationService.addUserCommentedNotification($scope.eventId, $rootScope.user.id);


        }
    };

    $scope.likeEvent = function() {
        $rootScope.events.likeEvent($scope.eventId);
    };

});