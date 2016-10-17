var Service, Characteristic;
var wpi = require('wiring-pi');

module.exports = function(homebridge){
    Service = homebridge.hap.Service;
    Characteristic = homebridge.hap.Characteristic;
    homebridge.registerAccessory("homebridge-pigaragedoor", "PiGarageDoor", PiGarageDoorAccessory);
}

function PiGarageDoorAccessory(log, config) {
    this.log = log;
    this.name = config["name"];
    this.statusPinNumber = config["status_pin_number"];
    this.togglePinNumber = config["toggle_pin_number"];

    wpi.setup('wpi');
    wpi.digitalWrite(this.togglePinNumber, wpi.HIGH);
    wpi.pinMode(this.togglePinNumber, wpi.OUTPUT);
    wpi.pinMode(this.statusPinNumber, wpi.INPUT);
    wpi.pullUpDnControl(this.statusPinNumber, wpi.PUP_UP);
}

PiGarageDoorAccessory.prototype.doorToggle = function(targetState, callback) {
    this.doorStatus(function(err, currentState) {
        if (currentState != targetState) {
            // toggle the garage door state
            wpi.digitalWrite(wpi.togglePinNumber, wpi.LOW);
            setTimeout(function() {
                wpi.digitalWrite(this.togglePinNumber, wpi.HIGH);
                this.log("Set state was successful: " + result);
                callback(null, targetState);
            }.bind(this), 1000);
        }
        else {
            callback(null, targetState);
        }
    }.bind(this));
}

PiGarageDoorAccessory.prototype.doorStatus = function(callback) {
    // get the state from the garage door
    var result = wpi.digitalRead(this.statusPinNumber);
    this.log("Get state was successful: " + result);
    callback(null, result == 0 ? Characteristic.CurrentDoorState.CLOSED : Characteristic.CurrentDoorState.OPEN);
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
