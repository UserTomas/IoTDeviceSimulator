"use strict"

let SmartTV = require('./devices/smartTV');


// Requires node.js and mqtt library installed.
var mqtt = require('mqtt');


const thingsboardHost = "demo.thingsboard.io";


// Default topics. See http://thingsboard.io/docs/reference/mqtt-api/ for more details.
const attributesTopic = 'devices/attributes';
const gatewayAttributesTopic = 'gateway/attributes';
// const telemetryTopic = 'v1/devices/me/telemetry'; //ThingsBoard directly
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

  // client.on('message', function (topic, message) {
  //   if (topic === attributesTopic) {
  //     // Process attributes update notification
  //     console.log('Received attribute update notification: %s', message.toString());
  //     var data = JSON.parse(message);
  //     if (data.uploadFrequency && data.uploadFrequency != currentFrequency) {
  //       // Reschedule upload using new frequency
  //       rescheduleStatsUpload(data.uploadFrequency);
  //     }
  //     if (data.latestFirmwareVersion && data.latestFirmwareVersion != device.firmwareVersion) {
  //       // Received new upload frequency configuration
  //       console.log('Device %s. New firmware version is available: %s',data.serialNumber, data.latestFirmwareVersion);
  //     }
  //   }
  //   } else if (topic === attributesResponseTopic) {
  //     // Process response to attributes request
  //     console.log('Received response to attribute request: %s', message.toString());
  //     var data = JSON.parse(message);
  //     if (data.client && data.client.appState) {
  //       appState = data.client.appState;
  //       console.log('Restore app state to: %s', appState);
  //     } else {
  //       appState = random();
  //       console.log('This is first application launch. Going to publish random application state: %s', appState);
  //       client.publish(attributesTopic, JSON.stringify({'appState': appState}));
  //     }
  //     if (data.shared) {
  //       if (data.shared.uploadFrequency && data.shared.uploadFrequency != currentFrequency) {
  //         // Received new upload frequency configuration
  //         rescheduleStatsUpload(data.shared.uploadFrequency);
  //       }
  //       if (data.shared.latestFirmwareVersion && data.shared.latestFirmwareVersion != device.firmwareVersion) {
  //         // Received new upload frequency configuration
  //         console.log('Device %s. New firmware version is available: %s',data.serialNumber, data.shared.latestFirmwareVersion);
  //       }
  //     }
  //   }
  // })

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
