pragma circom 2.0.0;

include "../../circom/circomlib/circuits/poseidon.circom";
include "../../circom/circomlib/circuits/bitify.circom";
include "../../circom/circomlib/circuits/eddsaposeidon.circom";


// include statements as before
template Main(nBits, d) {
   //signal output out;
   signal input challenge;
   signal input value;
   signal input prob[nBits][d];  // binary expansions of p_k
   signal input R8[2];           // signature and public key
   signal input S;
   signal input pk[2];

   // check the EdDSA signature of the challenge against pk and put it in the hash component to create randSeq, as in Figure 1 (lines 10 to 34). ...

   component eddsaVerifier = EdDSAPoseidonVerifier();
   eddsaVerifier.enabled <== 1;
   eddsaVerifier.Ax <== pk[0];
   eddsaVerifier.Ay <== pk[1];
   eddsaVerifier.S <== S;
   eddsaVerifier.R8x <== R8[0];
   eddsaVerifier.R8y <== R8[1];
   eddsaVerifier.M <== challenge;


   component hash = Poseidon(3);
   component bitify = Num2Bits_strict();

   hash.inputs[0] <== R8[0];
   hash.inputs[1] <== R8[1];
   hash.inputs[2] <== S;

   bitify.in <== hash.out;

   signal randSeq[254];

   for(var i = 0; i < 254; i++) {
      randSeq[i] <== bitify.out[i];
   }

   component isEqual[nBits][d];

   signal noiseBits[nBits];
   signal eval1[nBits][d];
   signal eval2[nBits][d];
   signal eval3[nBits][d + 1];
   signal hit[nBits][d + 1];

   // run the algorithm to create biased coins
   for (var i = 0; i < nBits; i++) {
      for (var j = 0; j < d; j++) {
         isEqual[i][j] = IsEqual();
      }
   }
   for (var k = 0;  k < nBits; k++) {
      hit[k][0] <== 1;
      eval3[k][0] <== 0;
      for (var j = 0;  j < d; j++) {
         isEqual[k][j].in[0] <== prob[k][j];
         isEqual[k][j].in[1] <== randSeq[k * d + j];

         hit[k][j + 1] <== hit[k][j] * isEqual[k][j].out;

         eval1[k][j] <== hit[k][j] * (1 - isEqual[k][j].out);
         eval2[k][j] <== eval1[k][j] * prob[k][j];
         eval3[k][j + 1] <== eval3[k][j] + eval2[k][j];
      }
      noiseBits[k] <== eval3[k][d];
   }

   component numify[2];
   // compute exponential noise from its binary representation
   numify[0] = Bits2Num(nBits);
   for (var i = 0; i < nBits; i++) {
      numify[0].in[i] <== noiseBits[i];
   }
   signal absNoise <== numify[0].out;
   signal sign <== 2 * randSeq[nBits * (d + 3)] - 1;
   signal signedNoise <== sign * absNoise;
   // generate uniformly distributed noise
   numify[1] = Bits2Num(nBits);
   for (var i = 0; i < nBits; i++) {
      numify[1].in[i] <== randSeq[nBits * (d + 2) + i];
   }

   // check if noise equals -0
   component isZero = IsZero();
   isZero.in <== signedNoise;
   signal isUnif <== isZero.out * (1 - randSeq[nBits * (d + 3) - 1]);
   signal unif <== isUnif * numify[1].out;

   signal result <== (1 - isUnif) * (value + signedNoise) + unif;

   component modulo = Modulo();
   modulo.in <== result;
   modulo.mod <== 128;

   signal output out <== modulo.out;
}

template Modulo() {
   signal input in;
   signal input mod;
   signal output out;

   signal div <-- in \ mod;
   out <-- in - (div * mod);
   in === div * mod + out;

   component lt = LessThan(252);
   lt.in[0] <== out;
   lt.in[1] <== mod;
   lt.out === 1;
}

component main {public [challenge, pk]} = Main(7, 22);