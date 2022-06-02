const { writeFile } = require("fs");
const { buildSimplePoseidon } = require("./poseidon.js");

let challenge = 12345; // randomness from the verifier
//let skey = 12345;      // verifiable randomness from the prover
let skey = "0001020304050607080900010203040506070809000102030405060708090001";

let randomnessBeacon = parseInt(challenge.toString() + skey.toString()); // starting point for derivation of random numbers (hashes)
console.log("Randomness beacon:      " + randomnessBeacon.toString());

let currentRandomnessSeed = randomnessBeacon;   // running value for deriving randomness -- must be modified after each use in the hash function that serves as random oracle

let v = 50;                   // true value
let u = 128;                  // upper bound (maybe +- a power of two?)
let l = 0;                    // lower bound (maybe +- a power of two?)
let epsilon = 10;             // privacy parameter - larger epsilon means smaller perturbation
let d = 20;                   // precision of probabilities -- 2 ** (-20) should do

console.log("Original value v:       " + v);
console.log("Lower bound:            " + l);
console.log("Upper bound:            " + u);
console.log("epsilon (from DP def.): " + epsilon);
console.log("d (precision):          " + d);
console.log("");

let K = Math.ceil(u - l);
let nBits = Math.ceil(Math.log2(K));  // as the noise is bounded by K, its number of bits, nBits, is bounded by log2(K), rounded up
console.log(nBits)
console.log("K:                      " + K.toString());
console.log("Number of bits:         " + nBits.toString());
console.log("");
console.log("=======");

// comment this to see detailed logs
console.debug = function () { };

/*
// returns bit representation of the Poseidon hash of some input
function getPoseidonBits(input) {
    return poseidonCircomlib([input]).toString(2);
}

 */

// create probabilities -- these will be either hardcoded or public inputs (or their Merkle root is a public input)
let bitstrings = [];

for (let k = 0; k < nBits; k++) {

    console.debug("");
    console.debug("Round k=" + k);
    console.debug("---------------");
    console.debug("");
    let pk = 1 / (1 + Math.exp(2 ** k * epsilon / K));  // pk is the probability of the biased coin toss in this round to return a 1
    if (typeof (pk) == "undefined") pk = "0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000"; // if the argument in the exponential is too large, it will return undefined. In this case, pk = 0, so its bit representation is "0....0.
    console.debug("p_k:                   " + pk.toString());

    // retrieve the digits after the comma and fill insignificant bits to needed length if necessary
    let bitstring = pk.toString(2).substr(2, d + 2);
    while (bitstring.length < d) {
        bitstring = bitstring + "0";
    }
    console.debug("Binary representation B_{j,k}: " + pk.toString(2) + " --> " + bitstring)
    let sorted = [];
    for (let i = 0; i < bitstring.length; i++) {
        sorted.push(bitstring[i]);
    }
    bitstrings.push(sorted)
}

//console.log("Bitstrings B_k: " + bitstrings.toString());
console.log(JSON.stringify(bitstrings));



