angular.module('songhop.services', ['ionic.utils'])
	.factory('User', ['$http', 'SERVER', '$q', '$localstorage', function($http, SERVER, $q, $localstorage){

		var service = {};

		service.favorites = [];
		service.newFavorites = 0;
		service.userName = false;
		service.session_id = false;

		service.auth = function(username, signingUp) {
			var authRoute;

			if(signingUp) {
				authRoute = 'signup';
			}
			else {
				authRoute = 'login';
			}

			return $http.post(SERVER.url + '/' + authRoute, {username:username})
				.then(function(data){
					service.setSession(data.username, data.session_id, data.favorites);
				});
		};

		service.setSession = function(username, session_id, favorites) {
			if(username) service.username = username;
			if(session_id) service.session_id = session_id;
			if(favorites) service.favorites = favorites;

			$localstorage.setObject('user', {'username':username,'session_id':session_id});
		};

		service.checkSession = function() {
			var deferred = $q.defer();

			if(service.session_id) {
				deferred.resolve(true);
			}
			else {
				var user = $localstorage.getObject('user');

				if( user && user.username) {
					service.setSession(user.username, user.session_id);
					service.populateFavorites()
						.then(function(){
							deferred.resolve(true);
						});

				}

				else {
					deferred.resolve(false);
				}
			}

			return deferred.promise;
		};

		service.destroySession = function() {
			$localstorage.setObject('user',{});
			service.session_id = false;
			service.username = false;
			service.favorites = [];
			service.newFavorites = 0;
		};

		service.populateFavorites = function() {
			return $http({
				method:'GET',
				url: SERVER.URL + '/favorites',
				params:{session_id:service.session_id}
			})
			.then(function(data){
				service.favorites = data;
			});
		};

		service.addSongToFavorite = function(song) {
			if(!song) {
				return false;
			}

			service.favorites.unshift(song);
			service.newFavorites++;

			return $http.post(SERVER.url + '/favorites', {session_id:service.session_id, song_id:song.song_id} );
		};

		service.removeSongFromFavorite = function(song, index) {
			if(!song) {
				return false;
			}

			service.favorites.splice(index,1);

			return $http({
				method:'DELETE',
				url:SERVER.url + '/favorites',
				params:{session_id:service.session_id, song_id:song.song_id}
			}) ;
		};

		service.favoriteCount = function(){
			return service.newFavorites;
		};

		return service;
	}])

	.factory('Recommendations',['$http', 'SERVER','$q', function($http, SERVER, $q){

		var service = {};

		var media;

		service.queue = [];

		service.init = function() {

			var deferred ;
			if(service.queue.length === 0) {
				deferred = service.getNextSongs();
			}
			else {
				deferred = service.playCurrentSong();
			}

			return deferred;

			
		};

		service.playCurrentSong = function() {
			var deferred = $q.defer();

			media = new Audio(service.queue[0].preview_url);

			media.addEventListener("loadeddata", function(){
				deferred.resolve();
			})

			media.play();

			return deferred.promise;


		};

		service.haltAudio = function(){
			if(media) {
				media.pause();
			}
		};

		service.getNextSongs = function() {
			return $http({
				method:'GET',
				url: SERVER.url + '/recommendations' 
			})
			.then(function(response){

				if(response.data) {
					service.queue = service.queue.concat(response.data);
				}
			})
			.then(null, function(error) {
				//do nothing
			});
		};

		service.nextSong = function() {

			var deferred = $q.defer();

			service.queue.shift();

			service.haltAudio();

			if(service.queue.length < 3) {
				service.getNextSongs();
			}

			deferred.resolve(true);

			return deferred.promise;
			

		};

		return service;

	}]);
