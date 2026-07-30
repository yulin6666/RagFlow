'use client';

import { useState, useEffect } from 'react';

const PRESETS = {
  tr1: {
    label: 'TR-1 Special Inspection',
    fields: [
      { key: 'project_name', label: 'Project Name' },
      { key: 'project_address', label: 'Project Address' },
      { key: 'inspection_date', label: 'Inspection Date' },
      { key: 'engineer_name', label: 'Engineer Name' },
      { key: 'inspection_type', label: 'Inspection Type' },
      { key: 'contractor', label: 'Contractor' },
    ],
  },
  tr8: {
    label: 'TR-8 Progress Inspection',
    fields: [
      { key: 'project_name', label: 'Project Name' },
      { key: 'project_address', label: 'Project Address' },
      { key: 'inspection_date', label: 'Inspection Date' },
      { key: 'engineer_name', label: 'Engineer Name' },
      { key: 'work_description', label: 'Work Description' },
      { key: 'inspection_result', label: 'Inspection Result' },
      { key: 'remarks', label: 'Remarks' },
    ],
  },
};

const STATUS_STYLES = {
  pending:    'bg-yellow-100 text-yellow-700',
  processing: 'bg-blue-100 text-blue-700',
  completed:  'bg-gray-100 text-gray-700',
  failed:     'bg-red-100 text-red-700',
};

export default function ExtractionPanel({ documentId }) {
  const [fields, setFields] = useState([{ key: 'field_0', label: '' }]);
  const [jobs, setJobs] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => { fetchJobs(); }, [documentId]);

  const fetchJobs = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/extraction/document/${documentId}`);
      if (res.ok) setJobs(await res.json());
    } catch {}
  };

  const applyPreset = (key) => setFields(PRESETS[key].fields);

  const addField = () =>
    setFields(prev => [...prev, { key: `field_${Date.now()}`, label: '' }]);

  const removeField = (idx) =>
    setFields(prev => prev.filter((_, i) => i !== idx));

  const updateField = (idx, label) =>
    setFields(prev => prev.map((f, i) => i === idx
      ? { label, key: label.toLowerCase().replace(/\s+/g, '_') || `field_${i}` }
      : f
    ));

  const validFields = fields.filter(f => f.label.trim());

  const handleExtract = async () => {
    if (!validFields.length) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/extraction`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documentId, fields: validFields }),
      });
      if (res.ok) {
        await fetchJobs();
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.message || `Error ${res.status}`);
      }
    } catch (err) {
      setError(err.message || 'Request failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Field builder */}
      <div className="bg-white rounded-xl border p-5 space-y-4">
        <div className="flex items-center gap-3">
          <h3 className="font-semibold text-gray-800">Form Field Extraction</h3>
          <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">
            PDF Automation Agent
          </span>
        </div>

        {/* Preset buttons */}
        <div className="space-y-1">
          <p className="text-xs text-gray-400">Quick presets</p>
          <div className="flex gap-2 flex-wrap">
            {Object.entries(PRESETS).map(([key, preset]) => (
              <button
                key={key}
                onClick={() => applyPreset(key)}
                className="text-xs border border-purple-300 text-purple-700 px-3 py-1 rounded-full hover:bg-purple-50"
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          {fields.map((f, i) => (
            <div key={f.key} className="flex gap-2">
              <input
                placeholder={`Field name (e.g. Company Name)`}
                value={f.label}
                onChange={e => updateField(i, e.target.value)}
                className="border rounded-lg px-3 py-2 text-sm flex-1 focus:outline-none focus:ring-2 focus:ring-purple-300"
              />
              {fields.length > 1 && (
                <button
                  onClick={() => removeField(i)}
                  className="text-gray-300 hover:text-red-400 px-2 text-lg leading-none"
                >
                  ✕
                </button>
              )}
            </div>
          ))}
          <button
            onClick={addField}
            className="text-purple-600 text-sm hover:underline"
          >
            + Add field
          </button>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleExtract}
            disabled={submitting || !validFields.length}
            className="bg-purple-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-purple-700 disabled:opacity-50"
          >
            {submitting ? 'Extracting...' : 'Extract fields'}
          </button>
          {validFields.length > 0 && (
            <span className="text-xs text-gray-400">{validFields.length} field{validFields.length > 1 ? 's' : ''}</span>
          )}
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}
      </div>

      {/* Job history */}
      {jobs.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-gray-700">Extraction History</h4>
          {jobs.map(job => (
            <JobCard key={job.id} job={job} />
          ))}
        </div>
      )}
    </div>
  );
}

function JobCard({ job }) {
  const jobFields = job.fields ?? [];

  return (
    <div className="bg-white rounded-xl border p-4 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-400">{new Date(job.createdAt).toLocaleString()}</span>
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_STYLES[job.status] ?? 'bg-gray-100 text-gray-600'}`}>
          {job.status}
        </span>
      </div>

      {job.status === 'processing' && (
        <p className="text-sm text-blue-600 animate-pulse">AI is extracting fields...</p>
      )}

      {job.status === 'failed' && (
        <p className="text-sm text-red-500">Extraction failed. Please try again.</p>
      )}

      {job.status === 'completed' && job.result && (
        <>
          <table className="w-full text-sm">
            <tbody>
              {jobFields.map(f => (
                <tr key={f.key} className="border-b last:border-0">
                  <td className="py-1.5 pr-4 text-gray-500 font-medium w-1/3">{f.label}</td>
                  <td className="py-1.5 text-gray-800">{job.result[f.key] ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <a
            href={`${process.env.NEXT_PUBLIC_API_URL}/api/extraction/${job.id}/export`}
            download
            className="inline-block mt-2 text-sm bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
          >
            Download Excel
          </a>
        </>
      )}
    </div>
  );
}
