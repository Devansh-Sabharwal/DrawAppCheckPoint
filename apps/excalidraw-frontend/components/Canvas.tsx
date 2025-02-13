import { Dispatch, SetStateAction, useEffect, useRef, useState } from "react";
import { drawInit } from "@/draw";

interface CanvasProps{
    roomId:string
    socket:WebSocket
}
export function Canvas(props:CanvasProps){
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [shape,setShape] = useState<string>("");
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
    useEffect(()=>{
        if(canvasRef.current){
            const canvas = canvasRef.current;
            const ctx = canvas.getContext("2d")
            if(!ctx) return;
            drawInit({ctx, canvas, roomId:props.roomId,socket:props.socket,shape});
        }
    }, [props.roomId,props.socket,shape]);
    return <div>
        <canvas ref={canvasRef} className="bg-black" height={window.innerHeight} width={window.innerWidth}></canvas>
        <Toolbar setShape={setShape}/>
    </div>
}
function Toolbar({setShape}:{setShape:Dispatch<SetStateAction<string>>}){
    return <div className="flex gap-4 fixed top-4 left-10">
        <div className="bg-white text-black hover:cursor-pointer" onClick={() => setShape("rect")}>Rect</div>
        <div className="bg-white text-black hover:cursor-pointer" onClick={()=> setShape("circle")}>Circle</div>
        <div className="bg-white text-black hover:cursor-pointer" onClick={()=> setShape("line")}>Line</div>
    </div>
}