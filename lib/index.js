/*
 * Copyright (c) 1999-2003 AppGate Network Security AB. All Rights Reserved.
 *
 * This file contains Original Code and/or Modifications of Original Code as
 * defined in and that are subject to the MindTerm Public Source License,
 * Version 2.0, (the 'License'). You may not use this file except in compliance
 * with the License.
 *
 * You should have received a copy of the MindTerm Public Source License
 * along with this software; see the file LICENSE.  If not, write to
 * AppGate Network Security AB, Stora Badhusgatan 18-20, 41121 Goteborg, SWEDEN
 *
 *****************************************************************************/

/*
 * Author's comment: The contents of this file is heavily based upon Bruce
 * Schneier's c-code found in his book: Bruce Schneier: Applied Cryptography 2nd
 * ed., John Wiley & Sons, 1996
 *
 * The IDEA mathematical formula may be covered by one or more of the following
 * patents: PCT/CH91/00117, EP 0 482 154 B1, US Pat. 5,214,703.
 * Hence it might be subject to licensing for commercial use.
 */
const DEFAULT_XOR_KEY = 197; // default xor key using by ENC3
const BLOCK_SIZE = 8;        // bytes in a data-block

/**
 * @param {Int8Array} key
 * @param {number}    xorKey
 * @returns {exports}
 */
module.exports = function IDEA(key, xorKey = DEFAULT_XOR_KEY) {
    this.encryptor = new Engine()
    this.decryptor = new Engine();

    function Engine() {
        this.keySchedule = [];
        this.getBlockSize = () => BLOCK_SIZE;

        this.processBlock = (src, inOff, out, outOff) => {
            ideaCipher(src, inOff, out, outOff, this.keySchedule);
            return BLOCK_SIZE;
        };
    }

    /**
     * @param {Int8Array} key
     * @param {number} xorKey
     */
    this.setKey = function (key, xorKey) {
        ideaExpandKey(key, this.encryptor.keySchedule);
        ideaInvertKey(this.encryptor.keySchedule, this.decryptor.keySchedule);
        xorKey && (this.xorKey = xorKey);
    };

    /**
     * the method to encrypt
     * @param {Int8Array | Uint8Array} src
     * @returns {Int8Array}
     */
    this.encrypt = function (src) {
        const len = src.length, out = new Int8Array(len), srcOff = 0, outOff = 0;

        if (this.xorKey === -1) {
            Padding.noPaddingFinal(this.encryptor, src, srcOff, out, outOff, len);
        } else {
            Padding.xorPaddingFinal(this.encryptor, this.xorKey, src, srcOff, out, outOff, len);
        }

        return out;
    };

    /**
     * the method to decrypt
     * @param {Int8Array | Uint8Array} src
     * @returns {Int8Array}
     */
    this.decrypt = function (src) {
        const len = src.length, out = new Int8Array(len), srcOff = 0, outOff = 0;
        if (this.xorKey === -1) {
            Padding.noPaddingFinal(this.decryptor, src, srcOff, out, outOff, len);
        } else {
            Padding.xorPaddingFinal(this.decryptor, this.xorKey, src, srcOff, out, outOff, len);
        }

        return out;
    };

    /**
     * @param {Int8Array} key
     * @param {int[]}     keySchedule
     */
    function ideaExpandKey(key, keySchedule) {
        let i, ki = 0, j;
        for (i = 0; i < 8; i++) {
            keySchedule[i] = ((key[2 * i] & 0xff) << 8) | (key[(2 * i) + 1] & 0xff);
        }

        for (i = 8, j = 0; i < 52; i++) {
            j++;
            keySchedule[ki + j + 7]
                    = ((keySchedule[ki + (j & 7)] << 9)
                       | (keySchedule[ki + ((j + 1) & 7)] >>> 7)) & 0xffff;
            ki += j & 8;
            j &= 7;
        }
    }

    /**
     * @param {int[]} key
     * @param {int[]} keySchedule
     */
    function ideaInvertKey(key, keySchedule) {
        let i, j, k, t1, t2, t3;

        j = 0;
        k = 51;

        t1 = mulInv(key[j++]);
        t2 = (-key[j++]) & 0xffff;
        t3 = (-key[j++]) & 0xffff;
        keySchedule[k--] = mulInv(key[j++]);
        keySchedule[k--] = t3;
        keySchedule[k--] = t2;
        keySchedule[k--] = t1;

        for (i = 1; i < 8; i++) {
            t1 = key[j++];
            keySchedule[k--] = key[j++];
            keySchedule[k--] = t1;

            t1 = mulInv(key[j++]);
            t2 = (-key[j++]) & 0xffff;
            t3 = (-key[j++]) & 0xffff;
            keySchedule[k--] = mulInv(key[j++]);
            keySchedule[k--] = t2;
            keySchedule[k--] = t3;
            keySchedule[k--] = t1;
        }

        t1 = key[j++];
        keySchedule[k--] = key[j++];
        keySchedule[k--] = t1;

        t1 = mulInv(key[j++]);
        t2 = (-key[j++]) & 0xffff;
        t3 = (-key[j++]) & 0xffff;
        // noinspection UnusedAssignment
        keySchedule[k--] = mulInv(key[j++]);
        keySchedule[k--] = t3;
        keySchedule[k--] = t2;
        // noinspection UnusedAssignment
        keySchedule[k--] = t1;
    }


    function ideaCipher(src, srcOffset, out, outOffset, keySchedule) {
        let t1 = 0, t2, x1, x2, x3, x4, ki = 0;
        let l = getIntMSBO(src, srcOffset);
        let r = getIntMSBO(src, srcOffset + 4);

        x1 = (l >>> 16);
        x2 = (l & 0xffff);
        x3 = (r >>> 16);
        x4 = (r & 0xffff);

        for (let round = 0; round < 8; round++) {
            x1 = mul(x1 & 0xffff, keySchedule[ki++]);
            x2 = (x2 + keySchedule[ki++]);
            x3 = (x3 + keySchedule[ki++]);
            x4 = mul(x4 & 0xffff, keySchedule[ki++]);

            t1 = (x1 ^ x3);
            t2 = (x2 ^ x4);
            t1 = mul(t1 & 0xffff, keySchedule[ki++]);
            t2 = (t1 + t2);
            t2 = mul(t2 & 0xffff, keySchedule[ki++]);
            t1 = (t1 + t2);

            x1 = (x1 ^ t2);
            x4 = (x4 ^ t1);
            t1 = (t1 ^ x2);
            x2 = (t2 ^ x3);
            x3 = t1;
        }

        t2 = x2;
        x1 = mul(x1 & 0xffff, keySchedule[ki++]);
        x2 = (t1 + keySchedule[ki++]);
        x3 = ((t2 + keySchedule[ki++]) & 0xffff);
        x4 = mul(x4 & 0xffff, keySchedule[ki]);

        putIntMSBO((x1 << 16) | (x2 & 0xffff), out, outOffset);
        putIntMSBO((x3 << 16) | (x4 & 0xffff), out, outOffset + 4);
    }

    function mul(a, b) {
        const ab = a * b;
        if (ab !== 0) {
            const lo = ab & 0xffff;
            const hi = (ab >>> 16) & 0xffff;
            return ((lo - hi) + ((lo < hi) ? 1 : 0));
        }
        if (a === 0) {
            return (1 - b);
        }
        return (1 - a);
    }

    function mulInv(x) {
        let t0, t1, q, y;
        if (x <= 1) {
            return x;
        }
        t1 = Math.floor(0x10001 / x);
        y = 0x10001 % x;
        if (y === 1) {
            return ((1 - t1) & 0xffff);
        }
        t0 = 1;
        do {
            q = Math.floor(x / y);
            x = x % y;
            t0 += q * t1;
            if (x === 1) {
                return t0;
            }
            q = Math.floor(y / x);
            y = y % x;
            t1 += q * t0;
        } while (y !== 1);
        return ((1 - t1) & 0xffff);
    }

    function getIntMSBO(src, srcOffset) {
        return (((src[srcOffset] & 0xff) << 24)
                | ((src[srcOffset + 1] & 0xff) << 16)
                | ((src[srcOffset + 2] & 0xff) << 8)
                | (src[srcOffset + 3] & 0xff));
    }

    function putIntMSBO(val, dest, destOffset) {
        dest[destOffset] = ((val >>> 24) & 0xff);
        dest[destOffset + 1] = ((val >>> 16) & 0xff);
        dest[destOffset + 2] = ((val >>> 8) & 0xff);
        dest[destOffset + 3] = (val & 0xff);
    }

    this.setKey(key, xorKey);
    return this;
}


