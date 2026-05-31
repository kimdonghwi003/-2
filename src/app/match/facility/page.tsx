'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

const FACILITY_LABELS: Record<string, string> = {
  futsal_a: '풋살 A코트',
  futsal_b: '풋살 B코트',
  basketball_a: '농구 A코트',
  basketball_b: '농구 B코트',
  tennis_a: '테니스 A코트',
  tennis_b: '테니스 B코트',
  tennis_c: '테니스 C코트',
  tennis_d: '테니스 D코트',
  tennis_e: '테니스 E코트',
  small_field: '소운동장',
  main_field: '종합운동장',
}

const FACILITY_TABS = [
  { key: 'all', label: '전체' },
  { key: 'futsal_a', label: '풋살 A' },
  { key: 'futsal_b', label: '풋살 B' },
  { key: 'basketball_a', label: '농구 A' },
  { key: 'basketball_b', label: '농구 B' },
  { key: 'tennis_a', label: '테니스 A' },
  { key: 'tennis_b', label: '테니스 B' },
  { key: 'tennis_c', label: '테니스 C' },
  { key: 'tennis_d', label: '테니스 D' },
  { key: 'tennis_e', label: '테니스 E' },
  { key: 'small_field', label: '소운동장' },
  { key: 'main_field', label: '종합운동장' },
]

type Slot = {
  facility: string
  reservation_date: string
  start_time: string
  end_time: string
  status: 'available' | 'reserved' | 'closed'
  last_crawled_at: string
}

function toDateInputValue(date: Date) {
  return date.toISOString().split('T')[0]
}

export default function FacilityPage() {
  const supabase = createClient()
  const [selectedDate, setSelectedDate] = useState(toDateInputValue(new Date()))
  const [selectedFacility, setSelectedFacility] = useState('all')
  const [slots, setSlots] = useState<Slot[]>([])
  const [loading, setLoading] = useState(true)
  const [lastCrawled, setLastCrawled] = useState<string | null>(null)

  const fetchSlots = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams({ date: selectedDate })
    if (selectedFacility !== 'all') params.set('facility', selectedFacility)

    const res = await fetch(`/api/sports-reservations?${params}`)
    if (res.ok) {
      const json = await res.json()
      const data: Slot[] = json.data ?? []
      setSlots(data)
      if (data.length > 0) {
        const latest = data.reduce((a, b) =>
          a.last_crawled_at > b.last_crawled_at ? a : b
        )
        setLastCrawled(latest.last_crawled_at)
      } else {
        setLastCrawled(null)
      }
    }
    setLoading(false)
  }, [selectedDate, selectedFacility])

  useEffect(() => {
    fetchSlots()

    const channel = supabase
      .channel('sports-reservations-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'sports_reservations' }, fetchSlots)
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [fetchSlots])

  // Group slots by facility
  const grouped = slots.reduce<Record<string, Slot[]>>((acc, slot) => {
    if (!acc[slot.facility]) acc[slot.facility] = []
    acc[slot.facility].push(slot)
    return acc
  }, {})

  const facilitiesToShow = selectedFacility === 'all'
    ? Object.keys(grouped)
    : grouped[selectedFacility] ? [selectedFacility] : []

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-[#800020]">시설 예약 현황</h1>
        <a
          href="https://sports.cbnu.ac.kr"
          target="_blank"
          rel="noopener noreferrer"
          className="px-4 py-2 bg-[#800020] text-white rounded-lg text-sm font-semibold hover:bg-[#5c1a24] transition-colors"
        >
          예약 바로가기 ↗
        </a>
      </div>

      <div className="bg-white rounded-xl border border-[#f4aaba] p-4 mb-4">
        <div className="flex items-center gap-3">
          <label className="text-sm font-medium text-gray-700">날짜 선택</label>
          <input
            type="date"
            value={selectedDate}
            min={toDateInputValue(new Date())}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-[#800020]"
          />
          {lastCrawled && (
            <span className="text-xs text-gray-400 ml-auto">
              마지막 갱신: {new Date(lastCrawled).toLocaleString('ko-KR', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
        </div>
      </div>

      <div className="flex gap-2 flex-wrap mb-6">
        {FACILITY_TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setSelectedFacility(tab.key)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              selectedFacility === tab.key
                ? 'bg-[#800020] text-white'
                : 'bg-white border border-gray-200 text-gray-600 hover:border-[#800020] hover:text-[#800020]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400">불러오는 중...</div>
      ) : facilitiesToShow.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <p className="mb-2">해당 날짜·시설의 예약 데이터가 없습니다.</p>
          <p className="text-xs">크롤러가 아직 수집하지 않은 날짜이거나 운영 미오픈 날짜입니다.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {facilitiesToShow.map((facilityKey) => {
            const facilitySlots = grouped[facilityKey] ?? []
            return (
              <div key={facilityKey} className="bg-white rounded-xl border border-[#f4aaba] p-5">
                <h3 className="font-bold text-gray-900 mb-4">{FACILITY_LABELS[facilityKey] ?? facilityKey}</h3>
                <div className="flex flex-wrap gap-2">
                  {facilitySlots.map((slot) => (
                    <div
                      key={`${slot.facility}-${slot.start_time}`}
                      className={`px-3 py-2 rounded-lg text-xs font-medium text-center min-w-[80px] ${
                        slot.status === 'available'
                          ? 'bg-[#d8f3dc] text-[#2d6a4f] border border-[#b7e4c7]'
                          : slot.status === 'reserved'
                          ? 'bg-[#fde8e8] text-[#9b1c1c] border border-[#fca5a5]'
                          : 'bg-gray-100 text-gray-400 border border-gray-200'
                      }`}
                    >
                      <div>{slot.start_time.slice(0, 5)}</div>
                      <div className="mt-0.5">
                        {slot.status === 'available' ? '예약 가능' : slot.status === 'reserved' ? '예약 완료' : '이용 불가'}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
