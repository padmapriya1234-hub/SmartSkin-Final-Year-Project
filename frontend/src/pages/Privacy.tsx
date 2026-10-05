import { MedicalDisclaimer } from "../components/common";

export default function Privacy() {
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-semibold">Privacy Notice</h1>

      <div className="card space-y-4 text-sm text-slate-600">
        <section>
          <h2 className="font-semibold text-slate-800 mb-1">How your images are used</h2>
          <p>
            Images you upload are used solely to generate your AI screening result. They are stored on the server
            associated with your account so that you can review your prediction history later.
          </p>
        </section>
        <section>
          <h2 className="font-semibold text-slate-800 mb-1">Retention</h2>
          <p>
            Images and prediction records are retained until you delete them from your History page. Deleting a
            prediction removes its record from your history.
          </p>
        </section>
        <section>
          <h2 className="font-semibold text-slate-800 mb-1">Deleting your data</h2>
          <p>
            You can delete any individual prediction (including its image) at any time from the History page. There
            is currently no bulk "delete all" action — remove records individually.
          </p>
        </section>
        <section>
          <h2 className="font-semibold text-slate-800 mb-1">Compliance</h2>
          <p>
            This is an academic/educational project. It does not currently claim or guarantee HIPAA, GDPR, or any
            other regulatory compliance — do not use it to store real patient data in a clinical setting.
          </p>
        </section>
        <section className="rounded-xl bg-amber-50 border border-amber-200 text-amber-900 p-4">
          <p className="font-medium">Please do not upload images that contain personally identifying information
            (faces, tattoos, documents, etc.) beyond the skin area you want analyzed.</p>
        </section>
      </div>

      <MedicalDisclaimer />
    </div>
  );
}
