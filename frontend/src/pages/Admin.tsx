import { useEffect, useState } from "react";
import { Cpu, Database, Layers, Percent, Activity } from "lucide-react";
import { getModelStatus, getHealth } from "../services/api";
import { ModelStatus } from "../types";
import { ModelUnavailableBanner, ErrorAlert, Spinner } from "../components/common";

export default function Admin() {
  const [status, setStatus] = useState<ModelStatus | null>(null);
  const [apiStatus, setApiStatus] = useState<string>("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getModelStatus(), getHealth()])
      .then(([modelRes, healthRes]) => {
        setStatus(modelRes.data);
        setApiStatus(healthRes.data.status);
      })
      .catch(() => setError("Could not load model status."))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner label="Loading model status..." />;
  if (error) return <ErrorAlert message={error} />;
  if (!status) return null;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Model & Dataset Status</h1>
        <p className="text-slate-500 text-sm">Live status of the deployed inference model.</p>
      </div>

      {!status.model_loaded && <ModelUnavailableBanner reason={status.load_error} />}

      <div className="grid sm:grid-cols-2 gap-4">
        <StatusCard icon={Activity} label="API Status" value={apiStatus === "healthy" ? "Healthy" : apiStatus} good={apiStatus === "healthy"} />
        <StatusCard icon={Cpu} label="Model Loaded" value={status.model_loaded ? "Yes" : "No"} good={status.model_loaded} />
        <StatusCard icon={Layers} label="Number of Classes" value={String(status.num_classes)} />
        <StatusCard icon={Percent} label="Confidence Threshold" value={`${Math.round(status.confidence_threshold * 100)}%`} />
      </div>

      <div className="card">
        <h2 className="font-semibold mb-3 flex items-center gap-2"><Database className="w-4 h-4" /> Configuration</h2>
        <dl className="text-sm space-y-2">
          <Row label="Model Path" value={status.model_path} />
          <Row label="Image Input Size" value={`${status.image_size} × ${status.image_size}`} />
          <Row label="Supported Classes" value={status.class_labels.join(", ")} />
        </dl>
      </div>

      {status.metrics && (
        <div className="card">
          <h2 className="font-semibold mb-3">Held-out test-set evaluation (from metrics.json)</h2>
          <dl className="text-sm space-y-2">
            <Row label="Model version" value={status.model_version} />
            <Row label="Test samples" value={String(status.metrics.test_samples)} />
            <Row label="Accuracy" value={(status.metrics.accuracy * 100).toFixed(2) + "%"} />
            <Row label="Top-3 accuracy" value={(status.metrics.top3_accuracy * 100).toFixed(2) + "%"} />
            <Row label="Macro F1" value={status.metrics.macro_avg["f1-score"].toFixed(3)} />
            <Row label="Weighted F1" value={status.metrics.weighted_avg["f1-score"].toFixed(3)} />
          </dl>
        </div>
      )}

      <p className="text-xs text-slate-400">
        This page does not expose sensitive server internals — only information relevant to understanding current
        model behavior.
      </p>
    </div>
  );
}

function StatusCard({ icon: Icon, label, value, good }: { icon: any; label: string; value: string; good?: boolean }) {
  return (
    <div className="card">
      <Icon className={`w-5 h-5 mb-2 ${good === false ? "text-amber-500" : "text-brand-600"}`} aria-hidden="true" />
      <p className="text-xs text-slate-500">{label}</p>
      <p className="text-lg font-semibold">{value}</p>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 border-b border-slate-100 pb-2">
      <dt className="text-slate-500">{label}</dt>
      <dd className="font-medium text-right break-all">{value}</dd>
    </div>
  );
}
