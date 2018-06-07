Device traffic simulator.
Application simulate IoT Devices connected to network.
Data generate by devices are forwarded to ThingsBoard IoT platform.

## Requirements

Tested with: ThingsBoard gateway v1.4.0
             ThingsBoard v2.0


## Installation

Install thingsboard gateway on your local machine
Configure both thingsBoard gateway and demo.ThingsBoard.io


## Basic Usage

Project consist of two separate applications.
"deviceGenerator" generate json with devices parameters. This file is necessarily for running main application. Device generator create new setup file according to "deviceGenerator.toml" file, where are stored all the settings.
```sh
$ node deviceGenerator.js
```

Run application from command line with
```sh
$ npm start setup.json
```

## Configuration

Top level: setup.json
Contains list of required devices.

required:
- `"devices" list of devices. All devices are nested into array`
- `"type" should be set as "tv".`
- `"uniqueId" unique device identificator`

optional:
- "settings" a name of additional device settings. Additional settings are loaded from config.json file with all others available settings. If required setting is not present in config.json file Default configuration will be used


Device config level: config.json
Contains list of all possible configuration options. Only "defaultConfig" has to implement "channels" option. For every other configurations are all the options except "name" optional. If feature is missing in additional configuration default configuration option is used

required:
- `"name" name of a configuration type. Config.json file has to contains defaultConfig type`
- `"channels" list of possible channels available for the device`

optional:
- "uploadFrequency" number how often is a new telemetry forwarded to gateway. If missing, default frequency is 10seconds
- "timeSchedule" two times represents "from" to "to" when a device is active. Time schedule is superior to "rndTimeGenerator". 24 hours format should be used.
- "rndTimeGenerator" two numbers "min" and "max" represent time in minutes used for generate random time when a device is active/deactive. If missing, default minimum time is 20minutes and maximum time 90 minutes set up by application.
- "volume" possible volume options. "min" and "max". Volume is randomly changing over the time. If missing default minimum is 0 and maximum 30.

## Example

device setup file
```json
{
  "devices": [
    {"type": "tv","uniqueId":"TV-015"},
    {"type": "tv","uniqueId":"TV-016","settings":"hallwayConfig"},
    {"type": "tv","uniqueId":"TV-017","settings":"defaultConfig"}
  ]
}
```

Configuration file
```json
{
	"defaultConfig": {
    "uploadFrequency": 10,
		"channels": ["channel1", "channel2", "channel3", "YouTube", "Netflix", "radio", "NAS", "HDMI"],
		"rndTimeGenerator": {
			"min": 30,
			"max": 90
		}
	},
	"hallwayConfig": {
    "uploadFrequency": 2,
		"channels": ["HDMI_hallway"],
		"timeSchedule": {
			"from": "08:00",
			"to": "19:00"
		},
		"volume": {
			"min": 0,
			"max": 10
		}
	}
}
```
