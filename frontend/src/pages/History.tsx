import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Trash2, Eye, ClipboardList } from "lucide-react";
import { deletePrediction, getPredictions, fileUrl } from "../services/api";
import { PredictionHistoryItem } from "../types";
import { ErrorAlert, Spinner } from "../components/common";
import { formatDate, formatPercent } from "../utils/format";

const PAGE_SIZE = 8;

export default function History() {
  const [items, setItems] = useState<PredictionHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [conditionFilter, setConditionFilter] = useState("");
  const [page, setPage] = useState(0);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const load = () => {
    setLoading(true);
    getPredictions({ limit: 200 })
      .then((res) => setItems(res.data))
      .catch(() => setError("Could not load your history right now."))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const conditions = Array.from(new Set(items.map((i) => i.prediction))).sort();

  const filtered = conditionFilter ? items.filter((i) => i.prediction === conditionFilter) : items;
  const pageCount = Math.ceil(filtered.length / PAGE_SIZE) || 1;
  const pageItems = filtered.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);

  const handleDelete = async (id: number) => {
    setDeletingId(id);
    try {
      await deletePrediction(id);
      setItems((prev) => prev.filter((i) => i.id !== id));
    } catch {
      setError("Could not delete this record. Please try again.");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Prediction History</h1>
          <p className="text-slate-500 text-sm">Review, filter, and manage your past screenings.</p>
        </div>
        <select
          className="input sm:w-56"
          value={conditionFilter}
          onChange={(e) => { setConditionFilter(e.target.value); setPage(0); }}
          aria-label="Filter by condition"
        >
          <option value="">All conditions</option>
          {conditions.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {error && <ErrorAlert message={error} />}

      {loading ? (
        <Spinner label="Loading history..." />
      ) : filtered.length === 0 ? (
        <div className="card text-center py-16">
          <ClipboardList className="w-10 h-10 mx-auto text-slate-300 mb-3" />
          <p className="text-slate-500 mb-4">No predictions found.</p>
          <Link to="/analyze" className="btn-primary inline-flex">Analyze an Image</Link>
        </div>
      ) : (
        <>
          <div className="card divide-y divide-slate-100">
            {pageItems.map((item) => (
              <div key={item.id} className="flex items-center gap-4 py-4">
                <img src={fileUrl(item.image_url)} alt="" className="w-14 h-14 rounded-lg object-cover border border-slate-200" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{item.prediction}</p>
                  <p className="text-xs text-slate-500">{formatDate(item.created_at)}</p>
                </div>
                <span className="text-sm font-semibold text-brand-700 w-14 text-right">{formatPercent(item.confidence)}</span>
                <Link to={`/results/${item.id}`} className="p-2 rounded-lg hover:bg-slate-100" aria-label={`View result for ${item.prediction}`}>
                  <Eye className="w-4 h-4 text-slate-600" />
                </Link>
                <button
                  onClick={() => handleDelete(item.id)}
                  disabled={deletingId === item.id}
                  className="p-2 rounded-lg hover:bg-red-50"
                  aria-label={`Delete result for ${item.prediction}`}
                >
                  <Trash2 className="w-4 h-4 text-red-500" />
                </button>
              </div>
            ))}
          </div>

          {pageCount > 1 && (
            <div className="flex items-center justify-center gap-2">
              <button
                className="btn-secondary !px-3 !py-1.5 text-sm"
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
              >
                Previous
              </button>
              <span className="text-sm text-slate-500">Page {page + 1} of {pageCount}</span>
              <button
                className="btn-secondary !px-3 !py-1.5 text-sm"
                onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
                disabled={page >= pageCount - 1}
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
