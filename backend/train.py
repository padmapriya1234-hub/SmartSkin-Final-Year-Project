import json
import os
import time
from typing import List, Tuple

import numpy as np
import tensorflow as tf

from app.config import settings
from app.services.image_service import preprocess_image


class ModelNotLoadedError(RuntimeError):
    pass


class ModelService:
    def __init__(self):
        self.model = None
        self.class_labels: List[str] = []
        self.load_error = None
        self.model_version = "1.0"
        self.load()

    def load(self):
        self.model = None
        self.class_labels = []
        self.load_error = None

        base_dir = os.path.dirname(
            os.path.dirname(
                os.path.dirname(os.path.abspath(__file__))
            )
        )

        model_path = os.path.join(
            base_dir, "models", "skin_model.keras"
        )

        labels_path = os.path.join(
            base_dir, "models", "class_labels.json"
        )

        try:
            if not os.path.isfile(model_path):
                raise FileNotFoundError(
                    f"Model file not found: {model_path}"
                )

            if not os.path.isfile(labels_path):
                raise FileNotFoundError(
                    f"Class labels file not found: {labels_path}"
                )

            with open(labels_path, "r", encoding="utf-8") as f:
                labels = json.load(f)

            if isinstance(labels, dict):
                labels = list(labels.values())

            if not isinstance(labels, list) or len(labels) == 0:
                raise ValueError(
                    "class_labels.json contains no valid labels."
                )

            self.model = tf.keras.models.load_model(
                model_path,
                compile=False
            )

            output_classes = self.model.output_shape[-1]

            if output_classes != len(labels):
                self.model = None
                raise ValueError(
                    f"Model output classes ({output_classes}) "
                    f"do not match labels ({len(labels)})."
                )

            self.class_labels = [str(x) for x in labels]

            report_path = os.path.join(
                base_dir,
                "models",
                "training_report.json"
            )

            if os.path.isfile(report_path):
                with open(report_path, "r", encoding="utf-8") as f:
                    report = json.load(f)

                self.model_version = report.get(
                    "model_version",
                    "1.0"
                )

        except Exception as exc:
            self.model = None
            self.class_labels = []
            self.load_error = str(exc)

    def is_loaded(self) -> bool:
        return self.model is not None

    def training_report(self) -> dict:
        base_dir = os.path.dirname(
            os.path.dirname(
                os.path.dirname(os.path.abspath(__file__))
            )
        )

        def read_json(filename):
            path = os.path.join(base_dir, "models", filename)

            if not os.path.isfile(path):
                return None

            try:
                with open(path, "r", encoding="utf-8") as f:
                    return json.load(f)
            except Exception:
                return None

        return {
            "training_report": read_json("training_report.json"),
            "metrics": read_json("metrics.json"),
        }

    def predict(
        self,
        disk_path: str
    ) -> Tuple[str, float, List[dict], float]:

        if not self.is_loaded():
            raise ModelNotLoadedError(
                self.load_error or "Model is not loaded."
            )

        start = time.perf_counter()

        image = preprocess_image(
            disk_path,
            settings.image_size
        )

        probabilities = np.asarray(
            self.model.predict(
                image,
                verbose=0
            )[0],
            dtype=np.float64
        )

        total = probabilities.sum()

        if total <= 0:
            raise RuntimeError(
                "Model returned invalid prediction values."
            )

        probabilities = probabilities / total

        ranked = sorted(
            zip(self.class_labels, probabilities),
            key=lambda x: x[1],
            reverse=True
        )

        top3 = [
            {
                "label": label,
                "confidence": round(float(prob), 4)
            }
            for label, prob in ranked[:3]
        ]

        inference_ms = round(
            (time.perf_counter() - start) * 1000,
            1
        )

        return (
            top3[0]["label"],
            top3[0]["confidence"],
            top3,
            inference_ms
        )


model_service = ModelService()