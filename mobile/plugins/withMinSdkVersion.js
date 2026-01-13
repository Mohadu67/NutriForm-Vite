const { withAppBuildGradle } = require('@expo/config-plugins');

/**
 * Config plugin pour forcer minSdkVersion à 26
 * Nécessaire pour androidx.health.connect:connect-client
 */
const withMinSdkVersion = (config) => {
  return withAppBuildGradle(config, (config) => {
    if (config.modResults.language === 'groovy') {
      // Remplacer minSdkVersion dans defaultConfig
      config.modResults.contents = config.modResults.contents.replace(
        /minSdkVersion\s*=?\s*\d+/g,
        'minSdkVersion 26'
      );
    }
    return config;
  });
};

module.exports = withMinSdkVersion;
