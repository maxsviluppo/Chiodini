
import { Component, input, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-peg-element',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="peg-container relative w-full h-full animate-peg-drop" style="transform-style: preserve-3d; will-change: transform;">
      
      <!-- Ombra base proiettata sulla tavola -->
      <div class="absolute inset-[-12%] rounded-full bg-black/45 blur-[2px]" style="transform: translateZ(1px);"></div>
      
      <!-- Gambo del chiodino (Pin) -->
      <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1/3 h-1/3 bg-slate-900"
           style="transform: translateZ(2px); border-radius: 50%;"></div>

      <!-- Testa del chiodino (Testa sferica lucida) -->
      <div 
        class="peg-head absolute inset-0 rounded-full shadow-[inset_0_-2px_6px_rgba(0,0,0,0.3),0_4px_10px_rgba(0,0,0,0.4)] border border-white/20 overflow-hidden"
        [style.background-color]="color()"
        style="transform: translateZ(16px); transform-style: preserve-3d; backface-visibility: hidden; -webkit-backface-visibility: hidden;"
      >
        <!-- Strato di volume: Ombreggiatura sferica interna -->
        <div class="absolute inset-0 bg-[radial-gradient(circle_at_35%_35%,rgba(255,255,255,0.3),transparent_75%)] rounded-full"></div>
        <div class="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-black/40 rounded-full"></div>
        
        <!-- RIFLESSO DINAMICO (Sheen) -->
        <div class="absolute inset-[-50%] bg-gradient-to-tr from-transparent via-white/25 to-transparent rotate-45 pointer-events-none animate-sheen"></div>
        
        <!-- Punto luce primario (Spotlight) -->
        <div class="absolute top-[12%] left-[12%] w-[35%] h-[35%] bg-white/60 blur-[1px] rounded-full pointer-events-none shadow-[0_0_5px_rgba(255,255,255,0.4)]"></div>
        
        <!-- Riflesso di contorno (Rim light) -->
        <div class="absolute inset-0 rounded-full border-[1.5px] border-white/10 pointer-events-none"></div>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; width: 100%; height: 100%; }
    
    @keyframes bounce-in {
      0% { transform: scale(0) translateY(-25px) translateZ(50px); opacity: 0; }
      70% { transform: scale(1.1) translateY(2px); }
      100% { transform: scale(1) translateY(0) translateZ(0); opacity: 1; }
    }

    @keyframes sheen-sweep {
      0% { transform: translateX(-100%) translateY(-100%) rotate(45deg); opacity: 0; }
      20% { opacity: 0.8; }
      40% { transform: translateX(100%) translateY(100%) rotate(45deg); opacity: 0; }
      100% { transform: translateX(100%) translateY(100%) rotate(45deg); opacity: 0; }
    }

    .animate-peg-drop {
      animation: bounce-in 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
    }

    .animate-sheen {
      animation: sheen-sweep 6s infinite ease-in-out;
    }

    .peg-head {
      image-rendering: -webkit-optimize-contrast;
      image-rendering: auto;
      transform: translateZ(16px);
    }
  `]
})
export class PegElementComponent {
  color = input.required<string>();
}
