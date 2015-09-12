#!/bin/bash

rm -rf platforms;
rm -rf plugins;

ionic platform add android;
ionic platform add ios;

ionic plugin add https://github.com/dpa99c/phonegap-launch-navigator.git;
ionic plugin add nl.x-services.plugins.launchmyapp --variable URL_SCHEME="yepic";
ionic plugin add com.pushwoosh.plugins.pushwoosh;
ionic plugin add https://github.com/bez4pieci/Phonegap-Cookies-Plugin.git;
ionic plugin add com.ionic.keyboard;
ionic plugin add com.plugin.datepicker;
ionic plugin add nl.x-services.plugins.toast;
ionic plugin add org.apache.cordova.console;
ionic plugin add org.apache.cordova.contacts;
ionic plugin add org.apache.cordova.device;
ionic plugin add org.apache.cordova.geolocation;
ionic plugin add org.apache.cordova.inappbrowser;
ionic plugin add org.apache.cordova.splashscreen;
ionic plugin add org.apache.cordova.statusbar;
ionic plugin add com.danielcwilson.plugins.googleanalytics;
ionic plugin add nl.x-services.plugins.socialsharing;
ionic plugin add cordova-plugin-whitelist;
ionic plugin add /facebook/phonegap-facebook-plugin --variable APP_ID="140246859483804" --variable APP_NAME="Yepic";