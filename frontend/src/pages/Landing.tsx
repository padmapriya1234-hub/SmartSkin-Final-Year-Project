import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import {
  Camera, ScanSearch, ShieldCheck, History, Sparkles, Stethoscope, Lock, ArrowRight,
} from "lucide-react";
import { getModelStatus } from "../services/api";
import { MedicalDisclaimer } from "../components/common";

export default function Landing() {
  const [conditions, setConditions] = useState<string[]>([]);

  useEffect(() => {
    getModelStatus()
      .then((res) => setConditions(res.data.class_labels))
      .catch(() => setConditions([]));
  }, []);

  return (
    <div className="space-y-20">
      {/* Hero */}
      <section className="text-center max-w-3xl mx-auto pt-6">
        <div className="inline-flex items-center gap-2 text-brand-700 bg-brand-50 px-3 py-1 rounded-full text-xs font-medium mb-4">
          <Sparkles className="w-3.5 h-3.5" /> AI-Powered Skin Screening
        </div>
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-slate-900">
          Understand Your Skin Better with AI
        </h1>
        <p className="mt-4 text-lg text-slate-600">
          Upload a skin image and receive an AI-assisted preliminary screening with confidence information and
          personalized general skincare guidance.
        </p>
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link to="/register" className="btn-primary text-base px-6 py-3">
            Analyze My Skin <ArrowRight className="w-4 h-4" />
          </Link>
          <a href="#how-it-works" className="btn-secondary text-base px-6 py-3">
            Learn More
          </a>
        </div>
      </section>

      <MedicalDisclaimer />

      {/* How it works */}
      <section id="how-it-works">
        <h2 className="text-2xl font-semibold text-center mb-10">How It Works</h2>
        <div className="grid sm:grid-cols-3 gap-6">
          {[
            { icon: Camera, title: "1. Upload or Capture", desc: "Upload a clear skin photo, or capture one directly with your camera." },
            { icon: ScanSearch, title: "2. AI Analysis", desc: "Our model preprocesses and analyzes the image to identify the most likely condition." },
            { icon: Stethoscope, title: "3. Get Guidance", desc: "Receive confidence-scored results plus general, educational skincare guidance." },
          ].map((s) => (
            <div key={s.title} className="card text-center">
              <s.icon className="w-8 h-8 mx-auto text-brand-600 mb-3" aria-hidden="true" />
              <h3 className="font-semibold mb-1">{s.title}</h3>
              <p className="text-sm text-slate-600">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Supported conditions */}
      <section>
        <h2 className="text-2xl font-semibold text-center mb-6">Supported Conditions</h2>
        <p className="text-center text-slate-500 text-sm mb-6">
          Automatically reflects the classes the currently loaded model was trained on.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          {(conditions.length ? conditions : ["Acne", "Eczema", "Psoriasis", "Melanoma", "Benign Keratosis", "Rosacea"]).map((c) => (
            <span key={c} className="px-4 py-2 rounded-full bg-white border border-slate-200 text-sm font-medium">
              {c}
            </span>
          ))}
        </div>
      </section>

      {/* Features */}
      <section>
        <h2 className="text-2xl font-semibold text-center mb-10">Features</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { icon: ScanSearch, title: "Confidence Scoring", desc: "Top-3 predictions with transparent confidence percentages." },
            { icon: History, title: "Prediction History", desc: "Review, filter, and manage your past screenings anytime." },
            { icon: Stethoscope, title: "Skincare Guidance", desc: "General, low-risk routines tailored to your results and preferences." },
            { icon: Lock, title: "Secure by Design", desc: "JWT authentication, hashed passwords, and per-user data isolation." },
          ].map((f) => (
            <div key={f.title} className="card">
              <f.icon className="w-6 h-6 text-brand-600 mb-3" aria-hidden="true" />
              <h3 className="font-semibold mb-1">{f.title}</h3>
              <p className="text-sm text-slate-600">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Privacy */}
      <section className="card max-w-3xl mx-auto text-center">
        <ShieldCheck className="w-8 h-8 mx-auto text-brand-600 mb-3" aria-hidden="true" />
        <h2 className="text-xl font-semibold mb-2">Your Privacy Matters</h2>
        <p className="text-sm text-slate-600 mb-3">
          Uploaded images are used only to generate your screening results and are stored so you can review your
          history. You can delete any prediction — and its image — at any time.
        </p>
        <Link to="/privacy" className="text-brand-700 text-sm font-medium hover:underline">
          Read our full privacy notice →
        </Link>
      </section>

      <MedicalDisclaimer />
    </div>
  );
}
