import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="text-center py-24">
      <h1 className="text-3xl font-semibold mb-2">Page not found</h1>
      <p className="text-slate-500 mb-6">The page you're looking for doesn't exist.</p>
      <Link to="/" className="btn-primary inline-flex">Go Home</Link>
    </div>
  );
}
