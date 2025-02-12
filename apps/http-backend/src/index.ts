import express from "express"
import * as dotenv from "dotenv"
import jwt from "jsonwebtoken"
import auth from "./middleware"
import {CreateUserSchema,SigninSchema,CreateRoomSchema} from "@repo/common/types"
const app = express()
app.use(express.json());
import {JWT_SECRET} from "@repo/backend-common/config"
import db from "@repo/db/client"
import cors from "cors";
app.use(cors());
app.post("/signup",async (req,res)=>{
    
    const parsedData = CreateUserSchema.safeParse(req.body);
    
    if(!parsedData.success){
        res.json({
            message:"Invalid Credentials"
        })
        return;
    }
    const email =  parsedData.data.email;
    const password = parsedData.data.password;
    const name = parsedData.data.name;
    const photo = parsedData.data.photo;
    try{
        await db.user.create({
            data: {
                password,
                email,
                name,
                photo
            }
        })
        res.status(200).json({
            message:"User created successfully"
        })
    }
    catch(e){
        res.status(404).json({
            message:"Server Error"
        })
    }
})
app.post("/signin",async (req,res)=>{
    const parsedData = SigninSchema.safeParse(req.body);
    if(!parsedData.success){
        res.json({
            message:"Invalid Credentials"
        })
        return;
    }
    const email = parsedData.data.email;
    const password = parsedData.data.password;
    const user = await db.user.findFirst({
        where:{
            email,
            password
        }
    })
    if(!user){
        res.status(401).json({
            message:"Incorrect Credentials"
        })
        return;
    }
    const token = jwt.sign({
        id: user.id,
    },JWT_SECRET);
    res.status(200).json({
        token
    })
})
app.use(auth);

app.post("/create-room",async (req,res)=>{
    const parsedData = CreateRoomSchema.safeParse(req.body);
    if(!parsedData.success){
        res.status(401).json({
            message:"Invalid Credentials"
        })
        return;
    }
    const userId = req.userId;
    if(!userId) {
        res.status(401).json({
            message: "Unauthorized"
        });
        return;
    }
    try{
    const room = await db.room.create({
        data:{
            slug: parsedData.data.name,
            adminId: userId
        }
    })
    res.status(200).json({
        message:"room created successfully",
        roomId:room.id

    })}
    catch(e){
        res.status(401).json({
            message: "room creation failed"
        });
        return;
    }
}) 
app.get('/chats/:roomId',async (req,res)=>{
    console.log("req aagi");
    const roomId = Number(req.params.roomId);
    const messages = await db.chat.findMany({
        where:{
            roomId
        },
        orderBy:{
            id:"desc"
        },
        take: 50
    })
    res.status(200).json({
        messages
    })
});
app.get("/room/:slug",async (req,res)=>{
    const slug = req.params.slug;
    const room = await db.room.findFirst({
        where:{slug}
    });
    res.json({room})
})
app.listen(8000, () => {
    console.log("server is listening");
});


