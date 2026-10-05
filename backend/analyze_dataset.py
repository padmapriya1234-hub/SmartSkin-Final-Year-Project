"""
Dataset validation + analysis. Reads the REAL dataset in dataset/{train,validation,test}/<class>/
and reports only what it finds. Writes models/dataset_report.json.

Checks: folder structure, missing/empty classes, unreadable/corrupt images, exact duplicates
(SHA-256, also ACROSS splits = data leakage), class imbalance.
Usage: python analyze_dataset.py [--dataset dataset]   (exit code 1 if blocking problems found)
"""
import argparse, hashlib, json, os, sys
from collections import defaultdict
from PIL import Image

EXTS = {".jpg", ".jpeg", ".png", ".webp"}
SPLITS = ["train", "validation", "test"]


def analyze(root):
    errors, warnings = [], []
    report = {"splits": {}, "classes": [], "corrupt_files": [], "duplicates_within_split": 0,
              "leakage_across_splits": []}
    if not os.path.isdir(root):
        return {"errors": [f"Dataset folder not found: {root}"], "warnings": []}
    classes = {}
    for sp in SPLITS:
        d = os.path.join(root, sp)
        if not os.path.isdir(d):
            errors.append(f"Missing split folder: {d}"); continue
        classes[sp] = sorted(c for c in os.listdir(d) if os.path.isdir(os.path.join(d, c)))
    if errors:
        return {"errors": errors, "warnings": warnings}
    base = classes["train"]
    if len(base) < 2: errors.append("Need at least 2 class folders in train/.")
    for sp in SPLITS[1:]:
        if classes[sp] != base:
            errors.append(f"Class folders in {sp}/ differ from train/: {sorted(set(base) ^ set(classes[sp]))}")
    report["classes"] = base
    seen = {}  # hash -> (split, path)
    counts = {sp: {} for sp in SPLITS}
    for sp in SPLITS:
        for c in classes[sp]:
            n = 0
            folder = os.path.join(root, sp, c)
            for fn in sorted(os.listdir(folder)):
                path = os.path.join(folder, fn)
                if os.path.splitext(fn)[1].lower() not in EXTS: continue
                try:
                    with Image.open(path) as im: im.verify()
                except Exception:
                    report["corrupt_files"].append(path); continue
                with open(path, "rb") as f: h = hashlib.sha256(f.read()).hexdigest()
                if h in seen:
                    if seen[h][0] == sp: report["duplicates_within_split"] += 1
                    else: report["leakage_across_splits"].append([seen[h][1], path])
                else: seen[h] = (sp, path)
                n += 1
            counts[sp][c] = n
            if n == 0: errors.append(f"Empty class folder: {folder}")
    for sp in SPLITS:
        report["splits"][sp] = {"total": sum(counts[sp].values()), "per_class": counts[sp]}
    report["total_images"] = sum(v["total"] for v in report["splits"].values())
    tr = [v for v in counts["train"].values() if v]
    if tr and max(tr) / min(tr) > 3:
        warnings.append(f"Class imbalance in train: max/min = {max(tr)/min(tr):.1f}x (train.py applies class weights).")
    if report["corrupt_files"]: warnings.append(f"{len(report['corrupt_files'])} corrupt image(s) found - remove them.")
    if report["leakage_across_splits"]: errors.append(f"DATA LEAKAGE: {len(report['leakage_across_splits'])} identical image(s) appear in multiple splits.")
    report.update(errors=errors, warnings=warnings)
    return report


if __name__ == "__main__":
    ap = argparse.ArgumentParser(); ap.add_argument("--dataset", default=os.path.join(os.path.dirname(__file__), "dataset"))
    r = analyze(ap.parse_args().dataset)
    if "total_images" in r:
        print(f"Classes ({len(r['classes'])}): {r['classes']}\nTotal images: {r['total_images']}")
        for sp, v in r["splits"].items(): print(f"  {sp:10s} {v['total']:6d}  {v['per_class']}")
        os.makedirs("models", exist_ok=True)
        json.dump(r, open("models/dataset_report.json", "w"), indent=2)
    for w in r["warnings"]: print("WARNING:", w)
    for e in r["errors"]: print("ERROR:", e)
    sys.exit(1 if r["errors"] else 0)
