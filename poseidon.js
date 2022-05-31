const { buildPoseidon, buildEddsa } = require('circomlibjs');
//import { string2buff, buff2bigIntString } from './utils.js';

async function buildSimplePoseidon() {
    /**
     * Poseidon hash function
     */
    let poseidon = await buildPoseidon();
    let eddsa = await buildEddsa();
    /**
    * Finite field of poseidon
    */
    const F = poseidon.F;

    /**
     * Converts an Uint8Array buffer into a BigInt string 
     * @param {Uint8Array} buff buffer
     * @returns {string} BigInt string
     */
    const buff2bigIntString = (buff) => {
        return F.toObject(buff).toString();
    };

    /**
     * Converts a BigInt string into a buffer array 
     * @param {string} string  BigInt string
     * @returns {Uint8Array} buffer
     */
    const bigIntString2buff = (string) => {
        return poseidon.F.e(string)
    };

    /**
     * Converts a string into an Uint8Array buffer 
     * @param {string} string  input string
     * @returns {Uint8Array} buffer
     */
    const string2buff = (string) => {
        let uint7 = new TextEncoder().encode(string);
        let n = Math.floor(uint7.length / 32) + 1;
        let buff = new Uint8Array(n * 32);
        buff.set(uint7, 0);
        return buff;
    }

    const sign = (sk, msg) => {

        let skBuff = Buffer.from(sk, "hex");

        const msgF = F.e(msg);

        return eddsa.signPoseidon(skBuff, msgF);
    }

    const sk2pk = (sk) => {

        let skBuff = Buffer.from(sk, "hex");

        return eddsa.prv2pub(skBuff);
    }

    const verify = (msg, signature, pk) => {
        const msgF = F.e(msg);

        return eddsa.verifyPoseidon(msgF, signature, pk);
    }

    /**
     * Wrapper for poseidon hash function which accepts strings and numbers outside an array 
     * @param {string | Uint8Array | Number | Number[]} input 
     * @returns {Uint8Array} hash of the input
     */
    const simplePoseidon = (input) => {
        // Convert if string is given - not inside an array 
        if (typeof input === "string" || Number.isInteger(input)) {
            if (!(/^\d+$/.test(input))) {
                return poseidon(string2buff(input));
            }
            return poseidon([input]);
        }

        return poseidon(input);
    };

    const toBigIntStringObject = (obj) => {
        return JSON.parse(JSON.stringify(obj, (key, value) => {
            if (value.constructor.name === 'Uint8Array') {
                return buff2bigIntString(value);
            } else if (typeof value === 'bigint') {
                return value.toString();
            } else {
                return value;
            }
        }));
    }

    simplePoseidon.toBigIntStringObject = toBigIntStringObject;

    simplePoseidon.F = F;

    simplePoseidon.string2buff = string2buff;

    simplePoseidon.buff2bigIntString = buff2bigIntString;

    simplePoseidon.bigIntString2buff = bigIntString2buff;

    simplePoseidon.sign = sign;

    simplePoseidon.sk2pk = sk2pk;

    simplePoseidon.verify = verify;

    return simplePoseidon;
}

async function test() {
    /*     const poseidon = await buildPoseidon();
        //let input = new Uint8Array(17 * 32);
        let input = string2buff("100");
        //let input = ["100"]
        console.log(Number.isInteger("100"));
        console.log(/^\d+$/.test("100"));
        let output = poseidon(input);
        console.log(output);
        console.log(buff2bigIntString(output, poseidon.F), "8540862089960479027598468084103001504332093299703848384261193335348282518119"); */
    const simplePoseidon = await buildSimplePoseidon();
    //    simplePoseidon.buff2bigIntString(simplePoseidon("100"));
    console.log(simplePoseidon.buff2bigIntString(simplePoseidon("100")));
    console.log(simplePoseidon.buff2bigIntString(simplePoseidon(100)));
    console.log(simplePoseidon("Hello World"));
    console.log(simplePoseidon([0, 1]));
}

module.exports = { buildSimplePoseidon };