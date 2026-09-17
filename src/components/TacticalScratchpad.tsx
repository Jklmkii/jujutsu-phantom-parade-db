import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Pencil,
  Eraser,
  RotateCcw,
  Trash2,
  X,
  Sparkles,
} from 'lucide-react';
import { useJjkStore } from '../store/useJjkStore';

export type ScratchpadTool = 'pen' | 'eraser';

export interface StrokePoint {
  x: number;
  y: number;
}

export interface Stroke {
  points: StrokePoint[];
  color: string;
  width: number;
  isEraser: boolean;
}

const COLOR_PALETTE = [
  { name: 'Branco', value: '#ffffff', bgClass: 'bg-white' },
  { name: 'Amarelo', value: '#facc15', bgClass: 'bg-yellow-400' },
  { name: 'Ciano', value: '#38bdf8', bgClass: 'bg-sky-400' },
  { name: 'Roxo', value: '#c084fc', bgClass: 'bg-purple-400' },
  { name: 'Vermelho', value: '#f87171', bgClass: 'bg-red-400' },
  { name: 'Verde', value: '#4ade80', bgClass: 'bg-green-400' },
];

export const TacticalScratchpad: React.FC = () => {
  const { isScratchpadOpen, toggleScratchpad } = useJjkStore();
  const [tool, setTool] = useState<ScratchpadTool>('pen');
  const [selectedColor, setSelectedColor] = useState('#c084fc');
  const [strokeWidth, setStrokeWidth] = useState(3);
  const [hasStrokes, setHasStrokes] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const isDrawingRef = useRef(false);
  const strokesRef = useRef<Stroke[]>([]);
  const currentStrokeRef = useRef<Stroke | null>(null);

  const redrawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (const stroke of strokesRef.current) {
      if (stroke.points.length < 2) continue;
      ctx.save();
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      if (stroke.isEraser) {
        ctx.globalCompositeOperation = 'destination-out';
        ctx.lineWidth = stroke.width * 4 * dpr;
      } else {
        ctx.globalCompositeOperation = 'source-over';
        ctx.strokeStyle = stroke.color;
        ctx.lineWidth = stroke.width * dpr;
      }

      ctx.beginPath();
      ctx.moveTo(stroke.points[0].x * dpr, stroke.points[0].y * dpr);

      for (let i = 1; i < stroke.points.length; i++) {
        ctx.lineTo(stroke.points[i].x * dpr, stroke.points[i].y * dpr);
      }

      ctx.stroke();
      ctx.restore();
    }
  }, []);

  // Resize canvas to match window
  const resizeCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = window.innerWidth * dpr;
    canvas.height = window.innerHeight * dpr;
    canvas.style.width = `${window.innerWidth}px`;
    canvas.style.height = `${window.innerHeight}px`;
    redrawCanvas();
  }, [redrawCanvas]);

  useEffect(() => {
    if (isScratchpadOpen) {
      window.addEventListener('resize', resizeCanvas);
      resizeCanvas();
    }
    return () => window.removeEventListener('resize', resizeCanvas);
  }, [isScratchpadOpen, resizeCanvas]);

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    isDrawingRef.current = true;
    currentStrokeRef.current = {
      points: [{ x, y }],
      color: selectedColor,
      width: strokeWidth,
      isEraser: tool === 'eraser',
    };
    strokesRef.current.push(currentStrokeRef.current);
    setHasStrokes(true);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current || !currentStrokeRef.current) return;
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    currentStrokeRef.current.points.push({ x, y });
    redrawCanvas();
  };

  const handlePointerUp = () => {
    isDrawingRef.current = false;
    currentStrokeRef.current = null;
  };

  const undoLastStroke = () => {
    strokesRef.current.pop();
    setHasStrokes(strokesRef.current.length > 0);
    redrawCanvas();
  };

  const clearCanvas = () => {
    strokesRef.current = [];
    setHasStrokes(false);
    redrawCanvas();
  };

  if (!isScratchpadOpen) {
    return (
      <button
        onClick={toggleScratchpad}
        className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-2.5 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-xl shadow-purple-950/70 border border-purple-400/40 font-bold text-xs transition-all hover:scale-105 active:scale-95 group"
        title="Abrir Lousa Tática (Anotações sobre a tela)"
      >
        <Pencil className="w-4 h-4 text-purple-200 group-hover:rotate-12 transition-transform" />
        <span>Lousa Tática</span>
      </button>
    );
  }

  return (
    <div ref={containerRef} className="fixed inset-0 z-50 pointer-events-none">
      {/* Interactive Floating Canvas */}
      <canvas
        ref={canvasRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        className="absolute inset-0 pointer-events-auto cursor-crosshair bg-black/30 backdrop-blur-[2px]"
      />

      {/* Floating Toolbar */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 pointer-events-auto bg-[#100c20]/95 border-2 border-purple-500/50 rounded-2xl p-2.5 shadow-2xl shadow-purple-950/80 flex items-center gap-3 backdrop-blur-md">
        {/* Brand/Title */}
        <div className="flex items-center gap-1.5 pl-2 pr-3 border-r border-[#2d2250] text-purple-300 font-bold text-xs">
          <Sparkles className="w-3.5 h-3.5 text-purple-400" />
          <span>Lousa Tática</span>
        </div>

        {/* Tools: Pen / Eraser */}
        <div className="flex items-center gap-1 bg-[#1a1333] p-1 rounded-xl border border-[#2d2250]">
          <button
            onClick={() => setTool('pen')}
            className={`p-2 rounded-lg transition-colors ${
              tool === 'pen' ? 'bg-purple-600 text-white shadow-sm' : 'text-gray-400 hover:text-white'
            }`}
            title="Caneta"
          >
            <Pencil className="w-4 h-4" />
          </button>
          <button
            onClick={() => setTool('eraser')}
            className={`p-2 rounded-lg transition-colors ${
              tool === 'eraser' ? 'bg-purple-600 text-white shadow-sm' : 'text-gray-400 hover:text-white'
            }`}
            title="Borracha"
          >
            <Eraser className="w-4 h-4" />
          </button>
        </div>

        {/* Colors */}
        {tool === 'pen' && (
          <div className="flex items-center gap-1.5 px-2 border-r border-[#2d2250]">
            {COLOR_PALETTE.map((c) => (
              <button
                key={c.value}
                onClick={() => setSelectedColor(c.value)}
                className={`w-6 h-6 rounded-full ${c.bgClass} transition-transform ${
                  selectedColor === c.value ? 'scale-125 ring-2 ring-purple-400' : 'opacity-70 hover:opacity-100'
                }`}
                title={c.name}
              />
            ))}
          </div>
        )}

        {/* Stroke Width Selector */}
        <div className="flex items-center gap-1 px-2 border-r border-[#2d2250]">
          {[
            { label: 'Fina', w: 2 },
            { label: 'Média', w: 4 },
            { label: 'Grossa', w: 7 },
          ].map((item) => (
            <button
              key={item.w}
              onClick={() => setStrokeWidth(item.w)}
              className={`px-2 py-1 rounded text-[10px] font-bold transition-all ${
                strokeWidth === item.w
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* Actions: Undo / Clear / Close */}
        <div className="flex items-center gap-1">
          <button
            onClick={undoLastStroke}
            disabled={!hasStrokes}
            className="p-2 rounded-lg text-gray-400 hover:text-white disabled:opacity-30 disabled:pointer-events-none transition-colors"
            title="Desfazer"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <button
            onClick={clearCanvas}
            disabled={!hasStrokes}
            className="p-2 rounded-lg text-gray-400 hover:text-red-400 disabled:opacity-30 disabled:pointer-events-none transition-colors"
            title="Limpar tudo"
          >
            <Trash2 className="w-4 h-4" />
          </button>
          <button
            onClick={toggleScratchpad}
            className="p-2 ml-2 rounded-lg bg-red-950/80 hover:bg-red-800 text-red-300 hover:text-white border border-red-500/40 transition-colors"
            title="Fechar Lousa"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