// returns exponential noise with cut-off on the boundaries
async function getDPRes(poseidon) {

    // create randomness with sufficient length -- there are nBit rounds that need up to d random bits and one bit for determining the sign of the noise
    let randomBitString = "";
    /*     while (randomBitString.length < nBits * d + 1) {
            //randomBitString = randomBitString + getPoseidonBits(currentRandomnessSeed);
            randomBitString = poseidonCircomlib([currentRandomnessSeed, challenge, skey]).toString(2);
            currentRandomnessSeed += 1; // update randomness for the next time, it is not i.i.d. if the same randomness is used as input for the Poseidon hash function every time
        } */
    challenge = Math.ceil(Math.random() * 1000000);
    let signature = poseidon.sign(skey, challenge);
    //    console.log(poseidon.toBigIntStringObject(signature));
    let bigInt = {};
    bigInt.R8 = [];
    bigInt.R8[0] = poseidon.buff2bigIntString(signature.R8[0]);
    bigInt.R8[1] = poseidon.buff2bigIntString(signature.R8[1]);
    bigInt.S = signature.S.toString();

    //    console.debug("Signature: " + JSON.stringify(bigInt));

    let pk = poseidon.sk2pk(skey);
    let pkBigInt = [];
    pkBigInt[0] = poseidon.buff2bigIntString(pk[0]);
    pkBigInt[1] = poseidon.buff2bigIntString(pk[1]);

    console.debug("PK: " + JSON.stringify(pkBigInt));

    console.debug(poseidon.verify(challenge, signature, pk));
    //Math.ceil(Math.random() * 1000000)
    //    let hash = BigInt(poseidon.buff2bigIntString(poseidon([signature.R8[0], signature.R8[1], signature.S])));
    let hash = BigInt(poseidon.buff2bigIntString(poseidon([signature.R8[0], signature.R8[1], signature.S])));

    console.debug("+++ Poseidon Hash: ", hash);
    randomBitString = hash.toString(2);
    let sorted = [];
    for (let i = randomBitString.length - 1; i >= 0; i--) {
        sorted.push(randomBitString[i]);
    }
    randomBitString = sorted;
    console.debug("Random sequence:       " + randomBitString);

    // this will become the bit representation of the noise -- each bit is determined according to an exponential distribution
    let res = "";

    // loop through all the nBits bits of the noise
    for (let k = 0; k < nBits; k++) {

        let bitstring = bitstrings[k];
        console.debug("B_{j,k}:                    " + bitstring);

        // run the algorithm that tosses a biased coin with winning probability pk
        for (let j = 0; j < d + 2; j++) {
            let positionRandomBitString = k * (d + 2) + j;
            let positionBitString = j;
            console.debug("");
            console.debug("Looking at position " + positionBitString.toString() + " in the B_{j,k} and at position " + positionRandomBitString.toString() + " in the random Bitstring");
            console.debug("    Bit from B_{j,k}:         " + bitstring[positionBitString]);
            console.debug("    Bit from randomness: " + randomBitString[positionRandomBitString]);

            if (bitstring[j] == randomBitString[positionRandomBitString]) {
                console.debug("Bits are equal -- Continuing with next j");
                continue;
            }
            console.debug("Bits are not equal -- Checking whether jth bit in the binary representation of the bias (B_{j,k}) is 1")
            // happens when Bits are not equal
            if (bitstring[positionBitString] == "1") {
                console.debug("    Bit is one -- coin toss results in 1")
                res = "1" + res;
                break;
            } else {
                console.debug("Bit is zero -- coin toss results in 0");
                res = "0" + res;
                break;
            }
        }
    }

    // determine the noise as number from its bit representation
    console.debug(res)
    let result = parseInt(res, 2)
    console.log("Noise: ", result)

    // determine the sign of the noise
    let sign = 2 * (randomBitString[(nBits) * (d + 3 + 2)] - 0.5); // +1 if last bit is 1, -1 if last bit is 0
    console.log("sign:", sign, "bit: ", randomBitString[(nBits) * (d + 3 + 2)]);
    if (sign == -1 && result == 0) {
        // take nBits bits from randomBitString to create uuid noise between 0 and 2^nBits - modulo will happen below
        let rand = randomBitString.slice(nBits * (d + 2 + 2), (nBits) * (d + 2 + 2) + (nBits)).join("")
        let sorted = [];
        for (let i = rand.length - 1; i >= 0; i--) {
            sorted.push(rand[i]);
        }
        result = parseInt(sorted.join(""), 2);
        console.log(randomBitString.slice(nBits * (d + 2 + 2), (nBits) * (d + 2 + 2) + (nBits)));
        console.log("RRRRrrrrrandom! \n +++")
        console.log("result:", result, "challenge:", challenge, "signature:", JSON.stringify(poseidon.toBigIntStringObject(signature)));
        return result;
    } else {
        result = sign * result;
    }
    // if the noise is too large, set noise to 0
    /*
    if (result < 0 || result > 128) {
        console.debug("Returning " + v + "noise mod " + 128);
        return result % 128;
    } else {
        console.debug("Returning " + result);
        return result;
    }

    */
    result = (v + result) % 128;
    if (result < 0) result += 128;
    console.log("result:", result, "challenge:", challenge, "signature:", JSON.stringify(poseidon.toBigIntStringObject(signature)));
    return result
}

async function implementCircom() {
    const simplePoseidon = await buildSimplePoseidon();
    let res = await getDPRes(simplePoseidon);
}

//implementCircom();

// for testing purposes only
async function createHistogram(poseidon, n) {

    let abs_counts = new Array(129).fill(0);
    console.debug(abs_counts);

    console.log("Creating Histogram for n=" + n);
    try {
        console.debug("Starting loop");
        for (let i = 0; i < n; i++) {
            console.debug("Loop for i=" + i);
            // let res = (v + await getDPRes(poseidon) - await getDPRes(poseidon)) % 128;
            // if (res < 0 ) res += 128;
            let res = await getDPRes(poseidon);
            console.log(i + "/" + n + " --> " + res);
            abs_counts[res]++;
        }
    } catch (err) {
        console.log(err);
    }

    console.debug(abs_counts);
    return abs_counts
}

async function saveData(n) {

    const simplePoseidon = await buildSimplePoseidon();

    let data = await createHistogram(simplePoseidon, n);
    console.log(data.length);

    let xs = new Array(129).fill(0);
    for (let i = 0; i < 129; i++) {
        xs[i] = i;
    }

    console.debug(xs.length);
    console.debug(data.length);

    console.debug("");
    console.debug("x values: ");
    console.debug(xs);

    console.debug("");
    console.debug("y-values: ")
    console.log(data);

    for (let i = 0; i < 129; i++) {
        console.log(data[i]);
        console.log(data[i] / n);
        data[i] = data[i] / n;
    }

    writeFile("./result.json", JSON.stringify({ "x": xs, "y": data }, null, 4), (err) => {
        if (err) console.log(err);
    })

    console.debug("Final randomness: " + currentRandomnessSeed);
}

saveData(10000);