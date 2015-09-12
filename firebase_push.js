/*************************************************************************

    YEPIC NOTIFICATION SERVER

*************************************************************************/

var request                     = require('request');
var Firebase                    = require('firebase');
var FirebaseTokenGenerator      = require('firebase-token-generator');
var Pushwoosh                   = require('pushwoosh-client');
var moment                      = require('moment');
var geofire                     = require('geofire');
var twilio                      = require('twilio');
var express                     = require('express');
var clone                       = require('clone');
var twilioClient                = new twilio.RestClient('ACe0cfdc43be6f94997ae81ebf00671615', '499f42f789a13a125b461b81bb4a3445');
var pushwooshClient             = new Pushwoosh("EAF46-4EC26", "LQEMpV8piWcZovsi8lQdkXqNDLne1LSPlfJ852DQX0wzvnCm0cVoOKbSIHIKBpIgMYi0NwAksBRQeu4eVYGR");
var generator                   = new FirebaseTokenGenerator('ykkOTmP3DEkI4uAjxCM4CTq5MWo5UbzKrPPQB86B');
var fbRoot                      = 'https://sizzling-fire-2797.firebaseio.com';
var fbRef                       = new Firebase(fbRoot);
var queuePushNotificationPath   = new Firebase(fbRoot + '/notifications');
var queueTextMessagePath        = new Firebase(fbRoot + '/texts');
var events                      = new Firebase(fbRoot + '/events');
var geoFire                     = new geofire(new Firebase(fbRoot + '/user_geo'));
var eventGeoFire                = new geofire(new Firebase(fbRoot + '/geo'));
var serverOffset                = 0;
var token                       = generator.createToken({ uid: '1', id: '1' });

var app = express();
app.set('port', (process.env.PORT || 5000));

/*
 *  Send notifications to users for upcoming events that they are attending
 */
function handleUpcomingEventReminders() {

    var oneHour  = 1000 * 60 * 60;
    var oneDay   = 1000 * 60 * 60 * 24;
    var twoDays  = 1000 * 60 * 60 * 24 * 2;

    function sendReminderPush( msg, uKey, eKey ) {
        fbRef.child('users/' + uKey + '/core/device').once('value', function(d_snap) {
            var options = {
                send_date: 'now',
                ignore_user_timezone: true,
                link: 'yepic://#/event/' + eKey,
                minimize_link: 0,
                platforms: [1,4]
            };

            fbRef.child('events/' + eKey + '/likes/' + uKey + '/reminded').set(true, function(error){
                if( error ) {
                    console.log( error );
                }
            });

            pushwooshClient.sendMessage( msg, [d_snap.val()], options, function(error, response) {
                if( error ) {
                    console.log( error );
                }
            });
        });
    };

    events.once('value', function(snap) {
        var eventList = snap.val();

        for (var eventKey in eventList) {
            var event = eventList[eventKey];
            if (event.endTime + twoDays < (Date.now() + serverOffset)) {
                console.log('old event found');
                eventGeoFire.remove(eventKey);
                fbRef.child('events/' + eventKey).once('value', function(snapshot) {
                    fbRef.child('event_archive/' + snapshot.key()).set(snapshot.val());
                    fbRef.child('events/' + snapshot.key()).remove();
                });
            } else if (event.endTime > Date.now() + serverOffset && event.startTime < Date.now() + serverOffset && event.startTime - (Date.now() + serverOffset) < oneHour ) {
                for (var userKey in event.likes) {
                    if (!event.likes[userKey].reminded) {
                        var pushText = 'An activity you are attending starts soon!';
                        if (event.uid == userKey) {
                            pushText = 'An activity you created starts soon!';
                        }
                        
                        sendReminderPush( pushText, userKey, eventKey );
                    }
                }
            }
        }
    });
    var fifteenMins = 15 * 60 * 1000;
    var thirtySecs = 30000;
    setTimeout(handleUpcomingEventReminders, fifteenMins);
};

/*
 *  Send a notification to a user that is close to an event that was created
 */
