import prisma from "@/lib/prisma"
import { currentUser } from "@clerk/nextjs/server"
import { notFound } from "next/navigation"
import EventListPage from "@/app/(dashboard)/list/events/page"

const societyMap: Record<string, number> = {
  saf: 3, uph: 4, ump: 5, upa: 6, ucp: 7,
}

export { default } from "@/app/(dashboard)/list/events/page"