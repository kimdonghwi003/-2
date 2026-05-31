import Navbar from '@/components/Navbar'

export default function ContestLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Navbar />
      <main className="max-w-6xl mx-auto px-4 py-6">{children}</main>
    </>
  )
}
