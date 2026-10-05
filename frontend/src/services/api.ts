import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";

export const api = axios.create({ baseURL: API_BASE_URL });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("smartskin_token");
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem("smartskin_token");
      if (!window.location.pathname.startsWith("/login")) {
        window.location.href = "/login";
      }
    }
    return Promise.reject(err);
  }
);

export function fileUrl(path: string) {
  if (!path) return "";
  if (path.startsWith("http")) return path;
  return `${API_BASE_URL}${path}`;
}

// ---------- Auth ----------
export const registerUser = (data: { name: string; email: string; password: string; confirm_password: string }) =>
  api.post("/api/auth/register", data);

export const loginUser = (data: { email: string; password: string }) =>
  api.post("/api/auth/login", data);

export const getMe = () => api.get("/api/auth/me");

// ---------- Prediction ----------
export const predictImage = (file: File) => {
  const form = new FormData();
  form.append("file", file);
  return api.post("/api/predict", form, { headers: { "Content-Type": "multipart/form-data" } });
};

export const getPredictions = (params?: { condition?: string; skip?: number; limit?: number }) =>
  api.get("/api/predictions", { params });

export const getPrediction = (id: number) => api.get(`/api/predictions/${id}`);

export const deletePrediction = (id: number) => api.delete(`/api/predictions/${id}`);

// ---------- Skincare ----------
export const getSkincareInfo = (condition: string) => api.get(`/api/skincare/${encodeURIComponent(condition)}`);

export const savePreferences = (data: { skin_type: string; sun_exposure: string; routine_preferences: string[] }) =>
  api.post("/api/skincare/preferences", data);

export const getRoutine = () => api.get("/api/skincare/routine/get");

// ---------- Admin / Health ----------
export const getHealth = () => api.get("/api/health");
export const getModelStatus = () => api.get("/api/admin/model-status");
