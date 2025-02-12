import { useEffect, useRef } from "react";
import { drawInit } from "@/draw";

interface CanvasProps{
    roomId:string
    socket:WebSocket
}
export function Canvas(props:CanvasProps){
    const canvasRef = useRef<HTMLCanvasElement>(null);
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
            drawInit({ctx, canvas, roomId:props.roomId,socket:props.socket});
        }
    }, [props.roomId,props.socket]);
    return <div>
        <canvas ref={canvasRef} className="bg-black" height={window.innerHeight} width={window.innerWidth}></canvas>

    </div>
}