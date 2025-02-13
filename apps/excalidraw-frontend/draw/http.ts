import axios from "axios";
import { HTTP_BACKEND } from "@/config";
export async function getExistingChats(roomId: string){
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