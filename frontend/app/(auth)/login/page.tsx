"use client";

import { Bot } from "lucide-react";
import { signIn } from "next-auth/react";
import Link from "next/link";

export default function Register() {
    return (
        <div className="h-screen flex justify-center items-center bg-radial from-emerald-50 to-white">
            <div className="w-[40vw] h-[80vh] shadow-2xl shadow-blue-300 rounded-xl flex flex-col items-center">
                <div className="flex items-center text-2xl my-10">
                    <Bot size={60} className="text-blue-600 mr-1"/> Prep<span className="text-red-700 text-4xl">Bot</span>
                </div>
                <h1 className="text-xl mb-4">Welcome</h1>
                <p className="text-black/70">
                    Sign in to PerpBot to continue
                </p>
                <form action="" className="mt-10 flex flex-col gap-4">
                    <div>
                        <input type="email" required placeholder="Enter your email" className="w-[25vw] h-10 focus:outline-none focus:ring-red-500 focus:ring-1 ring-1 ring-blue-500 rounded-xl pl-4"/>
                    </div>
                    <div>
                        <input type="password" required placeholder="Create your password" className="w-[25vw] h-10 focus:outline-none focus:ring-red-500 focus:ring-1 ring-1 ring-blue-500 rounded-xl pl-4"/>
                    </div>
                    <Link href="/forget" className="text-bold text-blue-600">
                        Forget Password?
                    </Link>
                    <button className="bg-blue-600 text-white font-bold rounded-xl py-1 hover:bg-blue-700 transition-colors duration-200">Continue</button>
                    <p className="text-black/70 text-sm mb-2">
                        Already have an account? <Link href="/register" className="text-lg text-blue-500 font-bold">Sign up</Link>
                    </p>
                </form>
                <div className="flex justify-center items-center gap-2">
                    <hr className="w-[15vw] text-gray-300"/>
                    OR
                    <hr className="w-[15vw] text-gray-300"/>
                </div>
                <button onClick={()=>signIn("github")} className="border-2 border-slate-200 rounded-xl px-2 py-1 text-white bg-black w-[25vw] hover:bg-slate-200">Continue with Github</button>
            </div>
        </div>
    )
}