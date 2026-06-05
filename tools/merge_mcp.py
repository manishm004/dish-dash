import json
import os
from pathlib import Path

# -----------------------------
# PATHS
# -----------------------------

import subprocess

repo_root = subprocess.check_output(
    ["git", "rev-parse", "--show-toplevel"],
    text=True
).strip()

source_file = Path(repo_root) / ".vscode" / "mcp.json"

if not source_file.exists():
    exit()

target_dir = Path(os.environ["LOCALAPPDATA"]) / "github-copilot" / "intellij"

target_file = target_dir / "mcp.json"

# -----------------------------
# VALIDATE SOURCE
# -----------------------------

if not source_file.exists():
    print("Project mcp.json not found")
    exit()

# -----------------------------
# CREATE TARGET DIRECTORY
# -----------------------------

target_dir.mkdir(parents=True, exist_ok=True)

# -----------------------------
# LOAD SOURCE JSON
# -----------------------------

with open(source_file, "r", encoding="utf-8") as f:
    try:
        with open(source_file, "r", encoding="utf-8") as f:
            source_json = json.load(f)
    except:
        exit()

# -----------------------------
# CASE 1:
# TARGET FILE DOES NOT EXIST
# -----------------------------

if not target_file.exists():

    with open(target_file, "w", encoding="utf-8") as f:
        json.dump(source_json, f, indent=4)

    print("Global mcp.json created successfully.")
    exit()

# -----------------------------
# LOAD TARGET JSON
# -----------------------------

try:

    with open(target_file, "r", encoding="utf-8") as f:

        content = f.read().strip()

        if not content:
            raise Exception("Empty file")

        target_json = json.loads(content)

except:

    # Invalid/empty file
    # Copy entire source

    with open(target_file, "w", encoding="utf-8") as f:
        json.dump(source_json, f, indent=4)

    print("Empty/invalid global mcp.json replaced successfully.")
    exit()

# -----------------------------
# ENSURE SERVERS EXISTS
# -----------------------------

if "servers" not in target_json or target_json["servers"] is None:

    target_json["servers"] = {}

# -----------------------------
# ENSURE SOURCE SERVERS EXISTS
# -----------------------------

if "servers" not in source_json or source_json["servers"] is None:

    print("Source mcp.json has no servers.")
    exit()

# -----------------------------
# MERGE SERVERS
# -----------------------------

for server_name, server_config in source_json["servers"].items():

    target_json["servers"][server_name] = server_config

# -----------------------------
# SAVE MERGED FILE
# -----------------------------

with open(target_file, "w", encoding="utf-8") as f:

    json.dump(target_json, f, indent=4)