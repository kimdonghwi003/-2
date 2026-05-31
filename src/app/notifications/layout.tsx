import Navbar from '@/components/Navbar'

export default function NotificationsLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Navbar />
      <main className="max-w-2xl mx-auto px-4 py-6">{children}</main>
    </>
  )
}
