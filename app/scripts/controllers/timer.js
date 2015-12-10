/*
 * Just for reference
 */

var FB = new Firebase('https://katowulf-timer.firebaseio-demo.com');
var myOffset = 0;
var myId = FB.push().name(); // a random id
var RESET_SECONDS = 15;

/***** CLIENT FUNCTIONS *******/
FB.child('.info/serverTimeOffset').on('value', function(snap) {
  myOffset = snap.val()||0;
});

var endsAt = 0,
  timeout;

FB.child('running').on('value', toggleRunning);
FB.child('endtime').on('value', updateEndTime);

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

/***** MASTER FUNCTIONS *********/
var masterTimeout;
FB.child('master').on('value', masterUpdated);

function masterUpdated(snap) {
  var isMe = snap.val() === myId;
  $('[data-master]').toggleClass('hide', !isMe);
  console.log('master', isMe, snap.val()); //debug
  $('#master').prop('disabled', snap.val() !== null);
  if (isMe) {
    $('#master').text('I am master');
  }
}

$('#start').click(function () {
  FB.child('running').set(true);
});

$('#stop').click(function () {
  FB.child('running').set(false);
});

$('#reset').click(function () {
  FB.child('running').set(false);
  FB.child('endtime').set(now() + RESET_SECONDS * 1000);
});

$('#master').click(function () {
  FB.child('master').set(myId);
  FB.child('master').onDisconnect().remove();
});

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
