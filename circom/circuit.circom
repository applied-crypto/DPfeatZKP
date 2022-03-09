include "./lib/poseidon.circom";
include "./lib/bitify.circom";

template Main(nBits, d) {
   signal output out;
   signal input secretKey; 
   signal input challenge;
   signal output randomSequence[254];
   signal input bitstring[7][20];
   
   component hash = Poseidon(2);
   component bitify = Num2Bits_strict();

   hash.inputs[0] <== secretKey;
   hash.inputs[1] <== challenge;

   bitify.in <== hash.out; 

   for(var i = 0; i < 254; i++) {
      randomSequence[i] <== bitify.out[i];
   }

   out <== hash.out;

   for (var k = 0;  k < nBits; k++) {
// Line 84
      
   }
   
}

component main {public [challenge]} = Main(7);