import { getExistingChats } from "./http";
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
export class Draw{
    private ctx: CanvasRenderingContext2D;
    private canvas: HTMLCanvasElement;
    private socket: WebSocket
    private roomId: string;
    private existingShapes: Shape[] = [];
    private clicked:boolean = false;
    private startX:number = 0;
    private startY:number = 0;
    private currShape = "rect";

    constructor(canvas:HTMLCanvasElement,ctx: CanvasRenderingContext2D,socket:WebSocket,roomId:string){
        this.ctx = ctx;
        this.ctx.strokeStyle = "white";
        this.canvas = canvas;
        this.socket = socket;
        this.roomId = roomId;
        this.init();
        this.initHandlers();
        this.initMouseHandlers();
    }
    destroy(){
        this.canvas.removeEventListener("mousedown",this.mouseDownHandler);
        this.canvas.removeEventListener("mouseup",this.mouseUpHandler);
        this.canvas.removeEventListener("mousemove",this.mouseMoveHandler);
    }
    setTool(shape: "circle" | "pencil" | "rect") {
        this.currShape = shape;
    }

    async init(){
        this.existingShapes = await getExistingChats(this.roomId);
    }
    initHandlers(){
        this.socket.onmessage = (event)=>{
            const message = JSON.parse(event.data);
            if(message.type=="chat"){
                const parsedShape = JSON.parse(message.message);
                this.existingShapes.push(parsedShape);
                this.clearCanvas();
            }
        }
    }
    initMouseHandlers() {
        this.canvas.addEventListener("mousedown", this.mouseDownHandler)
        this.canvas.addEventListener("mouseup", this.mouseUpHandler)
        this.canvas.addEventListener("mousemove", this.mouseMoveHandler)    
    }

    clearCanvas(){
        this.ctx.clearRect(0,0,this.canvas.width,this.canvas.height);
        this.existingShapes.map((shape)=>{
            if(shape.type=="rect"){
                this.ctx.strokeStyle = "white"
                this.ctx.strokeRect(shape.x,shape.y,shape.width,shape.height);
            }
            if(shape.type=="circle"){
                this.ctx.beginPath();
                this.ctx.ellipse(shape.x, shape.y, shape.radiusX, shape.radiusY, 0, 0, 2 * Math.PI);
                this.ctx.stroke();
            }
        })
    }
    mouseDownHandler = (e:MouseEvent)=>{
        this.clicked = true;
        this.startX = (e.clientX);
        this.startY = (e.clientY);
    }
    mouseUpHandler = (e:MouseEvent) =>{
        this.clicked = false;
        let shape:Shape|null = null;
        if(this.currShape=="rect"){
            const width = e.clientX-this.startX;
            const height = e.clientY-this.startY;
            shape= {
                type:"rect",
                x:this.startX,
                y:this.startY,
                width:width,
                height:height
            }
        }
        if(this.currShape=="circle"){
            const radiusX = Math.abs(e.clientX - this.startX);
            const radiusY = Math.abs(e.clientY - this.startY);
            shape =  {
                type:"circle",
                x:this.startX,
                y:this.startY,
                radiusX,
                radiusY
            }
        }
        if(!shape) return;
        this.existingShapes.push(shape)
        this.socket.send(JSON.stringify({
            type: "chat",
            roomId:this.roomId,
            message: JSON.stringify(shape)  // ✅ Only stringify the shape itself
        }));
                
    }
    mouseMoveHandler = (e:MouseEvent)=>{
        if(this.clicked){
            if(this.currShape=="rect"){
                this.drawRect(e);
            }
            else if(this.currShape=="circle"){
                this.drawCircle(e);
            }
        }
    }
    drawCircle(e:MouseEvent){
        const radiusX = Math.abs(e.clientX-this.startX);
        const radiusY = Math.abs(e.clientY-this.startY);
    //<!-- ellipse(x, y, radiusX, radiusY, rotation, startAngle, endAngle) -->
        this.clearCanvas();
        this.ctx.strokeStyle="white";
        this.ctx.beginPath();
        this.ctx.ellipse(this.startX,this.startY,radiusX,radiusY,0,0,2 * Math.PI);
        this.ctx.stroke();
    }
    drawRect(e:MouseEvent){
        const width = e.clientX-this.startX;
        const height = e.clientY-this.startY;
        this.clearCanvas();
        this.ctx.strokeStyle = "white"
        this.ctx.strokeRect(this.startX,this.startY,width,height);
    }

}