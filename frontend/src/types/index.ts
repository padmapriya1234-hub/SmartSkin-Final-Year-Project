export interface User {
  id: number;
  name: string;
  email: string;
  created_at: string;
}

export interface TopPrediction {
  label: string;
  confidence: number;
}

export interface PredictionResult {
  id: number;
  prediction: string;
  confidence: number;
  top_predictions: TopPrediction[];
  image_url: string;
  low_confidence: boolean;
  model_version: string;
  inference_ms?: number;
  disclaimer: string;
  created_at: string;
}

export interface PredictionHistoryItem {
  id: number;
  prediction: string;
  confidence: number;
  image_url: string;
  created_at: string;
}

export interface SkincareInfo {
  condition: string;
  about: string;
  common_characteristics: string[];
  general_causes: string[];
  general_prevention: string[];
  morning: string[];
  evening: string[];
  general_tips: string[];
}

export interface RoutineResponse {
  morning: string[];
  afternoon: string[];
  evening: string[];
  personalized_note?: string;
}

export interface ModelStatus {
  model_loaded: boolean;
  load_error?: string | null;
  model_version: string;
  training_report?: Record<string, any> | null;
  metrics?: Record<string, any> | null;
  model_path: string;
  num_classes: number;
  class_labels: string[];
  image_size: number;
  confidence_threshold: number;
}
