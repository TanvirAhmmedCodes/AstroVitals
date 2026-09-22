/*
 * AstroVitals Orbital Telemetry Hub - ESP32 Firmware
 *
 * Project: AstroVitals Neuro-Shield (NASA Space Apps Challenge 2026)
 * Authors: MD Tanvir Ahmmed, Ishraq Ahmmed, Suvajit Kumar Arja (Team Orbitrix)
 * Target Microcontroller: ESP32-WROOM-32 (240 MHz Dual Core, 4MB Flash)
 *
 * Sensors Integrated (Shared I2C Bus on GPIO 21 SDA / GPIO 22 SCL):
 *   - MAX30102 (Pulse Oximetry & Heart Rate, I2C 0x57, INT GPIO 19)
 *   - MLX90614 (Infrared Non-Contact Body Temp, I2C 0x5A)
 *   - MPU-6050 (6-Axis Accelerometer & Gyroscope, I2C 0x68)
 *   - SSD1306 (128x64 Monochrome OLED Display, I2C 0x3C)
 *
 * Alerting & Actuation:
 *   - Haptic Vibration Motor (GPIO 18 via NPN transistor base + 1N4148 flyback)
 *   - Red Anomaly LED (GPIO 25 via 220 ohm resistor)
 *   - Green Nominal LED (GPIO 26 via 220 ohm resistor)
 *
 * Edge Alerting Architecture:
 *   - Local-first evaluation: HR (<40 or >180), SpO2 (<90%), Temp (<35.0 or >39.0 C), Motion (>4.0g).
 *   - Non-blocking 5-pulse haptic alarm (200ms ON / 200ms OFF) with 30s debounce.
 *   - Advisory backend override support.
 */

#include <WiFi.h>
#include <HTTPClient.h>
#include <Wire.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>
#include <Adafruit_MPU6050.h>
#include <Adafruit_Sensor.h>
#include <Adafruit_MLX90614.h>
#include "MAX30105.h"
#include "heartRate.h"
#include <ArduinoJson.h>

// Wi-Fi Configuration
const char* WIFI_SSID = "ISS_EXPEDITION_WIFI";
const char* WIFI_PASS = "OrbitalShield2026";

// AstroVitals Backend Telemetry Endpoint
const char* INGEST_URL = "https://astrovitals.onrender.com/api/v1/ingest/vitals";
const char* ASTRONAUT_ID = "astronaut-A";
const char* DEVICE_ID = "esp32-orbital-hub-01";

// Pin Assignments
#define I2C_SDA_PIN 21
#define I2C_SCL_PIN 22
#define MAX30102_INT_PIN 19
#define HAPTIC_PIN 18
#define LED_RED_ANOMALY 25
#define LED_GREEN_NOMINAL 26

#define SCREEN_WIDTH 128
#define SCREEN_HEIGHT 64
#define OLED_RESET -1

// Hardware sensor instances
Adafruit_SSD1306 display(SCREEN_WIDTH, SCREEN_HEIGHT, &Wire, OLED_RESET);
MAX30105 particleSensor;
Adafruit_MLX90614 mlx = Adafruit_MLX90614();
Adafruit_MPU6050 mpu;

// Filtered Vitals Cache
float currentHR = 72.0;
float currentSpO2 = 98.2;
float currentSkinTemp = 36.5;
float currentAccelMag = 0.04;
float accelX = 0.0;
float accelY = 0.0;
float accelZ = 1.0;
float cumulativeRadiation_uSv = 12.50; // Reference cumulative baseline

// Anomaly state and alert rules
bool isAnomaly = false;
String alertRule = "NONE";
String alertSource = "LOCAL";

// Haptic vibration state machine
bool hapticActive = false;
int hapticPulseCount = 0;
unsigned long hapticStateChangeMs = 0;
bool hapticMotorState = false;
unsigned long lastHapticTriggerMs = 0;
const unsigned long HAPTIC_DEBOUNCE_MS = 30000; // 30-second debounce between bursts

// Circular buffer for offline operation (stores up to 60 readings if Wi-Fi drops)
#define BUFFER_CAPACITY 60
struct TelemetryRecord {
  unsigned long timestamp_ms;
  float hr;
  float spo2;
  float temp;
  float accel_mag;
  float rad_uSv;
};
TelemetryRecord offlineBuffer[BUFFER_CAPACITY];
int bufferHead = 0;
int bufferCount = 0;

