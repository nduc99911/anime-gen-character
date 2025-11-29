import React, { useState, useEffect } from 'react';
import ControlPanel from './components/ControlPanel';
import PreviewArea from './components/PreviewArea';
import LogViewer from './components/LogViewer';
import { ArtStyle, CharacterConfig, GeneratedImage, ViewAngle, LogEntry, LogLevel } from './types';
import { generateCharacterImage, buildPrompt } from './services/geminiService';
import { AlertTriangle, X } from 'lucide-react';

const App: React.FC = () => {
  const [config, setConfig] = useState<CharacterConfig>({
    style: ArtStyle.ANIME_2D,
    view: ViewAngle.FRONT,
    gender: 'Nữ',
    hairStyle: 'Tóc thẳng dài',
    hairColor: 'Bạch kim',
    eyeColor: 'Xanh dương',
    clothing: 'Đồng phục học sinh Nhật Bản',
    accessories: 'Không có',
    pose: 'Đứng nghiêm trang',
    background: 'Nền trắng đơn giản',
    expression: 'Cười tự tin',
    lightingStyle: 'Ánh sáng Studio (Cân bằng)',
    lightingColor: 'Tự nhiên (Trắng/Vàng nhạt)',
    effects: 'Không có'
  });

  const [currentImageId, setCurrentImageId] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [enable360, setEnable360] = useState<boolean>(false);
  const [history, setHistory] = useState<GeneratedImage[]>([]);
  const [missingApiKey, setMissingApiKey] = useState(false);
  
  // Log State
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isLogOpen, setIsLogOpen] = useState(false);

  // Helper to add logs
  const addLog = (message: string, level: LogLevel = 'info', details?: string) => {
    setLogs(prev => [...prev, {
      id: Date.now().toString() + Math.random().toString().slice(2),
      timestamp: Date.now(),
      message,
      level,
      details
    }]);
  };

  const clearLogs = () => setLogs([]);

  // Check for API Key on mount
  useEffect(() => {
    // Check if process is defined to avoid ReferenceError in some environments
    if (typeof process === 'undefined' || !process.env || !process.env.API_KEY) {
      setMissingApiKey(true);
      setTimeout(() => {
        addLog("CRITICAL: API Key is missing. Image generation will fail.", 'error');
      }, 500);
    } else {
        addLog("Application started. Ready to create characters.", 'success');
    }
  }, []);

  // Load history from local storage on mount
  useEffect(() => {
    const saved = localStorage.getItem('animefusion_history');
    if (saved) {
      try {
        setHistory(JSON.parse(saved));
        addLog(`Loaded ${JSON.parse(saved).length} items from history`, 'info');
      } catch (e) {
        console.error("Failed to parse history", e);
        addLog("Failed to load history from LocalStorage", 'error');
      }
    }
  }, []);

  // Save history to local storage
  useEffect(() => {
    localStorage.setItem('animefusion_history', JSON.stringify(history));
  }, [history]);

  const handleGenerate = async () => {
    if (typeof process === 'undefined' || !process.env || !process.env.API_KEY) {
      const msg = "Thiếu API Key. Vui lòng kiểm tra cấu hình môi trường.";
      setMissingApiKey(true);
      alert(msg);
      addLog(msg, 'error');
      return;
    }

    setIsGenerating(true);
    // Auto open logs on generate to show progress
    // setIsLogOpen(true); 

    try {
      let finalUrl = '';
      let rotationSet: string[] = [];
      const timestamp = Date.now().toString();

      // Debug: Log the prompt for the primary view
      const debugPrompt = buildPrompt(config);
      addLog("Starting generation process...", 'info');
      addLog(`Prompt [Main]: ${debugPrompt}`, 'info', debugPrompt);

      if (enable360) {
        addLog("360° Mode enabled. Generating 3 views (Front, Side, Back)...", 'warning');
        
        // Generate 3 views: Front, Side, Back
        // We use Promise.all to generate them in parallel for speed
        const viewsToGenerate = [ViewAngle.FRONT, ViewAngle.SIDE, ViewAngle.BACK];
        
        const promises = viewsToGenerate.map(view => {
            const viewConfig = { ...config, view: view };
            // Log individual prompts for debug
            // addLog(`Prompt [${view}]: ${buildPrompt(viewConfig)}`, 'info');
            return generateCharacterImage(viewConfig);
        });

        const results = await Promise.all(promises);
        rotationSet = results; // [Front, Side, Back]
        finalUrl = results[0]; // Set Front as main thumbnail
        addLog("Successfully generated all 360° views.", 'success');
      } else {
        // Standard single generation
        finalUrl = await generateCharacterImage(config);
        addLog("Image generated successfully.", 'success');
      }

      const newImage: GeneratedImage = {
        id: timestamp,
        url: finalUrl,
        prompt: `Character ${config.gender}, ${config.style} ${enable360 ? '(360° Set)' : ''}`,
        createdAt: Date.now(),
        rotationSet: enable360 ? rotationSet : undefined
      };
      
      setHistory(prev => [newImage, ...prev]);
      setCurrentImageId(timestamp);

    } catch (error: any) {
      console.error("Generation error:", error);
      
      let errorMsg = "An unknown error occurred";
      let details = "";

      if (error) {
          if (error instanceof Error) {
              errorMsg = error.message;
              details = error.stack || "";
          } else if (typeof error === 'string') {
              errorMsg = error;
          } else if (typeof error === 'object') {
              try {
                  details = JSON.stringify(error, null, 2);
                  if (details === '{}' || !details) details = String(error);
              } catch (e) {
                  details = String(error);
              }
          }
      }

      addLog(`Generation Failed: ${errorMsg}`, 'error', details);
      alert(`Đã xảy ra lỗi khi tạo hình ảnh. Vui lòng kiểm tra log để biết thêm chi tiết.`);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSelectHistory = (id: string) => {
    setCurrentImageId(id);
    addLog(`Selected image ID: ${id}`, 'info');
  };

  const handleDeleteHistory = (id: string) => {
    setHistory(prev => prev.filter(item => item.id !== id));
    if (currentImageId === id) {
      setCurrentImageId(null);
    }
    addLog(`Deleted image ID: ${id}`, 'warning');
  };

  const currentImageObj = history.find(item => item.id === currentImageId) || null;

  return (
    <div className="flex flex-col lg:flex-row h-screen bg-slate-950 overflow-hidden font-sans relative">
      {/* Missing API Key Warning Banner */}
      {missingApiKey && (
        <div className="absolute top-0 left-0 right-0 z-[100] bg-red-600/95 backdrop-blur-md text-white px-6 py-4 flex items-center justify-center gap-4 shadow-2xl animate-slideDown border-b border-red-500">
            <div className="bg-white/20 p-3 rounded-full shrink-0 animate-pulse">
                <AlertTriangle size={28} className="text-white" />
            </div>
            <div className="flex-1 max-w-4xl">
                <h3 className="font-bold text-xl mb-1">Thiếu Cấu Hình API Key!</h3>
                <p className="text-sm text-red-100 leading-relaxed">
                    Ứng dụng không tìm thấy <code>process.env.API_KEY</code>. Tính năng tạo hình ảnh sẽ không hoạt động. 
                    <br/>Vui lòng cung cấp API Key hợp lệ trong biến môi trường để tiếp tục.
                </p>
            </div>
            <button 
                onClick={() => setMissingApiKey(false)} 
                className="p-2 hover:bg-white/20 rounded-full transition-colors shrink-0"
                title="Đóng thông báo"
            >
                <X size={24} />
            </button>
        </div>
      )}

      <ControlPanel 
        config={config} 
        setConfig={setConfig} 
        onGenerate={handleGenerate}
        isGenerating={isGenerating}
        enable360={enable360}
        setEnable360={setEnable360}
        addLog={addLog}
      />
      <div className="flex-1 flex flex-col relative h-full overflow-hidden">
        <PreviewArea 
            currentImage={currentImageObj}
            history={history}
            isGenerating={isGenerating}
            onSelectHistory={handleSelectHistory}
            onDeleteHistory={handleDeleteHistory}
            addLog={addLog}
        />
        <LogViewer 
            logs={logs} 
            onClear={clearLogs} 
            isOpen={isLogOpen}
            setIsOpen={setIsLogOpen}
        />
      </div>
    </div>
  );
};

export default App;