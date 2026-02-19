
import { Component, signal, computed, inject, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Peg, Level, GameState, GameMode, COLORS } from './models/game.models';
import { PegElementComponent } from './components/peg-element.component';
import { AIService } from './services/ai.service';

@Component({
  selector: 'app-root',
  imports: [CommonModule, PegElementComponent],
  templateUrl: './app.component.html'
})
export class AppComponent {
  private aiService = inject(AIService);

  state = signal<GameState>('MENU');
  mode = signal<GameMode>('FREE');
  score = signal(0);
  levelScore = signal(0);
  timeLeft = signal(0);
  selectedColor = signal(COLORS[0].hex);
  placedPegs = signal<Peg[]>([]);
  showClearConfirm = signal(false);
  
  // Immagine guida
  guideImage = signal<string | null>(null);
  showGuide = signal(true);
  isProcessing = signal(false);
  
  freeGridOptions = [
    { label: 'MINI', size: 16, desc: 'Perfetto per sketch veloci e icone', icon: 'fa-table-cells' },
    { label: 'STANDARD', size: 24, desc: 'La dimensione classica per ogni idea', icon: 'fa-table-cells-large' },
    { label: 'GRANDE', size: 32, desc: 'Più spazio per sfumature e dettagli', icon: 'fa-border-all' },
    { label: 'MASTER', size: 48, desc: 'Per veri artisti dei mosaici digitali', icon: 'fa-border-none' }
  ];

  selectedFreeSize = signal(24);
  targetPegs = signal<Peg[]>([]);
  showTarget = signal(false);
  timerInterval: any;
  gameMessage = signal<string | null>(null);

  levels = signal<Level[]>([
    { id: 1, gridSize: 16, name: 'Cuore Pixel', description: 'Un classico cuore rosso', targetPattern: [], timeLimitSeconds: 60, bonusPoints: 100 },
    { id: 2, gridSize: 24, name: 'Fiore', description: 'Un fiore colorato', targetPattern: [], timeLimitSeconds: 120, bonusPoints: 200 },
    { id: 3, gridSize: 32, name: 'Astratto', description: 'Forme geometriche', targetPattern: [], timeLimitSeconds: 180, bonusPoints: 300 },
    { id: 4, gridSize: 24, name: 'AI Surprise', description: 'Generato dall\'IA', targetPattern: [], timeLimitSeconds: 150, bonusPoints: 500 } // Special level
  ]); 
  
  activeGridSize = computed(() => this.mode() === 'FREE' ? this.selectedFreeSize() : (this.currentLevel()?.gridSize || 24));
  currentLevel = signal<Level | null>(null);

  gridColumns = computed(() => `repeat(${this.activeGridSize()}, minmax(0, 1fr))`);
  
