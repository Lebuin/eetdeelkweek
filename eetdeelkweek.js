angular.module('app',['angular.filter','leaflet-directive','ngAnimate']);

angular.module('app')
   .filter('within',function(){
      return function(input,bounds){
         return selection1=turf.within(turf.featurecollection(input),turf.featurecollection([turf.bboxPolygon([bounds.southWest.lng,bounds.southWest.lat,bounds.northEast.lng,bounds.northEast.lat])])).features
         //selection2=input.filter(function(value){return value.properties.lat=="0"})
         //return selection2
      }
   });
   
angular.module('app')
   .controller('appCtrl',function($scope,$http,$filter){
      
      $scope.filters={};
      $scope.filters.properties={}
      $scope.filters.properties.categorie=''
      $scope.filterhide=false
      
      $scope.center= {
         lat: 51.05,
         lng: 3.74,
         zoom: 12
      }
      

      var geojsonMarkerOptions = function(feature){
				var style= {radius: 7,
                        weight: 1,
                        opacity:0.3,
                        fillOpacity: 1}
						
                switch (feature.properties.categorie) {
                    case "voeding": style.fillColor='orange';return style;
                    case "energie & mobiliteit": style.fillColor='green';return style;
                    case "consuminderen": style.fillColor='blue'; return style;
                    case "kennis":style.fillColor='red';return style;
                    case "democratie":style.fillColor='yellow';return style;
                    case "":style.fillColor='red';return style;
                };
				
            };
            
      $http.get("https://api.mlab.com/api/1/databases/eetdeelkweek/collections/organisaties?apiKey=zZCeZ97nlxBLNXmmmUHNj_VbBM3K9Ady")
      .then(function(response){
         data=[];
         response.data.forEach(function(object){
            data.push(
                           turf.point(
                                       [object.longitude,object.latitude],
                                       {
                                          'naam':object.naam,
                                          'website':object.website.split('.')[0]+'.png',
                                          'tekstje':object.tekstje,
                                          'foto':object.foto.split('.')[0]+'.png',
                                          'categorie':object.categorie,
                                          'tags':object.tags.split(','),
                                          
                                          }
                                          )
                           )
         });
         $scope.finished=true
         //layer.addData($scope.data)
         $scope.data=data
         $scope.tabledata=angular.copy(data)
         
         $scope.grid=$('.grid').masonry({itemSelector:'.grid-item',columnWidth:200})
         $scope.grid.masonry('layout')
         
         $scope.geojsondata={data:data
            ,pointToLayer:function(feature,latlng){
               
               return L.circleMarker(latlng,geojsonMarkerOptions(feature))
               },
         
            onEachFeature:function(feature,layer){
               layer.on('click',function(e){$scope.center.lat=e.latlng.lat;$scope.center.lng=e.latlng.lng;$scope.center.zoom=16});
               layer.on('mouseover',function(){
                  console.log(feature);
                  $scope.selecteditem=feature
                  })
               
            }
         }
         console.log($scope.geojsondata)
         $scope.$watch('filters.properties.categorie',function(){
            $scope.geojsondata.data=$filter('filter')($scope.data,$scope.filters)
            $scope.grid.masonry('layout')
           
         })
         
      });
      
      $scope.selectitem=function(feature){
         $scope.selecteditem=feature
      }
      $scope.reset = function(){
         $scope.center= {
         lat: 51.05,
         lng: 3.74,
         zoom: 12
         }
         $scope.filters.properties.categorie=''
      }
      
});
  