'use strict';

/**
 * @ngdoc function
 * @name simonbombApp.controller:GameCtrl
 * @description
 * # GameCtrl
 * Controller of the simonbombApp
 */
angular.module('simonbombApp')
  .controller('GameCtrl', function ($scope, Ref, Auth, $firebaseArray, $firebaseObject, $timeout) {
    // Set the timer
    Ref.child('.info/serverTimeOffset').on('value', function(snap) {
      myOffset = snap.val()||0;
    });
    Ref.child('running').on('value', toggleRunning);
    Ref.child('endtime').on('value', updateEndTime);

    // synchronize a read-only, synchronized array of colors, limit to most recent 100
    $scope.simonSequence = $firebaseArray(Ref.child('simonSequence').limitToLast(100));

    $scope.players = $firebaseArray(Ref.child('players').limitToLast(20));

    $scope.currentPlayerIdx = $firebaseObject(Ref.child('currentPlayerIdx'));

    $scope.currentPlayerIdx.$watch(function() {
      console.log("Player " + $scope.players[$scope.currentPlayerIdx] + " turn");
      glowSequence();
    });


    // display any errors
    $scope.simonSequence.$loaded().catch(alert);

    // provide a method for adding a message
    $scope.pickColor = function(color) {
      if( color ) {
        // push a message to the end of the array
        $scope.simonSequence.$add({text: color})
          // display any errors
          .catch(alert).then(function() {
            passTurn();
          });
      }
    };

    function passTurn() {
      var nextIdx = $scope.currentPlayerIdx.$value + 1;
      if (nextIdx >= $scope.players.length){
        nextIdx = 0;
      }
      $scope.currentPlayerIdx.$value = nextIdx;
      $scope.currentPlayerIdx.$save();
    }

    function glowSequence(idx) {
      if(typeof idx == "undefined") {
        idx = 0;
      }

      if(idx >= $scope.simonSequence.length){
        return;
      }

      var color = $scope.simonSequence[idx].text;
      console.log("Make: " + color + " shine");
      var colorEntry = colorMap[color];
      var btn = $("." + colorEntry.baseClass);
      var originalBackgroundColor = btn.css("background-color");
      var originalBorderColor = btn.css("border-color");
      btn.animate(
        {
          "background-color": colorEntry.brightColor,
          "border-color": colorEntry.brightColor,
          height: '+=15px',
          width: '+=15px'
        }, "slow",
        function() {
          setTimeout(function() {
            console.log(color + " back to normal");
            btn.animate(
              {
                "background-color": originalBackgroundColor,
                "border-color": originalBorderColor,
                height: '-=50px',
                width: '-=50px'
              }, "slow",
              function () {
                  glowSequence(++idx);
                });
          }, 500);
        });
      }

    $scope.newGame = function() {
      // reset players turn
      $scope.currentPlayerIdx.$value = 0;
      $scope.currentPlayerIdx.$save();

      // clean the sequence
      Ref.child('simonSequence').remove();
      Ref.child('endtime').set(now() + RESET_SECONDS * 1000);
      Ref.child('running').set(true);
    };

    /***** Players *********/
    $scope.loginNewPlayer = function () {
      Auth.$authAnonymously({rememberMe: "sessionOnly"})
        .then(function(authData) {
          console.log("Authenticated successfully with payload:", authData);
          $scope.players.$add({uid: authData.uid})
        });
    };

    $scope.kickAllPlayers = function () {
      Auth.$unauth();
      Ref.child('players').remove();
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

    var colorMap = {
      "Green": { baseClass: "btn-success", brightColor:"#00ff00"},
      "Blue": { baseClass: "btn-info", brightColor:"#0000ff"},
      "Yellow": { baseClass: "btn-warning", brightColor:"#ff6600"},
      "Red": { baseClass: "btn-danger", brightColor:"#ff0000"}
    }

  });