function notifyNearbyUser(event, notification, key, location, distance) {
    try {
        if (event.uid != key) {
            fbUser = new Firebase(fbRoot + '/users/' + key);
            fbUser.once('value', function(snap) {
                if (snap.val()) {
                    var userTags = snap.val().tags;
                    for (var tag in userTags) {
                        if (tag == event.tag) {
                            var userNotificationRef = new Firebase(fbRoot).child('/users/' + key + '/notifications/feed/newevents' + '_' + notification.request.notifications[0].data.custom.eid);
                            userNotificationRef.setWithPriority({
                                'text': notification.request.notifications[0].data.custom.text,
                                'type': 'newevents',
                                'eid': notification.request.notifications[0].data.custom.eid,
                                'uid': event.uid,
                                'startTime': event.startTime
                            }, Firebase.ServerValue.TIMESTAMP, function() {
                                console.log('inc not', key);
                                newFbUser = new Firebase(fbRoot + '/users/' + key);
                                newFbUser.child('notifications/newevents/' + notification.request.notifications[0].data.custom.eid + '/' + notification.request.notifications[0].data.custom.uid).setWithPriority(true, Firebase.ServerValue.TIMESTAMP);
                                newFbUser.child('numNotifications').transaction(function(userNotificationObj) {
                                    if (userNotificationObj === null) {
                                        userNotificationObj = 0;
                                    }
                                    userNotificationObj++;
                                    return userNotificationObj;
                                });
                            });
                            // Old style push
                            request.post({
                                url: 'https://cp.pushwoosh.com/json/1.3/createMessage',

                                json: true,

                                body: JSON.stringify(notification)
                            }, function(error, response, body) {



                            });
                            break;
                        }
                    }
                }
            });
        }
    } catch( ex ) {
        console.log( ex );
    }
};

/*
 *  When a new event is added find users nearby to notify
 */
function findNearbyUsers(e, notification) {
    if (e.location && e.location.latitude && e.location.longitude) {
        var userGeoQuery = geoFire.query({
            center: [e.location.latitude, e.location.longitude],
            radius: 20
        });

        var geoQueryKeyEnter = userGeoQuery.on('key_entered', function(key, location, distance) {
            notifyNearbyUser(e, notification, key, location, distance);
        });
        var geoQueryKeyExit = userGeoQuery.on('key_exited', function() {

        });
        var geoQueryReady = userGeoQuery.on('ready', function() {
            userGeoQuery.cancel();
            console.log('finished searching users');
        });
    }
};

/*
 *  Get the number of unique commenters on an event
 *  excluding the eventCreator
 */
function getUniqueCommenters(event) {
    var counts = {};
    var arr = Object.keys(event.comments);
    for (var i = 0; i < arr.length; i++) {
        if (event.comments[arr[i]].uid != event.uid)
            counts[event.comments[arr[i]].uid] = 1 + (counts[event.comments[arr[i]].uid] || 0);
    }
    return Object.keys(counts).length;
};

/*
 *  Process a new text object from firebase
 */
function handleNewTextObject() {
    queueTextMessagePath.on('child_added', function(snap) {
        var text_msg = snap.val();
        var prefix = 'Hi this is [send_name] -- ';
        var msg = 'I\'m hosting an event [event_date] and wanted to invite you. Check it out on Yepic here:  http://app.getyepic.com/#/event/' + text_msg.eid;
        
        fbRef.child('/events/' + text_msg.eid).once('value', function(e_snapshot) {
            var e = e_snapshot.val();

            fbRef.child('/users/' + e.uid).once('value', function(u_snapshot) {
                var u = u_snapshot.val();
                var event_date = moment(u.startTime).format('dddd, MMMM Do YYYY, h:mm:ss a');
                var send_name = u.core.name;

                msg = msg.split('[event_date]').join(event_date);
                if( send_name ) {
                    prefix = prefix.split('[send_name]').join(send_name);
                    msg = prefix + msg;
                }

                twilioClient.messages.create({
                    to: '+1' + text_msg.number,
                    from: '+12162204260',
                    body: msg
                }, function(error, message) {
                    snap.ref().remove();
                    if (error) {
                        console.log(error.message);
                    }
                });
            });
        });
    });
};

/*
 *  Send PushWoosh push notification
 *  notif: object (firebase)
 *  msg: string
 *  target_user: string
 */
function sendPushwooshMessage( notif, msg, target_user ) {
    if( notif.type === 'comments' || notif.type === 'alsocomments' ) {
        if( target_user === notif.uid ) {
            console.log( 'Not sending notification because notif.uid === target_user' );
            return;
        }
    } 

    fbRef.child('users/' + target_user + '/core/device').once('value', function(d_snap) {
        var options = {
            send_date: 'now',
            ignore_user_timezone: true,
            link: 'yepic://#/event/' + notif.eid,
            minimize_link: 0,
            platforms: [1,4],
            data: {
                custom: {
                    'type': notif.type,
                    'eid': notif.eid,
                    'uid': notif.uid,
                }
            }
        };

        pushwooshClient.sendMessage( msg, [d_snap.val()], options, function(error, response) {
            if( error ) {
                console.log( error );
            } else if( response ) {
                console.log( response );
            }
        });
    });
};

/*
 *  Process a new notification object from firebase
 */
