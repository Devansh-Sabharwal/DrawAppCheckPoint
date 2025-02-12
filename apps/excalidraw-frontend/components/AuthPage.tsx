"use client"
export function AuthPage({isSignin}:{isSignin:boolean}){
    return <div className="w-screen h-screen flex justify-center items-center">
        <div className="p-10 m-2 bg-blue-100 rounded-xl">
            <div className="m-2 mb-10 border border-black">
            <input type="text" placeholder="Email"></input>
            </div>
            <div className="m-2 mb-10 border border-black">
                <input type="password" placeholder="password"></input>
            </div>
            <button className="bg-blue-500 w-full" onClick={()=>{}}>
                {isSignin?"Signin":"Signup"}
            </button>
        </div>
        
    </div> 
}