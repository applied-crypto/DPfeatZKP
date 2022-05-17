## Dependencies

- node (e.g., via nvm, see https://github.com/nvm-sh/nvm)
- python3 <br>
```sudo apt-get install -y python3```
- python3-pip      
```sudo apt-get install -y python3-pip```
    - matplotlib   
    ```python3 -m pip install matplotlib```
- circom (https://github.com/iden3/circom)
- snarkjs (https://github.com/iden3/snarkjs) 
- rapidsnark (https://github.com/iden3/rapidsnark) 

## Run
- run trusted setup (as described in the snarkjs repository)
- install packages   
```npm i ```
- generate histogram  
```node generateHistogramData.js && python3 plot.py```
