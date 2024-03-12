import React from "react"
import { Inter } from "next/font/google"

const inter = Inter({ subsets: ["latin"] })

export default function Layout({ children }: { children: React.ReactNode }) {
  return <main className={inter.className}>
    {children}
  </main>
}
