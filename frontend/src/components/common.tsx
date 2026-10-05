import { AlertTriangle, ShieldAlert, Loader2, Info } from "lucide-react";

export function MedicalDisclaimer({ compact = false }: { compact?: boolean }) {
  return (
    <div
      role="note"
      className={`flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 text-amber-900 ${
        compact ? "px-3 py-2 text-xs" : "px-4 py-3 text-sm"
      }`}
    >
      <ShieldAlert className="w-4 h-4 mt-0.5 shrink-0" aria-hidden="true" />
      <p>
        AI screening result only. This tool is for educational and preliminary screening purposes and is{" "}
        <strong>not a medical diagnosis</strong>. Consult a qualified dermatologist or healthcare professional for
        diagnosis and treatment.
      </p>
    </div>
  );
}

export function ModelUnavailableBanner({ reason }: { reason?: string | null }) {
  return (
    <div role="alert" className="flex items-start gap-2 rounded-xl border border-orange-300 bg-orange-50 text-orange-900 px-4 py-3 text-sm">
      <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" aria-hidden="true" />
      <p>
        <strong>No trained model is loaded.</strong> Predictions are disabled until a model is trained with{" "}
        <code>python train.py</code> (see README). {reason}
      </p>
    </div>
  );
}

export function LowConfidenceNotice() {
  return (
    <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 text-red-900 px-4 py-3 text-sm">
      <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" aria-hidden="true" />
      <p>Low-confidence result. Please consider consulting a dermatologist rather than relying on this screening result.</p>
    </div>
  );
}

export function ErrorAlert({ message }: { message: string }) {
  if (!message) return null;
  return (
    <div role="alert" className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 text-red-800 px-4 py-3 text-sm">
      <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" aria-hidden="true" />
      <p>{message}</p>
    </div>
  );
}

export function InfoNote({ message }: { message: string }) {
  return (
    <div className="flex items-start gap-2 rounded-xl border border-brand-100 bg-brand-50 text-brand-700 px-4 py-3 text-sm">
      <Info className="w-4 h-4 mt-0.5 shrink-0" aria-hidden="true" />
      <p>{message}</p>
    </div>
  );
}

export function Spinner({ label = "Loading..." }: { label?: string }) {
  return (
    <div className="flex items-center gap-2 text-slate-500 py-6 justify-center" role="status" aria-live="polite">
      <Loader2 className="w-5 h-5 animate-spin" aria-hidden="true" />
      <span>{label}</span>
    </div>
  );
}

export function ConfidenceBar({ value }: { value: number }) {
  const pct = Math.round(value * 100);
  const color = pct >= 75 ? "bg-emerald-500" : pct >= 60 ? "bg-amber-500" : "bg-red-500";
  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span className="font-medium">AI model confidence</span>
        <span className="font-semibold">{pct}%</span>
      </div>
      <div className="w-full h-2.5 rounded-full bg-slate-200 overflow-hidden" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
        <div className={`h-full ${color} transition-all`} style={{ width: `${pct}%` }} />
      </div>
      <p className="text-xs text-slate-500 mt-1">
        Model confidence reflects the model's prediction probability and does not indicate diagnostic certainty.
      </p>
    </div>
  );
}
