import { useCallback, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { UploadCloud, X, Camera, RotateCcw, Loader2 } from "lucide-react";
import { predictImage } from "../services/api";
import { ErrorAlert, MedicalDisclaimer } from "../components/common";
import { formatBytes } from "../utils/format";

const ALLOWED_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
const MAX_SIZE_MB = 5;

export default function Analyze() {
  const navigate = useNavigate();
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [dragging, setDragging] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [cameraOpen, setCameraOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const validateAndSetFile = (f: File) => {
    setError("");
    if (!ALLOWED_TYPES.includes(f.type)) {
      setError("Unsupported file type. Please upload a JPG, PNG, or WEBP image.");
      return;
    }
    if (f.size === 0) {
      setError("The selected file is empty. Please choose a valid image.");
      return;
    }
    if (f.size > MAX_SIZE_MB * 1024 * 1024) {
      setError(`Image is too large. Maximum allowed size is ${MAX_SIZE_MB}MB.`);
      return;
    }
    setFile(f);
    setPreviewUrl(URL.createObjectURL(f));
  };

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files?.[0];
    if (f) validateAndSetFile(f);
  }, []);

  const removeFile = () => {
    setFile(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setError("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const startCamera = async () => {
    setError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      streamRef.current = stream;
      setCameraOpen(true);
      setTimeout(() => {
        if (videoRef.current) videoRef.current.srcObject = stream;
      }, 0);
    } catch {
      setError("Camera access is unavailable or was denied. Please use image upload instead.");
    }
  };

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setCameraOpen(false);
  };

  const capturePhoto = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    ctx?.drawImage(video, 0, 0);
    canvas.toBlob((blob) => {
      if (blob) {
        const capturedFile = new File([blob], `capture-${Date.now()}.jpg`, { type: "image/jpeg" });
        validateAndSetFile(capturedFile);
      }
    }, "image/jpeg", 0.92);
    stopCamera();
  };

  const handleAnalyze = async () => {
    if (!file) return;
    setAnalyzing(true);
    setError("");
    try {
      const res = await predictImage(file);
      navigate(`/results/${res.data.id}`);
    } catch (err: any) {
      setError(err?.response?.data?.detail || "We couldn't analyze this image. Please upload a clear JPG or PNG image and try again.");
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-semibold">Analyze Your Skin</h1>
        <p className="text-slate-500 text-sm mt-1">Upload a clear, well-lit photo, or use your camera.</p>
      </div>

      {error && <ErrorAlert message={error} />}

      {cameraOpen ? (
        <div className="card">
          <video ref={videoRef} autoPlay playsInline className="w-full rounded-xl bg-black aspect-video object-cover" />
          <div className="flex justify-center gap-3 mt-4">
            <button onClick={capturePhoto} className="btn-primary">
              <Camera className="w-4 h-4" /> Capture Photo
            </button>
            <button onClick={stopCamera} className="btn-secondary">Cancel</button>
          </div>
        </div>
      ) : previewUrl ? (
        <div className="card">
          <div className="relative">
            <img src={previewUrl} alt="Selected skin photo preview" className="w-full max-h-96 object-contain rounded-xl bg-slate-100" />
            <button
              onClick={removeFile}
              aria-label="Remove image"
              className="absolute top-2 right-2 bg-white/90 hover:bg-white rounded-full p-1.5 shadow"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="flex justify-between text-sm text-slate-500 mt-3">
            <span className="truncate">{file?.name}</span>
            <span>{file ? formatBytes(file.size) : ""}</span>
          </div>
          <button onClick={handleAnalyze} disabled={analyzing} className="btn-primary w-full mt-4">
            {analyzing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Analyzing your image…
              </>
            ) : (
              "Analyze Image"
            )}
          </button>
        </div>
      ) : (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          className={`card border-2 border-dashed text-center py-14 cursor-pointer transition ${
            dragging ? "border-brand-500 bg-brand-50" : "border-slate-300"
          }`}
          onClick={() => fileInputRef.current?.click()}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => { if (e.key === "Enter") fileInputRef.current?.click(); }}
          aria-label="Upload skin image"
        >
          <UploadCloud className="w-10 h-10 mx-auto text-brand-600 mb-3" aria-hidden="true" />
          <p className="font-medium">Drag & drop your image here, or click to browse</p>
          <p className="text-sm text-slate-500 mt-1">JPG, JPEG, PNG, or WEBP — up to {MAX_SIZE_MB}MB</p>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/webp"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && validateAndSetFile(e.target.files[0])}
          />
          <div className="mt-5">
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); startCamera(); }}
              className="btn-secondary"
            >
              <Camera className="w-4 h-4" /> Use Camera
            </button>
          </div>
        </div>
      )}

      <MedicalDisclaimer compact />
    </div>
  );
}