function handleNewNotificationObject() {
    queuePushNotificationPath.on('child_added', function(n_snap) {

        // We are going to process the notification so remove
        // the reference to it in firebase
        n_snap.ref().remove();

        // Copy notif for use in the future after the 
        // reference is destroyed
        var memNotif = clone(n_snap.val());

        // We want to grab the /notification object, process it, and get rid of it
        // BUT we copy it into a users notifications/feed so that it shows up in
        // the app as well


        // Grab the event associated with the notification
        fbRef.child('/events/' + memNotif.eid).once('value', function(e_snap){
            var e = e_snap.val();
            if( !e ) {
                return;
            }

            // Go ahead and consume the global notification
            var target_user = null;
            memNotif.text = '';
            switch( memNotif.type ) {
                case 'attendees':
                    
                    target_user = e.uid;

                    var new_attendee = memNotif.uid;

                    // Don't send notification if the new attendee
                    // is the person that created the event
                    if( target_user === new_attendee ) {
                        return;
                    }

                    fbRef.child('/users/' + new_attendee + '/core/name').once('value', function(name_snap) {
                        if( e.score > 1 ) {
                            if (e.score == 5 || e.score == 10 || e.score == 20 || e.score == 50) {
                                memNotif.text = e.score + ' people are attending your activity';
                            }
                        } else {
                            memNotif.text = name_snap.val() + ' is attending your activity';
                        }
                        sendPushwooshMessage( memNotif, clone(memNotif.text), target_user );
                    });

                    break;
                case 'comments':

                    target_user = e.uid;

                    var commenter = memNotif.uid;
                    fbRef.child('/users/' + commenter + '/core/name').once('value', function(name_snap) {
                        var num_commenters = getUniqueCommenters( e );
                        if( num_commenters > 1 ) {
                            memNotif.text = name_snap.val() + ' and ' + num_commenters + ' others have commented on your activity';
                        } else {
                            memNotif.text = name_snap.val() + ' has commented on your activity';
                        }
                        sendPushwooshMessage( memNotif, clone(memNotif.text), target_user );
                    });


                    break;
                case 'alsocomments':

                    target_user = memNotif.uid2;

                    var commenter = memNotif.uid;
                    fbRef.child('/users/' + commenter + '/core/name').once('value', function(name_snap) {
                        memNotif.text = name_snap.val() + ' replied to an activity you commented on.';
                        sendPushwooshMessage( memNotif, clone(memNotif.text), target_user );
                    });

                    break;
                case 'invites':

                    target_user = memNotif.uid2;

                    var inviter = memNotif.uid;
                    fbRef.child('/users/' + inviter + '/core/name').once('value', function(name_snap) {
                        memNotif.text = name_snap.val() + ' invited you to an activity!';
                        sendPushwooshMessage( memNotif, clone(memNotif.text), target_user );
                    });

                    break;
                case 'newevents':
                    // This is a special case where
                    // we must find the target users

                    setTimeout(function() {
                        findNearbyUsers(e, memNotif);
                    }, 5000);
                    return;
                    break;
                default:
                    // We are done here
                    return;
                    break;
            }

            if( !target_user ) {
                console.log( 'Unable to determine target_user' );
                return;
            }

            // Update user specific notification feed and numNotifications
            // by copying this notification into /users/[target_user]/notifications/feed
            var userRef = fbRef.child('/users/' + target_user );
            userRef.child('notifications/feed').limitToLast(1).once('value', function(f_snap) {
                userRef.child('numNotifications').transaction(function(userNotificationObj) {
                    // Update notification count
                    if (userNotificationObj === null) {
                        userNotificationObj = 0;
                    }
                    if (f_snap.val() && Object.keys(f_snap.val())[0] != memNotif.type + '_' + memNotif.eid || userNotificationObj == 0) {
                        userNotificationObj++;
                    } else {
                        if (!f_snap.val()) {
                            userNotificationObj = 1;
                        }
                    }
                    return userNotificationObj;
                }, function(error, committed, snapshot) {
                    // Copy global notification into users notification feed
                    var userNotificationRef = fbRef.child('/users/' + target_user + '/notifications/feed/' + memNotif.type + '_' + memNotif.eid);
                    userNotificationRef.setWithPriority({
                        'text': memNotif.text,
                        'type': memNotif.type,
                        'eid': memNotif.eid,
                        'uid': memNotif.uid,
                        'uid2': (memNotif.uid2 || 0)
                    }, Firebase.ServerValue.TIMESTAMP);
                });
            });
        });
    });
};

/*
 *  Grab server time offset from firebase
 */
function initServerOffset() {
    var offsetRef = new Firebase(fbRoot + '/.info/serverTimeOffset');
    offsetRef.on('value', function(snap) {
        serverOffset = snap.val();
    });
};

/*
 *  Authenticate with firebase and begin watching for new /text and /notification objects
 *  Process the object and then remove it or archive it in firebase
 */
fbRef.authWithCustomToken(token, function(err, authData) {
    if (err) {
        console.log('error logging in');
    } else {

        initServerOffset();
        handleUpcomingEventReminders();
        handleNewTextObject();
        handleNewNotificationObject();

    }
});

// Must listen on bound port on heroku or it will kill the process
app.listen(app.get('port'), function() {
  console.log('Node app is running on port', app.get('port'));
});
