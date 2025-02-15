import { Dispatch, SetStateAction, useEffect, useRef, useState } from "react";
import { Draw } from "@/draw/draw";
import { clearCanvas } from "@/draw/http";

interface CanvasProps {
    roomId: string;
    socket: WebSocket;
}

export function Canvas(props: CanvasProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [shape, setShape] = useState<"circle" | "pencil" | "rect" | "diamond" | "arrow" | "line" | "text" | "eraser">("rect");
    const [draw, setDraw] = useState<Draw>();

    // Update canvas resolution on mount and window resize
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        // Set initial canvas resolution
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        const handleResize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };

        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    // Update the tool in the Draw instance when the shape changes
    useEffect(() => {
        draw?.setTool(shape);
    }, [shape, draw]);

    // Initialize the Draw instance when the canvas ref is available
    useEffect(() => {
        if (canvasRef.current) {
            const canvas = canvasRef.current;
            const ctx = canvas.getContext("2d");
            if (!ctx) return;

            const d = new Draw(canvas, ctx, props.socket, props.roomId);
            setDraw(d);

            return () => {
                d.destroy();
            };
        }
    }, [canvasRef, props.socket, props.roomId]);

    // Update the cursor based on the selected tool
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        switch (shape) {
            case "eraser":
                canvas.style.cursor = `url("data:image/svg+xml,%3Csvg%20xmlns='http://www.w3.org/2000/svg'%20width='20'%20height='20'%20viewBox='0%200%2040%2040'%3E%3Ccircle%20cx='20'%20cy='20'%20r='18'%20fill='none'%20stroke='white'%20stroke-width='4'/%3E%3C/svg%3E") 20 20, auto`;
                break;
            case "text":
                canvas.style.cursor = "text"; // Text cursor
                break;
            default:
                canvas.style.cursor = "crosshair"; // Default cursor for other tools
        }
    }, [shape]);

    return (
        <div>
            <canvas
                ref={canvasRef}
                className="bg-[#131213]"
                height={window.innerHeight}
                width={window.innerWidth}
            ></canvas>
            <Toolbar setShape={setShape} roomId={props.roomId} draw={draw} />
        </div>
    );
}

function Toolbar({
    setShape,
    roomId,
    draw
}: {
    setShape: Dispatch<SetStateAction<any>>;
    roomId: string;
    draw: Draw | undefined;
}) {
    return (
        <div className="flex gap-4 fixed top-4 left-10">
            <ToolBarButton setShape={setShape} text={"rect"} />
            <ToolBarButton setShape={setShape} text={"circle"} />
            <ToolBarButton setShape={setShape} text={"diamond"} />
            <ToolBarButton setShape={setShape} text={"arrow"} />
            <ToolBarButton setShape={setShape} text={"pencil"} />
            <ToolBarButton setShape={setShape} text={"line"} />
            <ToolBarButton setShape={setShape} text={"text"} />
            <ToolBarButton setShape={setShape} text={"eraser"} />
            <div
                className="bg-white text-black hover:cursor-pointer p-2 rounded-xl flex items-center"
                onClick={() => { clearCanvas(roomId); draw?.clean(); }}
            >
                Clear
            </div>
        </div>
    );
}

function ToolBarButton({ setShape, text }: { setShape: Dispatch<SetStateAction<any>>; text: string }) {
    return (
        <div
            className="bg-white p-4 rounded-xl text-black hover:cursor-pointer"
            onClick={() => setShape(text)}
        >
            {text}
        </div>
    );
}