"use strict"

let SmartTV = require('./devices/smartTV');
// Requires node.js and mqtt library installed.
var mqtt = require('mqtt');


// Default topics. See http://thingsboard.io/docs/reference/mqtt-api/ for more details.
const attributesTopic = 'devices/attributes';
const gatewayAttributesTopic = 'gateway/attributes';
const telemetryTopic = 'gateway/telemetry'; //gateway
const telemetryTopicOff = 'gateway/telemetry/off'; //gateway
const attributesRequestTopic = 'v1/devices/me/attributes/request/1';
const attributesResponseTopic = attributesRequestTopic.replace('request', 'response');


function ThingsBoard(deviceInitialData) {

  // Initialization of mqtt client using Thingsboard gateway
  var client = mqtt.connect({ host: 'localhost', port: 1883 }); //gateway

  //create a new device
  let device = {};
  switch (deviceInitialData.type) {
    case 'tv':
      device = new SmartTV(deviceInitialData);
      break;
    default:
      console.log(`Unrecognized device!`);
      return;
  }

  var appState;
  // Telemetry upload is once currentFrequency seconds;
  var currentFrequency = 10;
  var uploadInterval;

  // Triggers when client is successfully connected to the Thingsboard server
  client.on('connect', function () {
    console.log('Client connected with id: %s', deviceInitialData.uniqueId);

    // Upload firmware version and serial number as device attribute using 'v1/devices/me/attributes' MQTT topic
    client.publish(gatewayAttributesTopic, JSON.stringify({
      'serialNumber': device.serialNumber,
      'firmwareVersion': device.firmwareVersion,
    }));

    // Schedule OS stats upload
    console.log('Uploading %s device telemetry with interval %s (sec)...',device.serialNumber, device.uploadFrequency);
    uploadInterval = setInterval(uploadStats, device.uploadFrequency * 1000);
  });

  //generate random appstate
  function random() {
      return Math.floor(Math.random() * 1000);
  }

  // Reschedule of stats upload timer
  function rescheduleStatsUpload(uploadFrequency) {
    clearInterval(uploadInterval);
    currentFrequency = uploadFrequency;
    console.log('Device %s. Uploading device status with new interval %s (sec)...',device.serialNumber, currentFrequency);
    uploadInterval = setInterval(uploadStats, currentFrequency * 1000);
  }

  // Upload OS stats using 'v1/devices/me/telemetry' MQTT topic
  function uploadStats() {
    let data = device.updateTelemetry();
    console.log('Device %s. Publishing new data: %s',device.serialNumber, JSON.stringify(data));
    switch (data.isOn) {
      case 1:
        client.publish(telemetryTopic, JSON.stringify(data));
        break;
      case 0:
        client.publish(telemetryTopicOff, JSON.stringify(data));
        break;
      default:
        console.log("ERROR! Undefinied device status. Data can not be publish!");
    }
  }

}

module.exports = ThingsBoard;
