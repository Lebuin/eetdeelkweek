window.onload = function() {
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
            case "energie": style.fillColor='green';return style;
            case "woon": style.fillColor='#58fa3c';return style;
            case "mobiliteit": style.fillColor='yellow';return style;
            case "consuminderen": style.fillColor='blue'; return style;
            case "leer":style.fillColor='red';return style;
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


            function addTag(element,index,value) {
                //console.log(element.replace(/ /g,''))
                $('#panel').append('<span class="badge badge-primary">'+element.replace(/ /g,'')+'</span>')
            }

            properties.tags.split(",").forEach(addTag)
        }
        $grid.on("mouseover",'.grid-item',function(){

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
        $grid.on("click",".grid-item",function(){
                panelfill(featuredict[this.id])

        })
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

        removed_ids=[]
        added_ids=[]
        for (i in selection.features){
            if ($.inArray(selection.features[i].properties.oid,old_oids)==-1) {
                added_ids.push(selection.features[i].properties.oid)
            }
        }
        for (i in old_selection.features){
            if ($.inArray(old_selection.features[i].properties.oid,new_oids)==-1) {
                removed_ids.push(old_selection.features[i].properties.oid)
            }
        }

        for (i in removed_ids) {
            var $item=$('#'+removed_ids[i])
            $grid.masonry("remove",$item).masonry("layout")
        }
        for (i in added_ids) {
            $('#thumbnails').append(thumbnails[added_ids[i]])
            $item=$('#'+added_ids[i])
            $grid.prepend($item).masonry("prepended",$item)
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
        })
    }

    $.ajax({
        type: "GET",
        url: "https://api.mlab.com/api/1/databases/eetdeelkweek/collections/organisaties?apiKey=zZCeZ97nlxBLNXmmmUHNj_VbBM3K9Ady",
        contentType: "application/json",
        dataType: "json",
        success: function (response) {
            console.log(response)
            thumbnails={}

            function addrow(element,index,value) {
                //console.log(element)
                $('#tabel').append("<tr><td><a href='"+element.gwebsite+"'>"+element.naam+"</a></td><td><a href='#' onClick='filter_points(\""+element.categorie+"\")'>"+element.categorie+"</a></td><td><button class='btn' onClick=\"delete_object('"+element._id.$oid+"')\">Delete in database</button></td></tr>")

                var thumbnail = "<div class='"+element.categorie.replace('"',"").split()[0]+" grid-item thumbnail' id='"+element._id.$oid+"' >\
                                    <img class='img-responsive' style='margin:0' src='images/"+element.foto.split('.')[0].concat('.png')+"'>\
                                    <div class='caption'>\
                                        <h5 style='text-align:center'>"+element.naam
                if (parseFloat(element.latitude)==0) {
                    thumbnail+='&nbsp<span class="glyphicon glyphicon-globe"></span>'
                }
                thumbnail+=('</h5></div></div>')
                thumbnails[element._id.$oid]=thumbnail

                try {
                    var point = turf.point(
                        [parseFloat(element.longitude),parseFloat(element.latitude)],
                        {"naam":element.naam,
                        "website":element.website,
                        "categorie":element.categorie,
                        "tags":element.tags,
                        "foto":element.foto.split('.')[0].concat('.png'),
                        "tekstje":element.tekstje,
                        "oid":element._id.$oid,
                        "latitude":element.latitude,
                        "longitude":element.longitude,
                        })

                    points.addData(point)
                } catch(e) {
                    //console.log("error with:",element)
                }
            }

            response.forEach(addrow)
            features=points.toGeoJSON()
            featuredict = {}
            for (i in features.features) {
                featuredict[features.features[i].properties.oid]=features.features[i].properties
            }
            //$('#thumbnails').html(thumbnails)
            //console.log(thumbnails)

            keys=[]
            for (k in thumbnails) {
                keys.push(k);
            }
            keys.sort()
            thumbnaildiv=[]
            for (i=0;i<keys.length;i++) {
                k=keys[i]
                thumbnaildiv.push(thumbnails[k])
            }

            $('#thumbnails').html(thumbnaildiv)
            map.addEventListener('dragend',function(){filter_points({'move':true})})
            map.addEventListener('zoomend',function(){filter_points({'move':true})})
            map.addEventListener('autopanstart',function(){filter_points({'move':true})})
            $grid=$('.grid').masonry({
                columnWidth:'.grid-item',
                itemSelector:'.grid-item',
                gutter:10

            })
            $grid.imagesLoaded(function(){$grid.masonry('layout')})
            eventlisteners()

        },
        error: function (response){

            console.log("failed");
        }
    });

    $('#categorieDropdown a').click(function(){
        let name = $(this).attr('name')
        filter_points({'categorie':name})
    })

    $('#Homereset').click(()=>{
        filter_points({});
        map.setView([51.055,3.73],12,{'animate':true,'pan':{'duration':1}})})
}
