import { Dispatch, SetStateAction, useEffect, useRef, useState } from "react";
import { Draw } from "@/draw/draw";
import { clearCanvas } from "@/draw/http";

interface CanvasProps{
    roomId:string
    socket:WebSocket
}
export function Canvas(props:CanvasProps){
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [shape,setShape] = useState<"circle" | "pencil" | "rect">("rect");
    const [draw,setDraw] = useState<Draw>()
    const [clear,setClear] = useState(false);
    useEffect(() => {
        const canvas = canvasRef.current;
        if(!canvas ) return;
        if (canvas) {
            // Set actual canvas resolution
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        }

        const handleResize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };

        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    useEffect(() => {
        draw?.setTool(shape);
    }, [shape, draw]);

    useEffect(() => {
        if (canvasRef.current) {
            const canvas = canvasRef.current;
            const ctx = canvas.getContext("2d");
            if (!ctx) return;
            const d = new Draw(canvas,ctx,props.socket,props.roomId);
            setDraw(d);
            return () => {
                d.destroy();
            }
        }
    }, [canvasRef,clear]);
    
    return <div>
        <canvas ref={canvasRef} className="bg-[#131213] cursor-crosshair" height={window.innerHeight} width={window.innerWidth}></canvas>
        <Toolbar setShape={setShape} roomId={props.roomId} setClear={setClear}/>
    </div>
}
function Toolbar(
    {
    setShape,
    roomId,
    setClear

    }:
{
    setShape:Dispatch<SetStateAction<any>>,
    roomId:string,
    setClear:Dispatch<SetStateAction<boolean>>
}
){
    return <div className="flex gap-4 fixed top-4 left-10">
        <div className="bg-white text-black hover:cursor-pointer" onClick={() => setShape("rect")}>Rect</div>
        <div className="bg-white text-black hover:cursor-pointer" onClick={()=> setShape("circle")}>Circle</div>
        <div className="bg-white text-black hover:cursor-pointer" onClick={()=> setShape("pencil")}>Pencil</div>
        <div className="bg-white text-black hover:cursor-pointer" onClick={() =>{ clearCanvas(roomId); setClear(prev=>!prev) }}>Clear</div>
    </div>
}