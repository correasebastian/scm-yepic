angular.module('app-filters', ['firebase'])

// reverse a list
.filter('reverse', function() {
    function toArray(list) {
        var k, out = [];
        if (list) {
            if (angular.isArray(list)) {
                out = list;
            } else if (typeof(list) === 'object') {
                for (k in list) {
                    if (list.hasOwnProperty(k)) {
                        out.push(list[k]);
                    }
                }
            }
        }
        return out;
    }

    return function(items) {
        return toArray(items).slice().reverse();
    };
})

.filter('connected', function() {
    return function(input, connected) {
        if (!input) return input;
        var output = [];
        for (var i in input) {
            var item = input[i];
            if (connected) {
                if (item.uid)
                    output.push(item);
            } else {
                if (!item.uid)
                    output.push(item);
            }
        }
        return output;
    };
})

// order an object by a key, used mostly on notifications
.filter('orderObjectBy', function() {
    return function(items, field, reverse) {
        if (!(items instanceof Object)) {
            return items;
        }
        var filtered = [];
        angular.forEach(items, function(item) {
            filtered.push(item);
        });
        filtered.sort(function(a, b) {
            return (a[field] > b[field] ? 1 : -1);
        });
        if (reverse) filtered.reverse();
        return filtered;
    };
});