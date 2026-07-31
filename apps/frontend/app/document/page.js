'use client';

import { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import ChatInterface from '../components/ChatInterface';
import ExtractionPanel from '../components/ExtractionPanel';

function DocumentContent() {
  const searchParams = useSearchParams();
  const docId = searchParams.get('id');
  const [tab, setTab] = useState('chat');

  if (!docId) {
    return (
      <div className="text-center py-16 text-gray-500">
        No document selected. <Link href="/" className="text-blue-600 hover:underline">Go back</Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto flex flex-col h-[calc(100vh-120px)]">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setTab('chat')}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition ${
              tab === 'chat' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Chat
          </button>
          <button
            onClick={() => setTab('extract')}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition ${
              tab === 'extract' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Extract Fields
          </button>
        </div>
        <Link href="/" className="text-sm text-blue-600 hover:underline">← Back</Link>
      </div>

      {/* Tab content */}
      {tab === 'chat' ? (
        <div className="flex-1 bg-white rounded-xl border overflow-hidden">
          <ChatInterface documentId={docId} />
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto">
          <ExtractionPanel documentId={docId} />
        </div>
      )}
    </div>
  );
}

export default function DocumentPage() {
  return (
    <Suspense fallback={<div className="text-center py-16 text-gray-400">Loading...</div>}>
      <DocumentContent />
    </Suspense>
  );
}
