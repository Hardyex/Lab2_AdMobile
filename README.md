# Practice Assignment 2 — Battery and Screen Brightness

This Android-only React Native app was created with React Native 0.87.1 and Kotlin. It implements both exercises using one manually registered Android Native Module.

## Features

- **Battery:** reads the real battery capacity using Android `BatteryManager`. If that API returns an unsupported value, it falls back to Android's current battery status broadcast. The value is refreshed on launch or with the Refresh button; no background polling is used.
- **Brightness:** a 0–100 slider updates the app window immediately through `WindowManager.LayoutParams.screenBrightness`. The initial app-window value is 50%. This does not change Android's system-wide brightness and does not request `WRITE_SETTINGS`.

## Native Module flow

```text
App.js -> NativeModules.DeviceFeatures -> @ReactMethod
       -> BatteryManager / currentActivity.window
       <- Promise result or a visible error
```

`DeviceFeaturesModule` extends `ReactContextBaseJavaModule`; `getName()` returns `DeviceFeatures`, matching the JavaScript `NativeModules.DeviceFeatures` name. `NativeFeaturesPackage` exposes the module, and `MainApplication` adds that package to the React package list. No Native Activity is needed because both controls stay on the React Native screen.

The project keeps the template's New Architecture setting enabled. These exercises use the traditional `ReactContextBaseJavaModule`/`ReactPackage` bridge and its legacy-module interoperability; they do not define a TurboModule or use Codegen.

## Main implementation files

- `App.js` — UI, local state, refresh and slider handlers.
- `src/native/DeviceFeatures.js` — checked JavaScript access to the native module.
- `android/app/src/main/java/com/nativemoduleslab/DeviceFeaturesModule.kt` — battery lookup and window-brightness update.
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

Start an Android emulator in Android Studio or connect and authorize an Android device before running the app. A native module or native dependency change requires rebuilding/reinstalling the Android app; reloading JavaScript alone is not enough.

## Verify

```powershell
npm test -- --runInBand
npm run lint
cd .\android
.\gradlew.bat assembleDebug
```

The debug APK is written to `android\app\build\outputs\apk\debug\app-debug.apk`. Verify battery against the device/emulator battery status, refresh it, then drag the slider and confirm only the app window changes brightness.

If `NativeModules.DeviceFeatures` is unavailable, confirm `NativeFeaturesPackage` is added in `MainApplication.kt`, then rebuild and reinstall with `npm run android`. If battery lookup fails, the app shows the native error instead of substituting a made-up percentage. This project targets Android; iOS does not include this module.
