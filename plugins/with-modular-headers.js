const { withPodfile } = require("@expo/config-plugins");

module.exports = function withModularHeaders(config) {
  return withPodfile(config, (config) => {
    const podfile = config.modResults.contents;

    if (podfile.includes("use_modular_headers!")) {
      return config;
    }

    config.modResults.contents = podfile.replace(
      /(platform :ios, [^\n]+\n)/,
      "$1use_modular_headers!\n",
    );

    return config;
  });
};
