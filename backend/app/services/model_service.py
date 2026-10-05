import json
import os
import time
from typing import List, Optional, Tuple

import numpy as np

from app.config import settings
from app.services.image_service import preprocess_image


class ModelNotLoadedError(RuntimeError):
    pass


def _read_json(path: str):
    if not os.path.exists(path):
        return None

    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


class ModelService:
    def __init__(self):
        self.model = None
        self.class_labels: List[str] = []
        self.load_error: Optional[str] = None
        self.model_version = "unavailable"
        self.load()

    def load(self):
        self.model = None
        self.class_labels = []
        self.load_error = None

        model_path = settings.model_path
        labels_path = settings.class_labels_path

        if not os.path.exists(model_path):
            self.load_error = f"Model not found: {model_path}"
            return

        labels = _read_json(labels_path)

        if not labels:
            self.load_error = f"Labels not found: {labels_path}"
            return

        try:
            import tensorflow as tf

            from tensorflow.keras.applications.mobilenet_v2 import (
                preprocess_input as mobilenet_preprocess
            )
            from tensorflow.keras.applications.resnet50 import (
                preprocess_input as resnet_preprocess
            )
            from tensorflow.keras.applications.efficientnet import (
                preprocess_input as efficientnet_preprocess
            )

            custom_objects = {
                "preprocess_input": mobilenet_preprocess,
                "mobilenet_v2.preprocess_input": mobilenet_preprocess,
                "resnet50.preprocess_input": resnet_preprocess,
                "efficientnet.preprocess_input": efficientnet_preprocess,
            }

            self.model = tf.keras.models.load_model(
                model_path,
                compile=False,
                safe_mode=False,
                custom_objects=custom_objects,
            )

        except Exception as exc:
            self.model = None
            self.load_error = (
                f"Model load error: {type(exc).__name__}: {exc}"
            )
            return

        try:
            if self.model.output_shape[-1] != len(labels):
                self.model = None
                self.load_error = (
                    "Model output classes do not match class_labels.json."
                )
                return
        except Exception as exc:
            self.model = None
            self.load_error = str(exc)
            return

        self.class_labels = labels

        report_path = os.path.join(
            os.path.dirname(model_path),
            "training_report.json"
        )

        report = _read_json(report_path) or {}

        self.model_version = report.get(
            "model_version",
            "1.0"
        )

    def is_loaded(self) -> bool:
        return self.model is not None

    def training_report(self) -> dict:
        model_dir = os.path.dirname(settings.model_path)

        return {
            "training_report": _read_json(
                os.path.join(model_dir, "training_report.json")
            ),
            "metrics": _read_json(
                os.path.join(model_dir, "metrics.json")
            ),
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

        tensor = preprocess_image(
            disk_path,
            settings.image_size
        )

        probabilities = np.asarray(
            self.model.predict(
                tensor,
                verbose=0
            )[0],
            dtype=np.float64
        )

        total = probabilities.sum()

        if total <= 0:
            raise RuntimeError(
                "Invalid prediction probabilities."
            )

        probabilities /= total

        inference_ms = round(
            (time.perf_counter() - start) * 1000,
            1
        )

        ranked = sorted(
            zip(self.class_labels, probabilities),
            key=lambda x: x[1],
            reverse=True
        )

        top3 = [
            {
                "label": label,
                "confidence": round(float(probability), 4)
            }
            for label, probability in ranked[:3]
        ]

        return (
            top3[0]["label"],
            top3[0]["confidence"],
            top3,
            inference_ms,
        )


model_service = ModelService()
