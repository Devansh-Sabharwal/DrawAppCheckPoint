"use client"
import { WS_URL } from "@/config";
import { useEffect, useState } from "react";
import { Canvas } from "./Canvas";

interface CanvasProps {
    roomId: string;
}

export function RoomCanvas(props: CanvasProps) {
    const [socket, setSocket] = useState<WebSocket | null>(null);

    useEffect(() => {
        const ws = new WebSocket(WS_URL);
        
        ws.onopen = () => {
            setSocket(ws);
            ws.send(JSON.stringify({
                type: "join_room",
                roomId: props.roomId
            }));
        };

        // Cleanup function to prevent multiple WS connections
        return () => {
            ws.close();
        };
    }, []); // ✅ Add dependency array

    if (!socket) {
        return <div>Connecting to Server...</div>;
    }

    return (
        <div className="bg-white h-screen w-screen">
            <Canvas roomId={props.roomId} socket={socket} />
        </div>
    );
}
