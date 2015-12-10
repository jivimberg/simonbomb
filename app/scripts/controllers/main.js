'use strict';

/**
 * @ngdoc function
 * @name simonbombApp.controller:MainCtrl
 * @description
 * # MainCtrl
 * Controller of the simonbombApp
 */
angular.module('simonbombApp')
  .controller('MainCtrl', function ($scope) {
    $scope.awesomeThings = [
      'HTML5 Boilerplate',
      'AngularJS',
      'Karma'
    ];
  });
