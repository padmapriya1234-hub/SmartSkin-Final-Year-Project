import { useEffect, useState } from "react";
import { Sunrise, Sun, Moon } from "lucide-react";
import { getRoutine, savePreferences } from "../services/api";
import { RoutineResponse } from "../types";
import { ErrorAlert, InfoNote, Spinner } from "../components/common";

const SKIN_TYPES = ["Unknown", "Oily", "Dry", "Combination", "Normal", "Sensitive"];
const EXPOSURE_LEVELS = ["Low", "Medium", "High"];
const CURRENT_PRODUCTS = ["Cleanser", "Moisturizer", "Sunscreen", "None"];

export default function Routine() {
  const [routine, setRoutine] = useState<RoutineResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [skinType, setSkinType] = useState("Unknown");
  const [sunExposure, setSunExposure] = useState("Medium");
  const [products, setProducts] = useState<string[]>([]);

  useEffect(() => {
    getRoutine()
      .then((res) => setRoutine(res.data))
      .catch(() => setError("Could not load your routine."))
      .finally(() => setLoading(false));
  }, []);

  const toggleProduct = (p: string) => {
    setProducts((prev) => (prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]));
  };

  const handleSave = async () => {
    setSaving(true);
    setError("");
    try {
      await savePreferences({ skin_type: skinType, sun_exposure: sunExposure, routine_preferences: products });
      const res = await getRoutine();
      setRoutine(res.data);
    } catch {
      setError("Could not save your preferences. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Your Daily Skin Routine</h1>
        <p className="text-slate-500 text-sm">General, conservative guidance — not a diagnosis or prescription.</p>
      </div>

      <div className="card">
        <h2 className="font-semibold mb-4">Personalize (Optional)</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="skinType">Skin type</label>
            <select id="skinType" className="input" value={skinType} onChange={(e) => setSkinType(e.target.value)}>
              {SKIN_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="exposure">Outdoor exposure</label>
            <select id="exposure" className="input" value={sunExposure} onChange={(e) => setSunExposure(e.target.value)}>
              {EXPOSURE_LEVELS.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
        </div>
        <fieldset className="mt-4">
          <legend className="block text-sm font-medium mb-2">Current skincare products</legend>
          <div className="flex flex-wrap gap-2">
            {CURRENT_PRODUCTS.map((p) => (
              <label key={p} className={`px-3 py-1.5 rounded-full text-sm border cursor-pointer ${
                products.includes(p) ? "bg-brand-600 text-white border-brand-600" : "bg-white border-slate-300"
              }`}>
                <input
                  type="checkbox"
                  className="sr-only"
                  checked={products.includes(p)}
                  onChange={() => toggleProduct(p)}
                />
                {p}
              </label>
            ))}
          </div>
        </fieldset>
        <button onClick={handleSave} disabled={saving} className="btn-primary mt-4">
          {saving ? "Saving..." : "Save & Update Routine"}
        </button>
      </div>

      {error && <ErrorAlert message={error} />}

      {loading ? (
        <Spinner label="Loading routine..." />
      ) : routine && (
        <div className="grid sm:grid-cols-3 gap-4">
          <RoutineCard icon={Sunrise} title="Morning" items={routine.morning} color="text-amber-500" />
          <RoutineCard icon={Sun} title="Afternoon" items={routine.afternoon} color="text-orange-500" />
          <RoutineCard icon={Moon} title="Evening" items={routine.evening} color="text-indigo-500" />
        </div>
      )}

      {routine?.personalized_note && <InfoNote message={routine.personalized_note} />}
    </div>
  );
}

function RoutineCard({ icon: Icon, title, items, color }: { icon: any; title: string; items: string[]; color: string }) {
  return (
    <div className="card">
      <h3 className={`flex items-center gap-2 font-semibold mb-3 ${color}`}>
        <Icon className="w-5 h-5" aria-hidden="true" /> {title}
      </h3>
      <ol className="text-sm text-slate-600 space-y-2 list-decimal list-inside">
        {items.map((item, i) => <li key={i}>{item}</li>)}
      </ol>
    </div>
  );
}
