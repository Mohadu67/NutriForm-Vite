/**
 * Health Service - Integration HealthKit (iOS) & Health Connect (Android)
 * Gere la recuperation des donnees de sante du telephone
 */

import { Platform } from 'react-native';

// Imports conditionnels pour eviter les erreurs sur chaque plateforme
let HealthConnect = null;
let AppleHealthKit = null;

if (Platform.OS === 'android') {
  HealthConnect = require('react-native-health-connect');
}

if (Platform.OS === 'ios') {
  AppleHealthKit = require('react-native-health').default;
}

// Permissions HealthKit iOS
const HEALTHKIT_PERMISSIONS = {
  permissions: {
    read: [
      AppleHealthKit?.Constants?.Permissions?.StepCount,
      AppleHealthKit?.Constants?.Permissions?.Weight,
      AppleHealthKit?.Constants?.Permissions?.Height,
      AppleHealthKit?.Constants?.Permissions?.HeartRate,
      AppleHealthKit?.Constants?.Permissions?.ActiveEnergyBurned,
      AppleHealthKit?.Constants?.Permissions?.DistanceWalkingRunning,
      AppleHealthKit?.Constants?.Permissions?.Workout,
      AppleHealthKit?.Constants?.Permissions?.MenstrualFlow,
      AppleHealthKit?.Constants?.Permissions?.SleepAnalysis,
      AppleHealthKit?.Constants?.Permissions?.HeartRateVariability,
      AppleHealthKit?.Constants?.Permissions?.RestingHeartRate,
    ].filter(Boolean),
    write: [
      AppleHealthKit?.Constants?.Permissions?.StepCount,
      AppleHealthKit?.Constants?.Permissions?.ActiveEnergyBurned,
      AppleHealthKit?.Constants?.Permissions?.Workout,
    ].filter(Boolean),
  },
};

// Permissions Health Connect Android
const HEALTH_CONNECT_PERMISSIONS = [
  { accessType: 'read', recordType: 'Steps' },
  { accessType: 'read', recordType: 'Weight' },
  { accessType: 'read', recordType: 'Height' },
  { accessType: 'read', recordType: 'HeartRate' },
  { accessType: 'read', recordType: 'ActiveCaloriesBurned' },
  { accessType: 'read', recordType: 'TotalCaloriesBurned' },
  { accessType: 'read', recordType: 'Distance' },
  { accessType: 'read', recordType: 'ExerciseSession' },
  { accessType: 'read', recordType: 'MenstruationFlow' },
  { accessType: 'read', recordType: 'MenstruationPeriod' },
  { accessType: 'read', recordType: 'SleepSession' },
  { accessType: 'read', recordType: 'HeartRateVariabilityRmssd' },
  { accessType: 'read', recordType: 'RestingHeartRate' },
  { accessType: 'write', recordType: 'Steps' },
  { accessType: 'write', recordType: 'ActiveCaloriesBurned' },
  { accessType: 'write', recordType: 'ExerciseSession' },
];

class HealthService {
  constructor() {
    this.isInitialized = false;
    this.isAvailable = false;
  }

  /**
   * Initialise le service de sante
   */
  async initialize() {
    try {
      if (Platform.OS === 'android' && HealthConnect) {
        const isInitialized = await HealthConnect.initialize();
        this.isInitialized = isInitialized;
        this.isAvailable = isInitialized;
        console.log('[HEALTH] Health Connect initialized:', isInitialized);
        return isInitialized;
      } else if (Platform.OS === 'ios' && AppleHealthKit) {
        return new Promise((resolve) => {
          AppleHealthKit.isAvailable((err, available) => {
            if (err || !available) {
              console.log('[HEALTH] HealthKit not available');
              this.isAvailable = false;
              resolve(false);
              return;
            }
            this.isAvailable = true;
            this.isInitialized = true;
            console.log('[HEALTH] HealthKit available');
            resolve(true);
          });
        });
      }
      return false;
    } catch (error) {
      console.error('[HEALTH] Initialization error:', error);
      this.isAvailable = false;
      return false;
    }
  }

