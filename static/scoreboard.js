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
    $("#tossupClock").removeClass('btn-default').addClass('btn-danger')
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
$(function(){

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
});
