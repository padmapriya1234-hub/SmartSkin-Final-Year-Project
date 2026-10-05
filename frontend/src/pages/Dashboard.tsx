import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { BarChart3, Camera, ClipboardList, TrendingUp, Percent } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  PieChart, Pie, Cell, Legend,
} from "recharts";
import { useAuth } from "../hooks/useAuth";
import { getPredictions } from "../services/api";
import { PredictionHistoryItem } from "../types";
import { Spinner } from "../components/common";
import { fileUrl } from "../services/api";
import { formatDate, formatPercent } from "../utils/format";

const COLORS = ["#0891b2", "#f59e0b", "#ef4444", "#10b981", "#8b5cf6", "#ec4899"];

export default function Dashboard() {
  const { user } = useAuth();
  const [predictions, setPredictions] = useState<PredictionHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getPredictions({ limit: 100 })
      .then((res) => setPredictions(res.data))
      .finally(() => setLoading(false));
  }, []);

  const stats = useMemo(() => {
    const total = predictions.length;
    const avgConfidence = total ? predictions.reduce((s, p) => s + p.confidence, 0) / total : 0;
    const latest = predictions[0];
    return { total, avgConfidence, latest };
  }, [predictions]);

  const conditionCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    predictions.forEach((p) => { counts[p.prediction] = (counts[p.prediction] || 0) + 1; });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [predictions]);

  const timelineData = useMemo(() => {
    return [...predictions]
      .reverse()
      .slice(-10)
      .map((p) => ({ date: formatDate(p.created_at).slice(0, 6), confidence: Math.round(p.confidence * 100) }));
  }, [predictions]);

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Welcome back, {user?.name?.split(" ")[0]} 👋</h1>
          <p className="text-slate-500 text-sm">Here's an overview of your skin screening activity.</p>
        </div>
        <Link to="/analyze" className="btn-primary">
          <Camera className="w-4 h-4" /> Analyze New Image
        </Link>
      </div>

      {loading ? (
        <Spinner label="Loading your dashboard..." />
      ) : (
        <>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard icon={ClipboardList} label="Total Analyses" value={stats.total.toString()} />
            <StatCard
              icon={BarChart3}
              label="Last Analysis"
              value={stats.latest ? formatDate(stats.latest.created_at) : "—"}
            />
            <StatCard icon={TrendingUp} label="Latest Prediction" value={stats.latest?.prediction || "—"} />
            <StatCard icon={Percent} label="Avg. Confidence" value={stats.total ? formatPercent(stats.avgConfidence) : "—"} />
          </div>

          {stats.total === 0 ? (
            <div className="card text-center py-16">
              <p className="text-slate-500 mb-4">You haven't analyzed any images yet.</p>
              <Link to="/analyze" className="btn-primary inline-flex">
                <Camera className="w-4 h-4" /> Analyze Your First Image
              </Link>
            </div>
          ) : (
            <div className="grid lg:grid-cols-2 gap-6">
              <div className="card">
                <h2 className="font-semibold mb-4">Confidence Over Recent Analyses</h2>
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={timelineData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="date" fontSize={12} />
                    <YAxis fontSize={12} domain={[0, 100]} unit="%" />
                    <Tooltip formatter={(v: number) => [`${v}%`, "Confidence"]} />
                    <Bar dataKey="confidence" fill="#0891b2" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="card">
                <h2 className="font-semibold mb-4">Most Frequently Predicted Conditions</h2>
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <Pie data={conditionCounts} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label>
                      {conditionCounts.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Legend />
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {predictions.length > 0 && (
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold">Recent Predictions</h2>
                <Link to="/history" className="text-sm text-brand-700 font-medium hover:underline">View all →</Link>
              </div>
              <div className="divide-y divide-slate-100">
                {predictions.slice(0, 5).map((p) => (
                  <Link
                    key={p.id}
                    to={`/results/${p.id}`}
                    className="flex items-center gap-4 py-3 hover:bg-slate-50 rounded-lg px-2 -mx-2"
                  >
                    <img src={fileUrl(p.image_url)} alt="" className="w-12 h-12 rounded-lg object-cover border border-slate-200" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{p.prediction}</p>
                      <p className="text-xs text-slate-500">{formatDate(p.created_at)}</p>
                    </div>
                    <span className="text-sm font-semibold text-brand-700">{formatPercent(p.confidence)}</span>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function StatCard({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="card">
      <Icon className="w-5 h-5 text-brand-600 mb-2" aria-hidden="true" />
      <p className="text-xs text-slate-500">{label}</p>
      <p className="text-lg font-semibold truncate">{value}</p>
    </div>
  );
}