  /**
   * Demande les permissions d'acces aux donnees de sante
   */
  async requestPermissions() {
    try {
      if (!this.isAvailable) {
        await this.initialize();
      }

      if (Platform.OS === 'android' && HealthConnect) {
        const permissions = await HealthConnect.requestPermission(HEALTH_CONNECT_PERMISSIONS);
        console.log('[HEALTH] Health Connect permissions granted:', permissions);
        return permissions;
      } else if (Platform.OS === 'ios' && AppleHealthKit) {
        return new Promise((resolve) => {
          AppleHealthKit.initHealthKit(HEALTHKIT_PERMISSIONS, (err) => {
            if (err) {
              console.error('[HEALTH] HealthKit permissions error:', err);
              resolve([]);
              return;
            }
            console.log('[HEALTH] HealthKit permissions granted');
            resolve(HEALTHKIT_PERMISSIONS.permissions.read);
          });
        });
      }

      return [];
    } catch (error) {
      console.error('[HEALTH] Permission request error:', error);
      return [];
    }
  }

  /**
   * Verifie les permissions actuelles
   */
  async checkPermissions() {
    try {
      if (Platform.OS === 'android' && HealthConnect && this.isAvailable) {
        const permissions = await HealthConnect.getGrantedPermissions();
        return permissions;
      }
      // iOS ne permet pas de verifier les permissions directement
      return this.isAvailable ? ['granted'] : [];
    } catch (error) {
      console.error('[HEALTH] Check permissions error:', error);
      return [];
    }
  }

  /**
   * Recupere le nombre de pas pour une periode donnee
   */
  async getSteps(startDate, endDate) {
    try {
      if (Platform.OS === 'android' && HealthConnect && this.isAvailable) {
        const result = await HealthConnect.readRecords('Steps', {
          timeRangeFilter: {
            operator: 'between',
            startTime: startDate.toISOString(),
            endTime: endDate.toISOString(),
          },
        });
        const totalSteps = result.reduce((sum, record) => sum + record.count, 0);
        return { total: totalSteps, records: result };
      } else if (Platform.OS === 'ios' && AppleHealthKit) {
        return new Promise((resolve) => {
          const options = {
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString(),
          };
          AppleHealthKit.getStepCount(options, (err, results) => {
            if (err) {
              console.error('[HEALTH] iOS getSteps error:', err);
              resolve({ total: 0, records: [] });
              return;
            }
            resolve({ total: results.value || 0, records: [results] });
          });
        });
      }
      return { total: 0, records: [] };
    } catch (error) {
      console.error('[HEALTH] Get steps error:', error);
      return { total: 0, records: [] };
    }
  }

  /**
   * Recupere le poids le plus recent
   */
  async getLatestWeight() {
    try {
      if (Platform.OS === 'android' && HealthConnect && this.isAvailable) {
        const endDate = new Date();
        const startDate = new Date();
        startDate.setMonth(startDate.getMonth() - 3);

        const result = await HealthConnect.readRecords('Weight', {
          timeRangeFilter: {
            operator: 'between',
            startTime: startDate.toISOString(),
            endTime: endDate.toISOString(),
          },
        });

        if (result.length > 0) {
          const sorted = result.sort((a, b) => new Date(b.time) - new Date(a.time));
          return {
            value: sorted[0].weight.inKilograms,
            date: sorted[0].time,
            unit: 'kg',
          };
        }
      } else if (Platform.OS === 'ios' && AppleHealthKit) {
        return new Promise((resolve) => {
          AppleHealthKit.getLatestWeight({}, (err, results) => {
            if (err || !results) {
              resolve(null);
              return;
            }
            resolve({
              value: results.value,
              date: results.startDate,
              unit: 'kg',
            });
          });
        });
      }
      return null;
    } catch (error) {
      console.error('[HEALTH] Get weight error:', error);
      return null;
    }
  }

