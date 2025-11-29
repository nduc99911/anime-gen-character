
import React, { useState, useEffect } from 'react';
import ControlPanel from './components/ControlPanel';
import PreviewArea from './components/PreviewArea';
import LogViewer from './components/LogViewer';
import { ArtStyle, CharacterConfig, GeneratedImage, ViewAngle, LogEntry, LogLevel } from './types';
import { generateCharacterImage, buildPrompt } from './services/geminiService';
import { AlertTriangle, X, Key, Save } from 'lucide-react';

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
  
  // API Key State
  const [userApiKey, setUserApiKey] = useState<string>("");
  const [showSettings, setShowSettings] = useState(false);
  const [tempApiKey, setTempApiKey] = useState("");

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

  // Check for API Key on mount (User > Env)
  useEffect(() => {
    const storedKey = localStorage.getItem('user_gemini_api_key');
    const envKey = (typeof process !== 'undefined' && process.env) ? process.env.API_KEY : '';

    if (storedKey) {
      setUserApiKey(storedKey);
      setTempApiKey(storedKey);
      addLog("Loaded API Key from settings.", 'success');
      setMissingApiKey(false);
    } else if (envKey) {
      addLog("Using API Key from environment variables.", 'info');
      setMissingApiKey(false);
    } else {
      setMissingApiKey(true);
      setTimeout(() => {
        addLog("CRITICAL: API Key is missing. Please configure it in Settings.", 'error');
      }, 500);
    }

    addLog("Application started. Ready to create characters.", 'success');
  }, []);

  // Save history to local storage on mount
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

  const handleSaveApiKey = () => {
    if (tempApiKey.trim()) {
      localStorage.setItem('user_gemini_api_key', tempApiKey.trim());
      setUserApiKey(tempApiKey.trim());
      setMissingApiKey(false);
      addLog("API Key saved successfully.", 'success');
      setShowSettings(false);
    } else {
      localStorage.removeItem('user_gemini_api_key');
      setUserApiKey("");
      
      const envKey = (typeof process !== 'undefined' && process.env) ? process.env.API_KEY : '';
      if (!envKey) {
         setMissingApiKey(true);
      }
      addLog("API Key removed.", 'warning');
      setShowSettings(false);
    }
  };

  const getEffectiveApiKey = () => {
    const envKey = (typeof process !== 'undefined' && process.env) ? process.env.API_KEY : '';
    return userApiKey || envKey;
  };

  const handleGenerate = async () => {
    const apiKey = getEffectiveApiKey();

    if (!apiKey) {
      const msg = "Thiếu API Key. Vui lòng vào Cài đặt để nhập Key.";
      setMissingApiKey(true);
      setShowSettings(true);
      alert(msg);
      addLog(msg, 'error');
      return;
    }

    setIsGenerating(true);
    
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
        const viewsToGenerate = [ViewAngle.FRONT, ViewAngle.SIDE, ViewAngle.BACK];
        
        const promises = viewsToGenerate.map(view => {
            const viewConfig = { ...config, view: view };
            return generateCharacterImage(viewConfig, apiKey);
        });

        const results = await Promise.all(promises);
        rotationSet = results; // [Front, Side, Back]
        finalUrl = results[0]; // Set Front as main thumbnail
        addLog("Successfully generated all 360° views.", 'success');
      } else {
        // Standard single generation
        finalUrl = await generateCharacterImage(config, apiKey);
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
      alert(`Đã xảy ra lỗi khi tạo hình ảnh. Vui lòng kiểm tra API Key hoặc Log.`);
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
      {missingApiKey && !showSettings && (
        <div className="absolute top-0 left-0 right-0 z-[100] bg-red-600/95 backdrop-blur-md text-white px-6 py-4 flex items-center justify-center gap-4 shadow-2xl animate-slideDown border-b border-red-500">
            <div className="bg-white/20 p-3 rounded-full shrink-0 animate-pulse">
                <AlertTriangle size={28} className="text-white" />
            </div>
            <div className="flex-1 max-w-4xl">
                <h3 className="font-bold text-xl mb-1">Cần Cấu Hình API Key</h3>
                <p className="text-sm text-red-100 leading-relaxed">
                    Ứng dụng chưa có Gemini API Key. Vui lòng nhập Key để bắt đầu sáng tạo.
                </p>
            </div>
            <button 
                onClick={() => setShowSettings(true)} 
                className="px-4 py-2 bg-white text-red-600 font-bold rounded-lg hover:bg-red-50 transition-colors shadow-lg"
            >
                Nhập Key Ngay
            </button>
        </div>
      )}

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
            <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md shadow-2xl animate-slideUp overflow-hidden">
                <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-800/50">
                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                        <Key className="text-purple-400" /> Cài đặt API
                    </h3>
                    <button onClick={() => setShowSettings(false)} className="text-slate-400 hover:text-white">
                        <X size={24} />
                    </button>
                </div>
                <div className="p-6 space-y-4">
                    <p className="text-slate-300 text-sm">
                        Nhập Google Gemini API Key của bạn để sử dụng ứng dụng. 
                        Key sẽ được lưu trữ an toàn trong trình duyệt của bạn (LocalStorage).
                    </p>
                    <div className="space-y-2">
                        <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">API Key</label>
                        <input 
                            type="password" 
                            value={tempApiKey}
                            onChange={(e) => setTempApiKey(e.target.value)}
                            placeholder="AIzaSy..."
                            className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-purple-500 outline-none font-mono"
                        />
                    </div>
                    <div className="bg-slate-800/50 p-3 rounded border border-slate-700/50 text-xs text-slate-400">
                        <span className="text-purple-400 font-bold">Lưu ý:</span> Bạn có thể lấy API Key miễn phí tại <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="text-blue-400 hover:underline">Google AI Studio</a>.
                    </div>
                </div>
                <div className="p-6 border-t border-slate-800 bg-slate-800/30 flex justify-end gap-3">
                    <button 
                        onClick={() => setShowSettings(false)}
                        className="px-4 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
                    >
                        Hủy bỏ
                    </button>
                    <button 
                        onClick={handleSaveApiKey}
                        className="px-6 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold rounded-lg shadow-lg flex items-center gap-2"
                    >
                        <Save size={18} /> Lưu Cấu Hình
                    </button>
                </div>
            </div>
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
        onOpenSettings={() => setShowSettings(true)}
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
