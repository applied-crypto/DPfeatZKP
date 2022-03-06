const { writeFile } = require("fs");
const { poseidonCircomlib } = require("./poseidonCircomlib");

let challenge = 12345; // randomness from the verifier
let skey = 67890;      // verifiable randomness from the prover

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

let K = Math.ceil(u-l);
let nBits = Math.ceil(Math.log2(K));  // as the noise is bounded by K, its number of bits, nBits, is bounded by log2(K), rounded up
console.log("K:                      " + K.toString());
console.log("Number of bits:         " + nBits.toString());
console.log("");
console.log("=======");

// comment this to see detailed logs
console.debug = function() {};

// returns bit representation of the Poseidon hash of some input
function getPoseidonBits(input){
    return poseidonCircomlib([input]).toString(2);
}

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
    bitstrings.push(bitstring)
}

console.log("Bitstrings B_k: " + bitstrings.toString());



// returns exponential noise with cut-off on the boundaries
function getDPRes() {

    // create randomness with sufficient length -- there are nBit rounds that need up to d random bits and one bit for determining the sign of the noise
    let randomBitString = "";
    while (randomBitString.length < nBits * d + 1) {
        randomBitString = randomBitString + getPoseidonBits(currentRandomnessSeed);
        currentRandomnessSeed += 1; // update randomness for the next time, it is not i.i.d. if the same randomness is used as input for the Poseidon hash function every time
    }
    console.debug("Random sequence:       " + randomBitString);

    // this will become the bit representation of the noise -- each bit is determined according to an exponential distribution
    let res="";

    // loop through all the nBits bits of the noise
    for (let k = 0; k < nBits; k++) {

        let bitstring = bitstrings[k];
        console.debug("B_{j,k}:                    " + bitstring);

        // run the algorithm that tosses a biased coin with winning probability pk
        for (let j = 0; j < d; j++) {
            console.debug("");
            console.debug("Looking at position " + j.toString() + " in the B_{j,k} and at position " + (k * d + j).toString() + " in the random Bitstring");
            console.debug("    Bit from B_{j,k}:         " + bitstring[j]);
            console.debug("    Bit from randomness: " + randomBitString[k * d + j]);

            if (bitstring[j] == randomBitString[k * d + j]) {
                console.debug("Bits are equal -- Continuing with next j");
                continue;
            }

            console.debug("Bits are not equal -- Checking whether jth bit in the binary representation of the bias (B_{j,k}) is 1")
            // happens when Bits are not equal
            if (bitstring[j] == "1") {
                console.debug("    Bit is one -- coin toss results in 1")
                res = "1" + res;
                break;
            } else {
                console.debug("But is zero -- coin toss results in 0");
                res = "0" + res;
                break;
            }
        }
    }

    // determine the noise as number from its bit representation
    let result = parseInt(res, 2)

    // determine the sign of the noise
    let sign = 2 * (randomBitString[nBits * d + 1] - 0.5); // +1 if last bit is 1, -1 if last bit is 0
    result = v + sign * result;

    // if the noise is too large, set noise to 0
    if (result < -128 || result > 128) return v;
    else return result;

}

// for testing purposes only
function createHistogram(n) {

    let abs_counts = new Array(257).fill(0);
    console.debug(abs_counts);

    console.log("");
    console.log("Creating Histogram for n=" + n);
    try {
        console.debug("Starting loop");
        for (let i = 0; i < n; i++) {
            console.debug("Loop for i=" + i);
            let res = getDPRes();
            console.debug(res);
            abs_counts[res + 128]++;
        }
    } catch (err) {
        console.log(err);
    }

    console.debug(abs_counts);
    return abs_counts
}

let data = createHistogram(10000);

let xs = new Array(257).fill(0);
for (let i = -128; i < 129; i++) {
    xs[i+128] = i;
}

console.debug(xs.length);
console.debug(data.length);

console.debug("");
console.debug("x values: ");
console.debug(xs);

console.debug("");
console.debug("y-values: ")
console.debug(data);

writeFile("./result.json", JSON.stringify({"x": xs, "y": data}, null, 4), (err) => {
    if(err) console.log(err);
})

console.debug("Final randomness: " + currentRandomnessSeed);