import React from 'react';
import ReactTestRenderer, {act} from 'react-test-renderer';
import {DeviceEventEmitter, Text, TouchableOpacity} from 'react-native';
import App from '../App';
import {
  canWriteSystemSettings,
  getBatteryPercentage,
  getSystemBrightness,
  openSystemBrightnessSettings,
  setSystemBrightness,
} from '../src/native/DeviceFeatures';

jest.mock('../src/native/DeviceFeatures', () => ({
  canWriteSystemSettings: jest.fn(),
  getBatteryPercentage: jest.fn(),
  getSystemBrightness: jest.fn(),
  openSystemBrightnessSettings: jest.fn(),
  setSystemBrightness: jest.fn(),
  subscribeToSystemBrightness: listener =>
    require('react-native').DeviceEventEmitter.addListener(
      'systemBrightnessChanged',
      listener,
    ),
}));

jest.mock('@react-native-community/slider', () => {
  const ReactNative = require('react-native');
  return function MockSlider(props) {
    const MockReact = require('react');
    return MockReact.createElement(ReactNative.View, {
      testID: 'brightness-slider',
      disabled: props.disabled,
      onValueChange: props.onValueChange,
    });
  };
});

test('shows battery data and keeps the slider synchronized with system brightness', async () => {
  getBatteryPercentage.mockResolvedValue(81);
  getSystemBrightness.mockResolvedValue(50);
  canWriteSystemSettings.mockResolvedValue(true);
  setSystemBrightness.mockResolvedValue(true);

  let renderer;
  await act(async () => {
    renderer = ReactTestRenderer.create(<App />);
  });

  const textContents = () =>
    renderer.root
      .findAllByType(Text)
      .map(node => React.Children.toArray(node.props.children).join(''));

  expect(textContents()).toContain('81');
  expect(getSystemBrightness).toHaveBeenCalled();

  await act(async () => {
    renderer.root.findAllByType(TouchableOpacity)[0].props.onPress();
  });

  await act(async () => {
    renderer.root
      .findByProps({testID: 'brightness-slider'})
      .props.onValueChange(72);
  });

  expect(textContents()).toContain('72%');
  expect(setSystemBrightness).toHaveBeenLastCalledWith(72);

  await act(async () => {
    DeviceEventEmitter.emit('systemBrightnessChanged', 35);
  });

  expect(textContents()).toContain('35%');

  await act(async () => {
    renderer.unmount();
  });
});

test('keeps a full battery percentage together on one line', async () => {
  getBatteryPercentage.mockResolvedValue(100);
  getSystemBrightness.mockResolvedValue(50);
  canWriteSystemSettings.mockResolvedValue(true);

  let renderer;
  await act(async () => {
    renderer = ReactTestRenderer.create(<App />);
  });

  const textContents = renderer.root
    .findAllByType(Text)
    .map(node => React.Children.toArray(node.props.children).join(''));

  expect(textContents).toContain('100');
  expect(textContents).toContain('%');

  await act(async () => {
    renderer.unmount();
  });
});

test('asks for system settings access before enabling brightness control', async () => {
  getBatteryPercentage.mockResolvedValue(81);
  getSystemBrightness.mockResolvedValue(35);
  canWriteSystemSettings.mockResolvedValue(false);
  openSystemBrightnessSettings.mockResolvedValue(true);

  let renderer;
  await act(async () => {
    renderer = ReactTestRenderer.create(<App />);
  });

  await act(async () => {
    renderer.root.findAllByType(TouchableOpacity)[0].props.onPress();
  });

  expect(
    renderer.root.findByProps({testID: 'brightness-slider'}).props.disabled,
  ).toBe(true);

  await act(async () => {
    renderer.root
      .findByProps({testID: 'grant-system-brightness-access'})
      .props.onPress();
  });

  expect(openSystemBrightnessSettings).toHaveBeenCalled();

  await act(async () => {
    renderer.unmount();
  });
});
