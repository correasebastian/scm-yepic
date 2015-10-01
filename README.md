Ionic App Base
=====================

A starting project for Ionic that optionally supports
using custom SCSS.

## Using this project

We recommend using the `ionic` utility to create new Ionic projects that are based on this project but use a ready-made starter template.

For example, to start a new Ionic project with the default tabs interface, make sure the `ionic` utility is installed:

```bash
$ sudo npm install -g ionic
```

Then run:

```bash
$ sudo npm install -g ionic
$ ionic start myProject tabs
```

More info on this can be found on the Ionic [Getting Started](http://ionicframework.com/getting-started) page.

## Installation

While we recommend using the `ionic` utility to create new Ionic projects, you can use this repo as a barebones starting point to your next Ionic app.

To use this project as is, first clone the repo from GitHub, then run:

```bash
$ cd ionic-app-base
$ sudo npm install -g cordova ionic gulp
$ npm install
$ gulp install
```

## Using Sass (optional)

This project makes it easy to use Sass (the SCSS syntax) in your projects. This enables you to override styles from Ionic, and benefit from
Sass's great features.

Just update the `./scss/ionic.app.scss` file, and run `gulp` or `gulp watch` to rebuild the CSS files for Ionic.

Note: if you choose to use the Sass method, make sure to remove the included `ionic.css` file in `index.html`, and then uncomment
the include to your `ionic.app.css` file which now contains all your Sass code and Ionic itself:

```html
<!-- IF using Sass (run gulp sass first), then remove the CSS include above
<link href="css/ionic.app.css" rel="stylesheet">
-->
```

## Updating Ionic

To update to a new version of Ionic, open bower.json and change the version listed there.

For example, to update from version `1.0.0-beta.4` to `1.0.0-beta.5`, open bower.json and change this:

```
"ionic": "driftyco/ionic-bower#1.0.0-beta.4"
```

To this:

```
"ionic": "driftyco/ionic-bower#1.0.0-beta.5"
```

After saving the update to bower.json file, run `gulp install`.

Alternatively, install bower globally with `npm install -g bower` and run `bower install`.

#### Using the Nightly Builds of Ionic

If you feel daring and want use the bleeding edge 'Nightly' version of Ionic, change the version of Ionic in your bower.json to this:

```
"ionic": "driftyco/ionic-bower#master"
```

Warning: the nightly version is not stable.


## Issues
Issues have been disabled on this repo, if you do find an issue or have a question consider posting it on the [Ionic Forum](http://forum.ionicframework.com/).  Or else if there is truly an error, follow our guidelines for [submitting an issue](http://ionicframework.com/contribute/#issues) to the main Ionic repository. On the other hand, pull requests are welcome here!


------

var f= new Firebase("Https://torrid-torch-646.firebaseio.com/")
undefined
f
U {k: Qh, path: L, o: Zd, kc: false}
var gF= new GeoFire(f.child("user_geo"));
undefined
gF
GeoFire {}



----------------warning firebase

FIREBASE WARNING: Using an unspecified index. Consider adding ".indexOn": "g" at /geo to your security rules for better performance 

------------------------------rootscope

 e= angular.element($0); s=e.scope(); r=s.$parent;

 -----------------

 lo que se lista en eventos no son todos los que yo creo sino los que estan cerca asi no los haya creado yo

 y esta dado por este evento
 var geoQueryKeyEnter = geoQuery.on('key_entered', newEventFound);
 newEventFound

 --------------------
 asignacion de location para el usuario

 $rootScope.user.location.latitude , no esta teniendo nada y esta es la informacion del /users , depronto la podriamos obtener de users_geo


 -------------------------------------

 el=R.eventList

 f= function(o,k){
 console.log(o.desc, new Date(o.endTime))
 }
 angular.forEach(el,f)

 sel=R.sortedEventList
 sf= function(o,k){
  
 if (o.length>1){
console.log(k)
angular.forEach(o,function(a,i){
if(a.desc){
	console.log(a.desc, new Date(a.endTime))
}
 
 })
 }
 
 }
 angular.forEach(sel,sf)