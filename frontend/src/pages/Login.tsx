import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { ErrorAlert } from "../components/common";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await login(email, password);
      navigate("/dashboard");
    } catch (err: any) {
      setError(err?.response?.data?.detail || "Invalid email or password.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-md mx-auto card mt-10">
      <h1 className="text-2xl font-semibold mb-1">Welcome back</h1>
      <p className="text-sm text-slate-500 mb-6">Log in to continue your skin screening journey.</p>

      {error && <div className="mb-4"><ErrorAlert message={error} /></div>}

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <div>
          <label htmlFor="email" className="block text-sm font-medium mb-1">Email</label>
          <input
            id="email" type="email" required autoComplete="email"
            className="input" value={email} onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div>
          <label htmlFor="password" className="block text-sm font-medium mb-1">Password</label>
          <input
            id="password" type="password" required autoComplete="current-password"
            className="input" value={password} onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <button type="submit" disabled={submitting} className="btn-primary w-full">
          {submitting ? "Logging in..." : "Log In"}
        </button>
      </form>

      <p className="text-sm text-slate-500 mt-6 text-center">
        Don't have an account?{" "}
        <Link to="/register" className="text-brand-700 font-medium hover:underline">Create one</Link>
      </p>
    </div>
  );
}
