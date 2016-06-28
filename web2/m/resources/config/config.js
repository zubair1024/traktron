App = {};
/**
 * Set the current app settings
 * @type {{map: {mapControlOption: boolean}, actionsheet: {viewOnMap: boolean, sendCommands: boolean, viewGeofences: boolean}}}
 */
App.controls = {
    'map'        : {
        'mapControlOption': true
    },
    'actionsheet': {
        'viewOnMap'    : true,
        'sendCommands' : true,
        'viewGeofences': true
    },
    'driver'     : {
        'options': false
    }
};
/**
 * Load the domainDataViewModel for Caesar
 * @type {{canbusfleetvehicle: {details: {domainObjectValues: string[]}}, generator: {details: {domainObjectValues: string[]}}, pump: {details: {domainObjectValues: string[]}}, driver: {details: {domainObjectValues: string[]}}}}
 */
App.domainDataViewModel = {
    'canbusfleetvehicle': {
        'details': {
            'domainObjectValues': [
                'geoReference',
                'position',
                //'altitude',
                //'geofenceStatus',
                'geofence',
                //'temperature1',
                //'temperature2',
                //'temperature1Range',
                //'temperature2Range',
                //'temperature1Status',
                //'temperature2Status',
                'assetGroup',
                'category',
                'manufacturer',
                'model',
                'plateNumber',
                'yearOfManufacture',
                'internalNumber',
                'registrationCountry',
                'registrationExpiry',
                'remoteTerminalNames',
                'remoteCommunicatorNames',
                //'comments',
                //'costCenterId',
                'driver',
                'driverMobile',
                'driverImage',
                //'panicStatus',
                //'buttonStatus',
                //'textMessage',
                //'fixedOperator',
                'speed',
                'speedLimit',
                'speedingStatus',
                'lastJourneyMaximumSpeedCan',
                'lastJourneyMaximumSpeedGps',
                'odometerCan',
                'odometerGps',
                'lastReportTime',
                'journeyDuration',
                'fuelConsumed',
                'fuelType',
                'journeyCo2',
                'currentFuel',
                'assetStatus',
                'asset',
                //'serviceInterval',
                //'status',
                'supplyVoltage',
                //'timeOfWeek',
                'engineCoolantTemperature',
                //'lastServiceValue',
                'serviceStatus',
                'alarmStatus',
                'currentOdometer',
                'lastServiceOdometer',
                'nextServiceOdometer',
                'location',
                'maximumEngineCoolantTc',
                //'troubleCodesNumber',
                //'lastPendingTroubleCode',
                //'lastStoredTroubleCode',
                //'faultAlert',
                'mainBatteryVoltage',
                'acceleratorPedalThreshold',
                'engineRpmThreshold',
                'harshAccelerationThreshold',
                'harshDecelerationThreshold'
            ]
        }
    },
    'generator'         : {
        'details': {
            'domainObjectValues': [
                'geoReference',
                'position',
                'assetGroup',
                'category',
                'manufacturer',
                'model',
                'yearOfManufacture',
                'description',
                'hourlyAverageFuelConsumption',
                //'fuelType',
                'remoteTerminalNames',
                'remoteCommunicatorNames',
                //'comments',
                'lastEngineCoolantTemperature',
                'lastEngineRPM',
                'lastGeneratorFrequency',
                'lastEngineTorque',
                'lastAvgLineToLineVoltage',
                'lastAvgLineToNeutralVoltage',
                'lastAvgAcRmsCurrent',
                'lastPhaseABLineToLineVoltage',
                'lastPhaseALineToNeutralVoltage',
                'lastPhaseAFrequency',
                'lastPhaseACurrent',
                'lastPhaseBCLineToLineVoltage',
                'lastPhaseBLineToNeutralVoltage',
                'lastPhaseBFrequency',
                'lastPhaseBCurrent',
                'lastPhaseCALineToLineVoltage',
                'lastPhaseCLineToNeutralVoltage',
                'lastPhaseCFrequency',
                'lastPhaseCCurrent',
                //'lastGeneratorDiagnosticStatus',
                'engineOilPressure',
                'lastPowerOutput',
                'lastGeneratorFrequencyStatus',
                'lastPowerOutputCapacityStatus',
                'combinedEngineRuntime'
            ]
        }
    },
    'pump'              : {
        'details': {
            'domainObjectValues': [
                'position',
                'geoReference',
                'assetGroup',
                'manufacturer',
                'model',
                'yearOfManufacture',
                'description',
                'averageFuelConsumption',
                //'fuelType',
                'remoteTerminalNames',
                'remoteCommunicatorNames',
                //'comments',
                'category',
                'lastAcceleratorPedalPosition',
                'lastAverageFuelConsumption',
                'lastDriverDemandEngineTorque',
                'lastEngineCoolantTemperature',
                'lastEngineRPM',
                'lastEngineDemandTorque',
                'lastEngineFuelTemperature',
                'lastEngineLoad',
                'lastEngineOilTemperature',
                'lastEngineTorque',
                'lastLifetimeEngineHours',
                'lastStarvationStatus',
                'lastTotalFuelConsumption',
                'combinedEngineRuntime'
            ]
        }
    },
    'driver'            : {
        'details': {
            'domainObjectValues': [
                //'fixedAsset',
                'driverId',
                'driverSiteId',
                'assetGroup',
                'fullName',
                'nationality',
                'mobile',
                'address',
                'driverImage',
                'birthday',
                'designation',
                'contractor',
                'employeeNo',
                'licenseNo',
                'licenseOrigin',
                'issueDate',
                'expiryDate',
                'licenseDocument',
                'authorizedVehicles',
                'vehicleCategories',
                'driverScoreStatus',
                'lastUpdateTimestamp'
            ]
        }
    }
};

