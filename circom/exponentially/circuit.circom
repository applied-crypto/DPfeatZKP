pragma circom 2.0.0;

include "./lib/poseidon.circom";
include "./lib/bitify.circom";
include "./lib/eddsaposeidon.circom";

template Main(nBits, d) {
   //signal output out;
   signal input challenge;
   signal input value;
   signal input probability[nBits][d];
   signal input R8[2];
   signal input S;
   signal input pk[2];

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

   signal randomSequence[254];

   for(var i = 0; i < 254; i++) {
      randomSequence[i] <== bitify.out[i];
   } 

   component isEqual[nBits][d];

   signal noiseBits[nBits];
   signal eval1[nBits][d];
   signal eval2[nBits][d];
   signal eval3[nBits][d + 1];
   signal hit[nBits][d + 1];

   for (var i = 0; i < nBits; i++) {
      for (var j = 0; j < d; j++) {
         isEqual[i][j] = IsEqual();
      }
   }

   for (var k = 0;  k < nBits; k++) {

      hit[k][0] <== 1;
      eval3[k][0] <== 0;

      for (var j = 0;  j < d; j++) {
         isEqual[k][j].in[0] <== probability[k][j];
         isEqual[k][j].in[1] <== randomSequence[k * d + j];

         hit[k][j + 1] <== hit[k][j] * isEqual[k][j].out;

         eval1[k][j] <== hit[k][j] * (1 - isEqual[k][j].out);
         eval2[k][j] <== eval1[k][j] * probability[k][j];
         eval3[k][j + 1] <== eval3[k][j] + eval2[k][j];
      }
      noiseBits[k] <== eval3[k][d];
   }

   component numify[2];
   numify[0] = Bits2Num(nBits);
   numify[1] = Bits2Num(nBits);

   for (var i = 0; i < nBits; i++) {
      numify[0].in[i] <== noiseBits[i];
   }

   //Random Bit String ab Bit 154 wieder frei

   signal noise <== numify[0].out;

   signal sign <== randomSequence[253] * (-1) + (1 - randomSequence[253]) * 1;

   signal resultA <== value + sign * noise; 
   
   for (var i = 0; i < nBits; i++) {
      numify[1].in[i] <== randomSequence[(d * nBits) + i];
   }
   component isZero = IsZero();
   isZero.in <== noise;
   signal isResultB <== isZero.out * (1 - sign);
   signal resultB <== isResultB * numify[1].out;
   
   signal result <== (1 - isResultB) * resultA + resultB;

/*
   component lT = LessThan(7);
   component gT = GreaterThan(7);

   lT.in[0] <== result;
   lT.in[1] <== 128;

   gT.in[0] <== result;
   gT.in[1] <== 0;
  
   signal both;
   both <== gT.out * lT.out;
   
   signal out1;
   signal out2;

   out1 <== (1 - both) * value;
   out2 <== out1 + both * result;
*/
   signal output out; 
   component modulo = Modulo();
   modulo.in <== result;
   modulo.mod <== 128;

   out <== modulo.out;   
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