angular.module('app-config', ['ionic'])

.config(function($stateProvider, $urlRouterProvider) {

    $stateProvider


    // main event index page
    .state('events', {
        url: '/events',
        templateUrl: 'screens/index/index-view.html',
        controller: 'EventIndexCtrl',

    })

    // event detail page, with comments and such
    .state('event', {
        url: '/event/:eventId',

        templateUrl: 'screens/activity/activity-view.html',
        controller: 'EventDetailCtrl'

    })

    // user profile page
    .state('user', {
        url: '/user/:userId',

        templateUrl: 'screens/profile/profile-view.html',
        controller: 'UserProfileCtrl'

    })

    // login page
    .state('auth', {
        url: '/auth',
        templateUrl: 'screens/auth/auth-view.html',
        controller: 'AuthCtrl'
    })

    // invite screen
    .state('invite', {
        url: '/event/:eventId/invite',
        templateUrl: 'screens/activity/invite/invite-view.html',
        controller: 'InviteCtrl'
    })

    // pariticipants list and map view
    .state('participants', {
        url: '/event/:eventId/participants/:map',
        templateUrl: 'screens/activity/participants/participants-view.html',
        controller: 'ParticipantsCtrl'
    })


    // settings
    .state('settings', {
        url: '/settings',
        templateUrl: 'screens/settings/settings-view.html',
        controller: 'SettingsCtrl'
    })

    .state('feedback', {
        url: '/feedback',
        templateUrl: 'screens/settings/feedback/feedback-view.html',
        controller: 'FeedbackCtrl'
    })

    .state('tags', {
        url: '/tags',
        templateUrl: 'screens/settings/interests/interests-view.html',
        controller: 'TagsCtrl'
    })

    $urlRouterProvider.otherwise('events');
});
