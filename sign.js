const { buildEddsa, buildPoseidon } = require("circomlibjs");
const { buildSimplePoseidon } = require("./poseidon");

const toHexString = bytes =>
    bytes.reduce((str, byte) => str + byte.toString(16).padStart(2, '0'), '');

const l = data => console.log(data);

async function buildSimpleEddsa() {
    const eddsa = await buildEddsa();
    const poseidon = await buildSimplePoseidon();



    /*     const msg = F.e(1234);
    
        const prvKey = Buffer.from("0001020304050607080900010203040506070809000102030405060708090001", "hex");
    
        const pubKey = eddsa.prv2pub(prvKey);
    
        const signature = eddsa.signPoseidon(prvKey, msg);
    
        assert(eddsa.verifyPoseidon(msg, signature, pubKey)); */
    let sk = "0001020304050607080900010203040506070809000102030405060708090001";
    let msg = 12345;
    let signature = poseidon.sign(sk, msg);
    let bigInt = {};
    bigInt.R8 = [];
    bigInt.R8[0] = poseidon.buff2bigIntString(signature.R8[0]);
    bigInt.R8[1] = poseidon.buff2bigIntString(signature.R8[1]);
    bigInt.S = signature.S.toString();

    l("Signature: " + JSON.stringify(bigInt));

    let pk = poseidon.sk2pk(sk);
    let pkBigInt = [];
    pkBigInt[0] = poseidon.buff2bigIntString(pk[0]);
    pkBigInt[1] = poseidon.buff2bigIntString(pk[1]);
    l("PK: " + JSON.stringify(pkBigInt));
    l(poseidon.verify(msg, signature, pk));
}

buildSimpleEddsa();

function bigIntToStringObject(obj) {
    return JSON.parse(JSON.stringify(obj, (key, value) =>
        typeof value === 'bigint'
            ? value.toString()
            : value // return everything else unchanged
    ));
}