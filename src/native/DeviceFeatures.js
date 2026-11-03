import {DeviceEventEmitter, NativeModules} from 'react-native';

const {DeviceFeatures} = NativeModules;

export async function getBatteryPercentage() {
  if (!DeviceFeatures) {
    throw new Error('Android DeviceFeatures native module is not available.');
  }
  return DeviceFeatures.getBatteryPercentage();
}

export async function getSystemBrightness() {
  if (!DeviceFeatures) {
    throw new Error('Android DeviceFeatures native module is not available.');
  }
  return DeviceFeatures.getSystemBrightness();
}

export async function canWriteSystemSettings() {
  if (!DeviceFeatures) {
    throw new Error('Android DeviceFeatures native module is not available.');
  }
  return DeviceFeatures.canWriteSystemSettings();
}

export async function openSystemBrightnessSettings() {
  if (!DeviceFeatures) {
    throw new Error('Android DeviceFeatures native module is not available.');
  }
  return DeviceFeatures.openSystemBrightnessSettings();
}

export async function setSystemBrightness(percent) {
  if (!DeviceFeatures) {
    throw new Error('Android DeviceFeatures native module is not available.');
  }
  return DeviceFeatures.setSystemBrightness(percent);
}

export function subscribeToSystemBrightness(listener) {
  return DeviceEventEmitter.addListener('systemBrightnessChanged', listener);
}
