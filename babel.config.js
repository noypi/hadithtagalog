module.exports = function (api) {
    api.cache(true);
    return {
        presets: [
            'babel-preset-expo',
            /* knex polyfills */
            'module:@expo/knex-expo-sqlite-dialect/babel-preset'
        ],
        "plugins": [
            'react-native-reanimated/plugin',
            [
                "module-resolver",
                {
                    alias: {
                        '@lib': './src/lib/',
                        '@screens': './src/screens/',
                        '@data': './src/data/',
                        '@stores': './src/stores/',
                        '@config': './src/config/',
                    },
                },
            ],
            ['nativewind/babel'],
        ],
    };
};
