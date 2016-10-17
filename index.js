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
    this.service = null;

    wpi.setup('wpi');
    wpi.digitalWrite(this.togglePinNumber, wpi.HIGH);
    wpi.pinMode(this.togglePinNumber, wpi.OUTPUT);
    wpi.pinMode(this.statusPinNumber, wpi.INPUT);
    wpi.pullUpDnControl(this.statusPinNumber, wpi.PUD_UP);
}

PiGarageDoorAccessory.prototype.doorMonitor = function(targetState, count) {
    if (this.service) {
        //monitor the garage door until the desired is reached or a minute passes
        this.doorStatus(function(err, currentState) {
            if (currentState != targetState) {
                if (count < 60) {
                    setTimeout(function() {
                        this.doorMonitor(targetState, count + 1);
                    }.bind(this), 1000);
                }
            }
            else {
                this.service.getCharacteristic(Characteristic.CurrentDoorState).setValue(currentState, undefined, 'internal');
            }
        }.bind(this));
    }
};

PiGarageDoorAccessory.prototype.doorToggle = function(targetState, callback, context) {
    if (context === 'internal') {
        if (callback) {
            callback();
        }
    }
    else {
        this.doorStatus(function(err, currentState) {
            if (currentState != targetState) {
                // toggle the garage door state
                wpi.digitalWrite(this.togglePinNumber, wpi.LOW);
                setTimeout(function() {
                    wpi.digitalWrite(this.togglePinNumber, wpi.HIGH);
                    this.log("Set state was successful: " + targetState);
                    if (callback) {
                        callback(null, targetState);
                    }
                    setTimeout(function() {
                        this.doorMonitor(targetState, 0);
                    }.bind(this), 1000);
                }.bind(this), 1000);
            }
            else {
                if (callback) {
                    callback(null, targetState);
                }
            }
        }.bind(this));
    }
}

PiGarageDoorAccessory.prototype.doorStatus = function(callback) {
    // get the state from the garage door
    var result = wpi.digitalRead(this.statusPinNumber);
    this.log("Get state was successful: " + result);
    if (callback) {
        callback(null, result == 0 ? Characteristic.CurrentDoorState.CLOSED : Characteristic.CurrentDoorState.OPEN);
    }
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

    this.service = garageDoorService;

    return [garageDoorService];
}
