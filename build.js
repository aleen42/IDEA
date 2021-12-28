const webpack = require('webpack');
const config = require('./webpack.config');

// build uncompressed
webpack(config(0)).run(webpackCallback);
// build minimized
webpack(config(1)).run(webpackCallback);

function log(msg) {
    log.logged ? console.log('') : (log.logged = true); // add blank line
    console.log(msg);
}

function webpackCallback(err, stats) {
    if (err) {
        process.exit(1);
    }
    log(stats.toString({
        colors : true,
    }));
}
