const fs = require("fs");

let v = 25;                   // true value
let u = 50;                   // upper bound
let l = 0;                    // lower bound
let epsilon = 5;              // privacy parameter
let d = 50;                   // precision

console.log("Original value v:       " + v);
console.log("Lower bound:            " + l);
console.log("Upper bound:            " + u);
console.log("epsilon (from DP def.): " + epsilon);
console.log("d (precision):          " + d);
console.log("");

let K = Math.ceil(u-l);
console.log("K:                      " + K.toString());
console.log("");
console.log("=======");


let nBits = Math.ceil(Math.log2(K));

console.log("Number of bits:         " + nBits.toString());
console.log("")

console.debug = function() {};

function getDPRes() {

    //console.log = function() {}
    let res="";

    for (let k = 0; k < nBits; k++) {

        console.debug("");
        console.debug("Round k=" + k);
        console.debug("---------------");
        console.debug("");
        let pk = 1 / (1 + Math.exp(2**k * epsilon / K));
        if (typeof(pk) == "undefined") pk = "0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000"; // length u-d
        console.debug("p_k:                   " + pk.toString());

        let bitstring = pk.toString(2).substr(2, d + 2);
        while (bitstring.length < d) {
            bitstring = bitstring + "0000000000";
        }
        console.debug("Binary representation: " + pk.toString(2) + " --> " + bitstring)
        //console.debug("Relevant: " + bitstring);
        //console.debug("Length: " + bitstring.length)

        let randomstring = "";
        while (randomstring.length < d + 1) {
            randomstring = randomstring + Math.random().toString(2).substr(2, d + 3);
        }
        console.debug("Random sequence:       " + randomstring);  // replaces hash function

        for (let j = 0; j < d; j++) {
            console.debug("");
            console.debug("Looking at position " + j.toString());
            console.debug("    Bit from pk:         " + bitstring[j]);
            console.debug("    Bit from randomness: " + randomstring[j]);

            if (bitstring[j] == randomstring[j]) {
                console.debug("Bits are equal -- Continuing with next j");
                continue;
            }

            console.debug("Bits are not equal -- Checking whether jth bit in the binary representation of the bias (B_{j,k}) is 1")
            // happens when Bits are not equal
            if (bitstring[j] == "1") {
                console.debug("    Bit is one -- determining noise")
                res = "1" + res;
                break;
                // randomstring[d] is the last random bit for the sign
                if (randomstring[d] == 0) {
                    if (v + k > u) {
                        console.debug("Returning original v (overflow case): " + v);
                        return v;
                    } else {
                        console.debug("    Using noise " + k);
                        console.debug("");
                        console.debug("Returning " + (v + k));
                        return v + k;
                    }
                } else {
                    if (v - k < l) {
                        console.debug("Returning original v (overflow case): " + v);
                        return v;
                    } else {
                        console.debug("    Using noise " + (-k));
                        console.debug("");
                        console.debug("Returning " + (v - k));
                        return v - k;
                    }
                }
            } else {
                console.debug("Breaking (Bits not equal but binary expansion bit is zero) -- next k");
                res = "0" + res;
                break;
            }
        }
    }
    console.debug("");
    console.debug("Returning original v because loop ended (non-termination case): " + v);

    let result = parseInt(res, 2)
    let sign = 2 * ((Math.ceil(Math.random() * 1000) % 2) - 0.5);
    result = v + sign * result;

    if (result < -128 || result > 128) return v;
    else return result;
    //return v;

}

function createHistogram(n) {

    let abs_counts = new Array(257).fill(0);
    console.debug(abs_counts);

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

let data = createHistogram(100000);

let xs = new Array(257).fill(0);
for (let i = -128; i < 129; i++) {
    xs[i+128] = i;
}

console.debug(xs.length);
console.debug(data.length);

console.log("");
console.log("x values: ");
console.log(xs);

console.log("");
console.log("y-values: ")
console.log(data);

fs.writeFile("./result.json", JSON.stringify({"x": xs, "y": data}, null, 4), (err) => {
    if(err) console.log(err);
})
