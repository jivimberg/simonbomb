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

    $scope.newGame = function() {
      // clean the sequence
      Ref.child('simonSequence').remove();

      Ref.child('.info/serverTimeOffset').on('value', function(snap) {
        myOffset = snap.val()||0;
      });
      Ref.child('running').on('value', toggleRunning);
      Ref.child('endtime').on('value', updateEndTime);
      Ref.child('endtime').set(now() + RESET_SECONDS * 1000);
      Ref.child('running').set(true);
    };

    function alert(msg) {
      $scope.err = msg;
      $timeout(function() {
        $scope.err = null;
      }, 5000);
    }

    /***** TIMER FUNCTIONS *********/
    var endsAt = 0, timeout;
    var RESET_SECONDS = 60;
    var myOffset = 0;

    function toggleRunning(snap) {
      var b = !! snap.val();
      if (b) {
        countDown();
        timeout = setInterval(countDown, 1000);
      } else {
        timeout && clearTimeout(timeout);
        timeout = null;
      }
    }

    function updateEndTime(snap) {
      endsAt = snap.val()||0;
      countDown();
    }

    function countDown() {
      setTime(Math.max(0, endsAt - now()));
    }

    function setTime(remaining) {
      var minutes = Math.floor(remaining / 60000);
      var seconds = Math.round(remaining / 1000);
      $('#timer').text(lpad(minutes) + ':' + lpad(seconds));
    }

    /******* UTILS **********/

    function now() {
      return Date.now() + myOffset;
    }

    function lpad(n) {
      if (n < 10) {
        return '0' + n;
      }
      else {
        return n;
      }
    }

  });
