import { resample } from '../lib/wav';
import type { FromWorker, Hit, ToWorker } from './protocol';

export const SAMPLE_RATE = 48_000;
const WINDOW_SECONDS = 3;
const WINDOW_SAMPLES = SAMPLE_RATE * WINDOW_SECONDS;
const HOP_MS = 1500;

export interface WindowResult {
  hits: Hit[];
  /** The 3 seconds of audio the result is for, at 48 kHz. */
  pcm: Float32Array;
  ms: number;
}

interface Handlers {
  onProgress?: (fraction: number) => void;
  onLevel?: (level: number) => void;
  onResult?: (result: WindowResult) => void;
  onError?: (message: string) => void;
}

/**
 * Listens to the microphone and runs BirdNET on the last 3 seconds of sound every 1.5 seconds.
 * The model runs in a worker, so the screen stays responsive.
 */
export class BirdListener {
  private readonly worker: Worker;
  private handlers: Handlers = {};
  private ready?: Promise<{ backend: string; hasArea: boolean }>;
  private waiters = new Map<string, (msg: FromWorker) => void>();
  private pending = new Map<number, Float32Array>();
  private nextId = 1;
  private busy = false;

  private stream?: MediaStream;
  private ctx?: AudioContext;
  private node?: AudioWorkletNode;
  private source?: MediaStreamAudioSourceNode;
  private timer?: ReturnType<typeof setInterval>;
  private ring = new Float32Array(0);
  private write = 0;
  private filled = 0;
  private rate = SAMPLE_RATE;
  minScore = 0.1;

  constructor() {
    this.worker = new Worker(new URL('./birdnet.worker.ts', import.meta.url), { type: 'module' });
    this.worker.onmessage = (event: MessageEvent<FromWorker>) => this.receive(event.data);
    this.worker.onerror = () => this.handlers.onError?.('The bird model stopped unexpectedly');
  }

  on(handlers: Handlers): void {
    this.handlers = handlers;
  }

  private receive(msg: FromWorker) {
    if (msg.type === 'progress') this.handlers.onProgress?.(msg.progress);
    else if (msg.type === 'result') {
      this.busy = false;
      const pcm = this.pending.get(msg.id);
      this.pending.delete(msg.id);
      if (pcm) this.handlers.onResult?.({ hits: msg.hits, pcm, ms: msg.ms });
    } else if (msg.type === 'error') {
      this.busy = false;
      this.handlers.onError?.(msg.message);
    }
    const waiter = this.waiters.get(msg.type);
    if (waiter) {
      this.waiters.delete(msg.type);
      waiter(msg);
    }
  }

  private send(msg: ToWorker, transfer: Transferable[] = []) {
    this.worker.postMessage(msg, transfer);
  }

  private waitFor<T extends FromWorker['type']>(type: T): Promise<Extract<FromWorker, { type: T }>> {
    return new Promise((resolve, reject) => {
      this.waiters.set(type, (msg) => resolve(msg as Extract<FromWorker, { type: T }>));
      this.waiters.set('error', (msg) => reject(new Error((msg as { message: string }).message)));
    });
  }

  /** Loads the model into the worker. Safe to call more than once. */
  load(baseUrl: string, backend?: 'webgl' | 'cpu'): Promise<{ backend: string; hasArea: boolean }> {
    this.ready ??= (async () => {
      const done = this.waitFor('ready');
      this.send({ type: 'load', base: baseUrl, backend });
      const msg = await done;
      this.waiters.delete('error');
      return { backend: msg.backend, hasArea: msg.hasArea };
    })();
    this.ready.catch(() => (this.ready = undefined));
    return this.ready;
  }

  /** Tells the model where and when it is listening; returns how many species are expected (or -1). */
  async setPlace(lat: number, lng: number, week: number): Promise<number> {
    const done = this.waitFor('area');
    this.send({ type: 'area', lat, lng, week });
    const msg = await done;
    this.waiters.delete('error');
    return msg.expected;
  }

  /** Call straight from a tap: iPhones only allow audio to start inside a user gesture. */
  async start(): Promise<void> {
    const ctx = new AudioContext({ sampleRate: SAMPLE_RATE });
    this.ctx = ctx;
    const resumed = ctx.resume();
    this.stream = await navigator.mediaDevices.getUserMedia({
      audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false, channelCount: 1 },
    });
    await resumed;
    this.rate = ctx.sampleRate;
    this.ring = new Float32Array(Math.round(this.rate * WINDOW_SECONDS));
    this.write = 0;
    this.filled = 0;
    await ctx.audioWorklet.addModule(`${import.meta.env.BASE_URL}worklets/capture.js`);
    this.source = ctx.createMediaStreamSource(this.stream);
    this.node = new AudioWorkletNode(ctx, 'veldboek-capture');
    this.node.port.onmessage = (event: MessageEvent<Float32Array>) => this.push(event.data);
    // The capture node outputs silence; connecting it keeps the browser processing audio.
    this.source.connect(this.node).connect(ctx.destination);
    await ctx.resume();
    this.timer = setInterval(() => this.tick(), HOP_MS);
  }

  private push(block: Float32Array) {
    let sum = 0;
    for (const s of block) sum += s * s;
    this.handlers.onLevel?.(Math.sqrt(sum / block.length));
    for (const s of block) {
      this.ring[this.write] = s;
      this.write = (this.write + 1) % this.ring.length;
    }
    this.filled = Math.min(this.ring.length, this.filled + block.length);
  }

  private tick() {
    if (this.busy || this.filled < this.ring.length) return;
    const window = new Float32Array(this.ring.length);
    window.set(this.ring.subarray(this.write));
    window.set(this.ring.subarray(0, this.write), this.ring.length - this.write);
    const pcm = this.rate === SAMPLE_RATE ? window : resample(window, this.rate, SAMPLE_RATE, WINDOW_SAMPLES);
    const id = this.nextId++;
    this.pending.set(id, pcm.slice());
    this.busy = true;
    this.send({ type: 'predict', id, pcm, minScore: this.minScore }, [pcm.buffer]);
  }

  stop(): void {
    clearInterval(this.timer);
    this.timer = undefined;
    this.node?.port.close();
    this.node?.disconnect();
    this.source?.disconnect();
    this.stream?.getTracks().forEach((t) => t.stop());
    void this.ctx?.close();
    this.node = undefined;
    this.source = undefined;
    this.stream = undefined;
    this.ctx = undefined;
    this.busy = false;
    this.pending.clear();
  }

  dispose(): void {
    this.stop();
    this.worker.terminate();
  }
}
