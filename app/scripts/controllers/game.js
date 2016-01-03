'use strict';

/**
 * @ngdoc function
 * @name simonbombApp.controller:GameCtrl
 * @description
 * # GameCtrl
 * Controller of the simonbombApp
 */
angular.module('simonbombApp')
  .controller('GameCtrl', function ($scope, Ref, Auth, $firebaseArray, $firebaseObject, $timeout, $routeParams) {
    // Set the timer
    Ref.child('.info/serverTimeOffset').on('value', function(snap) {
      myOffset = snap.val()||0;
    });
    Ref.child('endtime').on('value', updateEndTime);

    // enable admin view
    $scope.isAdmin = $routeParams.admin === 'admin';

    // synchronize a read-only, synchronized array of colors, limit to most recent 100
    $scope.simonSequence = $firebaseArray(Ref.child('simonSequence').limitToLast(100));

    $scope.players = $firebaseArray(Ref.child('players').limitToLast(20));
    $scope.players.$loaded().then(function(){
      if($scope.players.length === 0) {
        $scope.gameState.$remove();
      }
    });

    $scope.playing = $firebaseArray(Ref.child('playing').limitToLast(20));

    $scope.running = $firebaseObject(Ref.child('running'));
    $scope.running.$watch(function() {
      toggleRunning();
    });

    $scope.gameState = $firebaseObject(Ref.child('gameState'));

    $scope.currentPlayerIdx = $firebaseObject(Ref.child('currentPlayerIdx'));
    $scope.currentPlayerIdx.$watch(function() {
      if($scope.running.$value){
        turnStart();
      }
    });

    $scope.currentSequenceIdx = $firebaseObject(Ref.child('currentSequenceIdx'));

    // display any errors
    $scope.simonSequence.$loaded().catch(alert);
    $scope.players.$loaded().catch(alert);
    $scope.currentPlayerIdx.$loaded().catch(alert);

    $scope.pickColor = function(color) {
      if($scope.currentSequenceIdx.$value < $scope.simonSequence.length) {
        if($scope.simonSequence[$scope.currentSequenceIdx.$value].text !== color){
          pickMistake();
          passTurn();
        } else {
          $scope.currentSequenceIdx.$value = $scope.currentSequenceIdx.$value + 1;
          $scope.currentSequenceIdx.$save();
        }
      } else {
        console.log('Player chose ' + color + ' as the new color');
        $scope.simonSequence.$add({text: color})
          // display any errors
          .catch(alert).then(function() {
          passTurn();
        });
      }
    };

    function pickMistake() {
      var player = $scope.players.$getRecord($scope.playing[$scope.currentPlayerIdx.$value].$value);

      $scope.playing.forEach(function (elem){
        if(elem.$value === player.$id){
          $scope.playing.$remove(elem).then(function() {
            if($scope.playing.length < 2) {
              endGame();
            }
          });
        }
      });
    }

    function turnStart(){
      var player = $scope.players.$getRecord($scope.playing[$scope.currentPlayerIdx.$value].$value);
      console.log('Player ' + player + ' turn');
      if(player.$id === $scope.playerRefId){
        //my turn! enable buttons
        console.log('it\'s my turn');
        $scope.isMyTurn = true;
      } else {
        $scope.isMyTurn = false;
      }

      $scope.currentSequenceIdx.$value = 0;
      $scope.currentSequenceIdx.$save();

      glowSequence();
    }

    function passTurn() {
      var nextIdx = $scope.currentPlayerIdx.$value + 1;
      if (nextIdx >= $scope.playing.length){
        nextIdx = 0;
      }
      $scope.currentPlayerIdx.$value = nextIdx;
      $scope.currentPlayerIdx.$save();
    }

    function glowSequence(idx) {
      if(typeof idx === 'undefined') {
        idx = 0;
      }

      if(idx >= $scope.simonSequence.length){
        return;
      }

      var color = $scope.simonSequence[idx].text;
      console.log('Make: ' + color + ' shine');
      var colorEntry = COLOR_MAP[color];
      var btn = $('.' + colorEntry.baseClass);
      var originalBackgroundColor = btn.css('background-color');
      var originalBorderColor = btn.css('border-color');
      btn.animate(
        {
          'background-color': colorEntry.brightColor,
          'border-color': colorEntry.brightColor,
          height: '+=5px',
          width: '+=5px'
        }, 'slow',
        function() {
          setTimeout(function() {
            console.log(color + ' back to normal');
            btn.animate(
              {
                'background-color': originalBackgroundColor,
                'border-color': originalBorderColor,
                height: '-=5px',
                width: '-=5px'
              }, 'slow',
              function () {
                  glowSequence(++idx);
                });
          }, 500);
        });
      }

    $scope.newGame = function() {
      Ref.child('playing').remove();
      $scope.players.forEach(function(player) {
        $scope.playing.$add(player.$id);
      });

      // clean the sequence
      Ref.child('simonSequence').remove();
      // start the timer
      Ref.child('endtime').set(now() + RESET_SECONDS * 1000);
      $scope.running.$value = true;
      $scope.running.$save();

      $scope.gameState.$value = 'playing';
      $scope.gameState.$save();

      // reset players turn
      $scope.currentPlayerIdx.$value = 0;
      $scope.currentPlayerIdx.$save();
      // when updating the currentPlayerIdx the turn will start
    };

    function endGame() {
      $scope.gameState.$value = 'game-over';
      $scope.gameState.$save();

      // clean the sequence
      Ref.child('simonSequence').remove();

      $scope.running.$value = false;
      $scope.running.$save().then(function() {
        Ref.child('endtime').set(now() + RESET_SECONDS * 1000);
      });

      // reset players turn
      $scope.currentPlayerIdx.$remove();
      $scope.currentSequenceIdx.$remove();
      $scope.isMyTurn = false;
    }

    /***** Players *********/
    $scope.loginNewPlayer = function () {
      //TODO: perhaps we don't really need auth because we are removing the player with onDisconnect?
      //Auth.$authAnonymously({rememberMe: 'sessionOnly'})
      //  .then(function(authData) {
      //    console.log('Authenticated successfully with payload:', authData);
      //  });

      $scope.players.$add({image: randomAnimal.image }).then(function(ref) {
        $scope.playerRefId = ref.key();
        Ref.child('players/' + $scope.playerRefId).onDisconnect().remove();
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
    var RESET_SECONDS = 5 * 60;
    var myOffset = 0;

    function toggleRunning() {
      var b = !! $scope.running.$value;
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
      var remaining = Math.max(0, endsAt - now());
      setTime(remaining);
      if(timeout !== null && remaining === 0){
        endGame();
      }
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

    var COLOR_MAP = {
      'Green': { baseClass: 'btn-success', brightColor:'#00ff00'},
      'Blue': { baseClass: 'btn-info', brightColor:'#0000ff'},
      'Yellow': { baseClass: 'btn-warning', brightColor:'#ff6600'},
      'Red': { baseClass: 'btn-danger', brightColor:'#ff0000'}
    };

    var ANIMAL_ARRAY = [
      { image: 'bear.svg'},
      { image: 'bear2.svg'},
      { image: 'bull.svg'},
      { image: 'camel.svg'},
      { image: 'chimp.svg'},
      { image: 'cow.svg'},
      { image: 'cow2.svg'},
      { image: 'dog.svg'},
      { image: 'dog2.svg'},
      { image: 'dog3.svg'},
      { image: 'fox.svg'},
      { image: 'frog.svg'},
      { image: 'giraffe.svg'},
      { image: 'goat.svg'},
      { image: 'lion.svg'},
      { image: 'panda.svg'},
      { image: 'pig2.svg'},
      { image: 'sea.svg'},
      { image: 'sheep.svg'},
      { image: 'skunk.svg'},
      { image: 'wild.svg'},
      { image: 'zebra.svg'}
    ];

    var randomAnimal = ANIMAL_ARRAY[Math.floor(Math.random() * ANIMAL_ARRAY.length)];

  });