/**
 * @see org.bouncycastle.jcajce.provider.symmetric.util.BaseBlockCipher#engineSetPadding
 * BaseBlockCipher.engineSetPadding("NOPADDING")
 */
const Padding = {
    noPaddingFinal  : (cipher, src, inOff, out, outOff, len) => {
        doFinal(cipher, false, 0, src, inOff, out, outOff, len);
    },
    xorPaddingFinal : (cipher, xorKey, src, inOff, out, outOff, len) => {
        doFinal(cipher, true, xorKey, src, inOff, out, outOff, len);
    },
};

function doFinal(cipher, xorPadding, xorKey, src, inOff, out, outOff, len) {
    const blockSize = cipher.getBlockSize(); // assert Integer.bitCount(blockSize) == 1;
    const nBlocks = Math.floor(len / blockSize);

    // use the cipher algorithm for parts divided by the block size.
    for (let i = 0; i < nBlocks; i++) {
        cipher.processBlock(src, inOff, out, outOff);
        inOff += blockSize;
        outOff += blockSize;
        len -= blockSize;
    }

    if (!xorPadding && len > 0) {
        throw new Error('no padding, expecting more inputs');
    }

    // use xor encryption for remain parts
    for (let i = 0; i < len; i++) {
        out[outOff + i] = src[inOff + i] ^ xorKey;
    }
}
