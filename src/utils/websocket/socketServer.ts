import{ WebSocketServer }from "ws";

export const wss: WebSocketServer = new WebSocketServer({noServer: true});


wss.on("connection", (ws, request)=>{

    console.log("Connected to client");

    ws.on("message", (data) =>{

        const prompt:string = data.toString();
        console.log(prompt);

        const obj: {role: string, message: string} = {role: "model", message: "hassan"};
        ws.send(JSON.stringify(obj));
    });


    ws.on("close", ()=>{
        console.log("Disconnected");
    });
});