/**
 * Application specific icons
 * @type {{[assetStateValue.normal]: {url: string, description: string}, [assetStateValue.notOperational]: {url: string, description: string}, [assetStateValue.notMoving]: {url: string, description: string}, [assetStateValue.idling]: {url: string, description: string}, [alarmStateValue.active]: {url: string, description: string}, [alarmStateValue.acknowledged]: {url: string, description: string}, [alarmStateValue.normal]: {url: string, description: string}, [driverScoreStateValue.0]: {url: string, description: string}, [driverScoreStateValue.1]: {url: string, description: string}, [driverScoreStateValue.2]: {url: string, description: string}, [driverScoreStateValue.3]: {url: string, description: string}, [driverScoreStateValue.4]: {url: string, description: string}, [thresholdValue.good]: {url: string, description: string}, [thresholdValue.fair]: {url: string, description: string}, [thresholdValue.bad]: {url: string, description: string}, [thresholdValue.dangerous]: {url: string, description: string}}}
 */
App.icons = {
    'assetStateValue.normal'        : {url: '../images/assetstatus/normal.png', description: 'Normal'},
    'assetStateValue.notOperational': {url: '../images/assetstatus/notoperational.png', description: 'Not Operation'},
    'assetStateValue.notMoving'     : {url: '../images/assetstatus/notmoving.png', description: 'Not Moving'},
    'assetStateValue.idling'        : {url: '../images/assetstatus/idling.png', description: 'Idling'},
    'alarmStateValue.active'        : {url: '../images/alarmstatus/active.png', description: 'Active'},
    'alarmStateValue.acknowledged'  : {url: '../images/alarmstatus/acknowledged.png', description: 'Acknowledged'},
    'alarmStateValue.normal'        : {url: '../images/alarmstatus/normal.png', description: 'Normal'},
    'driverScoreStateValue.0'       : {url: '../images/threshold/good.png', description: 'Good'},
    'driverScoreStateValue.1'       : {url: '../images/threshold/fair.png', description: 'Fair'},
    'driverScoreStateValue.2'       : {url: '../images/threshold/bad.png', description: 'Bad'},
    'driverScoreStateValue.3'       : {url: '../images/threshold/dangerous.png', description: 'Dangerous'},
    'driverScoreStateValue.4'       : {url: '../images/threshold/none.png', description: 'None'},
    'thresholdValue.good'           : {url: '../images/threshold/good.png', description: 'Good'},
    'thresholdValue.fair'           : {url: '../images/threshold/fair.png', description: 'Fair'},
    'thresholdValue.bad'            : {url: '../images/threshold/bad.png', description: 'Bad'},
    'thresholdValue.dangerous'      : {url: '../images/threshold/dangerous.png', description: 'Dangerous'}
};