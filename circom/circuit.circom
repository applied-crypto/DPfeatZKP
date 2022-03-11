include "./lib/poseidon.circom";
include "./lib/bitify.circom";

template Main(nBits, d) {
   //signal output out;
   signal input secretKey; 
   signal input challenge;
   signal randomSequence[254];
   signal input probability[nBits][d];
   
   component hash = Poseidon(2);
   component bitify = Num2Bits_strict();

   hash.inputs[0] <== secretKey;
   hash.inputs[1] <== challenge;

   bitify.in <== hash.out; 

   for(var i = 0; i < 254; i++) {
      randomSequence[i] <== bitify.out[i];
   } 

   component isEqual[nBits][d];

   signal output result[nBits];
   signal evaluation1[nBits][d];
   signal evaluation2[nBits][d];
   signal evaluation3[nBits][d + 1];
   signal hit[nBits][d + 1];

   for (var i = 0; i < nBits; i++) {
      for (var j = 0; j < d; j++) {
         isEqual[i][j] = IsEqual();
      }
   }

   for (var k = 0;  k < nBits; k++) {

      hit[k][0] <== 1;
      evaluation3[k][0] <== 0;

      for (var j = 0;  j < d; j++) {
         isEqual[k][j].in[0] <== probability[k][j];
         isEqual[k][j].in[1] <== randomSequence[k * d + j];

         hit[k][j + 1] <== hit[k][j] * isEqual[k][j].out;

         evaluation1[k][j] <== hit[k][j] * (1 - isEqual[k][j].out);
         evaluation2[k][j] <== evaluation1[k][j] * probability[k][j];
         evaluation3[k][j + 1] <== evaluation3[k][j] + evaluation2[k][j];
      }
      result[k] <== evaluation3[k][d];
   }

   component numify = Bits2Num(nBits);
   for (var i = 0; i < nBits; i++) {
      numify.in[i] <== result[i];
   }

   signal output out;
   out <== numify.out;
   
}

component main {public [challenge]} = Main(7, 22);