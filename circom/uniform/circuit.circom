pragma circom 2.0.0;

include "./poseidon.circom";
include "./lib/bitify.circom";
include "./lib/eddsaposeidon.circom";

template Main() {
   signal input value;
   signal input challenge;
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

   signal rand; 
   signal output out;

   rand <== randomSequence[0] * randomSequence[1];
   out <== (1 - randomSequence[0]) * value + randomSequence[1];
   
}

component main {public [challenge, pk]} = Main();