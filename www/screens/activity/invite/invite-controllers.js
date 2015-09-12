angular.module('invite-controllers', ['firebase'])

.controller('InviteCtrl', function($scope, $timeout, ContactManager, filterFilter, $firebase, $rootScope, $stateParams, $state, $http, settings, NotificationService) {

    $rootScope.showLoader = true;
    $scope.confirmationText = 'Send';
    $scope.headerText = 'Invite Friends';


    $scope.toggleInvite = function(contact) {
        if (!$scope.eventAttendees['facebook:' + contact.id]) {
            contact.checked = !contact.checked;
        }
    };

    $timeout(function() {
        $scope.avatarSize = (window.innerWidth / 4);
    });


    var letterHasMatch = {};

    $scope.clearSearch = function() {
        $scope.search = '';
    };

    $scope.selectAllToggle = true;

    $scope.selectAll = function() {
        $scope.selectAllToggle = !$scope.selectAllToggle;
        var contacts = $scope.getContacts();
        for (var i = 0; i < contacts.length; i++) {
            if (contacts[i].id && !$scope.eventAttendees['facebook:' + contacts[i].id]) {
                if ($scope.selectAllToggle) {
                    contacts[i].checked = false;
                } else {
                    contacts[i].checked = true;
                }

            }
        }
    };


    $scope.shareFacebook = true;
    $scope.eventId = $stateParams.eventId;
    $scope.eventAttendees = $firebase(settings.fbRef.child('events/' + $scope.eventId + '/likes')).$asObject();

    if (window.plugins && ContactManager.contacts.length == 0) {
        ContactManager.getContacts();
    }


    $scope.contacts = ContactManager.contacts;

    $scope.getContacts = function(rallyFriends) {

        var contacts = $rootScope.userFriends.sort(function(a, b) {
            var textA = a.name.toLowerCase();
            var textB = b.name.toLowerCase();
            return (textA < textB) ? -1 : (textA > textB) ? 1 : 0;
        });
        contacts = contacts.concat(ContactManager.contacts);

        if (ContactManager.contacts.length || !window.plugins) {
            $rootScope.showLoader = false;
        }

        letterHasMatch = {};

        if (contacts && contacts.length > 0) {
            return contacts.filter(function(item) {
                if (item.name) {
                    var itemDoesMatch = !$scope.search || item.isLetter ||
                        item.name.toLowerCase().indexOf($scope.search.toLowerCase()) > -1
                    if (!item.isLetter && itemDoesMatch) {
                        var letter = item.name.charAt(0).toUpperCase();
                        letterHasMatch[letter] = true;
                    }
                } else {
                    itemDoesMatch = false;
                }
                return itemDoesMatch;
            }).filter(function(item) {
                if (item.isLetter && !letterHasMatch[item.letter]) {
                    return false;
                }
                return true;
            });
        }
    };

    $scope.doTest = function() {
        facebookConnectPlugin.showDialog({
            method: 'feed',
            link: 'http://candy.farm/#/event/' + $scope.eventId,
            caption: 'Check out this event on Rally!'
        }, function(response) {});
    };

    $scope.formatPhone = function(num) {
        var numbers = num.replace(/\D/g, ''),
            char = {
                0: '(',
                3: ') ',
                6: '-'
            };
        var formattedNum = '';
        for (var i = 0; i < numbers.length; i++) {
            formattedNum += (char[i] || '') + numbers[i];
        }
        return formattedNum;
    };

    function cleanNumber(number) {
        var phoneNumber = number.replace(/\D/g, '');
        return phoneNumber.substr(phoneNumber.length - 10, phoneNumber.length);
    }


    function queueText(number, eid) {
        settings.fbRef.child('texts').push({
            eid: eid,
            number: cleanNumber(number)
        });
    }

    $scope.sendInvitations = function() {
        console.log('sending invites');
        for (var i = 0; i < $scope.userFriends.length; i++) {
            if ($scope.userFriends[i].checked) {
                $scope.userFriends[i].checked = false;
                NotificationService.addInvitedNotification($scope.eventId, $rootScope.user.id, 'facebook:' + $scope.userFriends[i].id);
            }
        }
        for (var i = 0; i < $scope.contacts.length; i++) {
            if ($scope.contacts[i].checked) {
                $scope.contacts[i].checked = false;
                queueText($scope.contacts[i].numbers[0].value, $scope.eventId);
            }
        }
        $rootScope.notify('Invites sent!');
        $rootScope.goBack();
    };
});
