import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-white mt-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 text-sm text-slate-500 flex flex-col sm:flex-row justify-between gap-4">
        <p>&copy; {new Date().getFullYear()} SmartSkin. Educational project — not a medical device.</p>
        <div className="flex gap-4">
          <Link to="/privacy" className="hover:text-brand-700">Privacy</Link>
          <Link to="/admin" className="hover:text-brand-700">Model Status</Link>
        </div>
      </div>
    </footer>
  );
}
