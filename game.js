// Modern Snake — Canvas port with mobile touch controls and Game Over touch support
"use strict";

const SCREEN_WIDTH = 1000;
const SCREEN_HEIGHT = 700;
const CELL_SIZE = 22;
const GRID_W = Math.floor(SCREEN_WIDTH / CELL_SIZE);
const GRID_H = Math.floor(SCREEN_HEIGHT / CELL_SIZE);

const SNAKE_INIT_LEN = 8;
const SPEED = 7.5; // cells per second
const ACCEL_MULTIPLIER = 1.9;
const FRUIT_MARGIN = 2;

const COLORS = {
  BG_TOP: [10,12,30],
  BG_BOTTOM: [6,10,22],
  NEON_A: "rgb(84,255,214)",
  NEON_B: "rgb(124,89,255)",
  NEON_C: "rgb(255,130,160)",
  APPLE_RED: "rgb(220,35,45)",
  BANANA_YELLOW: "rgb(255,220,80)",
  ORANGE: "rgb(255,140,50)",
  CHERRY: "rgb(235,20,55)",
  LEAF_GREEN: "rgb(70,160,60)",
  STEM_BROWN: "rgb(90,55,30)"
};

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d", { alpha: true });
canvas.width = SCREEN_WIDTH;
canvas.height = SCREEN_HEIGHT;

let keys = {};
window.addEventListener("keydown", e => { keys[e.key] = true; });
window.addEventListener("keyup", e => { keys[e.key] = false; });

function clamp(v,a,b){ return Math.max(a, Math.min(b, v)); }
function lerp(a,b,t){ return a + (b-a)*t; }
function randf(a,b){ return a + Math.random()*(b-a); }
function tau(){ return Math.PI*2; }
function gridToPixel(g){ return [g[0]*CELL_SIZE + Math.floor(CELL_SIZE/2), g[1]*CELL_SIZE + Math.floor(CELL_SIZE/2)]; }
function vecEq(a,b){ return a[0]===b[0] && a[1]===b[1]; }

class Particle {
  constructor(pos, vel, color, life, size){
    this.pos = [pos[0], pos[1]];
    this.vel = [vel[0], vel[1]];
    this.color = color;
    this.life = life;
    this.max_life = life;
    this.size = size;
  }
  update(dt){
    this.life -= dt;
    this.pos[0] += this.vel[0]*dt;
    this.pos[1] += this.vel[1]*dt;
    this.vel[0] *= 0.98;
    this.vel[1] *= 0.98;
  }
  draw(ctx){
    if(this.life<=0) return;
    let a = clamp(this.life/this.max_life, 0,1);
    ctx.fillStyle = this.colorToRgba(this.color, a);
    let s = Math.max(1, Math.floor(this.size * a));
    ctx.beginPath();
    ctx.arc(this.pos[0], this.pos[1], s, 0, Math.PI*2);
    ctx.fill();
  }
  colorToRgba(col, a){
    if(col.startsWith("rgb")){
      let nums = col.replace(/[^\d,]/g,"").split(",").map(n=>+n);
      return `rgba(${nums[0]},${nums[1]},${nums[2]},${a.toFixed(3)})`;
    }
    return col;
  }
}

