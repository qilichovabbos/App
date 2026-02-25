// Replace the recordRound() network call with this localStorage-backed version
recordRoundLocal() {
  if (this.saved_current_round) return;
  const entry = {
    timestamp: (new Date()).toISOString(),
    score: this.score,
    high_score: this.high_score,
    reason: this.death_reason || this.snake.death_reason
  };
  try {
    const key = "modern_snake_rounds";
    const raw = localStorage.getItem(key);
    const arr = raw ? JSON.parse(raw) : [];
    arr.push(entry);
    localStorage.setItem(key, JSON.stringify(arr));
    this.rounds_count = arr.length;
    this.saved_current_round = true;
  } catch (e) {
    console.warn("Failed to save round to localStorage", e);
  }
}