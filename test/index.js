require('../lib/polyfill')

const testsContext = require.context('.', true, /-spec$/);
testsContext.keys().forEach(testsContext);
