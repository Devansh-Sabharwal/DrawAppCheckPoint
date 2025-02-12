import WebSocket,{WebSocketServer} from "ws";
import jwt from "jsonwebtoken"
import { JWT_SECRET } from "@repo/backend-common/config"
import db from "@repo/db/client"
interface User{
    ws: WebSocket,
    rooms: string[],
    userId: string
} 
let test = 0;
const users:User[] = [];
const wss = new WebSocketServer({port:8080});
function checkUser(token:string){
    try{
        const decoded = jwt.verify(token,JWT_SECRET);
        if(typeof decoded=="string"){
            return null;
        }
        if(!decoded || !decoded.id){
            return null;
        }
        return decoded.id;
    }
    catch(e){
        console.log("JWT didnt verify");
    }
}
wss.on('connection',(ws,req)=>{
    
    const url = req.url;
    if(!url) return;
    const queryParams = new URLSearchParams(url.split('?')[1]);
    const token = queryParams.get('token') || "";
    const userId = checkUser(token);
    if(!userId) {
        ws.close();
        return;
    }
    users.push({
        userId,
        rooms:[],
        ws
    }) 
    ws.on('message', async (data)=>{
        const parsedData = JSON.parse(data as unknown as string);
        if(parsedData.type==="join_room"){
            const user = users.find(x=>x.ws === ws);
            user?.rooms.push(parsedData.roomId);
        }
        if(parsedData.type==="leave_room"){
            const user = users.find(x=>x.ws==ws);
            if(!user) return;
            user.rooms = user?.rooms.filter(x=>x!==parsedData.roomId)
        }
        if(parsedData.type=="chat"){
            console.log(++test);
            const roomId = parsedData.roomId;
            const message = parsedData.message;
            try{
                await db.chat.create({
                    data:{
                        roomId:parseInt(roomId),
                        message,
                        userId
                    }
                });
                users.forEach(user=>{
                    if(user.rooms.includes(roomId)){
                        user.ws.send(JSON.stringify({
                            type:"chat",
                            message:message,
                            roomId
                        }))
                    }
                })
            }
            catch(e){
                console.log("An error occured");
                console.log(e);
                return;
            }
        }
    })
});