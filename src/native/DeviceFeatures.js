import {NativeModules} from 'react-native';

const {DeviceFeatures} = NativeModules;

export async function getBatteryPercentage() {
  if (!DeviceFeatures) {
    throw new Error('Android DeviceFeatures native module is not available.');
  }
  return DeviceFeatures.getBatteryPercentage();
}

export async function setWindowBrightness(percent) {
  if (!DeviceFeatures) {
    throw new Error('Android DeviceFeatures native module is not available.');
  }
  return DeviceFeatures.setWindowBrightness(percent);
}
