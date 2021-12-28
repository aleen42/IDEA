# IDEA

![npm](https://badges.aleen42.com/src/npm.svg) ![javascript](https://badges.aleen42.com/src/javascript.svg)

It is about the IDEA cypher which is implemented in JavaScript within ~10 KiB. If you want better compatibility, you may need the polyfill version `dist/idea.all.js`, which has shimmed [`Int8Array`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Int8Array) for you.

## Compatibility

- IE6+ (polyfills required for ES7- browsers)
- NodeJS

## Install

```bash
npm install @cormeail/idea
```

## Usage

- without padding:

    ```js
    function paddingToBytes(str) {
        typeof str !== 'string' && (str = JSON.stringify(str));

        const blockSize = 8;
        const srcBytes = encoder.encode(str);
        const len = Math.ceil(srcBytes.length / blockSize) * blockSize; // padding with \x00
        const src = new Int8Array(len);
        src.set(srcBytes);
        return src;
    }
  
    const IDEA = require('@coremail/idea');
    const idea = new IDEA(str2bytes('private key'), /* no padding */-1);
    idea.encrypt(paddingToBytes('message')); // => Int8Array[]
    ```

- with xor padding (ENC3 by default):

    ```js
    const encoder = new TextEncoder(); 
    const IDEA = require('@coremail/idea');
    const idea = new IDEA(str2bytes('private key'), /* ENC3 by default */197);
    idea.encrypt(encoder.encode('message')); // => Int8Array[]
    ```