  /**
   * Recupere la taille
   */
  async getHeight() {
    try {
      if (Platform.OS === 'android' && HealthConnect && this.isAvailable) {
        const endDate = new Date();
        const startDate = new Date();
        startDate.setFullYear(startDate.getFullYear() - 5);

        const result = await HealthConnect.readRecords('Height', {
          timeRangeFilter: {
            operator: 'between',
            startTime: startDate.toISOString(),
            endTime: endDate.toISOString(),
          },
        });

        if (result.length > 0) {
          const sorted = result.sort((a, b) => new Date(b.time) - new Date(a.time));
          return {
            value: sorted[0].height.inMeters * 100,
            date: sorted[0].time,
            unit: 'cm',
          };
        }
      } else if (Platform.OS === 'ios' && AppleHealthKit) {
        return new Promise((resolve) => {
          AppleHealthKit.getLatestHeight({}, (err, results) => {
            if (err || !results) {
              resolve(null);
              return;
            }
            // HealthKit retourne en inches, convertir en cm
            resolve({
              value: Math.round(results.value * 2.54),
              date: results.startDate,
              unit: 'cm',
            });
          });
        });
      }
      return null;
    } catch (error) {
      console.error('[HEALTH] Get height error:', error);
      return null;
    }
  }

  /**
   * Recupere les donnees de frequence cardiaque
   */
  async getHeartRate(startDate, endDate) {
    try {
      if (Platform.OS === 'android' && HealthConnect && this.isAvailable) {
        const result = await HealthConnect.readRecords('HeartRate', {
          timeRangeFilter: {
            operator: 'between',
            startTime: startDate.toISOString(),
            endTime: endDate.toISOString(),
          },
        });

        if (result.length > 0) {
          const allSamples = result.flatMap(r => r.samples);
          const avgBpm = allSamples.reduce((sum, s) => sum + s.beatsPerMinute, 0) / allSamples.length;
          const minBpm = Math.min(...allSamples.map(s => s.beatsPerMinute));
          const maxBpm = Math.max(...allSamples.map(s => s.beatsPerMinute));

          return { average: Math.round(avgBpm), min: minBpm, max: maxBpm, samples: allSamples.length };
        }
      } else if (Platform.OS === 'ios' && AppleHealthKit) {
        return new Promise((resolve) => {
          const options = {
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString(),
            ascending: false,
            limit: 100,
          };
          AppleHealthKit.getHeartRateSamples(options, (err, results) => {
            if (err || !results || results.length === 0) {
              resolve(null);
              return;
            }
            const values = results.map(r => r.value);
            const avg = values.reduce((a, b) => a + b, 0) / values.length;
            resolve({
              average: Math.round(avg),
              min: Math.min(...values),
              max: Math.max(...values),
              samples: values.length,
            });
          });
        });
      }
      return null;
    } catch (error) {
      console.error('[HEALTH] Get heart rate error:', error);
      return null;
    }
  }

  /**
   * Recupere les calories brulees
   */
  async getCaloriesBurned(startDate, endDate) {
    try {
      if (Platform.OS === 'android' && HealthConnect && this.isAvailable) {
        const activeResult = await HealthConnect.readRecords('ActiveCaloriesBurned', {
          timeRangeFilter: {
            operator: 'between',
            startTime: startDate.toISOString(),
            endTime: endDate.toISOString(),
          },
        });

        const totalActive = activeResult.reduce(
          (sum, record) => sum + record.energy.inKilocalories,
          0
        );

        return { active: Math.round(totalActive), unit: 'kcal' };
      } else if (Platform.OS === 'ios' && AppleHealthKit) {
        return new Promise((resolve) => {
          const options = {
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString(),
          };
          AppleHealthKit.getActiveEnergyBurned(options, (err, results) => {
            if (err || !results || results.length === 0) {
              resolve({ active: 0, unit: 'kcal' });
              return;
            }
            const total = results.reduce((sum, r) => sum + r.value, 0);
            resolve({ active: Math.round(total), unit: 'kcal' });
          });
        });
      }
      return { active: 0, unit: 'kcal' };
    } catch (error) {
      console.error('[HEALTH] Get calories error:', error);
      return { active: 0, unit: 'kcal' };
    }
  }

