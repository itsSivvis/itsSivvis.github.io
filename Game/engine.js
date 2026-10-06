// Game state and collisions are independent of the renderer.
export const LANES = [-3, 0, 3];
export class Sprint {
  constructor(random = Math.random) { this.random = random; this.state = 'ready'; this.best = 0; this.reset(); }
  reset() { this.lane = 1; this.x = 0; this.elapsed = 0; this.distance = 0; this.crystals = 0; this.score = 0; this.objects = []; this.spawnIn = 1.25; this.nextId = 0; this.speed = 14; }
  start() { this.reset(); this.state = 'running'; }
  move(direction) { if (this.state === 'running') this.lane = Math.max(0, Math.min(2, this.lane + direction)); }
  pause() { if (this.state === 'running') this.state = 'paused'; }
  resume() { if (this.state === 'paused') this.state = 'running'; }
  spawn() {
    const blocked = Math.min(2, Math.floor(this.random() * 3));
    this.objects.push({ id:this.nextId++, type:'block', x:LANES[blocked], z:-70 });
    let safe = (blocked + 1 + Math.floor(this.random() * 2)) % 3;
    if (this.elapsed > 18 && this.random() < .42) {
      const second = (blocked + 1) % 3;
      this.objects.push({ id:this.nextId++, type:'block', x:LANES[second], z:-70 });
      safe = (blocked + 2) % 3;
    }
    this.objects.push({ id:this.nextId++, type:'gem', x:LANES[safe], z:-70 });
  }
  update(dt) {
    if (this.state !== 'running') return [];
    dt = Math.max(0, Math.min(dt, .05));
    this.elapsed += dt;
    this.speed = Math.min(31, 14 + this.elapsed * .19);
    this.distance += this.speed * dt;
    this.x += (LANES[this.lane] - this.x) * (1 - Math.exp(-16 * dt));
    this.spawnIn -= dt;
    if (this.spawnIn <= 0) { this.spawn(); this.spawnIn = Math.max(.9, 1.75 - this.elapsed * .009); }
    const events = [];
    for (const obj of this.objects) {
      const before = obj.z;
      obj.z += this.speed * dt;
      const radius = obj.type === 'block' ? 1.1 : .95;
      if (!obj.hit && before <= 4.75 && obj.z >= 3.25 && Math.abs(obj.x - this.x) < radius) {
        obj.hit = true;
        if (obj.type === 'block') { this.state = 'over'; events.push({type:'crash'}); break; }
        this.crystals++; events.push({type:'collect'});
      }
    }
    this.objects = this.objects.filter(obj => obj.z < 16 && !(obj.hit && obj.type === 'gem'));
    this.score = Math.floor(this.distance / 3) + this.crystals * 25;
    this.best = Math.max(this.best, this.score);
    return events;
  }
}
