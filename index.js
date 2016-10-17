var Service, Characteristic;
var request = require("request");

module.exports = function(homebridge){
  Service = homebridge.hap.Service;
  Characteristic = homebridge.hap.Characteristic;
  homebridge.registerAccessory("homebridge-pigaragedoor", "PiGarageDoor", PiGarageDoorAccessory);
}

function PiGarageDoorAccessory(log, config) {
  this.log = log;
  this.name = config["name"];
  this.statusEndpoint = config["status_endpoint"];
  this.toggleEndpoint = config["toggle_endpoint"];
}

PiGarageDoorAccessory.prototype.doorToggle = function(targetState, callback) {
    this.doorStatus(function(err, currentState) {
        if (currentState != targetState) {
            // toggle the garage door state
            request.post({
                url: this.toggleEndpoint,
                json: true
            }, function(err, response, result) {
                if (!err && response.statusCode == 200) {
                    this.log("Set state was successful: " + result);
                    callback(null, targetState);
                }
                else {
                    this.log("Error '"+err+"' setting door state.");
                    callback(err);
                }
            }.bind(this));
        }
        else {
            callback(null, targetState);
        }
    }.bind(this));
}

PiGarageDoorAccessory.prototype.doorStatus = function(callback) {
    // get the state from the garage door
    request.get({
        url: this.statusEndpoint,
        json: true
    }, function(err, response, result) {
        if (!err && response.statusCode == 200) {
            this.log("Get state was successful: " + result);
            callback(null, result == "closed" ? Characteristic.CurrentDoorState.CLOSED : Characteristic.CurrentDoorState.OPEN);
        }
        else {
            this.log("Error '"+err+"' getting door state.");
            callback(err);
        }
    }.bind(this));
}

PiGarageDoorAccessory.prototype.getServices = function() {
    var garageDoorService = new Service.GarageDoorOpener("Garage Door Opener");

    garageDoorService
        .getCharacteristic(Characteristic.TargetDoorState)
        .on('set', this.doorToggle.bind(this))
        .on('get', this.doorStatus.bind(this));

    garageDoorService
        .getCharacteristic(Characteristic.CurrentDoorState)
        .on('get', this.doorStatus.bind(this));

    return [garageDoorService];
}
