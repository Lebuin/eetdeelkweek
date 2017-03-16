/*************
 * Templates *
 *************/

// Use like this:
// var html = compileTemplate[key](context)

templates = {};
templates.thumbnail = '\
<div class="<%= _.join(categories, " ") %> grid-item thumbnail" id="<%= id %>">\
    <img class="img-responsive" style="margin:0" src="images/<%= image %>" />\
    <div class="caption">\
        <h5 style="text-align:center">\
            <%= name %>\
        </h5>\
    </div>\
</div>';

templates.info = '\
<h5><%= name %></h5>\
<i><%= _.join(categories, ", ") %></i>\
\
<% if(hasCoordinate) { %>\
    <a href="#" onclick="focusItem(id)"><span class="glyphicon glyphicon-map-marker"></span></a>\
<% } %>\
\
<p><%= description %></p>\
\
<% if(image) { %>\
    <p><img src="images/<%= image %>" /></p>\
<% } %>\
\
<p><a href="<%= website %>">Website</a></p>';


let compileTemplate = {};
for(let key in templates) {
    compileTemplate[key] = _.template(templates[key]);
}



/********************
 * Global variables *
 ********************/

let categories = {
    voeding: {
        name: 'Voeding',
        color: '#F44336',
    },

    wonen: {
        name: 'Wonen',
        color: '#FF9800',
    },

    mobiliteit: {
        name: 'Mobiliteit',
        color: '#FFEB3B',
    },

    consuminderen: {
        name: 'Consuminderen',
        color: '#03A9F4'
    },

    ontmoeten: {
        name: 'Ontmoeten',
        color: 'blue',
    },
};

let selected = {
    categories: {},
    hasCoordinate: true,
};

let items = {}, filteredItems = {};

let $grid, map, pointsLayer;


/******************
 * setEvents      *
 ******************/

function setEvents(){

    $('#left').on('click', '.list-group-item', function(e){
        // name 
        var name = e.target.getAttribute('name')

        filterItems(name)

    })
}


/******************
 * Initialization *
 ******************/

window.onload = function() {
    $grid = createMasonry();

    map = createMap();

    registerEventListeners();

    getItems(function(localItems) {
        items = localItems;
        filterItems();
    });

    setEvents()
};



/***********
 * Methods *
 ***********/

function registerEventListeners() {
    //TODO: listen on masonry list item hover, map point hover, button clicks,...
}


function createMasonry() {
    let $grid = $('.grid');

    $grid.masonry({
        columnWidth:'.grid-item',
        itemSelector:'.grid-item',
        gutter:10,
    });

    return $grid;
}


function createMap() {
    var map = L.map('map', {
        center: [51.055, 3.73],
        zoom:12,
        maxZoom:16,
    });

    L.tileLayer('http://stamen-tiles-{s}.a.ssl.fastly.net/watercolor/{z}/{x}/{y}.{ext}', {
        attribution: 'Map tiles by <a href="http://stamen.com">Stamen Design</a>, <a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a> &mdash; Map data &copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        subdomains: 'abcd',
        minZoom: 1,
        maxZoom: 16,
        ext: 'png'
    }).addTo(map);

    L.tileLayer('http://stamen-tiles-{s}.a.ssl.fastly.net/toner-labels/{z}/{x}/{y}.{ext}', {
        attribution: 'Map tiles by <a href="http://stamen.com">Stamen Design</a>, <a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a> &mdash; Map data &copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        subdomains: 'abcd',
        minZoom: 0,
        maxZoom: 20,
        ext: 'png',
        opacity:0.7,
    }).addTo(map);

    return map;
}


// define marker layer
function geoJsonMarkerOptions(feature) {
    return {
        radius: 7,
        weight: 1,
        opacity:0.3,
        fillOpacity: 1,
        fillColor: categories[feature.properties.categorie].color,
    };
}


function setHasCoordinateFilter(value) {
    selected.hasCoordinate = value;

    filterItems();
}


function toggleCategoryFilter(category) {
    if(selected.categories.hasOwnProperty(category)) {
        delete selected.categories[category];
    } else {
        selected.categories[category] = true;
    }

    filterItems();
}


function filterItems() {
    debugger
    let oldFilteredItems = filteredItems;
    filteredItems = _.pickBy(items, filterItem);

    let removeItems = _.omitBy(oldFilteredItems, filteredItems.hasOwnProperty);
    let addItems = _.omitBy(filteredItems, oldFilteredItems.hasOwnProperty);

    // Remove all old elements
    _.forEach(removeItems, function(item) {
        let $element = item.$thumbnailElement;
        item.$thumbnailElement = null;

        $element.remove();
        $grid.masonry('remove', $element).masonry('layout');
    });

    // Add all new elements
    _.forEach(addItems, function(item) {
        let $element = $(item.html.thumbnail).prependTo($grid);
        item.$thumbnailElement = $element;
        $grid.masonry('prepended', $element).masonry('layout');
    });

    $grid.masonry('layout');
    $grid.imagesLoaded().progress(function() {
        $grid.masonry('layout');
    });
}


function filterItem(item) {
    // Items with a group should not be shown
    if(item.group) {
        return false;
    }

    // Check if items should have a coordinate
    if(item.hasCoordinate !== selected.hasCoordinate) {
        return false;
    }

    // Check if the item is shown on the map
    let bounds = map.getBounds();
    if(item.hasCoordinate && (
            item.latitude  < bounds._southWest.lat ||
            item.latitude  > bounds._northEast.lat ||
            item.longitude < bounds._southWest.lng ||
            item.longitude > bounds._northEast.lng)) {
        return false;
    }

    // Check if the item has a correct category
    if(_.keys(selected.categories).length === 0) {
        return true;
    }

    for(let i = 0; i < item.categories; i++) {
        if(_.has(selected.categories, item.categories[i])) {
            return true;
        }
    }

    return false;
}


