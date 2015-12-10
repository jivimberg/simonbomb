angular.module('firebase.config', [])
  .constant('FBURL', 'https://simonbomb.firebaseio.com')
  .constant('SIMPLE_LOGIN_PROVIDERS', ['anonymous'])

  .constant('loginRedirectPath', '/login');
