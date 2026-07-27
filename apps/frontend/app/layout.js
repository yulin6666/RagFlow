import './globals.css'

export const metadata = {
  title: 'RagFlow - Intelligent Document Q&A',
  description: 'Upload PDFs and ask questions powered by RAG',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
