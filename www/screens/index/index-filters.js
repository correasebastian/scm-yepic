angular.module("index-filters", ['firebase'])

/* this is the grand daddy filter, it sorts, filters, and
categorizes activities on the activites page */

.filter("orderByDateScore", function($rootScope) {
    function sortByScore(a, b) {

        // sorting options that are now on the backburner
        if ($rootScope.sortOptions.sort == 'distance') {
            aDist = a.getDistance();
            bDist = b.getDistance();
            if (aDist < bDist) {
                return -1;
            } else if (aDist > bDist) {
                return 1;
            }
        } else {

            if (a[$rootScope.sortOptions.sort] < b[$rootScope.sortOptions.sort]) {
                return 1;
            } else if (a[$rootScope.sortOptions.sort] > b[$rootScope.sortOptions.sort]) {
                return -1;
            }
        }
        return 0;
    }
    return function(input, labelType, dontHideLoader) {

        if (!input) {
            return [];
        }

        // check to make sure we have an array of activites, if not, convert to one
        if (!input.$getIndex || typeof input.$getIndex != "function") {

            var type = Object.prototype.toString.call(input);
            if (typeof input == "object" && type == "[object Object]") {
                var ret = [];
                for (var prop in input) {
                    if (input.hasOwnProperty(prop)) {
                        ret.push(input[prop]);
                    }
                }
                input = ret;
            }

            var index = input;
        } else {
            var index = input.$getIndex();
        }

        // we organize the activites into an array of today, tomorrow, later
        var sorted = {

            //TODO SCM 

            0: [],
            1: [],
            2: [],
            3: [],
            4: []
        };

        // if there are no activites, hide loader
        if (input.length <= 0) {
            $rootScope.showLoader = false;
            return input;
        }

        // the different time categories
        var times = [{
            startTime: 0,
            endTime: 5,
            name: "Twilight",
            used: false
        }, {
            startTime: 5,
            endTime: 12,
            name: "Morning",
            used: false
        }, {
            startTime: 12,
            endTime: 18,
            name: "Afternoon",
            used: false
        }, {
            startTime: 18,
            endTime: 24,
            name: "Evening",
            used: false
        }];

        // the different days with an object indexing time categories
        var days = {
            'Last Monday': {
                0: false,
                1: false,
                2: false,
                3: false
            },
            'Last Tuesday': {
                0: false,
                1: false,
                2: false,
                3: false
            },
            'Last Wednesday': {
                0: false,
                1: false,
                2: false,
                3: false
            },
            'Last Thursday': {
                0: false,
                1: false,
                2: false,
                3: false
            },
            'Last Friday': {
                0: false,
                1: false,
                2: false,
                3: false
            },
            'Last Saturday': {
                0: false,
                1: false,
                2: false,
                3: false
            },
            'Last Sunday': {
                0: false,
                1: false,
                2: false,
                3: false
            },
            'Yesterday': {
                0: false,
                1: false,
                2: false,
                3: false
            },
            'Today': {
                0: false,
                1: false,
                2: false,
                3: false
            },
            'Tomorrow': {
                0: false,
                1: false,
                2: false,
                3: false
            },
            'Monday': {
                0: false,
                1: false,
                2: false,
                3: false
            },
            'Tuesday': {
                0: false,
                1: false,
                2: false,
                3: false
            },
            'Wednesday': {
                0: false,
                1: false,
                2: false,
                3: false
            },
            'Thursday': {
                0: false,
                1: false,
                2: false,
                3: false
            },
            'Friday': {
                0: false,
                1: false,
                2: false,
                3: false
            },
            'Saturday': {
                0: false,
                1: false,
                2: false,
                3: false
            },
            'Sunday': {
                0: false,
                1: false,
                2: false,
                3: false
            },
        };

        var oldIndex = 1;
        var timePeriodEvents = [];

        // loop thru activities
        for (var i = 0; i < index.length; i++) {

            // if we havent loaded user info yet, initalize empty user object
            if (!$rootScope.user) {
                $rootScope.user = {};
            }

            // if we havent loaded notifications yet, initalize empty not. object
            if (!$rootScope.user.notifications) {
                $rootScope.user.notifications = {
                    invites: {}
                };
            }

            // var endTimeOffset = 172800000; //48 hours
            var endTimeOffset = 172800000*2; //48 hours


            //TODO SCM
            console.log(index[i].desc, index[i].endTime + endTimeOffset, new Date(index[i].endTime + endTimeOffset), Date.now())

            // make sure activity has description, endtime+48hours hasn't passed yet, isn't in a community or if it is in a community, the user is part of that community, the event isn't friends only or if it is friends only, the user is friends with the creator of the activity, and the user didn't create the event (we load those seperately)
            if (index[i].desc && index[i].endTime + endTimeOffset >= Date.now() && (!index[i].community || index[i].community == 0 || index[i].community == $rootScope.user.community) && !(index[i].private && (!$rootScope.userFriendsIndexed || ($rootScope.userFriendsIndexed && !$rootScope.userFriendsIndexed[index[i].uid])) && index[i].uid != $rootScope.user.id)) {

                console.log(index[i].desc)
                var prefix = '';
                var val = input[i];
                var hours = moment(val.startTime).hours();
                var day = moment(val.startTime).calendar().split(' ');
                var altDay = moment(val.endTime).calendar().split(' ')[0];

                if (day[0] == 'Last') {
                    day = day[0] + ' ' + day[1];
                } else {
                    day = day[0];
                }

                // if the activity doesn't start on the same day as today, then we append whatever prefix it might have, eg 'last' or 'tomorrow'
                if (moment().day() != moment(val.startTime).day()) {
                    prefix = day + ' ';
                }

                var offset = 0;

                // loop thru every possible time category
                for (j = 0; j < times.length; j++) {

                    // if the hour of the activity start time is less than the hour of the time category end time
                    if (hours < times[j].endTime) {

                        // if the activity isn't hidden and we haven't already used this time category
                        if (!days[day][j] && !val.hidden) {
                            days[day][j] = true;

                            // if we already have some activites in this time category, sort them by how many upvotes they have (aka likes aka attending)
                            if (timePeriodEvents.length > 0) {
                                timePeriodEvents.sort(sortByScore);
                                Array.prototype.push.apply(sorted[dayIndex], timePeriodEvents);
                            }

                            var dayIndex = 0;
                            var pushVal = true;

                            // some time category labeling logic
                            if (day == 'Today') {
                                dayIndex = 0;
                                if (labelType) {
                                    prefix = 'This ';
                                } else {
                                    prefix = '';
                                }
                            } else if (day == 'Tomorrow') {
                                dayIndex = 1;
                                if (labelType) {
                                    prefix = 'Tomorrow ';
                                } else {
                                    prefix = '';
                                }
                            } else if (day == 'Yesterday') {

                                if (altDay == 'Today') {
                                    dayIndex = 0;
                                } else {
                                    // TODO SCM

                                    // pushVal = false;
                                    dayIndex = 3;
                                }
                            // } else if (day == 'Last') {
                            } else if (day.includes('Last')) {

                                // day.includes('Last')
                                // TODO SCM LOGICA PARA SABER SI ACABA UN DIA ANTES OSEA AYER

                                if (altDay == 'Yesterday') {
                                    dayIndex = 3;
                                } else {
                                    // TODO SCM

                                    // pushVal = false;
                                    dayIndex = 4;
                                }
                            } else {

                                dayIndex = 2;

                            }

                            // add time category to list of activites, so it shows up on index template
                            if (pushVal) {
                                sorted[dayIndex].push({
                                    category: true,
                                    title: prefix + times[j].name
                                });
                            }
                            timePeriodEvents.length = 0;
                        }

                        break;
                    }
                }

                if (val) {
                    var dayIndex = 0;
                    var pushVal = true;
                    /* if (day == 'Today') {
                         dayIndex = 0;
                     } else if (day == 'Tomorrow') {
                         dayIndex = 1;
                         console.log('va;', val);
                     } else {
                         if (day == 'Yesterday') {
                             if (altDay == 'Today') {
                                 dayIndex = 0;
                             } else {
                                 //TODO SCM 
                                 dayIndex = 3;
                                 // pushVal = false;
                             }
                         } else {
                             dayIndex = 2;
                         }

                     }*/
                    if (day == 'Today') {
                        dayIndex = 0;
                        if (labelType) {
                            prefix = 'This ';
                        } else {
                            prefix = '';
                        }
                    } else if (day == 'Tomorrow') {
                        dayIndex = 1;
                        if (labelType) {
                            prefix = 'Tomorrow ';
                        } else {
                            prefix = '';
                        }
                    } else if (day == 'Yesterday') {

                        if (altDay == 'Today') {
                            dayIndex = 0;
                        } else {
                            // TODO SCM

                            // pushVal = false;
                            dayIndex = 3;
                        }
                    // } else if (day == 'Last') {
                        } else if (day.includes('Last')) {
                        // TODO SCM LOGICA PARA SABER SI ACABA UN DIA ANTES OSEA AYER

                        if (altDay == 'Yesterday') {
                            dayIndex = 3;
                        } else {
                            // TODO SCM

                            // pushVal = false;
                            dayIndex = 4;
                        }
                    } else {

                        dayIndex = 2;

                    }
                    if (pushVal)
                        timePeriodEvents.push(val);
                }
            } else {
                if (index[i].$destroy)
                    index[i].$destroy();
            }
        }
        if (timePeriodEvents.length > 0) {
            timePeriodEvents.sort(sortByScore);
            Array.prototype.push.apply(sorted[dayIndex], timePeriodEvents);

        }

        if (!dontHideLoader)
            $rootScope.finishedSortingEvents = true;

        return sorted;
    };
});

// little function to check how many elements are in an object
Object.size = function(obj) {
    var size = 0,
        key;
    for (key in obj) {
        if (obj.hasOwnProperty(key)) size++;
    }
    return size;
};