class Food {
  static TYPES = ["apple","banana","orange","cherry"];
  constructor(grid_pos){
    this.grid_pos = grid_pos;
    this.pulse = 0;
    this.type = Food.TYPES[Math.floor(Math.random()*Food.TYPES.length)];
    this.base_r = Math.floor(CELL_SIZE*0.45);
  }
  update(dt){ this.pulse += dt*4; }
  draw(ctx){
    let [x,y] = gridToPixel(this.grid_pos);
    let pulse_r = Math.sin(this.pulse)*2;
    let r = Math.max(6, this.base_r + pulse_r);
    if(this.type==="apple") this._draw_apple(ctx, x,y,r);
    else if(this.type==="banana") this._draw_banana(ctx,x,y,r);
    else if(this.type==="orange") this._draw_orange(ctx,x,y,r);
    else if(this.type==="cherry") this._draw_cherry(ctx,x,y,r);
  }
  _draw_apple(ctx,x,y,r){
    let g = ctx.createRadialGradient(x,y, r*0.2, x,y, r*3);
    g.addColorStop(0, "rgba(220,35,45,0.35)");
    g.addColorStop(1, "rgba(220,35,45,0)");
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x,y,r*3,0,Math.PI*2); ctx.fill();
    ctx.fillStyle = COLORS.APPLE_RED; ctx.beginPath(); ctx.arc(x,y,r,0,Math.PI*2); ctx.fill();
    ctx.fillStyle = COLORS.STEM_BROWN; ctx.fillRect(x-2,y-r-6,4,8);
    ctx.fillStyle = COLORS.LEAF_GREEN; ctx.beginPath(); ctx.moveTo(x+4,y-r-4); ctx.lineTo(x+10,y-r-10); ctx.lineTo(x+4,y-r-2); ctx.fill();
  }
  _draw_banana(ctx,x,y,r){
    ctx.save(); ctx.translate(x,y); ctx.rotate(-0.4);
    ctx.fillStyle = COLORS.BANANA_YELLOW;
    ctx.beginPath(); ctx.ellipse(0,0,r*1.5,r*0.6,0,0,Math.PI*2); ctx.fill();
    ctx.restore();
  }
  _draw_orange(ctx,x,y,r){
    let g = ctx.createRadialGradient(x,y, r*0.2, x,y, r*3);
    g.addColorStop(0, "rgba(255,140,50,0.3)");
    g.addColorStop(1, "rgba(255,140,50,0)");
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x,y,r*3,0,Math.PI*2); ctx.fill();
    ctx.fillStyle = COLORS.ORANGE; ctx.beginPath(); ctx.arc(x,y,r,0,Math.PI*2); ctx.fill();
  }
  _draw_cherry(ctx,x,y,r){
    let r_small = Math.max(6, Math.floor(r/2));
    let cx1 = x - r_small/1.6;
    let cx2 = x + r_small/1.6;
    let cy = y + r_small/4;
    ctx.fillStyle = COLORS.CHERRY; ctx.beginPath(); ctx.arc(cx1,cy,r_small,0,Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(cx2,cy,r_small,0,Math.PI*2); ctx.fill();
    ctx.strokeStyle = COLORS.STEM_BROWN; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(cx1, cy - r_small); ctx.lineTo(x, y - r - 6); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx2, cy - r_small); ctx.lineTo(x, y - r - 6); ctx.stroke();
  }
}

