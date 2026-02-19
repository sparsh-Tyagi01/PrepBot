import { Bot, Clock, Computer, LayoutDashboard, List, Menu, Settings } from "lucide-react"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "./ui/sheet"
import Link from "next/link"

function Navbar() {
  return (
    <div>
      <div className="m-4">
        <Link href="/" className="flex items-center font-bold">
          <Bot size={35} className="text-blue-600 mr-1"/> Prep<span className="text-red-700 text-xl">Bot</span>
        </Link>
      </div>
      <Sheet>
        <SheetTrigger className="m-4"><Menu/></SheetTrigger>
        <SheetContent side="left" className="bg-black">
          <SheetHeader className="flex flex-col items-center">
            <SheetTitle className="flex items-center gap-2 text-xl text-white"><LayoutDashboard/>Dashboard</SheetTitle>
            <SheetTitle className="flex items-center gap-2 text-xl text-white"><List/>My Reports</SheetTitle>
            <SheetTitle className="flex items-center gap-2 text-xl text-white"><Clock/>Analytics</SheetTitle>
            <SheetTitle className="flex items-center gap-2 text-xl text-white"><Computer/>Skill Gap</SheetTitle>
            <SheetTitle className="flex items-center gap-2 text-xl text-white"><Settings/>Settings</SheetTitle>
          </SheetHeader>
        </SheetContent>
    </Sheet>
    </div>
  )
}

export default Navbar