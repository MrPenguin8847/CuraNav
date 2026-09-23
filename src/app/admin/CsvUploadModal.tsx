"use client";

import { useState } from "react";
import { X, UploadCloud, AlertCircle, CheckCircle2 } from "lucide-react";
import Papa from "papaparse";
import { Hospital } from "@/lib/mockHospitals";

interface CsvUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function CsvUploadModal({ isOpen, onClose, onSuccess }: CsvUploadModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<any[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    const selected = e.target.files?.[0];
    if (selected) {
      if (selected.type !== "text/csv" && !selected.name.endsWith(".csv")) {
        setError("Please upload a valid CSV file.");
        return;
      }
      setFile(selected);
      Papa.parse(selected, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          setParsedData(results.data);
        },
        error: (err) => {
          setError(err.message);
        }
      });
    }
  };

  const handleUpload = async () => {
    if (parsedData.length === 0) return;
    setIsUploading(true);
    setError(null);

    try {
      const res = await fetch("/api/hospitals/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hospitals: parsedData }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to upload CSV");
      }

      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error occurred");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-3xl shadow-xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <div>
            <h2 className="text-xl font-bold text-foreground">Upload CSV</h2>
            <p className="text-sm text-muted mt-1">Import multiple hospitals at once.</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-full text-slate-500 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto">
          {!file ? (
            <div className="border-2 border-dashed border-slate-200 rounded-xl p-8 flex flex-col items-center justify-center bg-slate-50/50">
              <UploadCloud className="w-10 h-10 text-slate-400 mb-4" />
              <p className="text-sm text-foreground font-medium mb-1">Click to upload or drag and drop</p>
              <p className="text-xs text-muted mb-4">CSV files only</p>
              <label className="btn-primary cursor-pointer">
                Select File
                <input type="file" accept=".csv" className="hidden" onChange={handleFileChange} />
              </label>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm">{file.name}</p>
                    <p className="text-xs text-muted">{parsedData.length} rows found</p>
                  </div>
                </div>
                <button
                  onClick={() => { setFile(null); setParsedData([]); setError(null); }}
                  className="text-sm font-medium text-slate-500 hover:text-foreground underline"
                >
                  Change file
                </button>
              </div>

              {parsedData.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold mb-2">Preview (first 3 rows)</h3>
                  <div className="overflow-x-auto rounded-lg border border-slate-200">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-slate-50 border-b border-slate-200 uppercase text-slate-500">
                        <tr>
                          {Object.keys(parsedData[0]).slice(0, 5).map((key) => (
                            <th key={key} className="px-4 py-2 font-medium">{key}</th>
                          ))}
                          {Object.keys(parsedData[0]).length > 5 && <th className="px-4 py-2 font-medium">...</th>}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {parsedData.slice(0, 3).map((row, i) => (
                          <tr key={i} className="hover:bg-slate-50">
                            {Object.values(row).slice(0, 5).map((val: any, j) => (
                              <td key={j} className="px-4 py-2 truncate max-w-[150px]">{String(val)}</td>
                            ))}
                            {Object.values(row).length > 5 && <td className="px-4 py-2 text-slate-400">...</td>}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {error && (
            <div className="mt-4 p-4 bg-red-50 text-red-600 rounded-xl flex items-start gap-3 text-sm border border-red-100">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <p>{error}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-3 mt-auto">
          <button
            onClick={onClose}
            className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-200/50 rounded-xl transition-colors text-sm"
          >
            Cancel
          </button>
          <button
            onClick={handleUpload}
            disabled={!file || parsedData.length === 0 || isUploading}
            className="px-6 py-2 bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 rounded-xl font-medium transition-colors text-sm shadow-sm inline-flex items-center gap-2"
          >
            {isUploading && <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
            {isUploading ? "Uploading..." : `Upload ${parsedData.length} records`}
          </button>
        </div>
      </div>
    </div>
  );
}
