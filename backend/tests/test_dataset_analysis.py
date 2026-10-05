import os
import sys

from PIL import Image

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from analyze_dataset import analyze  # noqa: E402


def _img(path, color):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    Image.new("RGB", (32, 32), color).save(path)


def test_missing_dataset_reports_error(tmp_path):
    assert analyze(str(tmp_path / "nope"))["errors"]


def test_valid_structure_counts_and_detects_corrupt_and_leakage(tmp_path):
    # Throw-away structural fixtures to test the VALIDATOR; not a dataset, never used for training.
    for sp in ("train", "validation", "test"):
        for i, c in enumerate(("A", "B")):
            _img(str(tmp_path / sp / c / f"{sp}{i}.png"), (i * 50 + len(sp), 10, 10))
    r = analyze(str(tmp_path))
    assert r["classes"] == ["A", "B"] and r["total_images"] == 6 and not r["errors"]
    (tmp_path / "train" / "A" / "bad.jpg").write_bytes(b"not an image")
    _img(str(tmp_path / "test" / "A" / "leak.png"), (5, 10, 10))  # same pixels as train/A/train0.png
    r = analyze(str(tmp_path))
    assert len(r["corrupt_files"]) == 1 and r["leakage_across_splits"]
    assert any("LEAKAGE" in e for e in r["errors"])


def test_empty_class_and_mismatched_classes(tmp_path):
    for sp in ("train", "validation", "test"):
        os.makedirs(tmp_path / sp / "A", exist_ok=True)
    os.makedirs(tmp_path / "train" / "B", exist_ok=True)
    r = analyze(str(tmp_path))
    assert any("differ" in e for e in r["errors"]) and any("Empty" in e for e in r["errors"])
