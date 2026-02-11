import { Bot } from "lucide-react";
import Link from "next/link";

export default function Home() {
  return (
    <div className="w-screen min-h-screen">
      <nav className="flex justify-between items-center p-2 bg-slate-100 shadow-md m-4">
        <div>
          <Link href="/" className="flex items-center font-bold">
            <Bot size={35} className="text-blue-600 mr-1"/> Prep<span className="text-red-700 text-xl">Bot</span>
          </Link>
        </div>
        <div className="flex items-center gap-12">
          <Link href="#work">How it works</Link>
          <Link href="#pricing">Pricing</Link>
          <Link href="/help">Help Center</Link>  
        </div>
        <div>
          <button className="mr-4 bg-blue-100 border-2 border-slate-300 px-2 py-1 rounded-[5px] hover:bg-blue-200 transition-all duration-200">Sign Up</button>
          <button className="bg-blue-600 border-2 border-slate-300 text-white px-2 py-1 rounded-[5px] hover:bg-blue-700 transition-all duration-200">Log in</button>
        </div>
      </nav>
    </div>
  )
}