  /**
   * Recupere la distance parcourue
   */
  async getDistance(startDate, endDate) {
    try {
      if (Platform.OS === 'android' && HealthConnect && this.isAvailable) {
        const result = await HealthConnect.readRecords('Distance', {
          timeRangeFilter: {
            operator: 'between',
            startTime: startDate.toISOString(),
            endTime: endDate.toISOString(),
          },
        });

        const totalMeters = result.reduce(
          (sum, record) => sum + record.distance.inMeters,
          0
        );

        return { meters: totalMeters, kilometers: (totalMeters / 1000).toFixed(2) };
      } else if (Platform.OS === 'ios' && AppleHealthKit) {
        return new Promise((resolve) => {
          const options = {
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString(),
          };
          AppleHealthKit.getDistanceWalkingRunning(options, (err, results) => {
            if (err || !results) {
              resolve({ meters: 0, kilometers: '0.00' });
              return;
            }
            // HealthKit retourne en miles, convertir en metres
            const meters = (results.value || 0) * 1609.34;
            resolve({ meters, kilometers: (meters / 1000).toFixed(2) });
          });
        });
      }
      return { meters: 0, kilometers: '0.00' };
    } catch (error) {
      console.error('[HEALTH] Get distance error:', error);
      return { meters: 0, kilometers: '0.00' };
    }
  }

  /**
   * Recupere les donnees menstruelles
   */
  async getMenstrualData(startDate, endDate) {
    try {
      if (Platform.OS === 'android' && HealthConnect && this.isAvailable) {
        // Recuperer les periodes menstruelles
        const periods = await HealthConnect.readRecords('MenstruationPeriod', {
          timeRangeFilter: {
            operator: 'between',
            startTime: startDate.toISOString(),
            endTime: endDate.toISOString(),
          },
        });

        // Recuperer le flux menstruel
        const flows = await HealthConnect.readRecords('MenstruationFlow', {
          timeRangeFilter: {
            operator: 'between',
            startTime: startDate.toISOString(),
            endTime: endDate.toISOString(),
          },
        });

        return {
          periods: periods.map(p => ({
            startDate: p.startTime,
            endDate: p.endTime,
          })),
          flows: flows.map(f => ({
            date: f.time,
            flow: f.flow, // LIGHT, MEDIUM, HEAVY
          })),
        };
      } else if (Platform.OS === 'ios' && AppleHealthKit) {
        return new Promise((resolve) => {
          const options = {
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString(),
            ascending: false,
          };

          AppleHealthKit.getMenstrualFlowSamples(options, (err, results) => {
            if (err || !results) {
              console.log('[HEALTH] iOS getMenstrualFlow error:', err);
              resolve({ periods: [], flows: [] });
              return;
            }

            // Transformer les donnees HealthKit
            const flows = results.map(r => ({
              date: r.startDate,
              flow: r.value, // unspecified, light, medium, heavy, none
              isStartOfCycle: r.metadata?.HKMenstrualCycleStart === true,
            }));

            // Detecter les periodes (grouper les jours consecutifs)
            const periods = [];
            let currentPeriod = null;

            const sortedFlows = [...flows].sort((a, b) =>
              new Date(a.date) - new Date(b.date)
            );

            sortedFlows.forEach((flow, index) => {
              if (flow.flow !== 'none' && flow.flow !== 'unspecified') {
                if (!currentPeriod) {
                  currentPeriod = { startDate: flow.date, endDate: flow.date };
                } else {
                  // Verifier si c'est le meme cycle (moins de 2 jours d'ecart)
                  const lastDate = new Date(currentPeriod.endDate);
                  const currentDate = new Date(flow.date);
                  const diffDays = (currentDate - lastDate) / (1000 * 60 * 60 * 24);

                  if (diffDays <= 2) {
                    currentPeriod.endDate = flow.date;
                  } else {
                    periods.push(currentPeriod);
                    currentPeriod = { startDate: flow.date, endDate: flow.date };
                  }
                }
              }
            });

            if (currentPeriod) {
              periods.push(currentPeriod);
            }

            resolve({ periods, flows });
          });
        });
      }
      return { periods: [], flows: [] };
    } catch (error) {
      console.error('[HEALTH] Get menstrual data error:', error);
      return { periods: [], flows: [] };
    }
  }

  /**
   * Recupere le dernier cycle menstruel
   */
  async getLastMenstrualCycle() {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - 3); // 3 derniers mois

    const data = await this.getMenstrualData(startDate, endDate);

    if (data.periods.length === 0) {
      return null;
    }

