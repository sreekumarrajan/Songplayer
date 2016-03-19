angular.module('songhop.controllers', ['ionic', 'songhop.services'])

.controller('SplashCtrl',['$scope', 'User', '$state', function($scope, User, $state) {

$scope.submitForm = function(username, signingUp) {
    return  User.auth(username, signingUp)
               .then(function(){
                    $state.go('tab.discover');
               })
               .then(null,function(error) {
                    alert("Please try another username");
               });
};

}])
/*
Controller for the discover page
*/
.controller('DiscoverCtrl', ['$scope', '$timeout', 'User', 'Recommendations', '$ionicLoading', function($scope, $timeout, User, Recommendations, $ionicLoading) {


     var showLoading = function() {
          $ionicLoading.show({
               template:'<i class="ion-loading-c"></i>',
               noBackdrop:true
          });
     };

     var hideLoading = function() {
          $ionicLoading.hide();
     };

     showLoading();

     Recommendations.init()
     	.then(function(){
     		$scope.currentSong = Recommendations.queue[0];
             
               return Recommendations.playCurrentSong();
     	})
          .then(function(){
                 hideLoading();
                 $scope.currentSong.loaded = true;
          });

     $scope.sendFeedback = function(bool) {

     	if(bool) {
     		User.addSongToFavorite($scope.currentSong);
     	}
     	$scope.currentSong.rated = bool;
     	$scope.currentSong.hide = true;

     	return Recommendations.nextSong()
     		.then(function(){
     			return $timeout(function(){
		     		
		     		$scope.currentSong = Recommendations.queue[0];
                         $scope.currentSong.loaded = false;
     			});
     		})
               .then( function() {
                    
                     return Recommendations.playCurrentSong();
                    
               })
               .then(function(){
                    $scope.currentSong.loaded = true;
               })
     		.then(null, function(error){
     		});

         

     	
     	
     };

     $scope.nextAlbumImage = function() {
          if(Recommendations.queue.length > 1) {
             return  Recommendations.queue[1].image_large;
          }
          return '';
     };

}])


/*
Controller for the favorites page
*/
.controller('FavoritesCtrl', ['$scope', 'User', '$window', function($scope, User, $window) {

	$scope.favorites = User.favorites;
     $scope.username = User.username;

	$scope.removeSongFromFavorite = function(song, index) {
		User.removeSongFromFavorite(song, index);
	};

     $scope.openSong = function(song) {
          $window.open(song.open_url, "_system");
     };

}])


/*
Controller for our tab bar
*/
.controller('TabsCtrl', function($scope, Recommendations, User, $window) {

     $scope.enteringFavorites = function() {
          Recommendations.haltAudio();
          User.newFavorites = 0;
     };

     $scope.favCount = User.favoriteCount;

     $scope.leavingFavorites = function() {
          Recommendations.init();
     }

     $scope.logout = function() {
          User.destroySession();

          $window.location.href = "index.html";
     }

});