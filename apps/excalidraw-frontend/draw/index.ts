import { HTTP_BACKEND } from "@/config";
import axios from "axios";
interface DrawInitProps{
    ctx: CanvasRenderingContext2D,
    canvas:HTMLCanvasElement,
    roomId:string
    socket: WebSocket
    shape?:string
}
type Shape = {
    type:"rect",
    x:number,
    y:number,
    width:number,
    height:number,
}|{
    type:"circle",
    x:number,
    y:number,
    radiusX:number,
    radiusY:number,
    rotation?:number
}
export async function drawInit({ctx,canvas,roomId,socket,shape}:DrawInitProps){
            const existingShapes :Shape[] = await getExistingChats(roomId);
            const currShape = shape;

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
                console.log(currShape);
                clicked = false;
                if(currShape=="rect"){
                    const width = e.clientX-startX;
                    const height = e.clientY-startY;
                    const shape:Shape= {
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
                }
                if(currShape=="circle"){
                    const radiusX = Math.abs(e.clientX - startX);
                    const radiusY = Math.abs(e.clientY - startY);
                    const shape:Shape= {
                        type:"circle",
                        x:startX,
                        y:startY,
                        radiusX,
                        radiusY
                    }
                    existingShapes.push(shape)
                    socket.send(JSON.stringify({
                        type: "chat",
                        roomId:roomId,
                        message: JSON.stringify(shape)  // ✅ Only stringify the shape itself
                    }));
                }
                
                
                
            })
            canvas.addEventListener("mousemove",(e)=>{
                if(clicked){
                    if(currShape=="rect"){
                        drawRect(startX,startY,e,canvas,ctx,existingShapes);
                    }
                    else if(currShape=="circle"){
                        drawCircle(startX,startY,e,canvas,ctx,existingShapes);
                    }
                }
            })
}
function drawCircle(startX:number,startY:number,e:MouseEvent,canvas:HTMLCanvasElement,ctx:CanvasRenderingContext2D,existingShapes:Shape[]){
    const radiusX = Math.abs(e.clientX-startX);
    const radiusY = Math.abs(e.clientY-startY);
//<!-- ellipse(x, y, radiusX, radiusY, rotation, startAngle, endAngle) -->
    clearCanvas(existingShapes,ctx,canvas);
    ctx.strokeStyle="white";
    ctx.beginPath();
    ctx.ellipse(startX,startY,radiusX,radiusY,0,0,2 * Math.PI);
    ctx.stroke();
}
function drawRect(startX:number,startY:number,e:MouseEvent,canvas:HTMLCanvasElement,ctx:CanvasRenderingContext2D,existingShapes:Shape[]){
    const width = e.clientX-startX;
    const height = e.clientY-startY;
    clearCanvas(existingShapes,ctx,canvas);
    ctx.strokeStyle = "white"
    ctx.strokeRect(startX,startY,width,height);
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
        if(shape.type=="circle"){
            ctx.beginPath();
            ctx.ellipse(shape.x, shape.y, shape.radiusX, shape.radiusY, 0, 0, 2 * Math.PI);
            ctx.stroke();
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
    return shapes
}