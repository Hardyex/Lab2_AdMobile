import React, {useCallback, useEffect, useState} from 'react';
import {
  ActivityIndicator,
  AppState,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Slider from '@react-native-community/slider';
import {
  canWriteSystemSettings,
  getBatteryPercentage,
  getSystemBrightness,
  openSystemBrightnessSettings,
  setSystemBrightness,
  subscribeToSystemBrightness,
} from './src/native/DeviceFeatures';

function getErrorMessage(error) {
  return error instanceof Error ? error.message : 'Something went wrong.';
}

// ─────────────────────────────────────────────────────────────
// Sun Circle – tick marks around a circle (Brightness screen)
// ─────────────────────────────────────────────────────────────
const SUN_SIZE = 170;
const TOTAL_TICKS = 36;
const tickIndexes = Array.from({length: TOTAL_TICKS}, (_, i) => i);

function SunCircle({percentage}) {
  return (
    <View style={sunStyles.wrapper}>
      {tickIndexes.map(i => {
        const angle = (i / TOTAL_TICKS) * 360;
        const isMain = i % 9 === 0;
        const isMed  = i % 3 === 0;
        return (
          <View
            key={i}
            style={[
              sunStyles.tickWrapper,
              {transform: [{rotate: `${angle}deg`}]},
            ]}>
            <View
              style={[
                sunStyles.tick,
                isMed  && sunStyles.tickMed,
                isMain && sunStyles.tickMain,
              ]}
            />
          </View>
        );
      })}
      <View style={sunStyles.innerCircle}>
        <Text style={sunStyles.pctText}>
          {percentage === null ? '--%' : `${percentage}%`}
        </Text>
      </View>
    </View>
  );
}

const sunStyles = StyleSheet.create({
  wrapper: {
    width: SUN_SIZE,
    height: SUN_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tickWrapper: {
    position: 'absolute',
    width: SUN_SIZE,
    height: SUN_SIZE,
    alignItems: 'center',
  },
  tick: {
    width: 1.5,
    height: 5,
    backgroundColor: '#d0d0d0',
    marginTop: 5,
    borderRadius: 1,
  },
  tickMed: {
    height: 7,
    backgroundColor: '#b0b0b0',
  },
  tickMain: {
    height: 12,
    width: 2,
    backgroundColor: '#888',
  },
  innerCircle: {
    width: SUN_SIZE - 44,
    height: SUN_SIZE - 44,
    borderRadius: (SUN_SIZE - 44) / 2,
    backgroundColor: '#ffffff',
    borderWidth: 1.5,
    borderColor: '#dedede',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pctText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2a2a2a',
  },
});

// ─────────────────────────────────────────────────────────────
// Battery Visual – dark card with fill rising from bottom
// ─────────────────────────────────────────────────────────────
const BAT_W = 116;
const BAT_H = 180;

function BatteryVisual({percentage}) {
  const fillH =
    percentage === null ? 0 : Math.round((BAT_H * percentage) / 100);

  const fillColor =
    percentage === null
      ? '#00E5C0'
      : percentage <= 20
      ? '#ff5c5c'
      : percentage <= 50
      ? '#ffcc00'
      : '#00E5C0';

  return (
    <View style={batStyles.card}>
      <Text style={batStyles.cardLabel}>Battery</Text>
      <View style={batStyles.terminal} />
      <View style={batStyles.body}>
        {percentage !== null && (
          <View style={[batStyles.fill, {height: fillH, backgroundColor: fillColor}]} />
        )}
        {percentage !== null && percentage > 5 && (
          <View style={[batStyles.shimmer, {bottom: fillH - 3}]} />
        )}
        <View style={batStyles.overlay}>
          {percentage === null ? (
            <ActivityIndicator color="#00E5C0" size="large" />
          ) : (
            <View style={batStyles.valueRow}>
              <Text style={batStyles.number}>{percentage}</Text>
              <Text style={batStyles.pct}>%</Text>
            </View>
          )}
        </View>
      </View>
    </View>
  );
}

const batStyles = StyleSheet.create({
  card: {
    backgroundColor: '#0d2020',
    borderRadius: 30,
    paddingTop: 22,
    paddingHorizontal: 30,
    paddingBottom: 30,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 14},
    shadowOpacity: 0.40,
    shadowRadius: 28,
    elevation: 14,
  },
  cardLabel: {
    color: '#7ab8b8',
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.8,
    marginBottom: 18,
  },
  terminal: {
    width: 30,
    height: 10,
    borderWidth: 2.5,
    borderColor: '#2e5a5a',
    borderBottomWidth: 0,
    borderTopLeftRadius: 5,
    borderTopRightRadius: 5,
    marginBottom: -2,
    zIndex: 2,
    backgroundColor: '#0d2020',
  },
  body: {
    width: BAT_W,
    height: BAT_H,
    borderWidth: 2.5,
    borderColor: '#2e5a5a',
    borderRadius: 14,
    overflow: 'hidden',
    position: 'relative',
  },
  fill: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  shimmer: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  number: {
    color: '#ffffff',
    fontSize: 44,
    fontWeight: '800',
    lineHeight: 52,
    includeFontPadding: false,
    letterSpacing: -1,
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: {width: 0, height: 2},
    textShadowRadius: 6,
  },
  pct: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 18,
    fontWeight: '700',
    marginTop: 12,
  },
});

