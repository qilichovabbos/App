from flask import Flask, request, send_from_directory, jsonify
import os
import json
from datetime import datetime
from flask import abort

APP_DIR = os.path.dirname(os.path.abspath(__file__))
ROUNDS_FILE = os.path.join(APP_DIR, "rounds.json")
STATIC_DIR = os.path.join(APP_DIR, "static")

app = Flask(__name__, static_folder=STATIC_DIR, static_url_path="/static")

def _load_rounds():
    if os.path.exists(ROUNDS_FILE):
        try:
            with open(ROUNDS_FILE, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            return []
    return []

def _save_rounds(rounds):
    try:
        with open(ROUNDS_FILE, "w", encoding="utf-8") as f:
            json.dump(rounds, f, indent=2, ensure_ascii=False)
    except Exception as e:
        app.logger.error("Failed to save rounds: %s", e)

@app.route("/")
def index():
    return send_from_directory(STATIC_DIR, "index.html")

@app.route("/save_round", methods=["POST"])
def save_round():
    data = request.get_json(silent=True)
    if not data:
        return abort(400, "Invalid JSON")
    rounds = _load_rounds()
    # Normalize data: timestamp if not provided
    entry = {
        "timestamp": data.get("timestamp") or datetime.utcnow().isoformat() + "Z",
        "score": data.get("score", 0),
        "high_score": data.get("high_score", 0),
        "reason": data.get("reason", "")
    }
    rounds.append(entry)
    _save_rounds(rounds)
    return jsonify({"status": "ok", "total": len(rounds)})

@app.route("/rounds.json", methods=["GET"])
def rounds_file():
    rounds = _load_rounds()
    return jsonify(rounds)

if __name__ == "__main__":
    # Ensure rounds file exists
    if not os.path.exists(ROUNDS_FILE):
        with open(ROUNDS_FILE, "w", encoding="utf-8") as f:
            json.dump([], f)
    app.run(debug=True)
