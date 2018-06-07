"use strict"

const fs = require('fs');
const toml = require('toml');


const config = toml.parse(fs.readFileSync('./config/deviceGenerator.toml', 'utf-8'));
// const numberOfDevices = config.numberOfDevices;

let fileName = config.fileName;
let number = 0;
let list = [];
let deviceList = {
  devices: list
}

for (let i = 0; i < config.devices.length; i++) {
  let count = config.devices[i].number;
  for (var j = 0; j < count; j++) {
    let device = {
      type: "tv",
      uniqueId: "",
      settings: "defaultConfig"
    }
    device.uniqueId = `${config.devices[i].name}-${number}`;
    number ++;
    if (config.devices[i].settings) {
      device.settings = config.devices[i].settings;
    }
    list.push(device);
  }
}

fs.writeFile(`./config/${ fileName }.json`, JSON.stringify(deviceList), function(err) {
  if (err) throw err;
  console.log('Saved!');
});
