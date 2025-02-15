// util.ts
import { Tool } from "./draw";
export function isNearPoint(x: number, y: number, px: number, py: number, eraserSize: number): boolean {
    return Math.sqrt((x - px) ** 2 + (y - py) ** 2) < eraserSize;
}

export function isPointNearLine(x: number, y: number, x1: number, y1: number, x2: number, y2: number, eraserSize: number): boolean {
    const d = Math.abs((y2 - y1) * x - (x2 - x1) * y + x2 * y1 - y2 * x1) /
              Math.sqrt((y2 - y1) ** 2 + (x2 - x1) ** 2);
    return d < eraserSize;
}

export function isNearRectangle(x: number, y: number, shape: any): boolean {
    return x >= shape.x &&
           x <= shape.x + (shape.width || 0) &&
           y >= shape.y &&
           y <= shape.y + (shape.height || 0);
}

export function isNearCircle(x: number, y: number, shape: any): boolean {
    const dx = x - shape.x;
    const dy = y - shape.y;
    return Math.sqrt(dx * dx + dy * dy) <= (shape.width || 0);
}

export function isNearDiamond(x: number, y: number, shape: any, eraserSize: number): boolean {
    const startX = shape.x;
    const startY = shape.y;
    const size = shape.size;

    const top = { x: startX, y: startY - size };
    const right = { x: startX + size, y: startY };
    const bottom = { x: startX, y: startY + size };
    const left = { x: startX - size, y: startY };

    
    const isNearEdge =
        isPointNearLine(x, y, top.x, top.y, right.x, right.y, eraserSize) ||
        isPointNearLine(x, y, right.x, right.y, bottom.x, bottom.y, eraserSize) ||
        isPointNearLine(x, y, bottom.x, bottom.y, left.x, left.y, eraserSize) ||
        isPointNearLine(x, y, left.x, left.y, top.x, top.y, eraserSize);

    return isNearEdge;
}
export function isNearText(x: number, y: number, shape: any, eraserSize: number): boolean {
    // Fixed font size
    const fontSize = 24;

    // Estimate the bounding box dimensions
    const textWidth = shape.text.length * 10; // Approximate width based on text length
    const textHeight = fontSize; // Height is equal to the font size

    // Define the bounding box for the text
    const textX = shape.x;
    const textY = shape.y;

    // Check if the eraser position is inside or near the bounding box
    return (
        x >= textX - eraserSize &&
        x <= textX + textWidth + eraserSize &&
        y >= textY - eraserSize &&
        y <= textY + textHeight + eraserSize
    );
}

export function eraseShape(existingStrokes: Tool[], x: number, y: number, eraserSize: number, socket: WebSocket,roomId:string): any[] {
    return existingStrokes.filter((shape) => {
        let shouldKeep = true;

        if (shape.type === "rect") {
            shouldKeep = !isNearRectangle(x, y, shape);
        } else if (shape.type === "circle") {
            shouldKeep = !isNearCircle(x, y, shape);
        } else if (shape.type === "line" || shape.type === "arrow") {
            shouldKeep = !isPointNearLine(x, y, shape.x, shape.y, shape.endX, shape.endY, eraserSize);
        } else if (shape.type === "pencil" && shape.path) {
            //@ts-ignore
            shouldKeep = !shape.path.some((p) => isNearPoint(x, y, p.x, p.y, eraserSize));
        } else if (shape.type === "diamond") {
            shouldKeep = !isNearDiamond(x, y, shape, eraserSize);
        } else if (shape.type === "text") {
            shouldKeep = !isNearText(x, y, shape, eraserSize);
        }

        // If the shape is erased, notify others via WebSocket
        if (!shouldKeep) {
            socket.send(JSON.stringify({ type: "eraser", id: shape.id,roomId }));
        }

        return shouldKeep;
    });
}
