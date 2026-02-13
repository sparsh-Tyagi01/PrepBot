'use client'

import { useRouter } from "next/navigation"
import { X } from "lucide-react"

export default function ModalLayout({
    children
}: {
    children: React.ReactNode
}) {
    const router = useRouter()

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div 
                className="absolute inset-0 bg-black/20 backdrop-blur-[2px]"
                onClick={() => router.back()}
            />
            <div className="relative z-10">
                <button
                    onClick={() => router.back()}
                    className="absolute -top-4 -right-4 bg-white rounded-full p-2 shadow-lg hover:bg-gray-100 transition-colors z-20"
                    aria-label="Close modal"
                >
                    <X size={24} className="text-gray-700" />
                </button>
                {children}
            </div>
        </div>
    )
}
