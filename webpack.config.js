const path = require('path');
const TerserPlugin = require('terser-webpack-plugin');
const ES3HarmonyPlugin = require('./build/ES3HarmonyPlugin');

module.exports = minimize => ({
    mode   : 'production',
    target : ['web', 'es5'],
    output : {
        path          : path.resolve(__dirname, 'dist'),
        libraryTarget : 'umd',
        globalObject  : 'typeof window !== \'undefined\' ? window : this',
    },

    module : {
        rules : [{
            test : /\..?js$/,
            use  : {
                loader  : 'babel-loader',
                options : {
                    presets : [
                        ['@babel/env', {
                            forceAllTransforms : true,
                            loose              : true,
                            modules            : false, // ES6 modules should be processed only by webpack

                            // see https://github.com/babel/babel/issues/1087#issuecomment-373375175, naming anonymous functions is problematic
                            exclude : ['@babel/plugin-transform-function-name'],
                        }],
                    ],
                },
            },
        }],
    },

    entry : {
        [`idea${minimize ? '.min' : ''}`] : './lib/index',
        [`idea.all${minimize ? '.min' : ''}`] : ['./lib/polyfill', './lib/index'],
    },

    optimization : minimize ? {
        minimizer : [new TerserPlugin({terserOptions : {ie8 : true}})],
    } : {minimize : false},

    plugins : [new ES3HarmonyPlugin()],
});
