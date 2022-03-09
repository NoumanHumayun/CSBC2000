const crypto = require('crypto');
const uuid = require('uuid');

/**
 * Block represents a block in the blockchain. It has the
 * following params:
 * @index represents its position in the blockchain
 * @timestamp shows when it was created
 * @transactions represents the data about transactions
 * added to the chain
 * @hash represents the hash of the previous block
 */
class Block {
    constructor(index, transactions, prevHash, nonce, hash, merkelRoot) {
        this.index = index;
        this.timestamp = Math.floor(Date.now() / 1000);
        this.transactions = transactions;
        this.prevHash = prevHash;
        this.hash = hash;
        this.nonce = nonce;
        this.merkelRoot = merkelRoot;
    }
}

/**
 * A blockchain transaction. Has an amount, sender and a
 * recipient (not UTXO).
 */
class Transaction {
    constructor(amount, sender, recipient) {
        this.amount = amount;
        this.sender = sender;
        this.recipient = recipient;
        this.tx_id = uuid().split('-').join();
    }
}

/**
 * Blockchain represents the entire blockchain with the
 * ability to create transactions, mine and validate
 * all blocks.
 */
class Blockchain {
    constructor() {
        this.chain = [];
        this.pendingTransactions = [];
        this.addBlock('0');
        this.difficulty = '000';
    }

    /**
     * Creates a transaction on the blockchain
     */
    createTransaction(amount, sender, recipient) {
        this.pendingTransactions.push(new Transaction(amount, sender, recipient));
    }

    /**
     * Add a block to the blockchain
     */
    addBlock(nonce) {
        let index = this.chain.length;
        let prevHash = this.chain.length !== 0 ? this.chain[this.chain.length - 1].hash : '0';
        let merkelRoot = this.constructMerkleTree(this.pendingTransactions);    
        let hash = this.getHash(prevHash, merkelRoot, nonce);
        let block = new Block(index, this.pendingTransactions, prevHash, nonce, hash, merkelRoot);

        // reset pending txs
        this.pendingTransactions = [];
        this.chain.push(block);
    }

    /**
     * Gets the hash of a block.
     */
    getHash(prevHash, merkelRoot, nonce) {
        var encrypt = prevHash + merkelRoot +  nonce;
        var hash=crypto.createHmac('sha256', "secret")
            .update(encrypt)
            .digest('hex');
        return hash;
    }

    /**
     * Find nonce that satisfies our proof of work.
     */
    proofOfWork() {
        const prevHash = this.chain.length !== 0 ? this.chain[this.chain.length - 1].hash : '0';
        const nonce = crypto.randomBytes(2).toString('hex');
        // The resulting string will be twice as long as the random bytes you generate; 
        // each byte encoded to hex is 2 characters. 2 bytes will be 4 characters of hex.
        const hash = this.getHash(prevHash, this.merkelRoot, nonce);
        if(hash.startsWith(this.difficulty))
            return nonce;
        else 
            return this.proofOfWork();
    }

    /**
     * Mine a block and add it to the chain.
     */
    mine() {
        let tx_id_list = [];
        this.pendingTransactions.forEach((tx) => tx_id_list.push(tx.tx_id));
        let nonce = this.proofOfWork();
        this.addBlock(nonce);
    }


    /**
     * Check if the chain is valid by going through all blocks and comparing their stored
     * hash with the computed hash.
     */
    chainIsValid(){
        for(var i=0;i<this.chain.length;i++){
            let tx_id_list = [];
            this.chain[i].transactions.forEach((tx) => tx_id_list.push(tx.tx_id));

            if(i == 0 && this.chain[i].hash !==this.getHash('0',[],'0')){
                return false;
            }
            if(i > 0 && this.chain[i].hash !== this.getHash(this.chain[i-1].hash, this.chain[i].transactions, this.chain[i].nonce)){
                return false;
            }
            if(i > 0 && this.chain[i].prevHash !== this.chain[i-1].hash){
                return false;
            }
        }
        return true;
    }
    /**
   * Takes a list of transaction as input and
   * @param {TransactionList} transactionList
   */

 constructMerkleTree(transactionList) {
  let merkelRoot = []

    merkelRoot.unshift(transactionList);
    merkelRoot.unshift(transactionList.map((t) => t.hash));
  
    while (merkelRoot[0].length > 1) {
      let temp = [];
  
      for (let index = 0; index < merkelRoot[0].length; index += 2) {
        if (index < merkelRoot[0].length - 1 && index % 2 == 0)
        temp.push(crypto.createHmac('sha256', "secret")
        .update(merkelRoot[0][index] + merkelRoot[0][index + 1])
        .digest('hex'))
          
        else temp.push(crypto.createHmac('sha256', "secret")
        .update(merkelRoot[0][index])
        .digest('hex'));
      }
      merkelRoot.unshift(temp);
    }
    
    return merkelRoot[0][0];
  }
}


function simulateChain(blockchain, numTxs, numBlocks) {
    for(let i = 0; i < numBlocks; i++) {
        let numTxsRand = Math.floor(Math.random() * Math.floor(numTxs));
        for(let j = 0; j < numTxsRand; j++) {
            let sender = uuid().substr(0,5);
            let receiver = uuid().substr(0,5);
            blockchain.createTransaction(sender, receiver,
                                         Math.floor(Math.random() * Math.floor(1000)));
        }
        blockchain.mine();
    }
}

const BChain = new Blockchain();
simulateChain(BChain, 5, 3);

module.exports = Blockchain;

// uncomment these to run a simulation
console.dir(BChain,{depth:null});
console.log("******** Validity of this blockchain: ", BChain.chainIsValid());
