import {z} from "zod";

export const CreateUserSchema = z.object({
    email:z.string().email(),
    password:z.string(),
    name:z.string().optional(),
    photo:z.string().optional()
})

export const SigninSchema = z.object({
    email:z.string().email(),
    password:z.string(),
})
export const CreateRoomSchema = z.object({
    name:z.string().min(3).max(20),
})
export const JWT_CODE = "random#"