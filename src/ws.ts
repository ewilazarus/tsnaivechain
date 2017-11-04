import * as WebSocket from "ws";
import {blockchain, Blockchain} from "./domain";

// Messages
enum MessageType {
    QueryLatest,
    QueryAll,
    BlockchainResponse
}

interface Message {
    type : MessageType,
    data? : string
}

export const responseLatestMessage = () : Message => ({
    type: MessageType.BlockchainResponse,
    data: JSON.stringify([blockchain.lastBlock])
});

const responseAllMessage = () : Message => ({
    type: MessageType.BlockchainResponse,
    data: JSON.stringify(blockchain)
});

const queryLatestMessage = () : Message => ({
    type: MessageType.QueryLatest
});

const queryAllMessage = () : Message => ({
    type: MessageType.QueryAll
});


export const sockets : WebSocket[] = [];
const write = (ws : WebSocket, message : Message) => ws.send(JSON.stringify(message));
export const broadcast = (message : Message) => sockets.forEach(s => write(s, message));

const initConnection = (ws : WebSocket) : void => {
    sockets.push(ws);
    initMessageHandler(ws);
    initErrorHandler(ws);
    write(ws, queryLatestMessage());
}

const initMessageHandler = (ws : WebSocket) : void => {
    ws.on("message", (data : any) => {
        const message : Message = JSON.parse(data);
        switch (message.type) {
            case MessageType.QueryLatest:
                write(ws, responseLatestMessage());
                break;
            case MessageType.QueryAll:
                write(ws, responseAllMessage());
                break;
            case MessageType.BlockchainResponse:
                handleBlockchainResponse(message)
                break;
        }
    });
}

const handleBlockchainResponse = (message : Message) => {
    const receivedBlockchain : Blockchain = Blockchain.fromJSON(message.data as string);
    if (receivedBlockchain.lastBlock.index > blockchain.lastBlock.index) {
        console.log('Blockchain possibly behind');
        if (blockchain.lastBlock.hash === receivedBlockchain.lastBlock.previousHash) {
            console.log('We can append the received block to our chain');
            console.log('-----> ' + typeof(receivedBlockchain.lastBlock.isChainable));
            blockchain.addBlock(receivedBlockchain.lastBlock);
            broadcast(responseLatestMessage());
        } else if (receivedBlockchain.length === 1) {
            console.log('We have to query the chain from our peers');
            broadcast(queryAllMessage());
        } else if (blockchain.replace(receivedBlockchain)) {
            console.log('Received blockchain is longer than current blockchain');
            broadcast(responseLatestMessage());
        } else {
            console.log('Received blockchain is invalid');
        }
    } else {
        console.log('Received blockchain is not longer than current blockchain. Do nothing');
    }
}

const initErrorHandler = (ws : WebSocket) : void => {
    const closeConnection = (ws : WebSocket) => {
        console.error('Connection failed to peer ' + ws.url);
        sockets.splice(sockets.indexOf(ws), 1);
    };
    ws.on('close', () => closeConnection(ws));
    ws.on('error', () => closeConnection(ws));
}

export const connectToPeers = (newPeers : string[]) => {
    newPeers.forEach((peer) => {
        const peerWs = new WebSocket(peer);
        peerWs.on('open', () => initConnection(peerWs));
        peerWs.on('error', () => {
            console.error('Connection failed');
        });
    });
}

export const p2pServer = {
    listen: (port : number, fn : Function) => {
        const server = new WebSocket.Server({port: port});
        server.on('connection', ws => initConnection(ws));
        fn();
    }
};