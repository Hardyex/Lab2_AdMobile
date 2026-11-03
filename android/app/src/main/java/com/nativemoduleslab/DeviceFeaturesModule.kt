package com.nativemoduleslab

import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.os.BatteryManager
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import kotlin.math.roundToInt

class DeviceFeaturesModule(
  private val reactContext: ReactApplicationContext,
) : ReactContextBaseJavaModule(reactContext) {

  override fun getName(): String = "DeviceFeatures"

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
  fun setWindowBrightness(percent: Double, promise: Promise) {
    if (!percent.isFinite()) {
      promise.reject("E_INVALID_BRIGHTNESS", "Brightness must be a finite number")
      return
    }

    val activity =
      reactContext.currentActivity
        ?: run {
          promise.reject("E_ACTIVITY_UNAVAILABLE", "The current Android Activity is unavailable")
          return
        }

    val brightness = percent.coerceIn(0.0, 100.0).toFloat() / 100f
    activity.runOnUiThread {
      try {
        val layoutParams = activity.window.attributes
        layoutParams.screenBrightness = brightness
        activity.window.attributes = layoutParams
        promise.resolve(true)
      } catch (exception: Exception) {
        promise.reject("E_BRIGHTNESS_UPDATE_FAILED", "Could not update window brightness", exception)
      }
    }
  }
}