function buildMasonry(items) {
    // Remove unwanted items
}


function loadItem(id) {
    //TODO: show the item with 'id' in a modal dialog

}



/***************************************
 * Functions to build the items object *
 ***************************************/


function getItems(callback) {
    // fetch data
    $.ajax({
        type: "GET",
        url: "items.csv",

        success: function(response) {
            let items = getItemsFromResponse(response);
            callback(items);
        },

        error: function (response){
            console.log('failed to load items.csv');
        }
    });
}


function getItemsFromResponse(response) {
    var items = {};

    var rows = CSVToArray(response);
    var header = rows[0];

    for(var i = 1; i < rows.length; i++) {
        let item = getItem(i, header, rows[i]);

        if(item && item.group) {
            // If the element is in a group: fill up missing properties
            let success = fillItemFromGroup(item, items);

            if(!success) {
                item = null;
            }
        }


        if(item) {
            // Compile templates
            item.html = getItemHtml(item);

            // Store
            items[item.id] = item;
        }
    }

    return items;
}


function getItem(id, header, row) {
    var element = _.zipObject(header, row);

    // Categories;
    let categories = element.categorie ? element.categorie.split(',').map(_.trim) : [];

    // Group
    let group = element.groep ? element.groep : null;

    // Ignore items without categories or group
    if(categories.length === 0 && group === null) {
        return null;
    }


    // Name, website, description
    let name = element.naam ? element.naam : '';
    let website = element.website ? element.website : '';
    let description = element.tekstje ? element.tekstje : '';

    // Coordinate
    let longitude = parseFloat(element.Longitude);
    let latitude = parseFloat(element.Latitude);
    let hasCoordinate = _.isFinite(latitude) && _.isFinite(longitude);

    if(!hasCoordinate) {
        latitude = null;
        longitude = null;
    }


    // Address
    let address = element.adres ? element.adres : '';
    if(element.adresextra) {
        if(address) {
            address += ' ';
        }
        address += '(' + element.adresextra + ')';
    }

    // Image
    let image = element.foto ? element.foto.split('.')[0].concat('.jpg') : '';


    // Make final object
    let item = {
        id: id,

        name: name,
        website: website,
        address: address,
        categories: categories,
        image: image,
        description: description,

        isGroup: false,
        group: group,

        hasCoordinate: hasCoordinate,
        latitude: latitude,
        longitude: longitude,

        html: {},
        $thumbnailElement: null,
    };

    return item;
}


function fillItemFromGroup(item, items) {
    let success = false;

    let groupItems = _.filter(items, function(groupItem) {
        return groupItem.name === item.group;
    });

    if(groupItems.length === 0) {
        console.error('Group not found for item', item);

    } else if(groupItems.length > 1) {
        console.error('Multiple groups found for item %s:', item, groupItems);

    } else {
        let groupItem = groupItems[0];
        groupItem.isGroup = true;

        for(let key in groupItem) {
            if(!item[key]) {
                item[key] = groupItem[key];
            }
        }

        success = true;
    }

    return success;
}


function getItemHtml(item) {
    // Compile templates
    let thumbnail = compileTemplate.thumbnail({
        id: item.id,
        name: item.name,
        image: item.image,
        categories: item.categories,
    });

    let info = compileTemplate.info({
        id: item.id,
        name: item.name,
        website: item.website,
        description: item.description,

        image: item.image,
        categories: item.categories,
        hasCoordinate: item.hasCoordinate
    });

    return {
        thumbnail: thumbnail,
        info: info,
    };
}


function CSVToArray( strData, strDelimiter ){
    // Check to see if the delimiter is defined. If not,
    // then default to comma.
    strDelimiter = (strDelimiter || ",");

    // Create a regular expression to parse the CSV values.
    var objPattern = new RegExp(
        (
            // Delimiters.
            "(\\" + strDelimiter + "|\\r?\\n|\\r|^)" +

            // Quoted fields.
            "(?:\"([^\"]*(?:\"\"[^\"]*)*)\"|" +

            // Standard fields.
            "([^\"\\" + strDelimiter + "\\r\\n]*))"
        ),
        "gi"
        );


    // Create an array to hold our data. Give the array
    // a default empty first row.
    var arrData = [[]];

    // Create an array to hold our individual pattern
    // matching groups.
    var arrMatches = null;


    // Keep looping over the regular expression matches
    // until we can no longer find a match.
    while (arrMatches = objPattern.exec( strData )){

        // Get the delimiter that was found.
        var strMatchedDelimiter = arrMatches[ 1 ];

        // Check to see if the given delimiter has a length
        // (is not the start of string) and if it matches
        // field delimiter. If id does not, then we know
        // that this delimiter is a row delimiter.
        if (
            strMatchedDelimiter.length &&
            strMatchedDelimiter !== strDelimiter
            ){

            // Since we have reached a new row of data,
            // add an empty row to our data array.
            arrData.push( [] );

        }

        var strMatchedValue;

        // Now that we have our delimiter out of the way,
        // let's check to see which kind of value we
        // captured (quoted or unquoted).
        if (arrMatches[ 2 ]){

            // We found a quoted value. When we capture
            // this value, unescape any double quotes.
            strMatchedValue = arrMatches[ 2 ].replace(
                new RegExp( "\"\"", "g" ),
                "\""
                );

        } else {

            // We found a non-quoted value.
            strMatchedValue = arrMatches[ 3 ];

        }


        // Now that we have our value string, let's add
        // it to the data array.
        arrData[ arrData.length - 1 ].push( strMatchedValue );
    }

    // Return the parsed data.
    return( arrData );
}









