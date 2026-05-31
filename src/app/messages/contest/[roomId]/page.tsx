'use client'

import { use, useEffect, useState, useRef } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

type Msg = { id: string; sender_id: string; content: string; created_at: string; users: { nickname: string } | null }

export default function ContestChatPage({ params }: { params: Promise<{ roomId: string }> }) {
  const { roomId } = use(params)
  const supabase = createClient()
  const [messages, setMessages] = useState<Msg[]>([])
  const [myId, setMyId] = useState('')
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(true)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    init()
    const channel = supabase
      .channel(`contest-chat-${roomId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'contest_chat_messages', filter: `room_id=eq.${roomId}` }, (payload) => {
        setMessages((prev) => [...prev, payload.new as Msg])
        setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [roomId])

  async function init() {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) setMyId(user.id)
    const res = await fetch(`/api/contest/chat/${roomId}`)
    if (res.ok) {
      const data = await res.json()
      setMessages(data)
    }
    setLoading(false)
    setTimeout(() => bottomRef.current?.scrollIntoView(), 100)
  }

  async function handleSend() {
    if (!text.trim()) return
    const content = text.trim()
    setText('')
    await fetch(`/api/contest/chat/${roomId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content }),
    })
  }

  if (loading) return <div className="text-center py-20 text-gray-400">불러오는 중...</div>

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      <div className="flex items-center gap-3 mb-4">
        <Link href="/messages" className="text-gray-400 hover:text-[#800020]">←</Link>
        <h1 className="text-lg font-bold text-[#800020]">팀 채팅</h1>
      </div>

      <div className="flex-1 overflow-y-auto bg-white rounded-xl border border-[#f4aaba] p-4 space-y-3 mb-4">
        {messages.map((msg) => {
          const isMine = msg.sender_id === myId
          return (
            <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[70%] ${isMine ? 'items-end' : 'items-start'} flex flex-col`}>
                {!isMine && (
                  <span className="text-xs text-gray-400 mb-1">{msg.users?.nickname ?? ''}</span>
                )}
                <div className={`px-4 py-2 rounded-2xl text-sm ${isMine ? 'bg-[#800020] text-white' : 'bg-gray-100 text-gray-900'}`}>
                  {msg.content}
                </div>
                <span className="text-xs text-gray-300 mt-1">
                  {new Date(msg.created_at).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      <div className="flex gap-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() } }}
          placeholder="메시지를 입력하세요"
          className="flex-1 px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:border-[#800020] text-sm"
        />
        <button
          onClick={handleSend}
          className="px-4 py-2.5 bg-[#800020] text-white rounded-xl font-medium hover:bg-[#5c1a24] transition-colors text-sm"
        >
          전송
        </button>
      </div>
    </div>
  )
}
