'use client'

import { useState, useEffect } from 'react'

export default function ChatSidebar({ currentSessionId, onSelectSession, onNewChat }) {
  const [sessions, setSessions] = useState([])

  useEffect(() => {
    fetchSessions()
  }, [currentSessionId])

  const fetchSessions = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/chat/sessions`)
      if (!res.ok) return
      setSessions(await res.json())
    } catch {
      // ignore
    }
  }

  const formatTime = (iso) => {
    const d = new Date(iso)
    const now = new Date()
    const diffDays = Math.floor((now - d) / 86400000)
    if (diffDays === 0) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    if (diffDays === 1) return 'Yesterday'
    if (diffDays < 7) return `${diffDays}d ago`
    return d.toLocaleDateString()
  }

  return (
    <div className="bg-white rounded-lg shadow flex flex-col h-[calc(100vh-12rem)]">
      <div className="border-b p-4">
        <h2 className="text-lg font-semibold text-gray-900">Chat History</h2>
      </div>

      <div className="p-3 border-b">
        <button
          onClick={onNewChat}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg border border-dashed border-gray-300 text-gray-600 hover:bg-gray-50 hover:border-blue-400 hover:text-blue-600 transition-colors text-sm font-medium"
        >
          <span className="text-base">+</span> New Chat
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {sessions.length === 0 ? (
          <p className="text-center text-gray-400 text-sm mt-6">No chat history yet</p>
        ) : (
          sessions.map((session) => (
            <button
              key={session.id}
              onClick={() => onSelectSession(session.id)}
              className={`w-full text-left px-3 py-2.5 rounded-lg transition-colors group ${
                currentSessionId === session.id
                  ? 'bg-blue-50 border border-blue-200'
                  : 'hover:bg-gray-50 border border-transparent'
              }`}
            >
              <p
                className={`text-sm font-medium truncate ${
                  currentSessionId === session.id ? 'text-blue-700' : 'text-gray-800'
                }`}
              >
                {session.title}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">
                {formatTime(session.createdAt)}
                {session.messageCount > 0 && (
                  <span className="ml-2 text-gray-300">· {session.messageCount} msgs</span>
                )}
              </p>
            </button>
          ))
        )}
      </div>
    </div>
  )
}
