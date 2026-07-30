'use client'

import { useState, useEffect, useRef } from 'react'
import DocumentUpload from './components/DocumentUpload'
import DocumentList from './components/DocumentList'
import ChatInterface from './components/ChatInterface'
import ChatSidebar from './components/ChatSidebar'
import ExtractionPanel from './components/ExtractionPanel'

export default function Home() {
  const [documents, setDocuments] = useState([])
  const [selectedDocument, setSelectedDocument] = useState(null)
  const [extractionDocument, setExtractionDocument] = useState(null)
  const [mainTab, setMainTab] = useState('chat')
  const [currentSessionId, setCurrentSessionId] = useState(null)
  const pollingRef = useRef(null)

  useEffect(() => { fetchDocuments() }, [])

  useEffect(() => {
    const hasProcessing = documents.some(
      d => d.status === 'pending' || d.status === 'processing'
    )
    if (hasProcessing && !pollingRef.current) {
      pollingRef.current = setInterval(fetchDocuments, 3000)
    } else if (!hasProcessing && pollingRef.current) {
      clearInterval(pollingRef.current)
      pollingRef.current = null
    }
    return () => {
      if (pollingRef.current) { clearInterval(pollingRef.current); pollingRef.current = null }
    }
  }, [documents])

  const fetchDocuments = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/documents`)
      setDocuments(await res.json())
    } catch {}
  }

  const handleDeleteDocument = async (id) => {
    if (!confirm('Are you sure you want to delete this document?')) return
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/documents/${id}`, { method: 'DELETE' })
      fetchDocuments()
      if (selectedDocument?.id === id) setSelectedDocument(null)
      if (extractionDocument?.id === id) setExtractionDocument(null)
    } catch { alert('Failed to delete document') }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-6 px-4">
          <h1 className="text-3xl font-bold text-gray-900">
            RagFlow - Intelligent Document Q&A
          </h1>
          <p className="text-gray-600 mt-1 mb-4">
            Upload PDFs and ask questions powered by RAG technology
          </p>
          {/* Main tab switcher */}
          <div className="flex gap-1 bg-gray-100 rounded-lg p-1 w-fit">
            <button
              onClick={() => setMainTab('chat')}
              className={`px-5 py-2 rounded-md text-sm font-medium transition ${
                mainTab === 'chat' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              RAG Chat
            </button>
            <button
              onClick={() => setMainTab('extract')}
              className={`px-5 py-2 rounded-md text-sm font-medium transition ${
                mainTab === 'extract' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Form Extraction
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 px-4">
        {mainTab === 'chat' ? (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <div className="lg:col-span-1">
              <ChatSidebar
                currentSessionId={currentSessionId}
                onSelectSession={(id) => setCurrentSessionId(id)}
                onNewChat={() => setCurrentSessionId(null)}
              />
            </div>
            <div className="lg:col-span-1 space-y-6">
              <DocumentUpload onUploadSuccess={fetchDocuments} />
              <DocumentList
                documents={documents}
                selectedDocument={selectedDocument}
                onSelectDocument={setSelectedDocument}
                onDeleteDocument={handleDeleteDocument}
                onRefresh={fetchDocuments}
              />
            </div>
            <div className="lg:col-span-2">
              <ChatInterface
                document={selectedDocument}
                sessionId={currentSessionId}
                onSessionCreated={(id) => setCurrentSessionId(id)}
              />
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1 space-y-6">
              <DocumentList
                documents={documents.filter(d =>
                  /TR[_-]?[18]/i.test(d.filename)
                )}
                selectedDocument={extractionDocument}
                onSelectDocument={setExtractionDocument}
                onDeleteDocument={handleDeleteDocument}
                onRefresh={fetchDocuments}
              />
            </div>
            <div className="lg:col-span-2">
              {extractionDocument ? (
                <ExtractionPanel documentId={extractionDocument.id} />
              ) : (
                <div className="bg-white rounded-lg shadow p-8 text-center">
                  <div className="text-6xl mb-4">📋</div>
                  <h3 className="text-xl font-semibold text-gray-700 mb-2">No Document Selected</h3>
                  <p className="text-gray-500">Select a document to extract structured fields</p>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
