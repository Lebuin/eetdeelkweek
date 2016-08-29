templates = {};
templates.thumbnail = '\
<div class="<%= categorie %> grid-item thumbnail" id="<%= id %>">\
    <img class="img-responsive" style="margin:0" src="images/<%= foto %>" />\
    <div class="caption">\
        <h5 style="text-align:center">\
            <%= naam %>\
        </h5>\
    </div>\
</div>';


var compileTemplate = {};
for(var key in templates) {
    compileTemplate[key] = _.template(templates[key]);
}


var groepen = {};
groepen.Voedselteams = [

]


window.onload = function() {

    // map initialisation
    var map = L.map('map',{center:[51.055,3.73],zoom:12,maxZoom:16})
    var Stamen_Watercolor = L.tileLayer('http://stamen-tiles-{s}.a.ssl.fastly.net/watercolor/{z}/{x}/{y}.{ext}', {
        attribution: 'Map tiles by <a href="http://stamen.com">Stamen Design</a>, <a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a> &mdash; Map data &copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        subdomains: 'abcd',
        minZoom: 1,
        maxZoom: 16,
        ext: 'png'
    }).addTo(map);
    var Stamen_TonerLabels = L.tileLayer('http://stamen-tiles-{s}.a.ssl.fastly.net/toner-labels/{z}/{x}/{y}.{ext}', {
        attribution: 'Map tiles by <a href="http://stamen.com">Stamen Design</a>, <a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a> &mdash; Map data &copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        subdomains: 'abcd',
        minZoom: 0,
        maxZoom: 20,
        ext: 'png',
        opacity:0.7,
    }).addTo(map);

    wijken.features.forEach(function(c,a){
                            $('#wijkenMenu').append('<li><a href="#" onclick="fitbounds('+a+');"\
                            \
                            >'+c.properties.naam+'</a></li>')})

    fitbounds=function(num){
        b=turf.extent(wijken.features[num])
        map.fitBounds([[b[1],b[0]],[b[3],b[2]]])
        try{
            map.removeLayer(wijk)
            }catch(err){}
        wijk=L.geoJson(wijken.features[num],{color:'green','weight':2,dashArray:'10 10'}).addTo(map)
        filter_points({'wijk':wijken.features[num]})
    }

    // define marker layer
    var geojsonMarkerOptions = function(feature){
        var style= {radius: 7,
                weight: 1,
                opacity:0.3,
                fillOpacity: 1}

        switch (feature.properties.categorie) {
            case "voeding": style.fillColor='orange';return style;
            case "woon": style.fillColor='#58fa3c';return style;
            case "mobiliteit": style.fillColor='yellow';return style;
            case "consuminderen": style.fillColor='blue'; return style;
            case "":style.fillColor='purple';return style;
        };

    };

    function plotbounds() {
        var bounds=map.getBounds()
        polygon = turf.bboxPolygon(bounds.toBBoxString().split(",").map(parseFloat))
        var within=turf.within(features,turf.featurecollection([polygon]))
        //console.log(within)
    }

    var features=[];
    var points = L.geoJson(features,{
            pointToLayer: function (feature, latlng) {
                return L.circleMarker(latlng, geojsonMarkerOptions(feature));
            }
        }).addTo(map);

    // define eventlisteners for marker layer
    function eventlisteners() {
        function panelfill(properties) {
            //console.log(e.layer.feature.properties)
            var div = '<h5>'+properties.naam+'</h5>\
                            <i>'+properties.categorie+'</i>'
            if (parseFloat(properties.latitude)!=0){
                div=div+'&nbsp<a href="#"><span class="glyphicon glyphicon-map-marker"></span></a>'}
            div=div+'\
                <p style="text-align:justify;word-wrap:break-word">\
                            '+properties.tekstje.replace('\\r\\n','</p>')+'</p>'
            if (properties.foto!= "") {
                div = div+'<p><img class="img-responsive" style="border-radius:5px;" src="images/'+properties.foto+'" alt=""></img></p>'
            }
            div=div+'<p style="word-wrap:break-word"><a href="'+properties.website+'">'+properties.website+'</a></p>'

            $('#panel').html(div)
            $('#panel img').on('mouseover',function(){
                try {
                    map.removeLayer(found)
                } catch(e) {

                }
                found=L.geoJson(turf.point([properties.longitude,properties.latitude]),{
                    pointToLayer:function(feature,latlng){
                        return L.circleMarker(latlng,{
                            clickable:false,
                            radius:10,
                            fillColor:'yellow',
                            opacity:1,
                            color:"yellow",
                            fillOpacity:0.7,
                            })
                }}).addTo(map)
                d3.selectAll("path").transition().duration(1000).style("opacity",0)
                });
            $('#panel span').on('click',function(){
                if (properties.latitude!='0') {
                    map.setView([properties.latitude,properties.longitude],16)
                    $("a[href='#top']").click(function() {
                        $("html, body").animate({ scrollTop: 0 }, "fast");
                        return false;
                        });
                }
            });
        }

        $grid.on("mouseover",'.grid-item',function(){
            console.log(this)
            that=featuredict[this.id]
            //console.log(that.latitude)
            //if (that.latitude!="0") {
            //  map.setView([that.latitude,that.longitude,],16)
            //}
            //console.log(turf.point([that.longitude,that.latitude]))
            try{map.removeLayer(found)}catch(e){}

            found=L.geoJson(turf.point([that.longitude,that.latitude]),{
                pointToLayer:function(feature,latlng){
                    return L.circleMarker(latlng,{
                        clickable:false,
                        radius:10,
                        fillColor:'yellow',
                        opacity:1,
                        color:"yellow",
                        fillOpacity:0.7,
                        })
                }}).addTo(map)
            d3.selectAll("path").transition().duration(1000).style("opacity",0)

            })
        $grid.on("click",".grid-item",()=>{panelfill(featuredict[this.id])})
        $grid2.on("click",".grid-item",()=>{
            console.log(this.id)
            panelfill(featuredict_noloc[this.id])})
        points.on("mouseover",function(e){
            panelfill(e.layer.feature.properties)
        });

        points.on('click',function(e){
            map.setView(e.latlng,16)
        })
    }


    filters={}
    selection = []
    // define filtering on marker layer
    function filter_points(cat) {

        if (_.isEmpty(cat)){
            filters = {};
            selection = features;
        } else {
            _.forEach(cat, (value,key)=>{
                filters[key]=value
            })
        }

        if (!_.isEmpty(selection)) {old_selection = selection;selection=features} else {old_selection = features; selection=features}

        try {
                map.removeEventListener('mouseover')
                map.removeEventListener('click')
                map.removeLayer(points)

        } catch (e){

        }

        if (_.has(filters, 'categorie')){
            console.log(filters.categorie)
            selection = turf.filter(selection,'categorie',filters["categorie"])
        }
        if (_.has(filters,'wijk')){
            selection = turf.within(selection, turf.featurecollection([filters.wijk]))
        }
        //s
        //sif ("categorie" in filters && filters["categorie"]!='all') {
        //s    selection = turf.filter(selection,'categorie',filters["categorie"])
        //s} else if ("wijk" in filters) {
        //s    console.log(filters.wijk)
        //s    console.log(features)
        //s    selection = turf.within(features, turf.featurecollection([filters.wijk]))
        //s    console.log(selection)
        //s    //selection = turf.within(features,)
        //s} else {
        //s    selection = features
        //s}
        nocoords=[]
        for (i=0;i<selection.features.length;i++) {
            if (parseFloat(selection.features[i].properties.latitude)==0) {
                nocoords.push(selection.features[i])
            }
        }

        bounds=turf.bboxPolygon(map.getBounds().toBBoxString().split(",").map(parseFloat))
        selection=turf.within(selection,turf.featurecollection([bounds]))
        //selection.features=selection.features.concat(nocoords)

        old_oids=[]
        for (var item in old_selection.features){
            old_oids.push(old_selection.features[item].properties.oid)
        }
        new_oids=[]
        for (var item in selection.features){
            new_oids.push(selection.features[item].properties.oid)
        }


        for (i in selection.features){
            var properties = selection.features[i].properties;

            if($.inArray(properties.oid, old_oids)==-1) {
                $('#thumbnails').append(properties.thumbnail);
                $item = $('#' + properties.oid);
                $grid.prepend($item).masonry("prepended", $item);
            }
        }
        for (i in old_selection.features) {
            var properties = old_selection.features[i].properties

            if($.inArray(properties.oid, new_oids)==-1) {
                var $item = $('#' + properties.oid);
                $grid.masonry("remove", $item).masonry("layout")
            }
        }

        //for (i in added_keys.names){
        //  $('#thumbnails').append(thumbnails[added_keys.names[i]])
        //    $item=$('#'+added_keys.oids[i])
        //  console.log("add:",added_keys.names[i])
        //  $grid.prepend($item).masonry("prepended",$item)
        //}

        points = L.geoJson(selection,{
        pointToLayer: function (feature, latlng) {
            return L.circleMarker(latlng, geojsonMarkerOptions(feature));
        }}).addTo(map);

        eventlisteners()
        setTimeout(function(){$grid.masonry('layout')},500)

    }

    function delete_object(id) {
        console.log(id)
        $.ajax({
            type:"DELETE",
            url:"https://api.mlab.com/api/1/databases/eetdeelkweek/collections/organisaties/"+id+"?apiKey=zZCeZ97nlxBLNXmmmUHNj_VbBM3K9Ady",
            succes:function(response){
                console.log(id + " deleted")
            }
        });
    }


    // fetch data
    $.ajax({
        type: "GET",
        url: "items.csv",
        success: function(response) {
            var points_noloc = [];

            var rows = CSVToArray(response);
            var header = rows[0];

            for(var i = 1; i < rows.length; i++) {
                var item = _.zipObject(header, rows[i]);

                // Ignore items without categorie
                if(item.categorie || item.groep) {
                    var point = addrow(item, i, points, thumbnails);

                    if(point.properties.groep) {
                        var groep = point.properties.groep;

                        var groepPoint = null;
                        for(var k = points_noloc.length - 1; k >= 0; k--) {
                            if(points_noloc[k].properties.naam === point.properties.groep) {
                                groepPoint = points_noloc[k];
                                break;
                            }
                        }

                        if(groepPoint) {
                            for(var key in point.properties) {
                                if(!point.properties[key]) {
                                    point.properties[key] = groepPoint.properties[key];
                                }
                            }

                            if(!groepen.hasOwnProperty(groep)) {
                                groepen[groep] = [];
                            }
                            groepen[groep].push(point);

                        } else {
                            console.error('Groep niet gevonden:', groep);
                        }


                    } else if(point.properties.latitude) {
                        points.addData(point);

                    } else {
                        points_noloc.push(point);
                    }
                }
            }


            features = points.toGeoJSON()
            features_noloc = _.filter(points_noloc,'properties.oid')

            featuredict = {};
            var thumbnaildiv = [];
            _.forEach(features.features, value => {
                featuredict[value.properties.oid] = value.properties;
                thumbnaildiv.push(value.properties.thumbnail);
            });

            featuredict_noloc = {};
            var thumbnaildiv_noloc = [];
            _.forEach(features_noloc, value => {
                featuredict_noloc[value.properties.oid] = value.properties
                thumbnaildiv_noloc.push(value.properties.thumbnail);
            });

            $('#thumbnails').html(thumbnaildiv)
            $('#thumbnails_noloc').html(thumbnaildiv_noloc)

            function filterPointsMove() {
                filter_points({move: true});
            }
            map.addEventListener('dragend', filterPointsMove);
            map.addEventListener('zoomend', filterPointsMove);
            map.addEventListener('autopanstart', filterPointsMove);
            $grid=$('.grid').masonry({
                columnWidth:'.grid-item',
                itemSelector:'.grid-item',
                gutter:10
            })
            $grid2=$('.grid2').masonry({
                columnWidth:'.grid-item',
                itemSelector:'.grid-item',
                gutter:10
            })

            $grid.imagesLoaded(function(){$grid.masonry('layout')})
            $grid2.imagesLoaded(function(){$grid2.masonry('layout')})
            eventlisteners()

        },
        error: function (response){
            console.log('failed to load items.csv');
        }
    });

    $('#categorieDropdown a').click(function(){
        let name = $(this).attr('name')
        filter_points({'categorie':name})
    })

    $('#Homereset').click(()=>{
        filter_points({});
        map.removeLayer(wijk)
        map.setView([51.055,3.73],12,{'animate':true,'pan':{'duration':1}})})
}




function addrow(element, index, value) {
    var naam = element.naam;
    var groep = element.groep;
    var categorie = element.categorie;
    var categorie2 = element.categorie2;
    var website = element.website;
    var foto = element.foto ? element.foto.split('.')[0].concat('.jpg') : '';
    var tekstje = element.tekstje;


    // Adres
    var adres = element.adres;
    if(element.adresextra) {
        adres += ' (' + element.adresextra + ')';
    }

    // Latlon
    var latitude = parseFloat(element.latitude);
    var longitude = parseFloat(element.longitude);

    if(!_.isFinite(latitude) || !_.isFinite(longitude)) {
        latitude = 0;
        longitude = 0;
    }


    var thumbnail = compileTemplate.thumbnail({
        categorie: categorie,
        id: index,
        foto: foto,
        naam: naam,
    });


    return turf.point([longitude, latitude], {
        naam: naam,
        groep: groep,
        website: website,
        categorie: categorie,
        foto: foto,
        tekstje: tekstje,
        oid: index,
        latitude: latitude,
        longitude: longitude,
        adres: adres,
        thumbnail: thumbnail,
    });
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
