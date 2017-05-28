var uuid = '';

function addAlert (text) {
  var elem = $('#signin')
  elem = elem.length != 0 ? elem : $('#buzzer');
  elem.prepend('<div class="alert alert-danger" role="alert">' + text + '</div>');
}
function didwin (){
  $('#buzzer form button').removeClass('btn-danger btn-default').addClass('btn-success').prop('disabled', true);
}
function lockout (){
  $('#buzzer form button').removeClass('btn-danger btn-success').addClass('btn-default').prop('disabled', true);
}
function clear (){
  $('#buzzer form button').removeClass('btn-default btn-success').addClass('btn-danger').prop('disabled', false);
}
var ts = timesync.create({
  server: '/timesync',
  interval: 10000
});
$(function () {
  var socket = io();
  var mostRecent = -1;
  $('#A').click(function(e){
    var el = $(e.target)
    mostRecent = 0
    el.removeClass('btn-default').addClass('btn-primary')
    el.siblings('.btn-primary').removeClass('btn-primary').addClass('btn-default')
  });
  $('#B').click(function(e){
    var el = $(e.target)
    mostRecent = 1
    el.removeClass('btn-default').addClass('btn-primary')
    el.siblings('.btn-primary').removeClass('btn-primary').addClass('btn-default')
  });
  $('#signin-form').submit(function(){
    $('#signin .alert').remove();
    if(mostRecent != -1){
      socket.emit('join_game',
        {room: $('#roomID').val(), name: $('#name').val(), team: mostRecent},
        function (result, new_uuid, lockedout) {
          if (result === 'success') {
            uuid = new_uuid;
            $("#signin").remove();
            $('#buzzer').show();
            if (lockedout) lockout();
          } else if (result === 'malformed') {
            addAlert('Check your inputs. Names must be less than 15 characters.');
          } else if (result === 'room_id') {
            addAlert('Cannot locate game with the given ID.');
          }
      });
    } else {
      addAlert('You must choose a team.');
    }
    return false;
  });
  $('#buzzer form').submit(function () {
    $('#buzzer .alert').remove();
    socket.emit('buzz', {time: ts.now()}, function (result) {
      if (result === 'malformed' || result === 'unknown_user') {
        addAlert('An error occured.');
      }
    });
    return false;
  });

  socket.on('lockout', function (message) {
    lockout();
    socket.emit('lock_res', {lockout_id: message.lockout_id});
  });

  socket.on('reset_lockout', function (message) {
    clear();
  });

  socket.on('winner', function (message) {
    if (message.uuid === uuid) didwin();
  });

  socket.on('game_over', function (message) {
    lockout();
    addAlert('Game over!');
  })
});
