'use strict';

/**
 * @ngdoc function
 * @name simonbombApp.controller:GameCtrl
 * @description
 * # GameCtrl
 * Controller of the simonbombApp
 */
angular.module('simonbombApp')
  .controller('GameCtrl', function ($scope, Ref, $firebaseArray, $timeout) {
    // synchronize a read-only, synchronized array of colors, limit to most recent 100
    $scope.simonSequence = $firebaseArray(Ref.child('simonSequence').limitToLast(100));

    // display any errors
    $scope.simonSequence.$loaded().catch(alert);

    // provide a method for adding a message
    $scope.pickColor = function(color) {
      if( color ) {
        // push a message to the end of the array
        $scope.simonSequence.$add({text: color})
          // display any errors
          .catch(alert);
      }
    };

    function alert(msg) {
      $scope.err = msg;
      $timeout(function() {
        $scope.err = null;
      }, 5000);
    }
  });