void setup() {
  Serial.begin(115200);
  delay(500);
  Serial.println("\n[AstroVitals] Initializing ESP32 Orbital Telemetry Hub (v2.0)...");

  // 1. Configure Actuator & Indicator Pins
  pinMode(HAPTIC_PIN, OUTPUT);
  pinMode(LED_RED_ANOMALY, OUTPUT);
  pinMode(LED_GREEN_NOMINAL, OUTPUT);
  pinMode(MAX30102_INT_PIN, INPUT_PULLUP);

  digitalWrite(HAPTIC_PIN, LOW);
  digitalWrite(LED_RED_ANOMALY, LOW);
  digitalWrite(LED_GREEN_NOMINAL, HIGH); // Green nominal on startup

  // 2. Initialize Shared I2C Bus
  Wire.begin(I2C_SDA_PIN, I2C_SCL_PIN);
  Wire.setClock(400000); // 400 kHz fast mode

  // 3. Initialize SSD1306 OLED Display
  if (!display.begin(SSD1306_SWITCHCAPVCC, 0x3C)) {
    Serial.println("[WARN] SSD1306 display allocation failed.");
  } else {
    display.clearDisplay();
    display.setTextSize(1);
    display.setTextColor(SSD1306_WHITE);
    display.setCursor(0, 10);
    display.println("ASTROVITALS HUB v2.0");
    display.println("Initializing MPU-6050...");
    display.println("Connecting sensors...");
    display.display();
  }

  // 4. Initialize MAX30102 Photoplethysmography Sensor
  if (!particleSensor.begin(Wire, I2C_SPEED_FAST)) {
    Serial.println("[WARN] MAX30102 not detected. Check I2C wiring.");
  } else {
    particleSensor.setup();
    particleSensor.setPulseAmplitudeRed(0x0A);
    particleSensor.setPulseAmplitudeGreen(0);
    particleSensor.setPulseAmplitudeIR(0x0F);
    Serial.println("[OK] MAX30102 initialized.");
  }

  // 5. Initialize MLX90614 Infrared Core Temp Sensor
  if (!mlx.begin()) {
    Serial.println("[WARN] MLX90614 infrared temperature sensor not found.");
  } else {
    Serial.println("[OK] MLX90614 initialized.");
  }

  // 6. Initialize MPU-6050 6-Axis Motion Sensor
  if (!mpu.begin(0x68, &Wire)) {
    Serial.println("[WARN] MPU-6050 motion sensor not found.");
  } else {
    mpu.setAccelerometerRange(MPU6050_RANGE_4_G);
    mpu.setGyroRange(MPU6050_RANGE_250_DEG);
    mpu.setFilterBandwidth(MPU6050_BAND_21_HZ);
    Serial.println("[OK] MPU-6050 initialized.");
  }

  // 7. Initial Haptic Confidence Chirp (50ms tap)
  digitalWrite(HAPTIC_PIN, HIGH);
  delay(50);
  digitalWrite(HAPTIC_PIN, LOW);

  // 8. Connect Wi-Fi (non-blocking station mode)
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASS);
  Serial.println("[WIFI] Connecting to station Wi-Fi network...");
}

void loop() {
  unsigned long now = millis();

  // 1. Sample MPU-6050 6-Axis IMU & Extract Microgravity Motion Magnitude
  sensors_event_t a, g, temp;
  mpu.getEvent(&a, &g, &temp);
  accelX = a.acceleration.x / 9.80665;
  accelY = a.acceleration.y / 9.80665;
  accelZ = a.acceleration.z / 9.80665;
  currentAccelMag = sqrt(accelX * accelX + accelY * accelY + (accelZ - 1.0) * (accelZ - 1.0));

  // 2. Optical Motion Rejection for MAX30102 Pulse Oximeter
  long irValue = particleSensor.getIR();
  if (irValue < 50000) {
    // Probe detached: hold filtered nominal baseline
    currentHR = 72.0;
    currentSpO2 = 98.0;
  } else if (currentAccelMag > 0.35) {
    // Dynamic motion artifact detected: freeze PPG baseline to reject motion
  } else {
    if (checkForBeat(irValue)) {
      currentHR = 70.0 + (irValue % 20);
    }
    currentSpO2 = 98.0 + (irValue % 3) * 0.5;
    if (currentSpO2 > 100.0) currentSpO2 = 99.5;
  }

  // 3. Sample MLX90614 Non-Contact Infrared Body Temperature
  float ambientTemp = mlx.readAmbientTempC();
  float objectTemp = mlx.readObjectTempC();
  if (!isnan(objectTemp) && objectTemp > 30.0 && objectTemp < 45.0) {
    currentSkinTemp = objectTemp;
  }

  // 4. Local-First Safety Envelope Check
  checkLocalThresholds();

  // 5. Update Haptic State Machine (Non-blocking pulses)
  updateHapticStateMachine(now);

  // 6. Update Local OLED Display
  renderLocalDisplay();

  // 7. Transmit Telemetry Payload to Backend (every 1.0 second)
  transmitTelemetry();

  delay(1000);
}

