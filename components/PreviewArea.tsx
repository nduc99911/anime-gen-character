
import React, { useState, useRef, useEffect } from 'react';
import { GeneratedImage, LogLevel } from '../types';
import { Download, Share2, Maximize2, Trash2, Rotate3d, Globe, LayoutGrid, DownloadCloud, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';

interface PreviewAreaProps {
  currentImage: GeneratedImage | null;
  history: GeneratedImage[];
  isGenerating: boolean;
  onSelectHistory: (id: string) => void;
  onDeleteHistory: (id: string) => void;
  addLog: (msg: string, level?: LogLevel, details?: string) => void;
}

const PreviewArea: React.FC<PreviewAreaProps> = ({ currentImage, history, isGenerating, onSelectHistory, onDeleteHistory, addLog }) => {
  const [rotationIndex, setRotationIndex] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeTab, setActiveTab] = useState<'workspace' | 'community'>('workspace');
  
  // Zoom & Pan State
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const containerRef = useRef<HTMLDivElement>(null);
  const playInterval = useRef<ReturnType<typeof setInterval> | null>(null);
  
  // Preload images for smooth rotation
  useEffect(() => {
    if (currentImage?.rotationSet) {
        currentImage.rotationSet.forEach(url => {
            const img = new Image();
            img.src = url;
        });
    }
  }, [currentImage?.id]);

  // Reset state when image changes
  useEffect(() => {
    setRotationIndex(0);
    setIsPlaying(false);
    setZoom(1);
    setPan({ x: 0, y: 0 });
    
    if (playInterval.current) clearInterval(playInterval.current);

    if (isGenerating) {
        setActiveTab('workspace');
    }
  }, [currentImage?.id, isGenerating]);

  // Auto-play logic
  useEffect(() => {
    if (isPlaying) {
      playInterval.current = setInterval(() => {
        setRotationIndex(prev => (prev + 1) % 4);
      }, 800);
    } else {
      if (playInterval.current) clearInterval(playInterval.current);
    }
    return () => {
      if (playInterval.current) clearInterval(playInterval.current);
    };
  }, [isPlaying]);

  // Zoom Logic
  const handleZoomChange = (delta: number) => {
    setZoom(prev => {
      let newZoom = prev + delta;
      // Snap to 1 if close
      if (Math.abs(newZoom - 1) < 0.1) newZoom = 1;
      newZoom = Math.min(Math.max(1, newZoom), 5); // Max 5x zoom
      
      if (newZoom === 1) setPan({ x: 0, y: 0 });
      return newZoom;
    });
  };

  const handleZoomIn = () => handleZoomChange(0.5);
  const handleZoomOut = () => handleZoomChange(-0.5);
  const handleResetZoom = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  const onWheel = (e: React.WheelEvent) => {
    if (!currentImage) return;
    // e.preventDefault(); // Note: React synthetic events might not allow preventing default for passive listeners
    const delta = -e.deltaY * 0.002;
    handleZoomChange(delta);
  };

  const handleDownload = () => {
    if (!currentImage) return;
    const activeUrl = currentImage.rotationSet ? currentImage.rotationSet[rotationIndex % 3] : currentImage.url;
    const link = document.createElement('a');
    link.href = activeUrl;
    link.download = `anime-fusion-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addLog("Downloaded image successfully.", 'success');
  };

  const getActiveImage = () => {
    if (!currentImage) return '';
    if (!currentImage.rotationSet || currentImage.rotationSet.length === 0) return currentImage.url;
    const set = currentImage.rotationSet;
    const sourceIndex = [0, 1, 2, 1][rotationIndex % 4];
    return set[sourceIndex];
  };

  const isFlipped = rotationIndex % 4 === 3;

  // Mouse Handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    
    if (zoom > 1) {
        // Pan Logic
        e.preventDefault();
        const dx = e.clientX - dragStart.x;
        const dy = e.clientY - dragStart.y;
        setPan(prev => ({ x: prev.x + dx, y: prev.y + dy }));
        setDragStart({ x: e.clientX, y: e.clientY });
    } else {
        // Rotation Logic
        if (!containerRef.current || !currentImage?.rotationSet) return;
        const rect = containerRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const width = rect.width;
        const zone = Math.floor((x / width) * 4);
        const safeZone = Math.max(0, Math.min(3, zone));
        setRotationIndex(safeZone);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Touch Handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true);
    if (e.touches.length === 1) {
       setDragStart({ x: e.touches[0].clientX, y: e.touches[0].clientY });
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!containerRef.current || !currentImage) return;
    
    if (zoom > 1) {
        // Pan Logic
        if (e.touches.length === 1) {
            const dx = e.touches[0].clientX - dragStart.x;
            const dy = e.touches[0].clientY - dragStart.y;
            setPan(prev => ({ x: prev.x + dx, y: prev.y + dy }));
            setDragStart({ x: e.touches[0].clientX, y: e.touches[0].clientY });
        }
    } else if (currentImage.rotationSet) {
        // Rotation Logic
        const rect = containerRef.current.getBoundingClientRect();
        const x = e.touches[0].clientX - rect.left;
        const width = rect.width;
        const zone = Math.floor((x / width) * 4);
        const safeZone = Math.max(0, Math.min(3, zone));
        setRotationIndex(safeZone);
    }
  };

  return (
    <div className="flex-1 bg-slate-950 flex flex-col h-full overflow-hidden relative">
      <style>{`
        @keyframes subtle-shake {
          0% { transform: scale(1) rotate(0deg); }
          25% { transform: scale(1.02) rotate(1deg); }
          50% { transform: scale(1.02) rotate(-1deg); }
          75% { transform: scale(1.02) rotate(1deg); }
          100% { transform: scale(1) rotate(0deg); }
        }
        .hover-shake:hover {
          animation: subtle-shake 2s ease-in-out infinite;
          filter: drop-shadow(0 0 15px rgba(168, 85, 247, 0.4));
        }
      `}</style>

      {/* Top Navigation / Tab Switcher */}
      <div className="flex items-center justify-center p-4 bg-slate-900/50 border-b border-slate-800 shrink-0 z-10">
        <div className="flex bg-slate-800 rounded-lg p-1">
          <button 
            onClick={() => setActiveTab('workspace')}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'workspace' ? 'bg-purple-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
          >
            <LayoutGrid size={16} /> Workspace
          </button>
          <button 
             onClick={() => setActiveTab('community')}
             className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'community' ? 'bg-pink-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
          >
            <Globe size={16} /> Cộng Đồng
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-hidden relative">
        
        {/* WORKSPACE VIEW */}
        {activeTab === 'workspace' && (
            <div className="h-full flex flex-col">
                <div className="flex-1 p-4 lg:p-10 flex items-center justify-center relative bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] overflow-hidden">
                
                <div 
                    ref={containerRef}
                    className={`relative w-full max-w-2xl aspect-square lg:aspect-[4/3] flex items-center justify-center rounded-2xl shadow-2xl bg-slate-900 border border-slate-800 overflow-hidden select-none ${currentImage?.rotationSet || zoom > 1 ? 'cursor-move' : ''}`}
                    onMouseDown={handleMouseDown}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseUp}
                    onMouseMove={handleMouseMove}
                    onTouchStart={handleTouchStart}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={handleMouseUp}
                    onWheel={onWheel}
                >
                    {/* Zoom Controls Overlay */}
                    {currentImage && !isGenerating && (
                        <div className="absolute top-4 right-4 flex flex-col gap-2 bg-slate-900/80 backdrop-blur-md rounded-lg p-1 border border-slate-700 shadow-xl z-20">
                            <button onClick={(e) => { e.stopPropagation(); handleZoomIn(); }} className="p-2 text-slate-300 hover:text-white hover:bg-slate-700 rounded transition-colors" title="Zoom In">
                                <ZoomIn size={18} />
                            </button>
                            <button onClick={(e) => { e.stopPropagation(); handleResetZoom(); }} className="p-2 text-slate-300 hover:text-white hover:bg-slate-700 rounded transition-colors" title="Reset Zoom">
                                <RotateCcw size={18} />
                            </button>
                            <button onClick={(e) => { e.stopPropagation(); handleZoomOut(); }} className="p-2 text-slate-300 hover:text-white hover:bg-slate-700 rounded transition-colors" title="Zoom Out">
                                <ZoomOut size={18} />
                            </button>
                            <div className="text-[10px] text-center text-slate-500 font-mono border-t border-slate-700 pt-1 select-none">
                                {Math.round(zoom * 100)}%
                            </div>
                        </div>
                    )}

                    {isGenerating && (
                        <div className="absolute inset-0 z-20 bg-slate-900/80 backdrop-blur-sm flex flex-col items-center justify-center">
                        <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                        <p className="text-purple-300 animate-pulse font-medium">Đang triệu hồi nhân vật...</p>
                        <p className="text-slate-500 text-xs mt-2">AI đang vẽ từng chi tiết</p>
                        </div>
                    )}

                    {!currentImage && !isGenerating ? (
                    <div className="text-center p-8">
                        <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-600">
                        <Maximize2 size={32} />
                        </div>
                        <h3 className="text-xl font-bold text-slate-300 mb-2">Chưa có nhân vật nào</h3>
                        <p className="text-slate-500 max-w-xs mx-auto">Sử dụng bảng điều khiển bên trái để thiết lập thông số và bắt đầu sáng tạo.</p>
                    </div>
                    ) : (
                    <>
                        {/* Main Image Layer with Zoom/Pan Transforms */}
                        <div 
                            className="w-full h-full flex items-center justify-center transition-transform duration-75 ease-out"
                            style={{ 
                                transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                                transformOrigin: 'center'
                            }}
                        >
                            <div className={`w-full h-full transition-transform duration-300 ${isFlipped ? 'scale-x-[-1]' : ''}`}>
                                <img 
                                    src={getActiveImage()} 
                                    alt="Generated Character" 
                                    className={`w-full h-full object-contain pointer-events-none select-none ${!isDragging && currentImage?.rotationSet && zoom === 1 ? 'hover-shake' : ''}`}
                                />
                            </div>
                        </div>
                        
                        {/* 360 UI Controls Overlay - Only show if not zoomed in */}
                        {currentImage?.rotationSet && !isGenerating && zoom === 1 && (
                        <div className="absolute bottom-24 lg:bottom-28 left-1/2 transform -translate-x-1/2 w-3/4 max-w-sm"
                            onMouseDown={(e) => e.stopPropagation()} // Prevent drag conflict
                        >
                            <div className="bg-slate-900/80 backdrop-blur-md rounded-xl p-3 border border-slate-700 shadow-2xl">
                                
                                {/* Timeline Indicators */}
                                <div className="flex justify-between text-[10px] text-slate-400 font-bold uppercase mb-2 px-1">
                                    <span className={rotationIndex === 0 ? "text-purple-400" : ""}>Trước</span>
                                    <span className={rotationIndex === 1 ? "text-purple-400" : ""}>Phải</span>
                                    <span className={rotationIndex === 2 ? "text-purple-400" : ""}>Sau</span>
                                    <span className={rotationIndex === 3 ? "text-purple-400" : ""}>Trái</span>
                                </div>

                                {/* Slider */}
                                <input 
                                    type="range" 
                                    min="0" 
                                    max="3" 
                                    step="1"
                                    value={rotationIndex}
                                    onChange={(e) => setRotationIndex(parseInt(e.target.value))}
                                    className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-purple-500 mb-3"
                                />

                                {/* Control Buttons */}
                                <div className="flex justify-between items-center">
                                    <button 
                                        onClick={() => setIsPlaying(!isPlaying)}
                                        className={`p-2 rounded-lg flex items-center gap-2 text-xs font-bold transition-all ${isPlaying ? 'bg-purple-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}
                                    >
                                        <Rotate3d size={14} className={isPlaying ? "animate-spin" : ""} />
                                        {isPlaying ? "Dừng Xoay" : "Tự Động Xoay"}
                                    </button>
                                    
                                    <div className="flex gap-1">
                                        {[0,1,2,3].map(i => (
                                            <button 
                                                key={i}
                                                onClick={() => setRotationIndex(i)}
                                                className={`w-2 h-2 rounded-full transition-all ${rotationIndex === i ? 'bg-purple-500 scale-125' : 'bg-slate-600 hover:bg-slate-500'}`}
                                            />
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                        )}
                    </>
                    )}

                    {/* Action Bar (Only if image exists) */}
                    {currentImage && !isGenerating && (
                    <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex gap-4 bg-slate-900/90 backdrop-blur px-6 py-3 rounded-full border border-slate-700 shadow-xl z-10"
                            onMouseDown={(e) => e.stopPropagation()} // Prevent drag on buttons
                    >
                        <button onClick={handleDownload} className="flex flex-col items-center gap-1 group text-slate-300 hover:text-purple-400 transition-colors">
                        <div className="p-2 rounded-full bg-slate-800 group-hover:bg-slate-700 transition-colors">
                            <Download size={20} />
                        </div>
                        <span className="text-[10px] font-medium uppercase">Lưu Ảnh</span>
                        </button>
                        <button onClick={() => addLog("Exporting 3D reference sheet...", 'info')} className="flex flex-col items-center gap-1 group text-slate-300 hover:text-green-400 transition-colors">
                        <div className="p-2 rounded-full bg-slate-800 group-hover:bg-slate-700 transition-colors">
                            <DownloadCloud size={20} />
                        </div>
                        <span className="text-[10px] font-medium uppercase">Xuất 3D Ref</span>
                        </button>
                        <button onClick={() => addLog("Opening share dialog...", 'info')} className="flex flex-col items-center gap-1 group text-slate-300 hover:text-pink-400 transition-colors">
                            <div className="p-2 rounded-full bg-slate-800 group-hover:bg-slate-700 transition-colors">
                            <Share2 size={20} />
                            </div>
                            <span className="text-[10px] font-medium uppercase">Chia sẻ</span>
                        </button>
                    </div>
                    )}
                </div>
                </div>

                {/* History Strip */}
                <div className="h-40 bg-slate-900 border-t border-slate-800 p-4 flex flex-col shrink-0">
                    <div className="flex justify-between items-center mb-2">
                        <h4 className="text-slate-400 text-sm font-semibold uppercase tracking-wider">Thư Viện Của Tôi</h4>
                        <span className="text-xs text-slate-600">{history.length} tác phẩm</span>
                    </div>
                    <div className="flex-1 overflow-x-auto flex gap-4 pb-2 items-center custom-scrollbar">
                        {history.length === 0 && (
                            <p className="text-slate-600 text-xs italic w-full text-center">Các nhân vật bạn tạo sẽ xuất hiện ở đây.</p>
                        )}
                        {history.map((item) => (
                        <div 
                            key={item.id} 
                            className={`relative group shrink-0 w-24 h-24 rounded-lg overflow-hidden border cursor-pointer transition-all ${
                            currentImage?.id === item.id ? 'border-purple-500 ring-2 ring-purple-500/20' : 'border-slate-700 hover:border-slate-500'
                            }`}
                        >
                            <img 
                            src={item.url} 
                            alt="History thumbnail" 
                            className="w-full h-full object-cover"
                            onClick={() => onSelectHistory(item.id)}
                            />
                            {item.rotationSet && (
                                <div className="absolute bottom-1 right-1 bg-purple-600 rounded-full p-0.5 shadow-sm">
                                <Rotate3d size={10} className="text-white" />
                                </div>
                            )}
                            <button 
                            onClick={(e) => {
                                e.stopPropagation();
                                onDeleteHistory(item.id);
                            }}
                            className="absolute top-1 right-1 bg-black/60 p-1 rounded hover:bg-red-600 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                            <Trash2 size={12} />
                            </button>
                        </div>
                        ))}
                    </div>
                </div>
            </div>
        )}

        {/* COMMUNITY VIEW */}
        {activeTab === 'community' && (
            <div className="h-full overflow-y-auto p-6 bg-slate-950">
                <div className="max-w-6xl mx-auto">
                    <div className="text-center mb-10">
                        <h2 className="text-3xl font-bold bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent mb-2">Cộng Đồng Sáng Tạo</h2>
                        <p className="text-slate-400">Khám phá nguồn cảm hứng từ hàng ngàn nhà thiết kế trên thế giới</p>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {/* Mock Community Grid using history items repeated or logic if empty */}
                        {history.length > 0 ? (
                            // Mix user history with "mock" cards to simulate community
                             [...history, ...history, ...history].slice(0, 12).map((item, idx) => (
                                <div key={idx} className="group relative aspect-square rounded-xl overflow-hidden bg-slate-900 border border-slate-800 hover:border-pink-500/50 transition-all hover:shadow-2xl hover:shadow-pink-900/20 cursor-pointer">
                                    <img src={item.url} className="w-full h-full object-cover transition-transform group-hover:scale-110 duration-500" alt="Community Art" />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-4">
                                        <p className="text-white text-sm font-bold truncate">Warrior #{idx + 1024}</p>
                                        <div className="flex items-center justify-between mt-1">
                                            <span className="text-[10px] text-slate-300">by Creator{idx}</span>
                                            <div className="flex gap-2">
                                                <button className="text-slate-300 hover:text-pink-400"><Share2 size={14}/></button>
                                                <button className="text-slate-300 hover:text-purple-400"><Download size={14}/></button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                             ))
                        ) : (
                             // Fallback Mock Items if history is empty
                             Array.from({ length: 8 }).map((_, idx) => (
                                <div key={idx} className="group relative aspect-square rounded-xl overflow-hidden bg-slate-800 border border-slate-700 flex items-center justify-center">
                                    <div className="text-center p-4">
                                        <div className="w-12 h-12 bg-slate-700 rounded-full mx-auto mb-2 animate-pulse"></div>
                                        <p className="text-slate-500 text-xs">Community Art #{idx + 1}</p>
                                    </div>
                                    <div className="absolute inset-0 bg-slate-900/20 group-hover:bg-transparent transition-colors"></div>
                                </div>
                             ))
                        )}
                    </div>
                    
                    <div className="mt-12 text-center">
                        <button onClick={() => addLog("Fetching more community items...", 'info')} className="px-6 py-3 bg-slate-800 text-slate-300 rounded-full hover:bg-slate-700 transition-colors text-sm font-medium">
                            Xem thêm tác phẩm
                        </button>
                    </div>
                </div>
            </div>
        )}

      </div>
    </div>
  );
};

export default PreviewArea;
