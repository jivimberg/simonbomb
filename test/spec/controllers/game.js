'use strict';

describe('Controller: GameCtrl', function () {

  // load the controller's module
  beforeEach(module('simonbombApp'));

  var GameCtrl,
    scope;

  // Initialize the controller and a mock scope
  beforeEach(inject(function ($controller, $rootScope) {
    scope = $rootScope.$new();
    GameCtrl = $controller('GameCtrl', {
      $scope: scope
    });

    scope.players.$remove();
  }));

  it('should have an empty list of players at the beginning', function () {
    expect(scope.players.length).toBe(0);
  });

  it('should have an empty list of playing players at the beginning', function () {
    expect(scope.playing.length).toBe(0);
  });

  it('should have an empty simonSequence at the beginning', function () {
    expect(scope.playing.length).toBe(0);
  });

  it('should not have gameState value defined at the beginning', function () {
    expect(scope.gameState.$value).toBeUndefined();
  });

  it('should not have currentPlayerIdx value defined at the beginning', function () {
    expect(scope.currentPlayerIdx.$value).toBeUndefined();
  });

  it('should not have currentPlayerIdx value defined at the beginning', function () {
    expect(scope.playerRefId).toBeUndefined();
  });

  //it('should have a new player logged in', function (done) {
  //  scope.players.$loaded(function() {
  //    expect(scope.players.length).toBe(0);
  //  });
  //
  //  scope.players.$watch(function() {
  //    expect(scope.players.length).toBe(1);
  //    done();
  //  });
  //
  //  scope.loginNewPlayer();
  //});
});
