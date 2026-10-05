import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { CheckCircle2, Sunrise, Moon, Lightbulb } from "lucide-react";
import { getPrediction, getSkincareInfo, fileUrl } from "../services/api";
import { PredictionResult, SkincareInfo } from "../types";
import { ConfidenceBar, ErrorAlert, LowConfidenceNotice, MedicalDisclaimer, Spinner } from "../components/common";
import { formatPercent } from "../utils/format";

export default function Result() {
  const { id } = useParams();
  const [result, setResult] = useState<PredictionResult | null>(null);
  const [info, setInfo] = useState<SkincareInfo | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    getPrediction(Number(id))
      .then((res) => {
        setResult(res.data);
        return getSkincareInfo(res.data.prediction);
      })
      .then((res) => setInfo(res.data))
      .catch((err) => setError(err?.response?.data?.detail || "Could not load this result."))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <Spinner label="Loading result..." />;
  if (error) return <ErrorAlert message={error} />;
  if (!result) return null;

  return (
    <div className="max-w-3xl mx-auto space-y-6">

      <div className="card">
        <div className="grid sm:grid-cols-2 gap-6">
          <img
            src={fileUrl(result.image_url)}
            alt="Analyzed skin"
            className="w-full h-64 object-cover rounded-xl bg-slate-100"
          />
          <div className="flex flex-col justify-center">
            <p className="text-xs uppercase tracking-wide text-slate-400 mb-1">Possible Condition</p>
            <h1 className="text-2xl font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-6 h-6 text-brand-600" aria-hidden="true" />
              {result.prediction}
            </h1>
            <div className="mt-4">
              <ConfidenceBar value={result.confidence} />
            </div>
          </div>
        </div>

        {result.low_confidence && <div className="mt-4"><LowConfidenceNotice /></div>}

        <div className="mt-6">
          <h2 className="font-semibold mb-3">Top Predictions</h2>
          <div className="space-y-2">
            {result.top_predictions.map((p, i) => (
              <div key={p.label} className="flex items-center gap-3">
                <span className="w-6 text-sm text-slate-400">{i + 1}.</span>
                <span className="flex-1 text-sm font-medium">{p.label}</span>
                <div className="w-32 h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-brand-500" style={{ width: `${p.confidence * 100}%` }} />
                </div>
                <span className="text-sm w-12 text-right">{formatPercent(p.confidence)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {info && (
        <div className="card">
          <h2 className="font-semibold mb-2">About {info.condition}</h2>
          <p className="text-sm text-slate-600 mb-4">{info.about}</p>

          <div className="grid sm:grid-cols-3 gap-4 text-sm">
            <InfoList title="Common Characteristics" items={info.common_characteristics} />
            <InfoList title="General Causes" items={info.general_causes} />
            <InfoList title="General Prevention" items={info.general_prevention} />
          </div>
          <p className="text-xs text-slate-400 mt-4 italic">
            Educational information only — not exhaustive or a substitute for professional advice.
          </p>
        </div>
      )}

      {info && (
        <div className="card">
          <h2 className="font-semibold mb-4">General Skincare Guidance</h2>
          <div className="grid sm:grid-cols-2 gap-6">
            <div>
              <h3 className="flex items-center gap-2 text-sm font-medium mb-2"><Sunrise className="w-4 h-4 text-amber-500" /> Morning</h3>
              <ul className="text-sm text-slate-600 space-y-1 list-disc list-inside">
                {info.morning.map((step) => <li key={step}>{step}</li>)}
              </ul>
            </div>
            <div>
              <h3 className="flex items-center gap-2 text-sm font-medium mb-2"><Moon className="w-4 h-4 text-indigo-500" /> Evening</h3>
              <ul className="text-sm text-slate-600 space-y-1 list-disc list-inside">
                {info.evening.map((step) => <li key={step}>{step}</li>)}
              </ul>
            </div>
          </div>
          <div className="mt-4">
            <h3 className="flex items-center gap-2 text-sm font-medium mb-2"><Lightbulb className="w-4 h-4 text-yellow-500" /> General Tips</h3>
            <ul className="text-sm text-slate-600 space-y-1 list-disc list-inside">
              {info.general_tips.map((tip) => <li key={tip}>{tip}</li>)}
            </ul>
          </div>
          <Link to="/routine" className="text-brand-700 text-sm font-medium hover:underline mt-4 inline-block">
            View your full daily routine →
          </Link>
        </div>
      )}

      <MedicalDisclaimer />

      <div className="flex justify-center gap-3">
        <Link to="/analyze" className="btn-secondary">Analyze Another Image</Link>
        <Link to="/history" className="btn-primary">View History</Link>
      </div>
    </div>
  );
}

function InfoList({ title, items }: { title: string; items: string[] }) {
  if (!items.length) return null;
  return (
    <div>
      <h3 className="font-medium mb-1">{title}</h3>
      <ul className="text-slate-600 space-y-1 list-disc list-inside">
        {items.map((i) => <li key={i}>{i}</li>)}
      </ul>
    </div>
  );
}
