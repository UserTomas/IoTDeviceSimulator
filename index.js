"use strict"

let ImputFile = require('./fileReader');
let ThingsBoard = require('./thingsBoard');

// Reads the access token from arguments
const setupFile = process.argv[2];


let imput = new ImputFile(setupFile);
let devices = imput.readFile();
if (devices === 1) {
  console.log('Exited!');
} else {
    let jsonData = JSON.parse(devices);
    for (var i = 0; i < jsonData.devices.length; i++) {
      let device = jsonData.devices[i];

      // console.log("device: %s", device.accessToken);
      let tb = new ThingsBoard(device);
    }
}


// Catches ctrl+c event
process.on('SIGINT', function () {
    console.log();
    console.log('Exited!');
    process.exit(2);
});

process.on('ENOENT', function () {
  console.log("chyba suboru");
  process.exit(1);
});

// Catches uncaught exceptions
process.on('uncaughtException', function (e) {
    console.log('Uncaught Exception...');
    console.log(e.stack);
    process.exit(99);
});
