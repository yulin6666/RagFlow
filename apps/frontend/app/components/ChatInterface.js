'use client'

import { useState, useEffect, useRef } from 'react'

export default function ChatInterface({ document }) {
  const [messages, setMessages] = useState([])
  const [question, setQuestion] = useState('')
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef(null)

  useEffect(() => {
    // Fetch chat history when document changes
    if (document) {
      fetchChatHistory()
    }
  }, [document?.id])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const fetchChatHistory = async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/chat/history/${document.id}`
      )
      const data = await response.json()
      const formattedMessages = data.flatMap((chat) => [
        { role: 'user', content: chat.question },
        { role: 'assistant', content: chat.answer, sources: chat.sources },
      ])
      setMessages(formattedMessages)
    } catch (error) {
      console.error('Failed to fetch chat history:', error)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!question.trim() || loading) return

    if (document.status !== 'ready') {
      alert('Please wait for the document to finish processing')
      return
    }

    const userMessage = { role: 'user', content: question }
    setMessages((prev) => [...prev, userMessage])
    setQuestion('')
    setLoading(true)

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/chat/query`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            question: userMessage.content,
            documentId: document.id,
          }),
        }
      )

      if (!response.ok) {
        throw new Error('Query failed')
      }

      const data = await response.json()
      const assistantMessage = {
        role: 'assistant',
        content: data.answer,
        sources: data.sources,
      }

      setMessages((prev) => [...prev, assistantMessage])
    } catch (error) {
      console.error('Query error:', error)
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: 'Sorry, I encountered an error processing your question.',
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-lg shadow flex flex-col h-[calc(100vh-12rem)]">
      {/* Header */}
      <div className="border-b p-4">
        <h2 className="text-xl font-semibold">💬 Chat with Document</h2>
        <p className="text-sm text-gray-600 mt-1">{document.filename}</p>
        {document.status !== 'ready' && (
          <p className="text-sm text-yellow-600 mt-1">
            ⚠️ Document is still processing ({document.status})
          </p>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 mt-8">
            <div className="text-4xl mb-4">💭</div>
            <p>No messages yet</p>
            <p className="text-sm mt-2">Ask a question about this document</p>
          </div>
        ) : (
          messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex ${
                msg.role === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              <div
                className={`max-w-[80%] rounded-lg p-4 ${
                  msg.role === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-900'
                }`}
              >
                <p className="whitespace-pre-wrap">{msg.content}</p>
                {msg.sources && msg.sources.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-gray-300">
                    <p className="text-xs font-semibold mb-2">📎 Sources:</p>
                    {msg.sources.map((source, sidx) => (
                      <div key={sidx} className="text-xs mb-1">
                        • {source.filename} - Page {source.page || 'N/A'}{' '}
                        {source.score && (
                          <span className="text-gray-600">
                            (score: {source.score.toFixed(2)})
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 rounded-lg p-4">
              <div className="flex space-x-2">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200"></div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="border-t p-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Ask a question about this document..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
            disabled={loading || document.status !== 'ready'}
          />
          <button
            type="submit"
            disabled={loading || !question.trim() || document.status !== 'ready'}
            className={`px-6 py-2 rounded-lg font-medium transition-colors ${
              loading || !question.trim() || document.status !== 'ready'
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {loading ? '...' : 'Send'}
          </button>
        </div>
      </form>
    </div>
  )
}
