"use client"
import { useState } from "react";
import styles from "./page.module.css";
import { useRouter } from "next/navigation";

export default function Home() {
  const [roomId,setRoomId] = useState("");
  const router = useRouter();
  return (
    <div className={styles.page}>
      <input value={roomId} onChange={(e)=>{
        setRoomId(e.target.value);
      }} type="text" placeholder="Room Id"></input>
    <button onClick={()=>{
      router.push(`/room/${roomId}`)
    }}>Submit</button>
    </div>
  );
}
