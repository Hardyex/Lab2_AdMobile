package com.nativemoduleslab

import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.database.ContentObserver
import android.net.Uri
import android.os.BatteryManager
import android.os.Handler
import android.os.Looper
import android.provider.Settings
import android.util.Log
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.modules.core.DeviceEventManagerModule
import kotlin.math.roundToInt

class DeviceFeaturesModule(
  private val reactContext: ReactApplicationContext,
) : ReactContextBaseJavaModule(reactContext) {

  private val brightnessObserver =
    object : ContentObserver(Handler(Looper.getMainLooper())) {
      override fun onChange(selfChange: Boolean, uri: Uri?) {
        super.onChange(selfChange, uri)
        emitSystemBrightness()
      }
    }

  override fun getName(): String = "DeviceFeatures"

  override fun initialize() {
    super.initialize()
    reactContext.contentResolver.registerContentObserver(
      Settings.System.getUriFor(Settings.System.SCREEN_BRIGHTNESS),
      false,
      brightnessObserver,
    )
  }

  override fun invalidate() {
    reactContext.contentResolver.unregisterContentObserver(brightnessObserver)
    super.invalidate()
  }

  @ReactMethod
  fun addListener(eventName: String) = Unit

  @ReactMethod
  fun removeListeners(count: Double) = Unit

  @ReactMethod
  fun getBatteryPercentage(promise: Promise) {
    try {
      val batteryManager =
        reactContext.getSystemService(Context.BATTERY_SERVICE) as? BatteryManager
          ?: throw IllegalStateException("BatteryManager is unavailable")

      val batteryPercentage =
        batteryManager.getIntProperty(BatteryManager.BATTERY_PROPERTY_CAPACITY)
      if (batteryPercentage in 0..100) {
        promise.resolve(batteryPercentage)
        return
      }

      val batteryIntent =
        reactContext.registerReceiver(null, IntentFilter(Intent.ACTION_BATTERY_CHANGED))
          ?: throw IllegalStateException("Battery status is unavailable")
      val level = batteryIntent.getIntExtra(BatteryManager.EXTRA_LEVEL, -1)
      val scale = batteryIntent.getIntExtra(BatteryManager.EXTRA_SCALE, -1)
      if (level < 0 || scale <= 0) {
        throw IllegalStateException("Android returned an invalid battery level")
      }

      promise.resolve((level * 100f / scale).roundToInt().coerceIn(0, 100))
    } catch (exception: Exception) {
      promise.reject("E_BATTERY_UNAVAILABLE", "Could not read the device battery level", exception)
    }
  }

  @ReactMethod
  fun getSystemBrightness(promise: Promise) {
    try {
      promise.resolve(readSystemBrightness())
    } catch (exception: Exception) {
      promise.reject("E_BRIGHTNESS_READ_FAILED", "Could not read system brightness", exception)
    }
  }

  @ReactMethod
  fun canWriteSystemSettings(promise: Promise) {
    promise.resolve(Settings.System.canWrite(reactContext))
  }

  @ReactMethod
  fun openSystemBrightnessSettings(promise: Promise) {
    try {
      val intent =
        Intent(
          Settings.ACTION_MANAGE_WRITE_SETTINGS,
          Uri.parse("package:${reactContext.packageName}"),
        ).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
      reactContext.startActivity(intent)
      promise.resolve(true)
    } catch (exception: Exception) {
      promise.reject(
        "E_SETTINGS_SCREEN_UNAVAILABLE",
        "Could not open Android system settings permission page",
        exception,
      )
    }
  }

  @ReactMethod
  fun setSystemBrightness(percent: Double, promise: Promise) {
    if (!percent.isFinite()) {
      promise.reject("E_INVALID_BRIGHTNESS", "Brightness must be a finite number")
      return
    }

    if (!Settings.System.canWrite(reactContext)) {
      promise.reject(
        "E_WRITE_SETTINGS_PERMISSION",
        "Allow this app to modify system settings to change screen brightness",
      )
      return
    }

    try {
      val normalizedBrightness = (percent.coerceIn(0.0, 100.0) / 100.0).toFloat()
      val systemBrightness =
        (normalizedBrightness * MAX_SYSTEM_BRIGHTNESS).roundToInt()
      val updated =
        Settings.System.putInt(
          reactContext.contentResolver,
          Settings.System.SCREEN_BRIGHTNESS,
          systemBrightness,
        )
      if (!updated) {
        throw IllegalStateException("Android rejected the system brightness update")
      }
      promise.resolve(readSystemBrightness())
    } catch (exception: Exception) {
      promise.reject(
        "E_BRIGHTNESS_UPDATE_FAILED",
        "Could not update system brightness: ${exception.message ?: "unknown Android error"}",
        exception,
      )
    }
  }

  private fun readSystemBrightness(): Int {
    val value =
      Settings.System.getInt(
        reactContext.contentResolver,
        Settings.System.SCREEN_BRIGHTNESS,
      )
    return (value.coerceIn(0, MAX_SYSTEM_BRIGHTNESS) * 100.0 / MAX_SYSTEM_BRIGHTNESS).roundToInt()
  }

  private fun emitSystemBrightness() {
    try {
      val value = readSystemBrightness()
      reactContext
        .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
        .emit("systemBrightnessChanged", value)
    } catch (exception: Exception) {
      Log.e(NAME, "Could not publish changed system brightness", exception)
    }
  }

  private companion object {
    const val NAME = "DeviceFeatures"
    const val MAX_SYSTEM_BRIGHTNESS = 255
  }
}
