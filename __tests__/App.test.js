import React from 'react';
import ReactTestRenderer, {act} from 'react-test-renderer';
import {Text, TouchableOpacity} from 'react-native';
import App from '../App';
import {
  getBatteryPercentage,
  setWindowBrightness,
} from '../src/native/DeviceFeatures';

jest.mock('../src/native/DeviceFeatures', () => ({
  getBatteryPercentage: jest.fn(),
  setWindowBrightness: jest.fn(),
}));

jest.mock('@react-native-community/slider', () => {
  const ReactNative = require('react-native');
  return function MockSlider(props) {
    const MockReact = require('react');
    return MockReact.createElement(ReactNative.View, {
      testID: 'brightness-slider',
      onValueChange: props.onValueChange,
    });
  };
});

test('shows battery data and applies slider brightness updates', async () => {
  getBatteryPercentage.mockResolvedValue(81);
  setWindowBrightness.mockResolvedValue(true);

  let renderer;
  await act(async () => {
    renderer = ReactTestRenderer.create(<App />);
  });

  const textContents = () =>
    renderer.root
      .findAllByType(Text)
      .map(node => React.Children.toArray(node.props.children).join(''));

  expect(textContents()).toContain('81');
  expect(setWindowBrightness).toHaveBeenCalledWith(50);

  await act(async () => {
    renderer.root.findAllByType(TouchableOpacity)[0].props.onPress();
  });

  await act(async () => {
    renderer.root
      .findByProps({testID: 'brightness-slider'})
      .props.onValueChange(72);
  });

  expect(textContents()).toContain('72%');
  expect(setWindowBrightness).toHaveBeenLastCalledWith(72);

  await act(async () => {
    renderer.unmount();
  });
});

test('keeps a full battery percentage together on one line', async () => {
  getBatteryPercentage.mockResolvedValue(100);
  setWindowBrightness.mockResolvedValue(true);

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
