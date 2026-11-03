# Practice Assignment 2 — Battery and Screen Brightness

This Android-only React Native app was created with React Native 0.87.1 and Kotlin. It implements both exercises using one manually registered Android Native Module.

## Features

- **Battery:** reads the real battery capacity using Android `BatteryManager`. If that API returns an unsupported value, it falls back to Android's current battery status broadcast. The value is refreshed on launch or with the Refresh button; no background polling is used.
- **Brightness:** a 0–100 slider reads and updates Android's system brightness. The displayed percentage follows changes made from Android Quick Settings while the app is open. Changing system brightness requires the user to grant the app Android's special “Modify system settings” access; the app opens the relevant system settings page and refreshes its permission and value when resumed.
- Brightness reads and writes Android's `screen_brightness` setting (0–255), then converts it to the nearest whole percent for the app slider. Android's float brightness key may be read-only or out of sync on some devices, so the integer setting is used consistently for reliable updates and display. The percentage represents Android's normalized brightness value; actual perceived brightness and the system slider curve can vary by device and display.

## Native Module flow

```text
App.js -> NativeModules.DeviceFeatures -> @ReactMethod
       -> BatteryManager / Settings.System / ContentObserver
       <- Promise result or a visible error
```

`DeviceFeaturesModule` extends `ReactContextBaseJavaModule`; `getName()` returns `DeviceFeatures`, matching the JavaScript `NativeModules.DeviceFeatures` name. `NativeFeaturesPackage` exposes the module, and `MainApplication` adds that package to the React package list. No Native Activity is needed because both controls stay on the React Native screen.

The project keeps the template's New Architecture setting enabled. These exercises use the traditional `ReactContextBaseJavaModule`/`ReactPackage` bridge and its legacy-module interoperability; they do not define a TurboModule or use Codegen.

## Main implementation files

- `App.js` — UI, local state, refresh and slider handlers.
- `src/native/DeviceFeatures.js` — checked JavaScript access to the native module.
- `android/app/src/main/java/com/nativemoduleslab/DeviceFeaturesModule.kt` — battery lookup, system-brightness access, and brightness-change events.
- `android/app/src/main/java/com/nativemoduleslab/NativeFeaturesPackage.kt` — manual module package.
- `android/app/src/main/java/com/nativemoduleslab/MainApplication.kt` — package registration.

## Run on Windows

From the workspace root, open PowerShell:

```powershell
cd .\Lab2_Mobile\NativeModulesLab
adb devices
npm start
```

Keep Metro running. In a second PowerShell window:

```powershell
cd .\Lab2_Mobile\NativeModulesLab
npm run android
```

Start an Android emulator in Android Studio or connect and authorize an Android device before running the app. On the Brightness tab, grant “Modify system settings” when prompted. A native module or native dependency change requires rebuilding/reinstalling the Android app; reloading JavaScript alone is not enough.

## Verify

```powershell
npm test -- --runInBand
npm run lint
cd .\android
.\gradlew.bat assembleDebug
```

The debug APK is written to `android\app\build\outputs\apk\debug\app-debug.apk`. Verify battery against the device/emulator battery status, refresh it, then change system brightness from the app slider and Android Quick Settings; confirm the app slider percentage stays synchronized.

If `NativeModules.DeviceFeatures` is unavailable, confirm `NativeFeaturesPackage` is added in `MainApplication.kt`, then rebuild and reinstall with `npm run android`. If system brightness cannot be changed, grant the app “Modify system settings” in Android settings. If battery lookup fails, the app shows the native error instead of substituting a made-up percentage. This project targets Android; iOS does not include this module.
