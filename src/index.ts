import {httpServer} from "./http";
import {p2pServer} from "./ws";

let httpPort = process.env.HTTP_PORT as string != null 
    ? parseInt(process.env.HTTP_PORT as string)
    : 5000;

let p2pPort = process.env.P2P_PORT as string != null
    ? parseInt(process.env.P2P_PORT as string)
    : 5001;

httpServer.listen(httpPort, () => console.log(`HTTP server listening on port ${httpPort}`));
p2pServer.listen(p2pPort, () => console.log(`P2P server listening on port ${p2pPort}`));
