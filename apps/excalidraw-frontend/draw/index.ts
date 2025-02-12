import { HTTP_BACKEND } from "@/config";
import axios from "axios";
interface DrawInitProps{
    ctx: CanvasRenderingContext2D,
    canvas:HTMLCanvasElement,
    roomId:string
    socket: WebSocket
}
type Shape = {
    type:"rect",
    x:number,
    y:number,
    width:number,
    height:number,
}|{
    type:"circle",
    centerX:number,
    centerY:number,
    radius:number
}
export async function drawInit({ctx,canvas,roomId,socket}:DrawInitProps){
            const existingShapes :Shape[] = await getExistingChats(roomId);

            socket.onmessage = (event)=>{
                const message = JSON.parse(event.data);
                if(message.type=="chat"){
                    const parsedShape = JSON.parse(message.message);
                    existingShapes.push(parsedShape);
                    clearCanvas(existingShapes,ctx,canvas);
                }
            }
            let clicked = false;
            let startX = 0;
            let startY = 0;
            // ctx.fillStyle = "blue";
            // ctx.fillRect(0, 0, canvas.width, canvas.height);
            clearCanvas(existingShapes,ctx,canvas);
            ctx.strokeStyle = "white";
            canvas.addEventListener("mousedown",(e)=>{
                clicked = true;

                startX = (e.clientX);
                startY = (e.clientY);
            })
            canvas.addEventListener("mouseup",(e)=>{
                clicked = false;
                const width = e.clientX-startX;
                const height = e.clientY-startY;
                const shape:Shape = {
                    type:"rect",
                    x:startX,
                    y:startY,
                    width:width,
                    height:height
                }
                existingShapes.push(shape)
                socket.send(JSON.stringify({
                    type: "chat",
                    roomId:roomId,
                    message: JSON.stringify(shape)  // ✅ Only stringify the shape itself
                }));
                
                
            })
            canvas.addEventListener("mousemove",(e)=>{
                if(clicked){
                    const width = e.clientX-startX;
                    const height = e.clientY-startY;
                    clearCanvas(existingShapes,ctx,canvas);
                    ctx.strokeStyle = "white"
                    ctx.strokeRect(startX,startY,width,height);
                }
            })
}
function clearCanvas(existingShapes:Shape[],ctx:CanvasRenderingContext2D,canvas:HTMLCanvasElement){

    ctx.clearRect(0,0,canvas.width,canvas.height);
    // ctx.fillStyle = "black"
    // ctx.fillRect(0,0,canvas.height,canvas.width);

    existingShapes.map((shape)=>{
        if(shape.type=="rect"){
            ctx.strokeStyle = "white"
            ctx.strokeRect(shape.x,shape.y,shape.width,shape.height);
        }
    })
}
async function getExistingChats(roomId: string){
    const res = await axios.get(`${HTTP_BACKEND}/chats/${roomId}`, {
        headers: {
            Authorization: `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjcyZmM1NzI5LWQwNjctNGY1Ni05OWI3LTEyYjZjNGIxMzcyMyIsImlhdCI6MTczOTE2ODAyNH0.PBSB15fT0fhQ61MLSb2uwMYjLn-c9ZmUUuUkVgoul8s` // Set token here
        }
    });
    const messages = res.data.messages;

    const shapes = messages.map((x:{message:string})=>{
        const messageData = JSON.parse(x.message);
        return messageData;
    })
    console.log(shapes);
    return shapes
}