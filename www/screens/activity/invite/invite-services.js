angular.module('invite-services', ['firebase'])

.factory("ContactManager", ['$cordovaContacts', 'settings', '$firebase', '$rootScope',
    function($cordovaContacts, settings, $firebase, $rootScope) {
        var contacts;
        var contactList = [];

        function connectContacts() {
            for (var i = 0; i < contactList.length; i++) {
                connectContact(i);
            }
        }

        function connectContact(index) {
            numbers = contactList[index].numbers;
            console.log('attempting to connect', numbers);
            for (var j = 0; j < numbers.length; j++) {
                numberEntry = numbers[j];
                // console.log(numberEntry['value'].replace(/\D/g, ''));
                var phoneNumber = numberEntry.value.replace(/\D/g, '');
                phoneNumber = phoneNumber.substr(phoneNumber.length - 10, phoneNumber.length);
                settings.fbRef.child('users/phone_index/' + phoneNumber).once('value', function(snap) {
                    console.log(numberEntry, snap.val());
                    $rootScope.notify('Searching for friends on Spur (' + index + '/' + contactList.length + ')');


                    if (snap.val() !== null) {
                        $rootScope.$apply(function() {
                            contactList[index].uid = snap.val();
                        });
                    }

                    if (index >= contactList.length - 1) {
                        $rootScope.hide();
                        // return;
                    } else {
                        // connectContact(++index);
                    }

                });
            }
        }

        return {

            contacts: contactList,

            connectContacts: function() {
                connectContacts();
            },

            getContacts: function() {

                var options = {};
                options.fields = ["displayName", "name", "phoneNumbers"];
                options.filter = "";
                options.multiple = true;
                //get the phone contacts

                var newContactList = [];

                return $cordovaContacts.find(options).then(function(contacts) {

                    for (var i = 0; i < contacts.length; i++) {
                        if (contacts[i].displayName !== null || contacts[i].name !== null) {
                            var contactName = '';
                            if (contacts[i].displayName !== null && contacts[i].displayName !== '') {
                                contactName = contacts[i].displayName;
                            } else {
                                contactName = contacts[i].name.formatted;
                            }
                            contactDetail = {
                                name: contactName
                            };
                            if (contacts[i].phoneNumbers !== null && contacts[i].phoneNumbers.length > 0 && contactName !== '') {
                                contactDetail.numbers = contacts[i].phoneNumbers;
                                contactList.push(contactDetail);
                                contactList.sort(function(a, b) {
                                    if (a.name < b.name) return -1;
                                    if (a.name > b.name) return 1;
                                    return 0;
                                });
                            }
                        }
                    }
                    return true;

                });
            }
        };
    }
])