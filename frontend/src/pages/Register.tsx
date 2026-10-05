import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { ErrorAlert } from "../components/common";

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }

    setSubmitting(true);
    try {
      await register(name, email, password, confirmPassword);
      navigate("/dashboard");
    } catch (err: any) {
      setError(err?.response?.data?.detail || "Could not create your account. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-md mx-auto card mt-10">
      <h1 className="text-2xl font-semibold mb-1">Create your account</h1>
      <p className="text-sm text-slate-500 mb-6">Start your AI-assisted skin screening journey.</p>

      {error && <div className="mb-4"><ErrorAlert message={error} /></div>}

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <div>
          <label htmlFor="name" className="block text-sm font-medium mb-1">Full name</label>
          <input id="name" type="text" required minLength={2} className="input" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div>
          <label htmlFor="email" className="block text-sm font-medium mb-1">Email</label>
          <input id="email" type="email" required autoComplete="email" className="input" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div>
          <label htmlFor="password" className="block text-sm font-medium mb-1">Password</label>
          <input id="password" type="password" required minLength={8} autoComplete="new-password" className="input" value={password} onChange={(e) => setPassword(e.target.value)} />
          <p className="text-xs text-slate-400 mt-1">At least 8 characters.</p>
        </div>
        <div>
          <label htmlFor="confirm" className="block text-sm font-medium mb-1">Confirm password</label>
          <input id="confirm" type="password" required autoComplete="new-password" className="input" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
        </div>
        <button type="submit" disabled={submitting} className="btn-primary w-full">
          {submitting ? "Creating account..." : "Create Account"}
        </button>
      </form>

      <p className="text-sm text-slate-500 mt-6 text-center">
        Already have an account?{" "}
        <Link to="/login" className="text-brand-700 font-medium hover:underline">Log in</Link>
      </p>
    </div>
  );
}
