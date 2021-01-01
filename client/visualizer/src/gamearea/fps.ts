/**
 * FPS Counter math.
 */
export default class TickCounter {
  private smoothing: number;
  private updateEvery: number;
  private lastUpdate: number;
  private ticksSinceUpdate: number;

  /**
   * Ticks per second.
   */
  tps: number;

  /**
   * @param smoothing 
   * @param updateEvery how frequently to update the FPS counter, in ms
   */
  constructor(smoothing: number, updateEvery: number) {
    this.smoothing = smoothing;
    this.updateEvery = updateEvery;
    this.lastUpdate = 0;
    this.ticksSinceUpdate = 0;
    this.tps = 0;
  }

  /**
   * @param time the system time in ms
   * @param ticks the ticks since the last update
   */
  update(time: number, ticks: number) {
    this.ticksSinceUpdate += ticks;

    if (time > this.lastUpdate + this.updateEvery) {
      this.lastUpdate = time;
      this.tps = this.smoothing * (this.ticksSinceUpdate / (this.updateEvery / 1000)) +
        (1 - this.smoothing) * this.tps;
      this.ticksSinceUpdate = 0;
    }
  }
}
