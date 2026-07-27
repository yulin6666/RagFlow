'use client'

import { useState, useEffect } from 'react'
import DocumentUpload from './components/DocumentUpload'
import DocumentList from './components/DocumentList'
import ChatInterface from './components/ChatInterface'

export default function Home() {
  const [documents, setDocuments] = useState([])
  const [selectedDocument, setSelectedDocument] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchDocuments()
  }, [])

  const fetchDocuments = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/documents`)
      const data = await response.json()
      setDocuments(data)
    } catch (error) {
      console.error('Failed to fetch documents:', error)
    }
  }

  const handleUploadSuccess = () => {
    fetchDocuments()
  }

  const handleSelectDocument = (doc) => {
    setSelectedDocument(doc)
  }

  const handleDeleteDocument = async (id) => {
    if (!confirm('Are you sure you want to delete this document?')) return

    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/documents/${id}`, {
        method: 'DELETE',
      })
      fetchDocuments()
      if (selectedDocument?.id === id) {
        setSelectedDocument(null)
      }
    } catch (error) {
      console.error('Failed to delete document:', error)
      alert('Failed to delete document')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-6 px-4">
          <h1 className="text-3xl font-bold text-gray-900">
            🚀 RagFlow - Intelligent Document Q&A
          </h1>
          <p className="text-gray-600 mt-2">
            Upload PDFs and ask questions powered by RAG technology
          </p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 px-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Panel - Upload & Document List */}
          <div className="lg:col-span-1 space-y-6">
            <DocumentUpload onUploadSuccess={handleUploadSuccess} />
            <DocumentList
              documents={documents}
              selectedDocument={selectedDocument}
              onSelectDocument={handleSelectDocument}
              onDeleteDocument={handleDeleteDocument}
              onRefresh={fetchDocuments}
            />
          </div>

          {/* Right Panel - Chat Interface */}
          <div className="lg:col-span-2">
            {selectedDocument ? (
              <ChatInterface document={selectedDocument} />
            ) : (
              <div className="bg-white rounded-lg shadow p-8 text-center">
                <div className="text-6xl mb-4">📄</div>
                <h3 className="text-xl font-semibold text-gray-700 mb-2">
                  No Document Selected
                </h3>
                <p className="text-gray-500">
                  Upload a PDF and select it from the list to start asking questions
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
