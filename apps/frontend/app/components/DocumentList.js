'use client'

export default function DocumentList({
  documents,
  selectedDocument,
  onSelectDocument,
  onDeleteDocument,
  onRefresh,
}) {
  const getStatusBadge = (status) => {
    const badges = {
      pending: 'bg-yellow-100 text-yellow-800',
      processing: 'bg-blue-100 text-blue-800',
      ready: 'bg-green-100 text-green-800',
      failed: 'bg-red-100 text-red-800',
    }
    return badges[status] || 'bg-gray-100 text-gray-800'
  }

  const getStatusIcon = (status) => {
    const icons = {
      pending: '⏳',
      processing: '⚙️',
      ready: '✅',
      failed: '❌',
    }
    return icons[status] || '📄'
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">📚 Documents</h2>
        <button
          onClick={onRefresh}
          className="text-sm text-blue-600 hover:text-blue-700"
        >
          🔄 Refresh
        </button>
      </div>

      {documents.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <p>No documents uploaded yet</p>
          <p className="text-sm mt-2">Upload your first PDF to get started</p>
        </div>
      ) : (
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {documents.map((doc) => (
            <div
              key={doc.id}
              className={`border rounded-lg p-3 cursor-pointer transition-colors ${
                selectedDocument?.id === doc.id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => onSelectDocument(doc)}
            >
              <div className="flex justify-between items-start">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 truncate">
                    {doc.filename}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${getStatusBadge(
                        doc.status
                      )}`}
                    >
                      {getStatusIcon(doc.status)} {doc.status}
                    </span>
                    {doc.chunkCount > 0 && (
                      <span className="text-xs text-gray-500">
                        {doc.chunkCount} chunks
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {new Date(doc.uploadedAt).toLocaleString()}
                  </p>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onDeleteDocument(doc.id)
                  }}
                  className="ml-2 text-red-500 hover:text-red-700"
                  title="Delete document"
                >
                  🗑️
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