class Snake {
  constructor(){ this.reset(); }
  reset(){
    let cx = Math.floor(GRID_W/2);
    let cy = Math.floor(GRID_H/2);
    this.segments = [];
    for(let i=0;i<SNAKE_INIT_LEN;i++) this.segments.push([cx - i, cy]);
    this.direction = [1,0];
    this.next_dir = [1,0];
    this.speed = SPEED;
    this.move_progress = 0;
    this.alive = true;
    this.death_reason = null;
  }
  set_direction(dir){
    if(dir[0] === -this.direction[0] && dir[1] === -this.direction[1] && this.segments.length>1) return;
    this.next_dir = dir;
  }
  update(dt, accelerate=false){
    if(!this.alive) return false;
    let spd = this.speed * (accelerate ? ACCEL_MULTIPLIER : 1.0);
    this.move_progress += spd * dt;
    let moved = false;
    while(this.move_progress >= 1.0){
      this.move_progress -= 1.0;
      this.direction = [this.next_dir[0], this.next_dir[1]];
      let head = this.segments[0];
      let new_head = [head[0] + this.direction[0], head[1] + this.direction[1]];
      if(!(new_head[0]>=0 && new_head[0]<GRID_W && new_head[1]>=0 && new_head[1]<GRID_H)){
        this.alive = false;
        this.death_reason = "wall";
        moved = true;
        break;
      }
      this.segments.unshift(new_head);
      this.segments.pop();
      moved = true;
      for(let i=1;i<this.segments.length;i++){
        if(this.segments[i][0]===new_head[0] && this.segments[i][1]===new_head[1]){
          this.alive = false;
          this.death_reason = "self";
          break;
        }
      }
      if(!this.alive) break;
    }
    return moved;
  }
  grow(n=1){ for(let i=0;i<n;i++){ let last = this.segments[this.segments.length-1]; this.segments.push([last[0], last[1]]); } }
  head_grid(){ return this.segments[0]; }
  occupies(pos){ return this.segments.some(s => s[0]===pos[0] && s[1]===pos[1]); }
  segmentPixels(){ return this.segments.map(gridToPixel); }
  draw(ctx){
    let segPixels = this.segmentPixels();
    let n = segPixels.length;
    if(n===0) return;
    let max_r = Math.floor(CELL_SIZE*0.7);
    let min_r = Math.floor(CELL_SIZE*0.35);
    let radii = [];
    for(let i=0;i<n;i++) radii.push(Math.floor(lerp(max_r, min_r, i / Math.max(1, n-1))));
    for(let i=n-1;i>=0;i--){
      let [x,y] = segPixels[i];
      let r = radii[i];
      ctx.fillStyle = `rgb(${Math.floor(lerp(110,84, 1 - i/(n-1||1)))}, ${Math.floor(lerp(190,255, 1 - i/(n-1||1)))}, ${Math.floor(lerp(75,214, 1 - i/(n-1||1)))})`;
      ctx.beginPath(); ctx.arc(x,y,r,0,Math.PI*2); ctx.fill();
      ctx.fillStyle = "rgba(255,255,255,0.12)"; ctx.beginPath(); ctx.arc(x - r*0.18, y - r*0.18, Math.max(1, Math.floor(r/3)), 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = "rgba(0,0,0,0.08)"; ctx.beginPath(); ctx.arc(x + r*0.25, y + r*0.25, Math.max(1, Math.floor(r/2)), 0, Math.PI*2); ctx.fill();
    }
    let [head_x, head_y] = segPixels[0];
    let head_r = radii[0];
    ctx.fillStyle = "#ffffff";
    ctx.beginPath(); ctx.arc(head_x - head_r*0.25, head_y - head_r*0.35, Math.max(1, Math.floor(head_r/5)), 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(head_x + head_r*0.25, head_y - head_r*0.35, Math.max(1, Math.floor(head_r/5)), 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = "#1e1e1e";
    ctx.beginPath(); ctx.arc(head_x - head_r*0.25, head_y - head_r*0.35, Math.max(1, Math.floor(head_r/10)), 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(head_x + head_r*0.25, head_y - head_r*0.35, Math.max(1, Math.floor(head_r/10)), 0, Math.PI*2); ctx.fill();
  }
}

function randomFoodPos(snake, margin=FRUIT_MARGIN){
  let attempts = 0;
  let min_x = margin;
  let max_x = GRID_W - margin - 1;
  let min_y = margin;
  let max_y = GRID_H - margin - 1;
  if(min_x > max_x){ min_x = 0; max_x = GRID_W-1; }
  if(min_y > max_y){ min_y = 0; max_y = GRID_H-1; }
  while(true){
    let pos = [Math.floor(randf(min_x, max_x+1)), Math.floor(randf(min_y, max_y+1))];
    if(!snake.occupies(pos)) return pos;
    attempts++;
    if(attempts > 1000){
      for(let x=0;x<GRID_W;x++){
        for(let y=0;y<GRID_H;y++){
          if(!snake.occupies([x,y])) return [x,y];
        }
      }
      return snake.head_grid();
    }
  }
}

class Game {
  constructor(){
    this.snake = new Snake();
    this.food = new Food(randomFoodPos(this.snake));
    this.particles = [];
    this.score = 0;
    this.paused = false;
    this.show_start = true;
    this.bg_grid_offset = 0;
    this.high_score = 0;
    this.game_over = false;
    this.saved_current_round = false;
    this.death_reason = null;
    this.rounds_count = 0;
    this.loadRoundsCount();
    this.round_start_time = new Date();
    this.btnYesRect = null;
    this.btnNoRect = null;
    this._setupTouchControls();
    window.addEventListener("keydown", (e)=> this.onKeyDown(e));
    canvas.addEventListener("pointerdown", (e)=> this.onCanvasPointerDown(e));
  }

  async loadRoundsCount(){
    try{
      let r = await fetch("/rounds.json");
      if(r.ok){
        let j = await r.json();
        this.rounds_count = Array.isArray(j) ? j.length : 0;
      } else this.rounds_count = this._loadLocalRounds().length;
    }catch(e){
      this.rounds_count = this._loadLocalRounds().length;
    }
  }

  _loadLocalRounds(){
    try{ const raw = localStorage.getItem("modern_snake_rounds"); return raw ? JSON.parse(raw) : []; }catch(e){ return []; }
  }
  _saveLocalRound(entry){
    try{
      const key = "modern_snake_rounds";
      const arr = this._loadLocalRounds();
      arr.push(entry);
      localStorage.setItem(key, JSON.stringify(arr));
      this.rounds_count = arr.length;
      this.saved_current_round = true;
    }catch(e){ console.warn("local save failed", e); }
  }

  recordRound(){
    if(this.saved_current_round) return;
    const entry = {
      timestamp: (new Date()).toISOString(),
      score: this.score,
      high_score: this.high_score,
      reason: this.death_reason || this.snake.death_reason
    };
    try{
      fetch("/save_round", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(entry)
      }).then(resp => {
        if(!resp.ok) throw new Error("no server");
        return resp.json();
      }).then(j => {
        if(j && j.total) this.rounds_count = j.total;
        this.saved_current_round = true;
      }).catch(() => { this._saveLocalRound(entry); });
    }catch(e){ this._saveLocalRound(entry); }
  }

  reset(){
    this.snake = new Snake();
    this.food = new Food(randomFoodPos(this.snake));
    this.particles.length = 0;
    this.score = 0;
    this.paused = false;
    this.show_start = false;
    this.game_over = false;
    this.saved_current_round = false;
    this.death_reason = null;
    this.round_start_time = new Date();
  }

  spawnFood(){ this.food = new Food(randomFoodPos(this.snake)); }

  spawnEatParticles(px,py,color){
    for(let i=0;i<18;i++){
      let ang = Math.random()*tau();
      let speed = randf(40,260);
      let vel = [Math.cos(ang)*speed, Math.sin(ang)*speed];
      this.particles.push(new Particle([px,py], vel, color, randf(0.5,1.1), randf(2,5)));
    }
  }

  eatFood(){
    this.snake.grow(1);
    this.score += 1;
    this.high_score = Math.max(this.high_score, this.score);
    let [fx,fy] = gridToPixel(this.food.grid_pos);
    let colorMap = { apple: COLORS.APPLE_RED, banana: COLORS.BANANA_YELLOW, orange: COLORS.ORANGE, cherry: COLORS.CHERRY };
    let col = colorMap[this.food.type] || COLORS.NEON_C;
    this.spawnEatParticles(fx,fy,col);
    this.spawnFood();
  }

  update(dt){
    if(this.show_start){ this.bg_grid_offset += dt*10; return; }
    if(this.paused || this.game_over) return;

    if(keys["ArrowUp"] || keys["w"] || keys["W"]) this.snake.set_direction([0,-1]);
    if(keys["ArrowDown"] || keys["s"] || keys["S"]) this.snake.set_direction([0,1]);
    if(keys["ArrowLeft"] || keys["a"] || keys["A"]) this.snake.set_direction([-1,0]);
    if(keys["ArrowRight"] || keys["d"] || keys["D"]) this.snake.set_direction([1,0]);

    let accelerating = keys["Shift"] || keys["ShiftLeft"] || keys["ShiftRight"];
    let moved = this.snake.update(dt, !!accelerating);

    if(!this.snake.alive){
      this.game_over = true;
      this.death_reason = this.snake.death_reason;
      try{
        let [hx,hy] = gridToPixel(this.snake.head_grid());
        for(let i=0;i<30;i++){
          let ang = Math.random()*tau();
          let speed = randf(60,300);
          this.particles.push(new Particle([hx,hy], [Math.cos(ang)*speed, Math.sin(ang)*speed], "rgb(220,80,80)", randf(0.4,0.9), randf(2,6)));
        }
      }catch(e){}
      this.recordRound();
      return;
    }

    if(moved && vecEq(this.snake.head_grid(), this.food.grid_pos)) this.eatFood();

    for(let p of this.particles) p.update(dt);
    this.particles = this.particles.filter(p => p.life > 0.01);
    this.food.update(dt);
    this.bg_grid_offset += dt*40;
  }

  onKeyDown(e){
    if(this.game_over){
      if(e.key === "y" || e.key === "Enter") this.reset();
      return;
    }
    if(e.key === " "){
      if(this.show_start) this.show_start = false;
      else this.paused = !this.paused;
    } else if(e.key === "r" || e.key === "R") this.reset();
  }

  _setupTouchControls(){
    const map = [
      {id: "up", key: "ArrowUp", dir: [0,-1]},
      {id: "down", key: "ArrowDown", dir: [0,1]},
      {id: "left", key: "ArrowLeft", dir: [-1,0]},
      {id: "right", key: "ArrowRight", dir: [1,0]}
    ];
    for(let m of map){
      const el = document.getElementById(m.id);
      if(!el) continue;
      el.addEventListener("pointerdown", (ev)=>{
        ev.preventDefault();
        this.snake.set_direction(m.dir);
        keys[m.key] = true;
      });
      const upfn = (ev)=>{
        ev.preventDefault();
        keys[m.key] = false;
      };
      el.addEventListener("pointerup", upfn);
      el.addEventListener("pointercancel", upfn);
      el.addEventListener("pointerleave", upfn);
    }

    const accel = document.getElementById("accelerate");
    if(accel){
      accel.addEventListener("pointerdown", (e)=>{ e.preventDefault(); keys["Shift"] = true; });
      const up = (e)=>{ e.preventDefault(); keys["Shift"] = false; };
      accel.addEventListener("pointerup", up);
      accel.addEventListener("pointercancel", up);
      accel.addEventListener("pointerleave", up);
    }

    const pause = document.getElementById("pause");
    if(pause) pause.addEventListener("click", (e)=>{ e.preventDefault(); if(this.show_start) this.show_start = false; else this.paused = !this.paused; });

    const restart = document.getElementById("restart");
    if(restart) restart.addEventListener("click", (e)=>{ e.preventDefault(); this.reset(); });
  }

  onCanvasPointerDown(e){
    // For Game Over overlay buttons: map pointer position to canvas coords and check Yes/No rects
    if(!this.game_over) return;
    const rect = canvas.getBoundingClientRect();
    const mx = (e.clientX - rect.left) * (canvas.width / rect.width);
    const my = (e.clientY - rect.top) * (canvas.height / rect.height);
    if(this.btnYesRect && pointInRect(mx,my,this.btnYesRect)){
      this.reset();
    } else if(this.btnNoRect && pointInRect(mx,my,this.btnNoRect)){
      // do nothing (can't reliably close mobile tab). Could redirect or show message.
      // We'll simply keep game over overlay.
    }
  }

  draw(ctx){
    drawGradientBg(ctx, COLORS.BG_TOP, COLORS.BG_BOTTOM);
    this.drawAnimatedGrid(ctx);
    this.drawVignette(ctx);
    this.food.draw(ctx);
    this.snake.draw(ctx);
    for(let p of this.particles) p.draw(ctx);
    this.drawUI(ctx);
    if(this.show_start) this.drawStartOverlay(ctx);
    else if(this.game_over) this.drawGameOverOverlay(ctx);
    else if(this.paused) this.drawPaused(ctx);
  }

  drawAnimatedGrid(ctx){
    let spacing = CELL_SIZE*2;
    let offset = Math.floor(this.bg_grid_offset % spacing);
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    ctx.strokeStyle = "rgba(255,255,255,0.05)";
    ctx.lineWidth = 1;
    for(let x=-spacing; x<=SCREEN_WIDTH+spacing; x+=spacing){
      ctx.beginPath();
      ctx.moveTo(x + offset, 0);
      ctx.lineTo(x + offset - SCREEN_HEIGHT, SCREEN_HEIGHT);
      ctx.stroke();
    }
    ctx.restore();
    let cx = SCREEN_WIDTH/2, cy = SCREEN_HEIGHT/2;
    let glow = ctx.createRadialGradient(cx,cy,40,cx,cy,400);
    glow.addColorStop(0, "rgba(124,89,255,0.08)");
    glow.addColorStop(1, "rgba(124,89,255,0)");
    ctx.fillStyle = glow;
    ctx.beginPath(); ctx.arc(cx,cy,400,0,Math.PI*2); ctx.fill();
  }

  drawVignette(ctx){
    ctx.save();
    for(let i=200;i>0;i-=10){
      ctx.fillStyle = `rgba(0,0,0,0.02)`;
      ctx.fillRect(-i,-i, SCREEN_WIDTH + i*2, SCREEN_HEIGHT + i*2);
    }
    ctx.restore();
  }

  drawUI(ctx){
    document.getElementById("score").textContent = `Score: ${this.score}`;
    document.getElementById("best").textContent = `Best: ${this.high_score}`;
  }

  drawStartOverlay(ctx){
    ctx.save();
    ctx.fillStyle = "rgba(6,6,10,0.75)";
    ctx.fillRect(0,0,SCREEN_WIDTH,SCREEN_HEIGHT);
    ctx.fillStyle = COLORS.NEON_B;
    ctx.font = "64px Segoe UI, Arial";
    ctx.textAlign = "center";
    ctx.fillText("Modern Snake", SCREEN_WIDTH/2, SCREEN_HEIGHT/2 - 30);
    ctx.fillStyle = "rgba(200,200,200,0.95)";
    ctx.font = "28px Segoe UI, Arial";
    ctx.fillText("Tap a control or press Space to start", SCREEN_WIDTH/2, SCREEN_HEIGHT/2 + 40);
    ctx.restore();
  }

  drawPaused(ctx){
    ctx.save();
    ctx.fillStyle = "rgba(0,0,0,0.45)"; ctx.fillRect(0,0,SCREEN_WIDTH,SCREEN_HEIGHT);
    ctx.fillStyle = "rgba(230,230,230,0.98)";
    ctx.font = "64px Segoe UI, Arial";
    ctx.textAlign = "center";
    ctx.fillText("Paused", SCREEN_WIDTH/2, SCREEN_HEIGHT/2);
    ctx.restore();
  }

  drawGameOverOverlay(ctx){
    ctx.save();
    ctx.fillStyle = "rgba(6,6,10,0.82)";
    ctx.fillRect(0,0,SCREEN_WIDTH,SCREEN_HEIGHT);

    ctx.fillStyle = COLORS.NEON_C;
    ctx.font = "64px Segoe UI, Arial";
    ctx.textAlign = "center";
    ctx.fillText("Game Over", SCREEN_WIDTH/2, SCREEN_HEIGHT/2 - 130);

    let reason_text = "You crashed!";
    if(this.death_reason === "wall") reason_text = "You hit a wall!";
    else if(this.death_reason === "self") reason_text = "You hit yourself!";
    ctx.fillStyle = "rgba(230,230,230,0.95)";
    ctx.font = "28px Segoe UI, Arial";
    ctx.fillText(reason_text, SCREEN_WIDTH/2, SCREEN_HEIGHT/2 - 80);

    ctx.font = "18px Segoe UI, Arial";
    ctx.fillStyle = "#d2d2d2";
    ctx.fillText(`Score: ${this.score}`, SCREEN_WIDTH/2, SCREEN_HEIGHT/2 - 48);
    ctx.fillText(`Best: ${this.high_score}`, SCREEN_WIDTH/2, SCREEN_HEIGHT/2 - 26);
    ctx.fillText(`Total rounds stored: ${this.rounds_count}`, SCREEN_WIDTH/2, SCREEN_HEIGHT/2 - 4);

    ctx.font = "28px Segoe UI, Arial";
    ctx.fillStyle = "rgba(240,240,240,0.98)";
    ctx.fillText("Play again?", SCREEN_WIDTH/2, SCREEN_HEIGHT/2 + 20);

    // Buttons (larger for mobile)
    let btn_w = 160, btn_h = 64, gap = 36;
    let cx = SCREEN_WIDTH/2, cy = SCREEN_HEIGHT/2 + 110;
    let yesRect = { x: cx - btn_w - gap/2, y: cy - btn_h/2, w: btn_w, h: btn_h };
    let noRect  = { x: cx + gap/2, y: cy - btn_h/2, w: btn_w, h: btn_h };
    this.btnYesRect = yesRect; this.btnNoRect = noRect;

    ctx.fillStyle = "rgba(28,150,130,0.95)";
    roundRect(ctx, yesRect.x, yesRect.y, yesRect.w, yesRect.h, 16, true, false);
    ctx.fillStyle = "white";
    ctx.font = "30px Segoe UI, Arial";
    ctx.fillText("Yes", yesRect.x + yesRect.w/2, yesRect.y + yesRect.h/2 + 10);

    ctx.fillStyle = "rgba(60,60,60,0.9)";
    roundRect(ctx, noRect.x, noRect.y, noRect.w, noRect.h, 16, true, false);
    ctx.fillStyle = "white";
    ctx.fillText("No", noRect.x + noRect.w/2, noRect.y + noRect.h/2 + 10);

    ctx.restore();
  }
}

function pointInRect(px,py,r){ return px>=r.x && px<=r.x+r.w && py>=r.y && py<=r.y+r.h; }
function roundRect(ctx,x,y,w,h,r, fill, stroke){
  if (typeof r === 'undefined') r = 5;
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
  if(fill) ctx.fill();
  if(stroke) ctx.stroke();
}

// Instantiate and run
let game = new Game();
let last = performance.now();
function loop(now){
  let dt = Math.min(0.05, (now - last)/1000);
  last = now;
  game.update(dt);
  ctx.clearRect(0,0,SCREEN_WIDTH,SCREEN_HEIGHT);
  game.draw(ctx);
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);

function drawGradientBg(ctx, topCol, bottomCol){
  let grad = ctx.createLinearGradient(0,0,0,SCREEN_HEIGHT);
  grad.addColorStop(0, `rgb(${topCol[0]},${topCol[1]},${topCol[2]})`);
  grad.addColorStop(1, `rgb(${bottomCol[0]},${bottomCol[1]},${bottomCol[2]})`);
  ctx.fillStyle = grad; ctx.fillRect(0,0,SCREEN_WIDTH,SCREEN_HEIGHT);
}