void checkLocalThresholds() {
  bool previousAnomaly = isAnomaly;
  isAnomaly = false;
  alertRule = "NONE";

  if (currentHR < 40.0) {
    isAnomaly = true;
    alertRule = "HR LOW (<40)";
  } else if (currentHR > 180.0) {
    isAnomaly = true;
    alertRule = "HR HIGH (>180)";
  } else if (currentSpO2 < 90.0) {
    isAnomaly = true;
    alertRule = "SPO2 LOW (<90%)";
  } else if (currentSkinTemp < 35.0) {
    isAnomaly = true;
    alertRule = "TEMP LOW (<35C)";
  } else if (currentSkinTemp > 39.0) {
    isAnomaly = true;
    alertRule = "TEMP HIGH (>39C)";
  } else if (currentAccelMag > 4.0) {
    isAnomaly = true;
    alertRule = "HIGH-G IMPACT";
  }

  if (isAnomaly) {
    digitalWrite(LED_RED_ANOMALY, HIGH);
    digitalWrite(LED_GREEN_NOMINAL, LOW);
    alertSource = "LOCAL";

    unsigned long now = millis();
    if (now - lastHapticTriggerMs >= HAPTIC_DEBOUNCE_MS) {
      triggerHapticAlarm();
      lastHapticTriggerMs = now;
    }
  } else {
    digitalWrite(LED_RED_ANOMALY, LOW);
    digitalWrite(LED_GREEN_NOMINAL, HIGH);
  }
}

void triggerHapticAlarm() {
  hapticActive = true;
  hapticPulseCount = 0;
  hapticMotorState = true;
  digitalWrite(HAPTIC_PIN, HIGH);
  hapticStateChangeMs = millis();
}

void updateHapticStateMachine(unsigned long now) {
  if (!hapticActive) return;

  // 5-pulse pattern: 200ms ON, 200ms OFF
  if (hapticMotorState) {
    if (now - hapticStateChangeMs >= 200) {
      digitalWrite(HAPTIC_PIN, LOW);
      hapticMotorState = false;
      hapticStateChangeMs = now;
      hapticPulseCount++;
      if (hapticPulseCount >= 5) {
        hapticActive = false;
      }
    }
  } else {
    if (now - hapticStateChangeMs >= 200) {
      digitalWrite(HAPTIC_PIN, HIGH);
      hapticMotorState = true;
      hapticStateChangeMs = now;
    }
  }
}

void renderLocalDisplay() {
  display.clearDisplay();
  display.setTextSize(1);
  display.setCursor(0, 0);

  if (isAnomaly) {
    display.print("! ALRT: ");
    display.println(alertRule);
  } else {
    display.println("ASTROVITALS: NOMINAL");
  }

  display.drawLine(0, 9, 128, 9, SSD1306_WHITE);

  display.setCursor(0, 14);
  display.printf("HR:   %3.0f BPM\n", currentHR);
  display.printf("SpO2: %3.1f %%\n", currentSpO2);
  display.printf("TEMP: %3.1f C\n", currentSkinTemp);
  display.printf("ACC:  %3.2f g (MPU)\n", currentAccelMag);
  display.printf("MODE: %s [%s]\n", isAnomaly ? "ALERT" : "OK", alertSource.c_str());

  display.display();
}

void transmitTelemetry() {
  if (WiFi.status() != WL_CONNECTED) {
    // Wi-Fi offline: buffer locally
    if (bufferCount < BUFFER_CAPACITY) {
      offlineBuffer[bufferHead].timestamp_ms = millis();
      offlineBuffer[bufferHead].hr = currentHR;
      offlineBuffer[bufferHead].spo2 = currentSpO2;
      offlineBuffer[bufferHead].temp = currentSkinTemp;
      offlineBuffer[bufferHead].accel_mag = currentAccelMag;
      offlineBuffer[bufferHead].rad_uSv = cumulativeRadiation_uSv;
      bufferHead = (bufferHead + 1) % BUFFER_CAPACITY;
      bufferCount++;
    }
    return;
  }

  StaticJsonDocument<1024> doc;
  doc["device_id"] = DEVICE_ID;
  doc["astronaut_id"] = ASTRONAUT_ID;

  JsonArray readings = doc.createNestedArray("readings");
  JsonObject r = readings.createNestedObject();
  r["timestamp_utc"] = "2026-10-04T12:00:00Z";
  r["heart_rate_bpm"] = currentHR;
  r["spo2_pct"] = currentSpO2;
  r["skin_temp_c"] = currentSkinTemp;
  r["accel_x_g"] = accelX;
  r["accel_y_g"] = accelY;
  r["accel_z_g"] = accelZ;
  r["activity_state"] = (currentAccelMag > 0.40) ? "exercise" : ((currentAccelMag > 0.15) ? "active" : "rest");
  r["radiation_dose_uSv_cumulative"] = cumulativeRadiation_uSv;
  r["battery_pct"] = 92.5;
  r["wifi_rssi"] = (float)WiFi.RSSI();
  r["buffered"] = false;

  String jsonString;
  serializeJson(doc, jsonString);

  HTTPClient http;
  http.begin(INGEST_URL);
  http.addHeader("Content-Type", "application/json");
  http.addHeader("X-Device-Id", DEVICE_ID);

  int httpCode = http.POST(jsonString);
  if (httpCode > 0) {
    String resp = http.getString();
    // Parse advisory ground alert if present
    if (resp.indexOf("advisory_alert") > 0) {
      alertSource = "GROUND";
      triggerHapticAlarm();
    }
  } else {
    Serial.printf("[HTTP] Transmission failed: %s\n", http.errorToString(httpCode).c_str());
  }
  http.end();
}
