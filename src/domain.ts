import { SHA256 } from "crypto-js";

const calculateHash = (index : number, previousHash : string, timestamp : number, data : string) : string => 
    SHA256(index + previousHash + timestamp + data).toString();


class Block {
    static get genesis() : Block {
        return new Block(0, "0", 1465154705, "I'm the genesis block", "816534932c2b7154836da6afc367695e6337db8a921823784c14378abed4f7d7");
    }
    
    index : number;
    previousHash : string;
    timestamp : number;
    data : string;
    hash : string;

    constructor(index : number, previousHash : string, timestamp : number, data : string, hash : string) {
        this.index = index;
        this.previousHash = previousHash;
        this.timestamp = timestamp;
        this.data = data;
        this.hash = hash;
    }

    calculateHash() : string {
        return calculateHash(this.index, this.previousHash, this.timestamp, this.data);
    }

    isChainable(blockchain : Blockchain) : boolean {
        const lastBlock = blockchain.lastBlock;

        if (lastBlock.index + 1 !== this.index) {
            console.error('Invalid index');
            return false;
        } 
        if (lastBlock.hash !== this.previousHash) {
            console.error('Invalid previous hash');
            return false;
        }
        if (this.calculateHash() !== this.hash) {
            console.error('Invalid hash');
            return false;
        }
        return true;
    }

    static fromObject(json : any) : Block {
        return new Block(json.index, json.previousHash, json.timestamp, json.data, json.hash);
    }
}


export class Blockchain {
    private _blocks : Block[];

    get lastBlock() : Block {
        return this._blocks[this._blocks.length - 1];
    }

    get length() : number {
        return this._blocks.length;
    }

    get isValid() : boolean {
        const tempBlockchain = new Blockchain();
        for (let i = 1; i < this.length; i++) {
            const block = this._blocks[i];
            if (block.isChainable(tempBlockchain)) {
                tempBlockchain._blocks.push(block);
            } else {
                return false;
            }
        }
        return true;
    }

    static fromJSON(json : string) : Blockchain {
        const blocks : Block[] = (JSON.parse(json).map((b : any) => Block.fromObject(b))).sort((b1 : Block, b2 : Block) => (b1.index - b2.index));
        const blockchain = new Blockchain();
        blockchain._blocks = blocks;
        return blockchain;
    }

    constructor() {
        this._blocks = [Block.genesis];
    }

    generateNextBlock(data : string) : boolean {
        const lastBlock = this.lastBlock;
        const index = lastBlock.index + 1;
        const timestamp = Math.round(new Date().getTime() / 1000);
        const hash = calculateHash(index, lastBlock.hash, timestamp, data);

        const block = new Block(index, lastBlock.hash, timestamp, data, hash);
        return this.addBlock(block);
    }

    addBlock(block : Block) : boolean {
        if (block.isChainable(this)) {
            this._blocks.push(block);
            return true;
        }
        return false;
    }

    replace(blockchain : Blockchain) : boolean {
        if (blockchain.isValid && blockchain.length > this.length) {
            console.log('Replacing current blockchain with received blockchain');
            this._blocks = blockchain._blocks;
            return true;
        }
        return false;
    }

    toJSON() {
        return this._blocks;
    }
}

export const blockchain = new Blockchain();
