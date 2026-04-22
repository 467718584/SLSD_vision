import csv
import json
import sys

model_name = sys.argv[1] if len(sys.argv) > 1 else "loushui"
csv_path = f"data/models/{model_name}/results.csv"
meta_path = f"data/models/{model_name}/metadata.json"

try:
    with open(csv_path, "r") as f:
        reader = csv.reader(f)
        rows = list(reader)
    
    if len(rows) > 1:
        max_vals = [0, 0, 0, 0]
        for row in rows[1:]:
            for i, idx in enumerate([5, 6, 7, 8]):
                try:
                    v = float(row[idx])
                    if v > max_vals[i]:
                        max_vals[i] = v
                except:
                    pass
        
        # Update metadata
        with open(meta_path, "r") as f:
            metadata = json.load(f)
        
        if "results_data" not in metadata:
            metadata["results_data"] = {}
        
        metadata["results_data"]["max_precision"] = round(max_vals[0] * 100, 2)
        metadata["results_data"]["max_recall"] = round(max_vals[1] * 100, 2)
        metadata["results_data"]["max_map50"] = round(max_vals[2] * 100, 2)
        metadata["results_data"]["max_map50_95"] = round(max_vals[3] * 100, 2)
        
        # Calculate F1
        p = max_vals[0]
        r = max_vals[1]
        if p + r > 0:
            f1 = 2 * p * r / (p + r)
            metadata["results_data"]["max_f1"] = round(f1 * 100, 2)
        
        with open(meta_path, "w") as f:
            json.dump(metadata, f, ensure_ascii=False, indent=2)
        
        print(f"Updated {meta_path}")
        print(f"  max_precision: {metadata['results_data'].get('max_precision')}")
        print(f"  max_recall: {metadata['results_data'].get('max_recall')}")
        print(f"  max_map50: {metadata['results_data'].get('max_map50')}")
        print(f"  max_map50_95: {metadata['results_data'].get('max_map50_95')}")
        print(f"  max_f1: {metadata['results_data'].get('max_f1')}")
    else:
        print("No data in CSV")
except Exception as e:
    print(f"Error: {e}")