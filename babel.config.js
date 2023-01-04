module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
        [
          'module-resolver',
          {
            root: ['./src'],
            extensions: [
              '.ios.js',
              '.android.js',
              '.js',
              '.json',
              '.ts',
              '.tsx',
              '.ios.ts',
              '.android.ts',
              '.ios.tsx',
              '.android.tsx',
            ],
            alias: {
              '@lib': './src/lib',
              '@screens': './src/screens',
              '@data': './src/data'
            },
          },
        ],
      ],
  };
};
