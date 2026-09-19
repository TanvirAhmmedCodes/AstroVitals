/**
 * AstroVitals Neuro-Shield — Firestore Real-Time React Hooks.
 *
 * Real-time reactive subscriptions for wearable telemetry streams,
 * hardware device status, and live mission crew updates.
 * Features automatic unsubscribe, error resilience, and graceful REST fallback.
 *
 * Made by MD Tanvir Ahmmed · Team Orbitrix · NASA Space Apps Challenge 2026
 */

import { useState, useEffect } from "react";
import {
  collection,
  doc,
  query,
  orderBy,
  limit as firestoreLimit,
  onSnapshot,
} from "firebase/firestore";
import { db } from "../lib/firebase";

/**
 * Real-time subscription to recent telemetry readings for a specific device / astronaut.
 * Listens to Firestore: devices/{deviceId}/readings
 *
 * @param {string} deviceId - Target hardware / astronaut ID (e.g. "astronaut-A")
 * @param {number} maxLimit - Max number of recent readings to fetch (default: 50)
 * @returns {{ data: Array, loading: boolean, error: Error|null, isLive: boolean }}
 */
export function useDeviceReadings(deviceId, maxLimit = 50) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isLive, setIsLive] = useState(false);

  useEffect(() => {
    if (!db || !deviceId) {
      setLoading(false);
      setIsLive(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const readingsRef = collection(db, "devices", deviceId, "readings");
      const readingsQuery = query(
        readingsRef,
        orderBy("timestamp", "desc"),
        firestoreLimit(maxLimit)
      );

      const unsubscribe = onSnapshot(
        readingsQuery,
        (snapshot) => {
          const readings = [];
          snapshot.forEach((docSnap) => {
            readings.push({
              id: docSnap.id,
              ...docSnap.data(),
            });
          });
          setData(readings);
          setLoading(false);
          setIsLive(true);
        },
        (err) => {
          console.warn(`[Firestore] Error reading telemetry for ${deviceId}:`, err.message);
          setError(err);
          setLoading(false);
          setIsLive(false);
        }
      );

      return () => {
        unsubscribe();
        setIsLive(false);
      };
    } catch (err) {
      console.warn("[Firestore] Hook initialization error:", err.message);
      setError(err);
      setLoading(false);
      setIsLive(false);
    }
  }, [deviceId, maxLimit]);

  return { data, loading, error, isLive };
}

/**
 * Real-time subscription to device connectivity, battery, and firmware status.
 * Listens to Firestore: devices/{deviceId}
 *
 * @param {string} deviceId - Target hardware / astronaut ID
 * @returns {{ data: Object|null, loading: boolean, error: Error|null, isLive: boolean }}
 */
export function useDeviceStatus(deviceId) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isLive, setIsLive] = useState(false);

  useEffect(() => {
    if (!db || !deviceId) {
      setLoading(false);
      setIsLive(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const deviceRef = doc(db, "devices", deviceId);
      const unsubscribe = onSnapshot(
        deviceRef,
        (docSnap) => {
          if (docSnap.exists()) {
            setData(docSnap.data());
            setIsLive(true);
          } else {
            setData(null);
          }
          setLoading(false);
        },
        (err) => {
          console.warn(`[Firestore] Error reading device doc for ${deviceId}:`, err.message);
          setError(err);
          setLoading(false);
          setIsLive(false);
        }
      );

      return () => {
        unsubscribe();
        setIsLive(false);
      };
    } catch (err) {
      console.warn("[Firestore] useDeviceStatus error:", err.message);
      setError(err);
      setLoading(false);
      setIsLive(false);
    }
  }, [deviceId]);

  return { data, loading, error, isLive };
}

/**
 * Real-time subscription to active mission crew status and health indices.
 * Listens to Firestore: mission/current
 *
 * @returns {{ data: Array, missionData: Object|null, loading: boolean, error: Error|null, isLive: boolean }}
 */
export function useMissionCrew() {
  const [data, setData] = useState([]);
  const [missionData, setMissionData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isLive, setIsLive] = useState(false);

  useEffect(() => {
    if (!db) {
      setLoading(false);
      setIsLive(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const missionRef = doc(db, "mission", "current");
      const unsubscribe = onSnapshot(
        missionRef,
        (docSnap) => {
          if (docSnap.exists()) {
            const mData = docSnap.data();
            setMissionData(mData);
            setData(mData.crew || []);
            setIsLive(true);
          } else {
            setData([]);
            setMissionData(null);
          }
          setLoading(false);
        },
        (err) => {
          console.warn("[Firestore] Error reading mission/current:", err.message);
          setError(err);
          setLoading(false);
          setIsLive(false);
        }
      );

      return () => {
        unsubscribe();
        setIsLive(false);
      };
    } catch (err) {
      console.warn("[Firestore] useMissionCrew error:", err.message);
      setError(err);
      setLoading(false);
      setIsLive(false);
    }
  }, []);

  return { data, missionData, loading, error, isLive };
}
