module.exports = function (api) {
  api.cache(true);
  // babel-preset-expo (SDK56) covers expo-router transforms.
  return {
    presets: ['babel-preset-expo'],
  };
};