// ─────────────────────────────────────────────────────────────
// Main App
// ─────────────────────────────────────────────────────────────
export default function App() {
  const [activeTab, setActiveTab]               = useState('battery');
  const [batteryPercentage, setBatteryPercentage] = useState(null);
  const [batteryError, setBatteryError]         = useState('');
  const [isRefreshing, setIsRefreshing]         = useState(false);
  const [brightness, setBrightness]             = useState(null);
  const [canModifySystemSettings, setCanModifySystemSettings] = useState(null);
  const [brightnessError, setBrightnessError]   = useState('');

  const refreshBattery = useCallback(async () => {
    setIsRefreshing(true);
    setBatteryError('');
    try {
      const value = await getBatteryPercentage();
      if (!Number.isInteger(value) || value < 0 || value > 100) {
        throw new Error('Android returned an invalid battery percentage.');
      }
      setBatteryPercentage(value);
    } catch (error) {
      setBatteryError(getErrorMessage(error));
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  const refreshBrightness = useCallback(async (clearError = true) => {
    try {
      const [value, canWrite] = await Promise.all([
        getSystemBrightness(),
        canWriteSystemSettings(),
      ]);
      if (!Number.isInteger(value) || value < 0 || value > 100) {
        throw new Error('Android returned an invalid system brightness percentage.');
      }
      setBrightness(value);
      setCanModifySystemSettings(canWrite);
      if (clearError) {
        setBrightnessError('');
      }
    } catch (error) {
      setBrightnessError(getErrorMessage(error));
    }
  }, []);

  useEffect(() => {
    refreshBattery();
    refreshBrightness();

    const brightnessSubscription = subscribeToSystemBrightness(value => {
      if (Number.isInteger(value) && value >= 0 && value <= 100) {
        setBrightness(value);
      }
    });
    const appStateSubscription = AppState.addEventListener('change', state => {
      if (state === 'active') {
        refreshBrightness();
      }
    });

    return () => {
      brightnessSubscription.remove();
      appStateSubscription.remove();
    };
  }, [refreshBattery, refreshBrightness]);

  const handleBrightnessChange = value => {
    const next = Math.round(value);
    setBrightness(next);
    setBrightnessError('');
    setSystemBrightness(next)
      .then(appliedValue => {
        if (
          Number.isInteger(appliedValue) &&
          appliedValue >= 0 &&
          appliedValue <= 100
        ) {
          setBrightness(appliedValue);
        }
      })
      .catch(error => {
        setBrightnessError(getErrorMessage(error));
        refreshBrightness(false);
      });
  };

  const handleOpenSystemSettings = async () => {
    setBrightnessError('');
    try {
      await openSystemBrightnessSettings();
    } catch (error) {
      setBrightnessError(getErrorMessage(error));
    }
  };

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="dark-content" backgroundColor="#f5f5f7" />

      {/* ── Screen body ── */}
      <View style={styles.body}>
        {activeTab === 'battery' ? (
          /* ── Battery Screen ── */
          <View style={styles.centered}>
            <BatteryVisual percentage={batteryPercentage} />
            {batteryError ? (
              <Text style={styles.error}>{batteryError}</Text>
            ) : null}
            <Pressable
              accessibilityRole="button"
              onPress={refreshBattery}
              disabled={isRefreshing}
              style={({pressed}) => [
                styles.refreshBtn,
                pressed      && {opacity: 0.75},
                isRefreshing && {opacity: 0.5},
              ]}>
              <Text style={styles.refreshBtnText}>
                {isRefreshing ? 'Refreshing…' : '↻  Refresh'}
              </Text>
            </Pressable>
          </View>
        ) : (
          /* ── Brightness Screen ── */
          <View style={styles.brightnessScreen}>
            <SunCircle percentage={brightness} />
            <Text style={styles.brightnessLabel}>System brightness</Text>
            <View style={styles.sliderRow}>
              <Text style={styles.sunIconDim}>☀</Text>
              <Slider
                accessibilityLabel="System screen brightness"
                style={styles.slider}
                minimumValue={0}
                maximumValue={100}
                step={1}
                value={brightness ?? 50}
                disabled={canModifySystemSettings !== true}
                onValueChange={handleBrightnessChange}
                minimumTrackTintColor="#2563eb"
                maximumTrackTintColor="#fca5a5"
                thumbTintColor="#2563eb"
              />
            </View>
            {canModifySystemSettings === false ? (
              <View style={styles.permissionNotice}>
                <Text style={styles.permissionText}>
                  Allow system settings access to change your phone brightness.
                </Text>
                <Pressable
                  accessibilityRole="button"
                  testID="grant-system-brightness-access"
                  onPress={handleOpenSystemSettings}
                  style={({pressed}) => [
                    styles.permissionButton,
                    pressed && {opacity: 0.75},
                  ]}>
                  <Text style={styles.permissionButtonText}>
                    Grant access
                  </Text>
                </Pressable>
              </View>
            ) : null}
            {brightnessError ? (
              <Text style={styles.error}>{brightnessError}</Text>
            ) : null}
          </View>
        )}
      </View>

      {/* ── Bottom Tab Bar ── */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={styles.tab}
          activeOpacity={0.7}
          onPress={() => setActiveTab('brightness')}>
          <Text style={[styles.tabText, activeTab === 'brightness' && styles.activeTabText]}>
            Brightness
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.tab}
          activeOpacity={0.7}
          onPress={() => setActiveTab('battery')}>
          <Text style={[styles.tabText, activeTab === 'battery' && styles.activeTabText]}>
            Battery
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────
// Global Styles
// ─────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#f5f5f7',
  },
  body: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 12,
  },
  /* Battery screen */
  centered: {
    alignItems: 'center',
    gap: 20,
  },
  refreshBtn: {
    backgroundColor: '#e8f0fe',
    paddingHorizontal: 28,
    paddingVertical: 11,
    borderRadius: 22,
    marginTop: 4,
  },
  refreshBtnText: {
    color: '#2563eb',
    fontWeight: '700',
    fontSize: 14,
    letterSpacing: 0.3,
  },
  /* Brightness screen */
  brightnessScreen: {
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 36,
    gap: 10,
  },
  brightnessLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#2a2a2a',
    marginTop: 6,
    marginBottom: 6,
  },
  sliderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 6,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
    gap: 8,
  },
  sunIconDim: {
    fontSize: 18,
    color: '#aaa',
  },
  slider: {
    flex: 1,
    height: 40,
  },
  permissionNotice: {
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 12,
    paddingTop: 6,
  },
  permissionText: {
    color: '#64748b',
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
  },
  permissionButton: {
    backgroundColor: '#2563eb',
    borderRadius: 18,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  permissionButtonText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  /* Shared */
  error: {
    color: '#dc2626',
    fontSize: 12,
    textAlign: 'center',
    paddingHorizontal: 16,
    marginTop: 4,
  },
  /* Tab bar */
  tabBar: {
    flexDirection: 'row',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#ddd',
    backgroundColor: '#ffffff',
    paddingTop: 14,
    paddingBottom: 28,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 2,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#b0b0b0',
  },
  activeTabText: {
    color: '#2563eb',
    fontWeight: '700',
  },
});
