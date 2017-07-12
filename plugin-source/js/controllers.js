'use strict';

// Controlleur pour l'affichage des acteurs et du bandeau
var ReminizPlugin = angular.module('ReminizPlugin', []);
ReminizPlugin.config(function($httpProvider){
    $httpProvider.defaults.xsrfCookieName = 'csrftoken';
    $httpProvider.defaults.xsrfHeaderName = 'X-CSRFToken';
});
ReminizPlugin.config( [
    '$compileProvider',
    function( $compileProvider )
    {
	$compileProvider.imgSrcSanitizationWhitelist(/^\s*(https?|local|data|chrome-extension):/);
    }
]);

ReminizPlugin.controller('detail', [ '$rootScope', '$scope',
    function($rootScope, $scope){
        $scope.fonts_path = chrome.extension.getURL('/fonts/');
	$scope.basePluginUrl = chrome.extension.getURL('');

        $rootScope.$on('showPanel', function(event, celebrity) {
            $scope.celebrity = celebrity;
        });

        $rootScope.$on('hidePanel', function(event, celebrity) {
            $scope.celebrity = null;
        });
    }
]);

ReminizPlugin.controller('list', [ '$rootScope', '$scope', '$http',
    function($rootScope, $scope, $http){
        $scope.player = {
            hash: null,
            currentTime: null
        };
        $scope.celebrities = null;

        $scope.evaluateSize = function(){
            $scope.player.top = player.offset().top;
            $scope.player.left = player.offset().left;
            $scope.player.width = player.width();
            $scope.player.height = player.height();
        }

        $scope.onPause = function(event) {
            $scope.evaluateSize();
            console.log("Pause the video");
            $scope.player.currentTime = this.currentTime;

            // TODO : should not be window.location.href, but player.baseURI.
            var oldHref = window.location.href;
            var re = /https?\:\/\/www.([^&]*).*/;
            var newHref = oldHref.replace(re, '$1');
            $scope.player.hash = md5(newHref);
            console.log(newHref);

            $http({
                method: 'GET',
                url: `https://father02.local:8000/sourcevideos/${$scope.player.hash}/whoisthere/${$scope.player.currentTime}`
            }).then(function successCallback(onScreenEntities) {
                $scope.celebrities = [];
                console.log(onScreenEntities);
                onScreenEntities.data.forEach(function(element) {
                    $http({
                        method: 'GET',
                        url: `https://father02.local:8000/entities/${element.entity}/`
                    }).then(function(entity){
                        $scope.celebrities.push({
                            missed: false,
                            infos: entity.data,
                            location: element
                        });
                    });
                });
                console.log($scope.celebrities);
            }, function errorCallback(onScreenEntities) {
                $scope.celebrities = null;
                console.log("Cette vidéo n'est pas en base de données.");
            });
            console.log(this.currentTime);
            $scope.$apply();
        }
        $scope.onPlay = function(event) {
            console.log("Play the video");
            $scope.celebrities = null;
            $scope.hidePanel();
            $scope.$apply();
        }
        $scope.onSeeked = function(event) {
            console.log("Seeked the video");
            $scope.player.currentTime = this.currentTime;
            $scope.$apply();
        }
        $scope.findVideo = function() {
            // Cherche la première vidéo.
            player = $("video").first();
            if (!player.length)
            // Si la vidéo n'est pas trouvé, on reessaie dans une seconde.
            setTimeout($scope.findVideo, 1000);
            else
            {
                $scope.evaluateSize();

                player.on("pause", $scope.onPause);
                player.on("play", $scope.onPlay);
                player.on("seeked", $scope.onSeeked);

                // Affiche les cercles au bon endroit si la fenetre est redimensionnée.
                window.onresize = function(){
                    $scope.evaluateSize();
                    $scope.$apply();
                };
                window.onclick = function(){
                    setTimeout(function(){
                        $scope.evaluateSize();
                        $scope.$apply();
                    }, 400);
                };
                window.onkeydown = function(){
                    $scope.evaluateSize();
                    $scope.$apply();
                };
            }
        }
        $scope.showPanel = function(celebrity) {
            $scope.celebrities.forEach(function(celeb){
                celeb.selected = "";
            });
            celebrity.selected = "selected";
            $rootScope.$emit('showPanel', celebrity);
        }
        $scope.hidePanel = function(celebrity) {
            $rootScope.$emit('hidePanel');
        }

        $scope.findVideo();
    }
]);
