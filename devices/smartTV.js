"use strict"

let ReadFile = require('../fileReader');
let schedule = require('node-schedule');

function SmartTv(initData) {
  this.deviceInitialData = initData;
  this.uploadFrequency = 10;
  this.isOn = 0;
  this.firmwareVersion = '1.0.1';
  this.serialNumber = initData.uniqueId;
  this.minVolume = 0;
  this.maxVolume = 30;
  this.randTimeMin = 20;
  this.randTimeMax = 90;
    this.telemetry = {
    volume: 15,
    serialNumber: initData.uniqueId
  };

  let flReader = new ReadFile("./config/config.json");
  let deviceConfig = JSON.parse(flReader.readFile());

  //individual settings for device
  if (this.deviceInitialData.hasOwnProperty('settings')&&
      deviceConfig.hasOwnProperty(this.deviceInitialData.settings)) {

    let individualSet = deviceConfig[this.deviceInitialData.settings];

    // set up uploading data frequency on the server
    if (individualSet.hasOwnProperty('uploadFrequency')) {
      this.uploadFrequency = individualSet.uploadFrequency;
    }else {
      this.uploadFrequency = deviceConfig.defaultConfig.uploadFrequency;
    }

    // set up channel paramters
    if (individualSet.hasOwnProperty('channels')) {
      this.arrayChannels = individualSet.channels;
    }else {
      this.arrayChannels = deviceConfig.defaultConfig.channels;
    }

    //set up a time schedule
    if (individualSet.hasOwnProperty('timeSchedule')) {
      let timeFrom = individualSet.timeSchedule.from.split(':');
      let timeTo = individualSet.timeSchedule.to.split(':');
      let turnOn = schedule.scheduleJob(`0 ${timeFrom[1]} ${timeFrom[0]} * * *`,() => {
        this.isOn = 1;
      });
      let turnOff = schedule.scheduleJob(`0 ${timeTo[1]} ${timeTo[0]} * * *`,() => {
        this.isOn = 0;
      });

      let currentTime = new Date().toLocaleTimeString('it-IT');
      if (individualSet.timeSchedule.from < currentTime) {
        if (individualSet.timeSchedule.to > currentTime) {
          this.isOn = 1;
        }
      }
    }else if (individualSet.hasOwnProperty('rndTimeGenerator')) {
      this.randTimeMin = individualSet.rndTimeGenerator.min;
      this.randTimeMax = individualSet.rndTimeGenerator.max;
      //set up a random turn on/off the device
      this.turnOnTimer();
    }else {
      this.randTimeMin = deviceConfig.defaultConfig.rndTimeGenerator.min;
      this.randTimeMin = deviceConfig.defaultConfig.rndTimeGenerator.max;
      //set up a random turn on/off the device
      this.turnOnTimer();
    }

    //set up volume parameters
    if (individualSet.hasOwnProperty('volume')) {
      this.minVolume = individualSet.volume.min;
      this.maxVolume = individualSet.volume.max;
      this.telemetry.volume = Math.floor(((this.maxVolume - this.minVolume) / 2));
    }

  // defaule settings with random changing for all the temetetry attributes
  }else {
    console.log(`Default settings will be used!`);
    this.arrayChannels = deviceConfig.defaultConfig.channels;
    this.randTimeMin = deviceConfig.defaultConfig.rndTimeGenerator.min;
    this.randTimeMax = deviceConfig.defaultConfig.rndTimeGenerator.max;
    //set up a random turn on/off the device
    this.turnOnTimer();
  }
}

  //generate serial number for TV
  SmartTv.prototype.randomSN = function() {
      return Math.floor(Math.random() * 1000);
  }

  // Generates new random value that is within 3% range from previous value
  SmartTv.prototype.genNextValue = function(prevValue) {
      let change = Math.random() < 0.7 ? 0 : 1;
      if (change) {
        if(prevValue == 0) prevValue = Math.floor(((this.maxVolume - this.minVolume) / 2));
        var value = prevValue + ((this.maxVolume - this.minVolume) * (Math.random() - 0.5)) * 0.05;
        value = Math.max(this.minVolume, Math.min(this.maxVolume, value));
        return Math.round(value * 10) / 10;
      }
      return prevValue;
  }

  //Generate randon integer between min and max
  SmartTv.prototype.getRndInteger = function(min, max) {
    return Math.round((Math.random() * (max - min) + min)*100)/100;
  }

  //turn on a tv in a random time
  SmartTv.prototype.turnOnTimer = function() {
    let rand = this.getRndInteger(this.randTimeMin,this.randTimeMax);
    console.log("Wait %d minutes for turn ON the TV", rand);
    setTimeout(() => {
      this.isOn = 1;
      console.log("Tv: %s, is active.", this.serialNumber);
      this.turnOffTimer();
    }, rand * 60 * 1000) //rand minutes
  }

  //turn off a tv in a random time
  SmartTv.prototype.turnOffTimer = function() {
    let rand = this.getRndInteger(this.randTimeMin,this.randTimeMax);
    console.log("Wait %d minutes for turn OFF the TV", rand);
    setTimeout(() => {
      this.isOn = 0;
      console.log("Tv: %s, is inactive.", this.serialNumber);
      this.turnOnTimer();
    }, rand * 60 * 1000)  //rand minutes
  }

  //upload tv telemetry to thingsboard
  SmartTv.prototype.updateTelemetry = function(){
    if (this.isOn) {
      this.telemetry.volume = this.genNextValue(this.telemetry.volume);
      this.telemetry.channel = this.arrayChannels.randomChannel(this.telemetry.channel);
      this.telemetry.isOn = 1;
      return this.telemetry;
    } else {
      // console.log("%i",this.isOn);
        let data = {};
        data.serialNumber = this.telemetry.serialNumber;
        data.isOn = this.isOn;
        return data;
    }
  }

  //randomly genereate active channel on tv
  Array.prototype.randomChannel = function(previous) {
    let change = Math.random() < 0.7 ? 0 : 1;
    if (change | !previous) {
      return this[Math.floor(Math.random() * this.length)];
    }else {
      return previous;
    }
  }

module.exports = SmartTv;
