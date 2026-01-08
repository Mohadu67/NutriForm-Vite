const { withAppBuildGradle } = require('@expo/config-plugins');

/**
 * Config plugin pour forcer minSdkVersion depuis gradle.properties
 * Nécessaire car expo-build-properties ne modifie pas automatiquement le build.gradle
 */
function withMinSdkFromProperties(config) {
  return withAppBuildGradle(config, (config) => {
    let buildGradle = config.modResults.contents;

    // Remplacer minSdkVersion pour lire depuis gradle.properties
    buildGradle = buildGradle.replace(
      /minSdkVersion\s+rootProject\.ext\.minSdkVersion/g,
      `minSdkVersion project.hasProperty('android.minSdkVersion') ? Integer.parseInt(project.property('android.minSdkVersion')) : rootProject.ext.minSdkVersion`
    );

    // Remplacer targetSdkVersion aussi pour cohérence
    buildGradle = buildGradle.replace(
      /targetSdkVersion\s+rootProject\.ext\.targetSdkVersion/g,
      `targetSdkVersion project.hasProperty('android.targetSdkVersion') ? Integer.parseInt(project.property('android.targetSdkVersion')) : rootProject.ext.targetSdkVersion`
    );

    config.modResults.contents = buildGradle;
    return config;
  });
}

module.exports = withMinSdkFromProperties;