    // Trier par date de debut (plus recent en premier)
    const sortedPeriods = data.periods.sort((a, b) =>
      new Date(b.startDate) - new Date(a.startDate)
    );

    const lastPeriod = sortedPeriods[0];
    const previousPeriod = sortedPeriods[1];

    // Calculer la duree du cycle
    let cycleLength = null;
    if (previousPeriod) {
      const lastStart = new Date(lastPeriod.startDate);
      const prevStart = new Date(previousPeriod.startDate);
      cycleLength = Math.round((lastStart - prevStart) / (1000 * 60 * 60 * 24));
    }

    // Calculer la duree des regles
    const periodLength = Math.round(
      (new Date(lastPeriod.endDate) - new Date(lastPeriod.startDate)) / (1000 * 60 * 60 * 24)
    ) + 1;

    // Predire la prochaine date
    let nextPeriodDate = null;
    if (cycleLength) {
      const lastStart = new Date(lastPeriod.startDate);
      nextPeriodDate = new Date(lastStart.getTime() + cycleLength * 24 * 60 * 60 * 1000);
    }

    return {
      lastPeriod: {
        startDate: lastPeriod.startDate,
        endDate: lastPeriod.endDate,
        length: periodLength,
      },
      cycleLength,
      nextPeriodDate: nextPeriodDate?.toISOString(),
      totalPeriods: sortedPeriods.length,
    };
  }

  /**
   * Recupere les donnees de sommeil pour une periode donnee
   */
  async getSleepData(startDate, endDate) {
    try {
      if (Platform.OS === 'android' && HealthConnect && this.isAvailable) {
        const result = await HealthConnect.readRecords('SleepSession', {
          timeRangeFilter: {
            operator: 'between',
            startTime: startDate.toISOString(),
            endTime: endDate.toISOString(),
          },
        });

        if (!result || result.length === 0) {
          console.log('[HEALTH] No sleep sessions found (Android)');
          return null;
        }

        let deepMinutes = 0;
        let remMinutes = 0;
        let lightMinutes = 0;
        let awakeMinutes = 0;
        let totalSleepMinutes = 0;
        let earliestStart = null;
        let latestEnd = null;

        result.forEach((session) => {
          const sessionStart = new Date(session.startTime);
          const sessionEnd = new Date(session.endTime);

          if (!earliestStart || sessionStart < earliestStart) {
            earliestStart = sessionStart;
          }
          if (!latestEnd || sessionEnd > latestEnd) {
            latestEnd = sessionEnd;
          }

          if (session.stages && session.stages.length > 0) {
            session.stages.forEach((stage) => {
              const stageStart = new Date(stage.startTime);
              const stageEnd = new Date(stage.endTime);
              const durationMinutes = (stageEnd - stageStart) / (1000 * 60);

              // Stage mapping: 1=AWAKE, 2=SLEEPING, 3=OUT_OF_BED, 4=LIGHT, 5=DEEP, 6=REM
              switch (stage.stage) {
                case 1: // AWAKE
                  awakeMinutes += durationMinutes;
                  break;
                case 2: // SLEEPING (generic)
                  lightMinutes += durationMinutes;
                  totalSleepMinutes += durationMinutes;
                  break;
                case 4: // LIGHT
                  lightMinutes += durationMinutes;
                  totalSleepMinutes += durationMinutes;
                  break;
                case 5: // DEEP
                  deepMinutes += durationMinutes;
                  totalSleepMinutes += durationMinutes;
                  break;
                case 6: // REM
                  remMinutes += durationMinutes;
                  totalSleepMinutes += durationMinutes;
                  break;
                // 3=OUT_OF_BED is not counted
              }
            });
          } else {
            // No stage data, count entire session as sleep
            const sessionMinutes = (sessionEnd - sessionStart) / (1000 * 60);
            totalSleepMinutes += sessionMinutes;
          }
        });

        return {
          sleepDuration: Math.round(totalSleepMinutes),
          deepSleepMinutes: Math.round(deepMinutes),
          remSleepMinutes: Math.round(remMinutes),
          lightSleepMinutes: Math.round(lightMinutes),
          awakeMinutes: Math.round(awakeMinutes),
          sleepStart: earliestStart ? earliestStart.toISOString() : null,
          sleepEnd: latestEnd ? latestEnd.toISOString() : null,
        };
      } else if (Platform.OS === 'ios' && AppleHealthKit) {
        return new Promise((resolve) => {
          AppleHealthKit.getSleepSamples(
            {
              startDate: startDate.toISOString(),
              endDate: endDate.toISOString(),
              ascending: false,
            },
            (err, results) => {
              if (err || !results || results.length === 0) {
                console.log('[HEALTH] iOS getSleepSamples error or empty:', err);
                resolve(null);
                return;
              }

              let deepMinutes = 0;
              let remMinutes = 0;
              let lightMinutes = 0;
              let awakeMinutes = 0;
              let totalSleepMinutes = 0;
              let earliestStart = null;
              let latestEnd = null;

              results.forEach((sample) => {
                const sampleStart = new Date(sample.startDate);
                const sampleEnd = new Date(sample.endDate);
                const durationMinutes = (sampleEnd - sampleStart) / (1000 * 60);

                // Track sleep window boundaries (exclude AWAKE samples)
                if (sample.value !== 'AWAKE') {
                  if (!earliestStart || sampleStart < earliestStart) {
                    earliestStart = sampleStart;
                  }
                  if (!latestEnd || sampleEnd > latestEnd) {
                    latestEnd = sampleEnd;
                  }
                }

                switch (sample.value) {
                  case 'DEEP':
                    deepMinutes += durationMinutes;
                    totalSleepMinutes += durationMinutes;
                    break;
                  case 'REM':
                    remMinutes += durationMinutes;
                    totalSleepMinutes += durationMinutes;
                    break;
                  case 'CORE': // Light sleep in Apple's terminology
                    lightMinutes += durationMinutes;
                    totalSleepMinutes += durationMinutes;
                    break;
                  case 'ASLEEP': // Generic asleep (older data)
                    lightMinutes += durationMinutes;
                    totalSleepMinutes += durationMinutes;
                    break;
                  case 'INBED':
                    // In bed but not necessarily asleep — track for window but don't count as sleep
                    if (!earliestStart || sampleStart < earliestStart) {
                      earliestStart = sampleStart;
                    }
                    if (!latestEnd || sampleEnd > latestEnd) {
                      latestEnd = sampleEnd;
                    }
                    break;
                  case 'AWAKE':
                    awakeMinutes += durationMinutes;
                    break;
                }
              });

              resolve({
                sleepDuration: Math.round(totalSleepMinutes),
                deepSleepMinutes: Math.round(deepMinutes),
                remSleepMinutes: Math.round(remMinutes),
                lightSleepMinutes: Math.round(lightMinutes),
                awakeMinutes: Math.round(awakeMinutes),
                sleepStart: earliestStart ? earliestStart.toISOString() : null,
                sleepEnd: latestEnd ? latestEnd.toISOString() : null,
              });
            }
          );
        });
      }
      return null;
    } catch (error) {
      console.error('[HEALTH] Get sleep data error:', error);
      return null;
    }
  }

  /**
   * Recupere la frequence cardiaque au repos
   */
  async getRestingHeartRate(startDate, endDate) {
    try {
      if (Platform.OS === 'android' && HealthConnect && this.isAvailable) {
        const result = await HealthConnect.readRecords('RestingHeartRate', {
          timeRangeFilter: {
            operator: 'between',
            startTime: startDate.toISOString(),
            endTime: endDate.toISOString(),
          },
        });

        if (!result || result.length === 0) {
          return null;
        }

        const avgBpm = result.reduce((sum, r) => sum + r.beatsPerMinute, 0) / result.length;
        return { value: Math.round(avgBpm), unit: 'bpm' };
      } else if (Platform.OS === 'ios' && AppleHealthKit) {
        return new Promise((resolve) => {
          AppleHealthKit.getRestingHeartRate(
            {
              startDate: startDate.toISOString(),
              endDate: endDate.toISOString(),
            },
            (err, results) => {
              if (err || !results || results.length === 0) {
                console.log('[HEALTH] iOS getRestingHeartRate error or empty:', err);
                resolve(null);
                return;
              }

              const values = Array.isArray(results) ? results : [results];
              const avg = values.reduce((sum, r) => sum + (r.value || 0), 0) / values.length;
              resolve({ value: Math.round(avg), unit: 'bpm' });
            }
          );
        });
      }
      return null;
    } catch (error) {
      console.error('[HEALTH] Get resting heart rate error:', error);
      return null;
    }
  }

  /**
   * Recupere la variabilite de la frequence cardiaque (HRV)
   */
  async getHRV(startDate, endDate) {
    try {
      if (Platform.OS === 'android' && HealthConnect && this.isAvailable) {
        const result = await HealthConnect.readRecords('HeartRateVariabilityRmssd', {
          timeRangeFilter: {
            operator: 'between',
            startTime: startDate.toISOString(),
            endTime: endDate.toISOString(),
          },
        });

        if (!result || result.length === 0) {
          return null;
        }

        const avgHrv = result.reduce((sum, r) => sum + r.heartRateVariabilityMillis, 0) / result.length;
        return { value: Math.round(avgHrv), unit: 'ms' };
      } else if (Platform.OS === 'ios' && AppleHealthKit) {
        return new Promise((resolve) => {
          AppleHealthKit.getHeartRateVariabilitySamples(
            {
              startDate: startDate.toISOString(),
              endDate: endDate.toISOString(),
            },
            (err, results) => {
              if (err || !results || results.length === 0) {
                console.log('[HEALTH] iOS getHRV error or empty:', err);
                resolve(null);
                return;
              }

              // HealthKit returns HRV in seconds, convert to ms
              const avg = results.reduce((sum, r) => sum + (r.value || 0), 0) / results.length;
              resolve({ value: Math.round(avg * 1000), unit: 'ms' });
            }
          );
        });
      }
      return null;
    } catch (error) {
      console.error('[HEALTH] Get HRV error:', error);
      return null;
    }
  }

  /**
   * Recupere un resume des donnees de sante pour aujourd'hui
   */
  async getTodaySummary() {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // Sleep window: previous day 18:00 to today 12:00
    const sleepWindowStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 18, 0, 0);
    const sleepWindowEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12, 0, 0);

    const [steps, calories, distance, heartRate, sleep, restingHR, hrv] = await Promise.all([
      this.getSteps(startOfDay, now),
      this.getCaloriesBurned(startOfDay, now),
      this.getDistance(startOfDay, now),
      this.getHeartRate(startOfDay, now),
      this.getSleepData(sleepWindowStart, sleepWindowEnd),
      this.getRestingHeartRate(sleepWindowStart, now),
      this.getHRV(sleepWindowStart, now),
    ]);

    return {
      date: now.toISOString().split('T')[0],
      steps: steps.total,
      calories: calories.active,
      distance: parseFloat(distance.kilometers),
      heartRate: heartRate?.average || null,
      sleep: sleep || null,
      restingHeartRate: restingHR?.value || null,
      hrv: hrv?.value || null,
    };
  }

  /**
   * Recupere un resume hebdomadaire
   */
  async getWeeklySummary() {
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const [steps, calories, distance] = await Promise.all([
      this.getSteps(weekAgo, now),
      this.getCaloriesBurned(weekAgo, now),
      this.getDistance(weekAgo, now),
    ]);

    return {
      period: '7 days',
      startDate: weekAgo.toISOString().split('T')[0],
      endDate: now.toISOString().split('T')[0],
      totalSteps: steps.total,
      avgStepsPerDay: Math.round(steps.total / 7),
      totalCalories: calories.active,
      totalDistanceKm: parseFloat(distance.kilometers),
    };
  }

  /**
   * Recupere les donnees corporelles (poids, taille, IMC)
   */
  async getBodyMetrics() {
    const [weight, height] = await Promise.all([
      this.getLatestWeight(),
      this.getHeight(),
    ]);

    let bmi = null;
    if (weight && height) {
      const heightInMeters = height.value / 100;
      bmi = (weight.value / (heightInMeters * heightInMeters)).toFixed(1);
    }

    return {
      weight,
      height,
      bmi: bmi ? parseFloat(bmi) : null,
    };
  }
}

// Instance singleton
const healthService = new HealthService();
export default healthService;
