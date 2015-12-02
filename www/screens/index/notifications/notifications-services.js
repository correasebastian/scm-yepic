angular.module('notifications-services', ['firebase'])

.factory("NotificationService", ['$rootScope', '$firebase', 'settings', 'DateTimeManager',
    function($rootScope, $firebase, settings, DateTimeManager) {

        function addNotificationToFeed(type, alertText, fullText, eid, uid, uid2) {

            //TODO SCM invite a friend no esta mandando ninguna notificacion pushwoosh , 


            globalNotificationFeedRef = settings.fbRef.child('notifications').push({
                eid: eid,
                uid: uid,
                type: type,
                text: alertText,
                uid2: (uid2 || 0)
            });
        }

        function removeNotificationFromFeed(type, eid, uid, euid) {
            userNotificationRef = settings.fbRef.child('/users/' + euid + '/notifications/feed/' + type + '_' + eid);
            notificationRef = settings.fbRef.child('/users/' + euid + '/notifications/' + type + '/' + eid);
            notificationRef.once('value', function(snapshot) {
                if (snapshot.val() === null) {
                    userNotificationRef.remove();
                }
            });
        }

        function addNotification(type, text, eid, uid1, uid2) {
            addNotificationToFeed(type, text, text, eid, uid1, uid2);
        }

        function removeNotification(type, eid, uid) {
            eventInfoRef = settings.fbRef.child('/events/' + eid);
            eventInfoRef.once('value', function(snapshot) {
                eventInfo = snapshot.val();
                var eventCreator = eventInfo.uid;
                if (eventCreator != uid) {
                    notificationRef = settings.fbRef.child('/users/' + eventCreator + '/notifications/' + type + '/' + eid + '/' + uid);
                    notificationRef.remove(function() {
                        removeNotificationFromFeed(type, eid, uid, eventCreator);
                    });
                    userRef = settings.fbRef.child('/users/' + eventCreator);
                    userRef.child('numNotifications').transaction(function(userNotificationObj) {
                        if (userNotificationObj === null) {
                            userNotificationObj = 0;
                        }
                        if (userNotificationObj > 0)
                            userNotificationObj--;
                        return userNotificationObj;
                    });
                }
            });
        }

        return {

            initNotifications: function(id) {
                $rootScope.userNotifications = $firebase(settings.fbRef.child('/users/' + id + '/notifications')).$asObject();

            },

            resetNotificationCounter: function() {
                $rootScope.$watch('user.id', function() {
                    userNotificationRef = settings.fbRef.child('/users/' + $rootScope.user.id + '/numNotifications');
                    userNotificationRef.set('0');
                });
            },

            addUserFollowingNotification: function(uid) {
                addNotificationToFeed('follower', '', uid, '');
            },

            addUserInviteNotification: function(eid, uid1, uid2) {

            },

            removeUserFollowingNotification: function(uid) {},

            addUserJoinedNotification: function(eid, uid) {
                // Notify event owner
                // uid: new guy
                addNotification('attendees', 'attending your activity', eid, uid);
            },

            removeUserJoinedNotification: function(eid, uid) {
                removeNotification('attendees', eid, uid);
            },

            addUserCommentedNotification: function(eid, uid) {
                // Notify event owner
                // uid: commenter
                addNotification('comments', 'commented on your activity', eid, uid);
            },

            addUserAlsoCommentedNotification: function(eid, uid, uid2) {
                // Notify uid2
                // uid: person replying
                // uid2: last person to comment - being replied to
                addNotification('alsocomments', 'replied to an activity you commented on', eid, uid, uid2);
            },

            addInvitedNotification: function(eid, uid, uid2) {
                // Notify invitee
                // uid: inviter
                // uid2: invitee
                addNotification('invites', 'invited you to an activity', eid, uid, uid2);
            },

            addEventCreatedNotification: function(eid, uid) {
                // Nofity nearby users
                // uid: event creator
                addNotification('newevents', 'has created a nearby activity', eid, 0);
            }

        };
    }
]);