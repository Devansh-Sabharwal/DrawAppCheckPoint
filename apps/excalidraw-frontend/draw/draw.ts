import { getExistingChats } from "./http";
import { eraseShape } from "./eraser";
export interface Tool {
    id: string;
    type:
      | "rect"
      | "circle"
      | "pencil"
      | "diamond"
      | "arrow"
      | "line"
      | "text"
      | "eraser" 
    x: number;
    y: number;
    endX:number;
    endY:number;
    width?: number;
    height?: number;
    rotation?: number;
    text?:string
    size?:number;
    path?: { x: number; y: number }[]; // for draw drawing
  }
export class Draw{
    private ctx: CanvasRenderingContext2D;
    private canvas: HTMLCanvasElement;
    private socket: WebSocket
    private roomId: string;
    private existingStrokes: Tool[] = [];
    private clicked:boolean = false;
    private startX:number = 0;
    private startY:number = 0;
    private currShape = "rect";
    private selectedShape: Tool|null = null;
    private tempPath: { x: number; y: number }[] = [];

    constructor(canvas:HTMLCanvasElement,ctx: CanvasRenderingContext2D,socket:WebSocket,roomId:string){
        this.ctx = ctx;
        this.ctx.strokeStyle = "white";
        this.ctx.lineWidth = 2;
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
    setTool(shape: Tool["type"]) {
        this.currShape = shape;        
    }

    async init(){
        this.existingStrokes = await getExistingChats(this.roomId);
        this.clearCanvas();
    }
    clean(){
        this.ctx.clearRect(0,0,this.canvas.width,this.canvas.height);
        this.existingStrokes = [];
    }
    initHandlers(){
        this.socket.onmessage = (event)=>{
            const message = JSON.parse(event.data);
            if(message.type=="chat"){
                const parsedShape = JSON.parse(message.message);
                this.existingStrokes.push(parsedShape);
                this.clearCanvas();
            }
            if(message.type=="eraser"){
                this.existingStrokes = this.existingStrokes.filter((shape) => shape.id !== message.id);
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
        this.ctx.lineCap = "round";
        this.ctx.lineJoin = "round";
        this.ctx.lineWidth = 3;
        this.existingStrokes.forEach((shape) => {
            if (shape.type === "pencil") {
                const path = shape.path;
                if (!path || path.length === 0) return;
                this.ctx.beginPath();
                this.ctx.moveTo(path[0].x, path[0].y);
        
                for (let i = 1; i < path.length; i++) {
                    this.ctx.lineTo(path[i].x, path[i].y);
                }
                this.ctx.stroke();
                this.ctx.closePath();
            }
            if(shape.type === "circle"){
                this.ctx.beginPath();
                if(!shape.width || !shape.height) return;        
                this.ctx.ellipse(shape.x, shape.y, shape.width, shape.height, 0, 0, 2 * Math.PI);
                this.ctx.stroke();
            }
            if(shape.type=="rect"){
                if(!shape.width || !shape.height) return;
                this.ctx.strokeStyle = "white"
                this.ctx.strokeRect(shape.x,shape.y,shape.width,shape.height);
            }
            if(shape.type=="diamond"){
                const size = shape.size;
                if(!size) return;
                this.drawDiamond(shape.x,shape.y,size);
            }
            if(shape.type=="arrow"){
                this.drawLine(shape.x,shape.y,shape.endX,shape.endY,true);
            }
            if(shape.type=="line"){
                this.drawLine(shape.x,shape.y,shape.endX,shape.endY,false);
            }
            if(shape.type=="text"){
                if(shape.text) this.drawText(shape.text,shape.x,shape.y);
            }
        });
    }
    mouseDownHandler = (e:MouseEvent)=>{
        if (this.selectedShape) {
            this.selectedShape.id = `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
        }
        this.clicked = true;
        this.startX = (e.clientX);
        this.startY = (e.clientY);
        this.ctx.strokeStyle = "white";
        if (this.currShape === "pencil") {
            this.tempPath = [{ x: this.startX, y: this.startY }];
            this.ctx.beginPath();
            this.ctx.moveTo(this.startX, this.startY);
        }
        else if(this.currShape == "text"){
            this.clicked = false;
            this.addInput(e.clientX,e.clientY);
        }
        else{
            this.selectedShape = {
                type: this.currShape as Tool["type"],
                x: this.startX,
                y: this.startY,
                id: `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
                endX: this.startY,
                endY: this.startY
            }
        }
    }
    mouseUpHandler = (e:MouseEvent) =>{
        
        if(this.selectedShape){
            if (this.selectedShape.type == "circle") {
                this.selectedShape.height = Math.abs(e.clientY - this.startY);
                this.selectedShape.width =  Math.abs(e.clientX - this.startX);
            }
            if (this.selectedShape.type == "rect") {
                this.selectedShape.height = (e.clientY - this.startY);
                this.selectedShape.width =  (e.clientX - this.startX);
            }
            const currSize = Math.max(Math.abs(e.clientX - this.startX), Math.abs(e.clientY - this.startY));

            this.selectedShape.size = currSize;
            this.selectedShape.endX = e.clientX;
            this.selectedShape.endY = e.clientY;
        }
        
        this.clicked = false;
        if (this.currShape === "pencil") {
            if(this.tempPath.length <= 1) return;
            this.selectedShape = {
                id:`${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
                type: "pencil",
                x: 0,
                y: 0,
                endX: 0,
                endY: 0,
                path: [...this.tempPath],
            };
            this.existingStrokes.push(this.selectedShape);
            this.socket.send(JSON.stringify({
                type: "chat",
                id:this.selectedShape.id,
                roomId:this.roomId,
                message: JSON.stringify(this.selectedShape)
            }));
            this.tempPath = [];
        }
        else if(this.currShape!="eraser"){
            if(!this.selectedShape) return;
            this.existingStrokes.push(this.selectedShape);
            this.socket.send(JSON.stringify({
                    type: "chat",
                    id:this.selectedShape.id,
                    roomId:this.roomId,
                    message: JSON.stringify(this.selectedShape)
            }));
        }
        this.selectedShape = null;
    }
    mouseMoveHandler = (e:MouseEvent)=>{
        if(this.clicked){
            this.ctx.strokeStyle="white";
            this.ctx.lineCap = "round";
            this.ctx.lineJoin = "round";
            this.ctx.lineWidth = 3;
            if(this.currShape=="rect"){
                this.drawRect(e);
            }
            else if(this.currShape=="circle"){
                requestAnimationFrame(() => {
                    this.drawCircle(e);
                });
            }
            else if (this.currShape === "pencil") {
                requestAnimationFrame(() => {
                    this.drawPencil(e);
                });
            }
            else if(this.currShape==="diamond"){
                const x = e.clientX;
                const y = e.clientY;
                const currSize = Math.max(Math.abs(x - this.startX), Math.abs(y - this.startY));
                requestAnimationFrame(()=>{
                    this.clearCanvas();
                    this.drawDiamond(this.startX,this.startY,currSize);
                })
            }
            else if(this.currShape==="arrow"){
                const endX = e.clientX;
                const endY = e.clientY; 
                this.clearCanvas();
                this.drawLine(this.startX,this.startY,endX,endY,true);
            }
            else if(this.currShape==="line"){
                const endX = e.clientX;
                const endY = e.clientY; 
                this.clearCanvas();
                this.drawLine(this.startX,this.startY,endX,endY,false);
            }
            else if (this.currShape === "eraser") {
                this.eraseShape(e.clientX, e.clientY);
            }
        }
    }
    
    eraseShape(x: number, y: number) {
        const eraserSize = 10; // Adjust as needed
        this.existingStrokes = eraseShape(this.existingStrokes, x, y, eraserSize,this.socket,this.roomId);
        this.clearCanvas();
    }

    drawCircle(e:MouseEvent){
        const radiusX = Math.abs(e.clientX-this.startX);
        const radiusY = Math.abs(e.clientY-this.startY);
        this.clearCanvas();
        this.ctx.beginPath();
        this.ctx.ellipse(this.startX,this.startY,radiusX,radiusY,0,0,2 * Math.PI);
        this.ctx.stroke();
    }
    drawRect(e:MouseEvent){
        const width = e.clientX-this.startX;
        const height = e.clientY-this.startY;
        this.clearCanvas();
        this.ctx.strokeRect(this.startX,this.startY,width,height);
    }
    drawPencil(e: MouseEvent) {
        const newPoint = { x: e.clientX, y: e.clientY };
        this.tempPath.push(newPoint);    
        this.ctx.lineTo(newPoint.x, newPoint.y);
        this.ctx.stroke();
    }
    drawDiamond(startX:number,startY:number,size:number){
        this.ctx.beginPath();
        this.ctx.moveTo(startX, startY - size); // Top vertex
        this.ctx.lineTo(startX + size, startY); // Right vertex
        this.ctx.lineTo(startX, startY + size); // Bottom vertex
        this.ctx.lineTo(startX - size, startY); // Left vertex
        this.ctx.closePath();
        this.ctx.stroke();
    }
    drawLine(startX:number,startY:number,endX:number,endY:number,arrow:boolean){
        this.ctx.beginPath();
        this.ctx.moveTo(startX,startY);
        this.ctx.lineTo(endX,endY);
        this.ctx.closePath();
        this.ctx.stroke();
        if(arrow==false) return;
        // Draw arrowhead
        const ctx = this.ctx;
        const arrowLength = 10; // Length of the arrowhead lines
        const angle = Math.atan2(endY - startY, endX - startX); // Angle of the main line

        ctx.beginPath();
        
        ctx.moveTo(endX, endY);
        ctx.lineTo(
            endX - arrowLength * Math.cos(angle - Math.PI / 6),
            endY - arrowLength * Math.sin(angle - Math.PI / 6)
        );

        ctx.moveTo(endX, endY);
        ctx.lineTo(
            endX - arrowLength * Math.cos(angle + Math.PI / 6),
            endY - arrowLength * Math.sin(angle + Math.PI / 6)
        );

        ctx.stroke();
    }
    addInput(x: number, y: number) {
        const input = document.createElement("input");
        input.type = "text";
        input.style.position = "absolute";
        input.style.left = `${x}px`;
        input.style.top = `${y}px`;
        input.style.background = "transparent";
        input.style.color = "white";
        input.style.border = "none";
        input.style.outline = "none";
        input.style.fontSize = "24px";
        input.style.fontFamily =  "Comic Sans MS, cursive"
        document.body.appendChild(input);
        setTimeout(() => input.focus(), 0);
    
        const handleSubmit = () => {
            if (input.value.trim() !== "") {
                this.drawText(input.value, x, y);
                this.selectedShape = {
                    id:`${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
                    type: "text",
                    x,
                    y,
                    endX: x,
                    endY: y,
                    text: input.value.trim(),
                };
                this.existingStrokes.push(this.selectedShape);
                this.socket.send(
                    JSON.stringify({
                        type: "chat",
                        id:this.selectedShape.id,
                        roomId: this.roomId,
                        message: JSON.stringify(this.selectedShape),
                    })
                );
            }
            document.body.removeChild(input);
        };
    
        // Listen for "Enter" key
        input.addEventListener("keydown", (e) => {
            if (e.key === "Enter") {
                handleSubmit();
            }
        });
    
        // Listen for clicks outside the input
        const handleClickOutside = (e: MouseEvent) => {
            if (!input.contains(e.target as Node)) {
                handleSubmit();
            }
        };
    
        // Add a slight delay before attaching the outside click listener
        setTimeout(() => {
            document.addEventListener("mousedown", handleClickOutside);
        }, 10);
    
        // Remove the event listener when the input is removed
        input.addEventListener("blur", () => {
            document.removeEventListener("mousedown", handleClickOutside);
        });
    }
    //Draw the text onto canvas:
    drawText(text: string, x: number, y: number) {
        this.ctx.font = '24px Comic Sans MS, cursive'; // Set font size and family
        this.ctx.fillStyle = 'white'; // Set text color
        this.ctx.fillText(text, x, y+24);
    }
    
    
}