  holes = computed(() => {
    const size = this.activeGridSize();
    const items = [];
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        items.push({ id: `${x}-${y}`, x, y });
      }
    }
    return items;
  });

  boardPixels = signal(window.innerWidth > 768 ? 700 : 400);

  @HostListener('window:resize')
  onResize() {
    const isMobile = window.innerWidth < 768;
    const padding = isMobile ? 30 : 150;
    const availableHeight = window.innerHeight - 300; 
    const availableWidth = window.innerWidth - padding;
    this.boardPixels.set(Math.min(availableWidth, availableHeight, 800));
  }

  constructor() {
    this.onResize();
  }

  async startChallenge(level: Level) {
    this.isProcessing.set(true);
    this.currentLevel.set(level);
    this.mode.set('CHALLENGE');
    this.placedPegs.set([]);
    this.score.set(0);
    this.timeLeft.set(level.timeLimitSeconds);
    this.gameMessage.set(null);
    
    // Generate pattern if needed (for AI level or if not pre-defined)
    let pattern = level.targetPattern;
    if (pattern.length === 0) {
      // Generate on the fly
      pattern = await this.aiService.generatePattern(level.name, level.gridSize);
      // Update level with generated pattern so we don't regenerate every time if we restart
      this.levels.update(levels => levels.map(l => l.id === level.id ? { ...l, targetPattern: pattern } : l));
    }
    
    this.targetPegs.set(pattern);
    this.isProcessing.set(false);
    this.state.set('PLAYING');
    this.startTimer();
    
    // Reset view
    this.rotX.set(25);
    this.rotY.set(0);
    this.zoom.set(level.gridSize > 32 ? 0.7 : 1);
    this.onResize();
    
    // Show target briefly
    this.showTarget.set(true);
    setTimeout(() => this.showTarget.set(false), 3000);
  }

  startTimer() {
    if (this.timerInterval) clearInterval(this.timerInterval);
    this.timerInterval = setInterval(() => {
      this.timeLeft.update(t => {
        if (t <= 1) {
          this.endGame(false);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
  }

  stopTimer() {
    if (this.timerInterval) clearInterval(this.timerInterval);
  }

  endGame(win: boolean) {
    this.stopTimer();
    if (win) {
      const bonus = this.timeLeft() * 10;
      this.score.update(s => s + this.currentLevel()!.bonusPoints + bonus);
      this.gameMessage.set(`VITTORIA! Punti: ${this.score()}`);
      // Play win sound or effect
    } else {
      this.gameMessage.set('TEMPO SCADUTO!');
    }
    this.state.set('GAME_OVER');
  }

  toggleTargetView() {
    this.showTarget.update(v => !v);
  }

  checkSolution() {
    if (this.mode() !== 'CHALLENGE') return;
    
    const current = this.placedPegs();
    const target = this.targetPegs();
    
    // Simple check: exact match of position and color
    // This might be too strict. Maybe check percentage?
    // Let's do exact match for now but allow extra pegs? No, exact match is better for puzzle.
    
    if (current.length !== target.length) return; // Not finished
    
    const allMatch = target.every(t => {
      const p = current.find(cp => cp.x === t.x && cp.y === t.y);
      return p && p.color === t.color;
    });
    
    if (allMatch) {
      this.endGame(true);
    }
  }

  rotX = signal(25);
  rotY = signal(0);
  zoom = signal(1);
  boardRotationStyle = computed(() => `rotateX(${this.rotX()}deg) rotateY(${this.rotY()}deg) scale(${this.zoom()})`);

  isDragging = false;
  lastPointerPos = { x: 0, y: 0 };
  pointers = new Map<number, { x: number, y: number }>();
  initialPinchDistance = 0;

  colors = COLORS;

  @HostListener('wheel', ['$event'])
  handleWheel(e: WheelEvent) {
    if (this.state() !== 'PLAYING') return;
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.08 : 0.08;
    this.zoom.update(z => Math.max(0.3, Math.min(2.5, z + delta)));
  }

  handlePointerDown(e: PointerEvent) {
    if (this.state() !== 'PLAYING') return;
    if (this.showClearConfirm()) return;
    
    if ((e.target as HTMLElement).closest('.no-scrollbar') || (e.target as HTMLElement).closest('button') || (e.target as HTMLElement).closest('label')) {
      return;
    }

    this.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    
    if (this.pointers.size === 1) {
      if ((e.target as HTMLElement).classList.contains('hole')) return;
      this.isDragging = true;
      this.lastPointerPos = { x: e.clientX, y: e.clientY };
    } else if (this.pointers.size === 2) {
      this.isDragging = false;
      const [p1, p2] = Array.from(this.pointers.values());
      this.initialPinchDistance = Math.hypot(p1.x - p2.x, p1.y - p2.y);
    }
  }

  handlePointerMove(e: PointerEvent) {
    if (this.state() !== 'PLAYING') return;
    if (!this.pointers.has(e.pointerId)) return;

    this.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (this.pointers.size === 1 && this.isDragging) {
      const deltaX = e.clientX - this.lastPointerPos.x;
      const deltaY = e.clientY - this.lastPointerPos.y;
      this.rotY.update(v => v + deltaX * 0.5);
      this.rotX.update(v => Math.max(-10, Math.min(80, v - deltaY * 0.5)));
      this.lastPointerPos = { x: e.clientX, y: e.clientY };
    } else if (this.pointers.size === 2) {
      const [p1, p2] = Array.from(this.pointers.values());
      const currentDist = Math.hypot(p1.x - p2.x, p1.y - p2.y);
      if (this.initialPinchDistance > 0) {
        const delta = (currentDist - this.initialPinchDistance) * 0.005;
        this.zoom.update(z => Math.max(0.3, Math.min(2.5, z + delta)));
      }
      this.initialPinchDistance = currentDist;
    }
  }

  handlePointerUp(e: PointerEvent) {
    this.pointers.delete(e.pointerId);
    if (this.pointers.size < 2) this.initialPinchDistance = 0;
    if (this.pointers.size === 0) this.isDragging = false;
  }

  startFreeMode(size: number) {
    this.selectedFreeSize.set(size);
    this.mode.set('FREE');
    this.placedPegs.set([]);
    this.guideImage.set(null);
    this.state.set('PLAYING');
    this.rotX.set(25);
    this.rotY.set(0);
    this.zoom.set(size > 32 ? 0.7 : 1);
    this.onResize();
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.guideImage.set(e.target.result);
        this.showGuide.set(true);
      };
      reader.readAsDataURL(file);
    }
  }

  autoFillFromImage() {
    const imgSrc = this.guideImage();
    if (!imgSrc) return;

    this.isProcessing.set(true);
    const img = new Image();
    img.src = imgSrc;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const size = this.activeGridSize();
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Disegna l'immagine sulla griglia della risoluzione desiderata
      ctx.drawImage(img, 0, 0, size, size);
      const imageData = ctx.getImageData(0, 0, size, size).data;
      
      const newPegs: Peg[] = [];
      for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
          const idx = (y * size + x) * 4;
          const r = imageData[idx];
          const g = imageData[idx + 1];
          const b = imageData[idx + 2];
          const a = imageData[idx + 3];

          if (a > 10) { // Salta pixel trasparenti
            const closestHex = this.getClosestColor(r, g, b);
            newPegs.push({
              id: `auto-peg-${x}-${y}-${Date.now()}`,
              x,
              y,
              color: closestHex
            });
          }
        }
      }
      this.placedPegs.set(newPegs);
      this.isProcessing.set(false);
    };
  }

  private getClosestColor(r: number, g: number, b: number): string {
    let minDistance = Infinity;
    let closestHex = this.colors[0].hex;

    for (const color of this.colors) {
      const rgb = this.hexToRgb(color.hex);
      if (!rgb) continue;
      
      // Distanza Euclidea pesata per la percezione umana
      const dr = r - rgb.r;
      const dg = g - rgb.g;
      const db = b - rgb.b;
      const distance = Math.sqrt(dr * dr * 0.3 + dg * dg * 0.59 + db * db * 0.11);

      if (distance < minDistance) {
        minDistance = distance;
        closestHex = color.hex;
      }
    }
    return closestHex;
  }

  private hexToRgb(hex: string) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  }

  toggleGuideVisibility() {
    this.showGuide.update(v => !v);
  }

  placePeg(x: number, y: number) {
    if (this.state() !== 'PLAYING' || this.showClearConfirm()) return;
    const existingIndex = this.placedPegs().findIndex(p => p.x === x && p.y === y);
    if (existingIndex !== -1) {
      const existing = this.placedPegs()[existingIndex];
      if (existing.color === this.selectedColor()) {
        this.placedPegs.update(pegs => pegs.filter((_, i) => i !== existingIndex));
      } else {
        this.placedPegs.update(pegs => {
          const updated = [...pegs];
          updated[existingIndex] = { ...updated[existingIndex], color: this.selectedColor() };
          return updated;
        });
      }
      return;
    }
    const newPeg: Peg = {
      id: `peg-${Date.now()}-${x}-${y}`,
      x,
      y,
      color: this.selectedColor()
    };
    this.placedPegs.update(pegs => [...pegs, newPeg]);
    
    if (this.mode() === 'CHALLENGE') {
      this.checkSolution();
    }
  }

  isPegAt(x: number, y: number): boolean {
    return this.placedPegs().some(p => p.x === x && p.y === y);
  }

  getPegAt(x: number, y: number): Peg | undefined {
    return this.placedPegs().find(p => p.x === x && p.y === y);
  }

  getTargetPegAt(x: number, y: number): Peg | undefined {
    return this.targetPegs().find(p => p.x === x && p.y === y);
  }

  openClearConfirm() {
    if (this.placedPegs().length === 0) return;
    this.showClearConfirm.set(true);
  }

  confirmClear() {
    this.placedPegs.set([]);
    this.showClearConfirm.set(false);
  }

  cancelClear() {
    this.showClearConfirm.set(false);
  }

  resetGame() {
    this.stopTimer();
    this.state.set('MENU');
    this.placedPegs.set([]);
    this.showClearConfirm.set(false);
    this.guideImage.set(null);
  }
}
