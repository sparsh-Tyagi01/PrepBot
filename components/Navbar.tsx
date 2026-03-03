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
          <SheetHeader className="flex flex-col items-center gap-12 mt-8">
            <SheetTitle><Link href={"/dashboard"} className="flex items-center gap-2 text-xl text-white"><LayoutDashboard/>Dashboard</Link></SheetTitle>
            <SheetTitle><Link href={"/reports"} className="flex items-center gap-2 text-xl text-white"><List/>My Reports</Link></SheetTitle>
            <SheetTitle><Link href={"/analytics"} className="flex items-center gap-2 text-xl text-white"><Clock/>Analytics</Link></SheetTitle>
            <SheetTitle><Link href={"/skill"} className="flex items-center gap-2 text-xl text-white"><Computer/>Skill Gap</Link></SheetTitle>
            <SheetTitle><Link href={"/settings"} className="flex items-center gap-2 text-xl text-white"><Settings/>Settings</Link></SheetTitle>
          </SheetHeader>
        </SheetContent>
    </Sheet>
    </div>
  )
}

export default Navbar