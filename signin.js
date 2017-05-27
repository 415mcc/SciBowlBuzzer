function addAlert (text) {
  $('<div class="alert alert-danger" role="alert">' + text + '</div>').prependTo('#signin');
}
function didwin(){

  $('#buzzer form button').removeClass('btn-danger btn-default').removeClass('btn-default').addClass('btn-success')

}
function lockout(){
  $('#buzzer form button').removeClass('btn-danger btn-success').addClass('btn-default')
}
function clear(){
  $('#buzzer form button').removeClass('btn-default btn-success').addClass('btn-danger')
}
// var ts = timesync.create({
//   peers: '',
//   interval: 10000
// });
$(function () {
 //var socket = io();
  var mostRecent=-1;
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
    if(mostRecent!=-1){
      console.log($('#roomID').val());
      console.log($('#name').val());
      console.log(mostRecent);
      // socket.emit('room id', $('#roomID').val());
      // $('#roomID').val('');
      // socket.emit('name', $('#name').val());
      // $('#name').val('');

      $("#signin").remove();
      $('#buzzer').show()

    } else {
      addAlert('You must choose a team.')
    }
    return false;
  });
  $('#buzzer form').submit(function(){
    // var now = new Date(ts.now());
    // console.log('now: ' + now.toISOString() + ' ms');
    return false;
  });

});
