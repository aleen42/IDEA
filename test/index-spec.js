/*
 * Copyright (c) 2021 Coremail.cn, Ltd. All Rights Reserved.
 */

const IDEA = require('../lib/index.js');

/* eslint-disable no-global-assign */
const encoding = require('text-encoding');

typeof TextEncoder === 'undefined' && (TextEncoder = encoding.TextEncoder);
typeof TextDecoder === 'undefined' && (TextDecoder = encoding.TextDecoder);

const encoder = new TextEncoder();
const decoder = new TextDecoder();

const str2bytes = str => {
    const len = str.length;
    const bytes = new Int8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = str.charCodeAt(i);
    }
    return bytes;
};

describe('IDEA', () => {
    function input(str) {
        typeof str !== 'string' && (str = JSON.stringify(str));

        const blockSize = 8;
        const srcBytes = encoder.encode(str);
        const len = Math.ceil(srcBytes.length / blockSize) * blockSize; // padding with \x00
        const src = new Int8Array(len);
        src.set(srcBytes);
        return src;
    }

    function output(out) {
        // eslint-disable-next-line no-control-regex
        return decoder.decode(out).replace(/\x00/g, ''); // strip \x00
    }

    // Convert a hex string to a byte array
    // REF: https://stackoverflow.com/a/34356351
    function hexToBytes(hex) {
        let bytes, c;
        for (bytes = [], c = 0; c < hex.length; c += 2) {
            bytes.push(parseInt(hex.substr(c, 2), 16));
        }
        return bytes;
    }

    // Convert a byte array to a hex string
    // REF: https://stackoverflow.com/a/34356351
    function bytesToHex(bytes) {
        let hex, i;
        for (hex = [], i = 0; i < bytes.length; i++) {
            let current = bytes[i] < 0 ? bytes[i] + 256 : bytes[i];
            hex.push((current >>> 4).toString(16));
            hex.push((current & 0xF).toString(16));
        }
        return hex.join('');
    }

    it('encrypt / decrypt', () => {
        const idea = new IDEA(str2bytes('private key'), /* no padding */-1);

        // encrypt
        expect(bytesToHex(idea.encrypt(input('null')))).toBe('c675f487ebb3e6cc');
        expect(bytesToHex(idea.encrypt(input(null)))).toBe('c675f487ebb3e6cc');
        expect(bytesToHex(idea.encrypt(input(false)))).toBe('aa4fb94e2fd3adb7');
        expect(bytesToHex(idea.encrypt(input(true)))).toBe('7cbd11e0ffc70e35');
        expect(bytesToHex(idea.encrypt(input({})))).toBe('95a64d37f8411ed6');
        expect(bytesToHex(idea.encrypt(input({a : 1, b : false})))).toBe('ae98e3c26bdab47476173ddd1fb16ae83b694639e5d4e433');

        // decrypt
        expect(output(idea.decrypt(hexToBytes('c675f487ebb3e6cc')))).toBe('null');
        expect(output(idea.decrypt(hexToBytes('aa4fb94e2fd3adb7')))).toBe('false');
        expect(output(idea.decrypt(hexToBytes('7cbd11e0ffc70e35')))).toBe('true');
        expect(output(idea.decrypt(hexToBytes('95a64d37f8411ed6')))).toBe('{}');
        expect(output(idea.decrypt(hexToBytes('ae98e3c26bdab47476173ddd1fb16ae83b694639e5d4e433'))))
                .toBe('{"a":1,"b":false}');
    });

    it('no padding', () => {
        const idea = new IDEA(str2bytes('private key'), /* no padding */-1);
        expect(() => {
            idea.encrypt(encoder.encode('null'));
        }).toThrow(new Error('no padding, expecting more inputs'));
    });

    it('padding', () => {
        const idea = new IDEA(str2bytes('private key'));
        expect(() => {
            idea.encrypt(encoder.encode('null'));
        }).not.toThrow();
    });
});
