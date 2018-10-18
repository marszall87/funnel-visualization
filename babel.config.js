/* eslint-env node */
module.exports = {
    presets: [
        [
            '@babel/preset-env',
            {
                targets: 'last 1 version, not dead',
                useBuiltIns: 'entry',
                modules: false
            }
        ]
    ],
    plugins: ['babel-plugin-fast-async']
};
