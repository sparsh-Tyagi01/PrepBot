'use client'

import { useRouter } from "next/navigation"
import { X } from "lucide-react"
import Navbar from "@/components/Navbar"

export default function MainLayout({
    children
}: {
    children: React.ReactNode
}) {
    const router = useRouter()

    return (
        <div className="flex items-start">
            <Navbar/>
            {children}
        </div>
    )
}
