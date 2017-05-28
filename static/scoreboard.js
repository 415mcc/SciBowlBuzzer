var mainClockTime = 480;
var bonusClockTime = 20;
var tossupClockTime = 5;
var play = false;
var timerID;
var bonusTimerID;
var bonusIsTiming = false;
var tossupTimerID;
var tossupIsTiming = false;
var mainIsTiming = false;
var lockedout = false;
var lastWinner = null;
var players = {};
var teamscore = {0: 0, 1: 0};

function lockout () {
  lockedout = true;
  $('#lockout-btn')
    .removeClass('btn-default')
    .addClass('btn-primary')
    .prop('disabled', false);
}

function unlockout () {
  lockedout = false;
  $('#lockout-btn')
    .removeClass('btn-primary')
    .addClass('btn-default')
    .prop('disabled', true);
  if (lastWinner) lastWinner.removeClass('list-group-item-success');
}

function setTeamScore (team, score) {
  teamscore[team] = score;
  var id = team === 0 ? '#editable-a' : '#editable-b'
  $(id).text(score);
}

function mainDownSec(){
  if(mainClockTime>0){
    mainClockTime--;
    updateTime();
  }else{
    play = false;
    clearInterval(timerID);
    mainIsTiming = false;
    $('#mainClockPlay').show()
    $('#mainClockPlay').siblings().show()
    $('#mainClockPause').hide()

    mainClockTime = 480;
    $("#mainClock").text(Math.floor(mainClockTime/60)+":" + mainClockTime%60)
    updateTime();
  }
}
function bonusDownSec(){
  if(bonusClockTime>0){
    bonusClockTime--;
    $("#bonusClock").text(bonusClockTime);
  }else{
    $("#bonusClock").removeClass('btn-default').addClass('btn-danger')
  }
}
function tossupDownSec(){
  if(tossupClockTime>0){
    tossupClockTime--;
    $("#tossupClock").text(tossupClockTime);
  }else{
    $("#tossupClock").removeClass('btn-default').addClass('btn-danger');
  }
}
function updateTime(){
  if(mainClockTime%60<10){
    $("#mainClock").text(Math.floor(mainClockTime/60)+":" + '0'+ mainClockTime%60)
  } else {
    console.log(mainClockTime);
    $("#mainClock").text(Math.floor(mainClockTime/60)+":"+ mainClockTime%60)
  }
}
$(document).ready(function () {
  $('#a-inc-4').click(function () {
    setTeamScore(0, teamscore[0] + 4);
  });

  $('#a-inc-10').click(function () {
    setTeamScore(0, teamscore[0] + 10);
  });

  $('#b-inc-4').click(function () {
    setTeamScore(1, teamscore[1] + 4);
  });

  $('#b-inc-10').click(function () {
    setTeamScore(1, teamscore[1] + 10);
  });

  $('#editable-a').blur(function () {
    var num = Number($(this).text());
    if (num) {
      setTeamScore(0, num);
    } else {
      $(this).text(old);
    }
  });

  $('#editable-b').blur(function () {
    var num = Number($(this).text());
    if (num) {
      setTeamScore(1, num);
    } else {
      $(this).text(old);
    }
  });

  $('#mainClockPlay').click(function(e){
    var el = $(e.target)
    if(!mainIsTiming){
      console.log("play pressed");
      play = true;
      mainIsTiming = true;
      timerID = setInterval(mainDownSec, 1000);
    }
    $('#mainClockPause').show()
    el.siblings().hide()
    el.hide()

  });
  $('#mainClockPause').click(function(e){
    var el = $(e.target)
    play = false;
    clearInterval(timerID);
    mainIsTiming = false;
    $('#mainClockPlay').show()
    $('#mainClockPlay').siblings().show()
    el.hide()

  });
  $('#mainClockReset').click(function(e){
    mainClockTime = 480;
    $("#mainClock").text(Math.floor(mainClockTime/60)+":" + mainClockTime%60)
    updateTime();
  });
  $('#mainClockAddMin').click(function(e){
    mainClockTime = mainClockTime + 60;
    $("#mainClock").text(Math.floor(mainClockTime/60)+":" + mainClockTime%60)
    updateTime();
  });
  $('#mainClockSubMin').click(function(e){
    mainClockTime = mainClockTime - 60;
    updateTime();
  });
  $('#bonusClock').click(function(e){
    if(bonusIsTiming){
      $("#bonusClock").removeClass('btn-danger').addClass('btn-default')
      clearInterval(bonusTimerID)
      bonusClockTime = 20;
      $("#bonusClock").text(bonusClockTime);
      bonusIsTiming = false;
    } else {
      bonusIsTiming = true;
      bonusTimerID = setInterval(bonusDownSec, 1000);
    }
  });
  $('#tossupClock').click(function(e){
    if(tossupIsTiming){
      $("#tossupClock").removeClass('btn-danger').addClass('btn-default')
      clearInterval(tossupTimerID)
      tossupClockTime = 5;
      $("#tossupClock").text(tossupClockTime);
      tossupIsTiming = false;
    } else {
      tossupIsTiming = true;
      tossupTimerID = setInterval(tossupDownSec, 1000);
    }
  });

  $('#lockout-btn').click(function (e) {
    // TODO: implement pls
  });

  var socket = io();
  socket.on('connect', function () {
    socket.emit('new_game', null, function (room_id) {
      $('#roomID').text(room_id);
    });
  });

  socket.on('lockout', function (message) {
    lockout();
  });

  socket.on('winner', function (message) {
    // TODO: pls implement me
    console.log(message.uuid);
  });

  socket.on('new_user', function (message) {
    var obj = {name: message.name, team: message.team, score: 0};
    var teamlist = message.team === 0 ? '#members-a' : '#members-b';
    var div = $('<div>');
    var li = $('<li>')
      .addClass('list-group-item')
      .appendTo(teamlist)
      .append('<h4>' + message.name + '</h4>')
      .append(div);
    var editable = $('<span class="editable-score" contenteditable>0</span>');
    $('<span class="btn btn-xs btn-default">Score: </span>')
      .appendTo(div)
      .append(editable);
    editable.blur(function () {
      var team = message.team;
      var uuid = message.uuid;
      var old = players[uuid].score;
      var num = Number($(this).text());
      if (num) {
        players[uuid].score = num;
        setTeamScore(team, teamscore[team] + (num - old));
      } else {
        $(this).text(old);
      }
    });
    $('<span class="btn btn-xs btn-default">-4</span>')
      .appendTo(div)
      .click(function () {
        var team = message.team;
        var ed = editable;
        var uuid = message.uuid;
        players[uuid].score += -4;
        setTeamScore(team, teamscore[team] - 4);
        ed.text(players[uuid].score);
      });
    $('<span class="btn btn-xs btn-default">+4</span>')
      .appendTo(div)
      .click(function () {
        var team = message.team;
        var ed = editable;
        var uuid = message.uuid;
        players[uuid].score += 4;
        setTeamScore(team, teamscore[team] + 4);
        ed.text(players[uuid].score);
      });
    obj.elem = li;
    players[message.uuid] = obj;
  });

  socket.on('user_exit', function (message) {
    players[message.uuid].elem.remove();
  });

  socket.on('winner', function (message) {
    lastWinner = players[message.uuid].elem;
    lastWinner.addClass('list-group-item-success');
  });
});
