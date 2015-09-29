angular.module('ion-google-place', [])
    .directive('ionGooglePlace', [
        '$ionicTemplateLoader',
        '$ionicBackdrop',
        '$q',
        '$timeout',
        '$rootScope',
        '$document',
        function($ionicTemplateLoader, $ionicBackdrop, $q, $timeout, $rootScope, $document) {
            return {
                require: '?ngModel',
                restrict: 'E',
                template: '<a class="new-event-icon icon button-icon ion-ios7-location-outline button button-small button-clear button-stable" style="box-shadow: 0px 0px 1px rgba(0,0,0,.1);text-align:left !important;vertical-align:middle;font-size:14px;padding:4px 8px 4px 12px;width:100%;background:#fcfcfc;border:1px solid #dcdcdc;border-radius:2px;"><span style="padding-left:4px">Where?</span><span style="font-weight:bold;text-align:right;float:right;white-space: nowrap"></span>',
                replace: true,
                scope: {
                    addressInfo: '=address'
                },
                link: function(scope, element, attrs, ngModel) {

                    console.log(scope,attrs);
                    scope.locations = [{
                        formatted_address: 'Current Location'
                    }];
                    var geocoder = new google.maps.Geocoder();
                    var autocompleteService = new google.maps.places.AutocompleteService();

                    var searchEventTimeout = undefined;

                    var POPUP_TPL = [
                        '<div class="ion-google-place-container">',
                        '<div class="bar bar-header bar-dark item-input-inset">',
                        '<label class="item-input-wrapper">',
                        '<i class="icon ion-ios7-search placeholder-icon"></i>',
                        '<input class="google-place-search" type="search" ng-model="searchQuery" placeholder="Enter any place or address">',
                        '</label>',
                        '<button class="button button-clear">',
                        'Cancel',
                        '</button>',
                        '</div>',
                        '<ion-content class="has-header has-header">',
                        '<ion-list>',
                        '<ion-item style="margin:5px" ng-repeat="location in locations" type="item-text-wrap" ng-click="selectLocation(location)" ng-class="location.formatted_address==\'Current Location\'?\'item-positive\':\'\'">',
                        // '<span >{{location.description}}</span>',
                        // todo SCM
                         '<span >{{location.formatted_address}}</span>',
                        '</ion-item>',
                        '</ion-list>',
                        '</ion-content>',
                        '</div>'
                    ].join('');

                    var popupPromise = $ionicTemplateLoader.compile({
                        template: POPUP_TPL,
                        scope: scope,
                        appendTo: $document[0].body
                    });

                    popupPromise.then(function(el) {
                        var searchInputElement = angular.element(el.element.find('input'));

                        scope.selectLocation = function(location) {
                            ngModel.$setViewValue(location);
                            console.log(scope.addressInfo)
                            scope.addressInfo=location.address_components;
                            // addressInfo=Location.address_components
                            ngModel.$render();
                            el.element.css('display', 'none');
                            $ionicBackdrop.release();
                        };

                        scope.$watch('searchQuery', function(query) {
                            if (searchEventTimeout) $timeout.cancel(searchEventTimeout);
                            searchEventTimeout = $timeout(function() {
                                if (!query) return;
                                if (query.length < 3);

                                // autocompleteService.getPlacePredictions({input: query}, function(results, status) {

                                geocoder.geocode({
                                    address: query
                                }, function(results, status) {
                                    if (status == google.maps.places.PlacesServiceStatus.OK) {
                                        scope.$apply(function() {
                                            scope.locations = results;
                                            scope.locations.push({                                               
                                                formatted_address: 'Current Location'
                                            });

                                        });
                                    } else {
                                        // @TODO: Figure out what to do when the geocoding fails
                                    }
                                });
                            }, 350); // we're throttling the input by 350ms to be nice to google's API
                        });

                        var onClick = function(e) {
                            e.preventDefault();
                            e.stopPropagation();
                            $ionicBackdrop.retain();
                            el.element.css('display', 'block');
                            searchInputElement[0].focus();
                            $rootScope.showLocationPicker = true;
                            setTimeout(function() {
                                searchInputElement[0].focus();
                            }, 0);
                        };

                        var onCancel = function(e) {
                            scope.searchQuery = '';
                            $ionicBackdrop.release();
                            el.element.css('display', 'none');
                            $rootScope.showLocationPicker = false;
                        };

                        element.bind('click', onClick);
                        element.bind('touchend', onClick);

                        el.element.find('button').bind('click', onCancel);
                    });

                    scope.$watch('addressInfo', function(newVal, oldVal) {
                        if (newVal) {
                            if (scope.addressInfo) {
                                element[0].children[1].innerHTML = scope.addressInfo[3].short_name + ' Area';
                            } else {
                                element[0].children[1].innerHTML = 'Locating...';
                            }
                        } else {
                            element[0].children[1].innerHTML = 'Locating...';
                        }
                    });


                    // element[0].firstChild.placeholder=attrs.placeholder;



                    ngModel.$formatters.unshift(function(modelValue) {
                        if (!modelValue) return '';
                        return modelValue;
                    });

                    ngModel.$parsers.unshift(function(viewValue) {
                        return viewValue;
                    });

                    ngModel.$render = function() {
                        if (!ngModel.$viewValue.terms) {
                            if (ngModel.$viewValue.formatted_address == 'Current Location') {
                                var displayValue = scope.addressInfo[0].short_name + ' ' + scope.addressInfo[1].short_name;
                                ngModel.$viewValue.locationName = displayValue;
                                ngModel.$viewValue.locationFullName = displayValue + ', ' + scope.addressInfo[3].short_name + ' ' + scope.addressInfo[4].short_name;
                                element[0].children[1].innerHTML = displayValue;
                            }
                        } else {
                            var displayValue = ngModel.$viewValue.terms[0].value + ', ' + ngModel.$viewValue.terms[1].value;
                            if (ngModel.$viewValue.types[0] == 'establishment') {
                                displayValue = ngModel.$viewValue.terms[0].value;
                            } else if (ngModel.$viewValue.types[0] == 'street_address') {
                                displayValue = ngModel.$viewValue.terms[0].value + ' ' + ngModel.$viewValue.terms[1].value + ', ' + ngModel.$viewValue.terms[2].value;
                            }
                            ngModel.$viewValue.locationName = displayValue;
                            ngModel.$viewValue.locationFullName = ngModel.$viewValue.formatted_address;
                            element[0].children[1].innerHTML = displayValue || '';
                        }
                    };
                }
            };
        }
    ]);
