import * as express from "express";
import * as bodyParser from "body-parser";
import {blockchain} from "./domain";
import {broadcast, responseLatestMessage, sockets, connectToPeers} from "./ws";

const app = express();
app.use(bodyParser.json())

app.get("/blocks", (request: express.Request, response: express.Response) => response.json(blockchain));
app.post("/mineBlock", (request : express.Request, response : express.Response) => {
    blockchain.generateNextBlock(request.body.data);
    broadcast(responseLatestMessage());
    response.send();
});
app.get("/peers", (request : express.Request, response : express.Response) => {
    response.send(sockets.map(s => s.url));
});
app.post("/addPeers", (request : express.Request, response : express.Response) => {
    connectToPeers(request.body.peers)
});

export const httpServer = app;