
import React, { useState, useEffect } from 'react';
import { ArtStyle, CharacterConfig, ViewAngle, SavedPreset, LogLevel } from '../types';
import { HAIR_STYLES, CLOTHING_STYLES, ACCESSORIES, POSES, BACKGROUNDS, EXPRESSIONS, LIGHTING_STYLES, LIGHTING_COLORS, SPECIAL_EFFECTS } from '../constants';
import { Palette, Box, User, Shirt, Camera, Smile, Map, Sparkles, Rotate3d, Save, FolderOpen, Trash2, Plus, X, Check, Lightbulb, Wand2 } from 'lucide-react';

interface ControlPanelProps {
  config: CharacterConfig;
  setConfig: React.Dispatch<React.SetStateAction<CharacterConfig>>;
  onGenerate: () => void;
  isGenerating: boolean;
  enable360: boolean;
  setEnable360: (enable: boolean) => void;
  addLog: (msg: string, level?: LogLevel, details?: string) => void;
}

const ControlPanel: React.FC<ControlPanelProps> = ({ config, setConfig, onGenerate, isGenerating, enable360, setEnable360, addLog }) => {
  const [presets, setPresets] = useState<SavedPreset[]>([]);
  const [isSaveMode, setIsSaveMode] = useState(false);
  const [newPresetName, setNewPresetName] = useState("");

  // Load presets on mount
  useEffect(() => {
    const saved = localStorage.getItem('animefusion_presets');
    if (saved) {
      try {
        setPresets(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse presets", e);
        addLog("Failed to parse saved presets", 'error');
      }
    }
  }, []);

  // Save logic
  const handleSavePreset = () => {
    if (!newPresetName.trim()) return;
    
    const newPreset: SavedPreset = {
      id: Date.now().toString(),
      name: newPresetName.trim(),
      config: { ...config },
      createdAt: Date.now()
    };
    
    const updatedPresets = [newPreset, ...presets];
    setPresets(updatedPresets);
    localStorage.setItem('animefusion_presets', JSON.stringify(updatedPresets));
    
    addLog(`Saved preset: "${newPresetName}"`, 'success');
    setNewPresetName("");
    setIsSaveMode(false);
  };

  const handleDeletePreset = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const preset = presets.find(p => p.id === id);
    const updatedPresets = presets.filter(p => p.id !== id);
    setPresets(updatedPresets);
    localStorage.setItem('animefusion_presets', JSON.stringify(updatedPresets));
    addLog(`Deleted preset: "${preset?.name || id}"`, 'warning');
  };

  const handleLoadPreset = (preset: SavedPreset) => {
    setConfig(preset.config);
    addLog(`Loaded preset: "${preset.name}"`, 'info', JSON.stringify(preset.config, null, 2));
  };

  const handleChange = (key: keyof CharacterConfig, value: string) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  };

  const SectionTitle = ({ icon: Icon, title }: { icon: any, title: string }) => (
    <div className="flex items-center gap-2 mb-3 text-purple-400 font-semibold uppercase text-xs tracking-wider mt-2">
      <Icon size={14} />
      <span>{title}</span>
    </div>
  );

  return (
    <div className="w-full lg:w-96 bg-slate-900 border-r border-slate-700 flex flex-col h-full overflow-hidden shrink-0">
      <div className="p-6 border-b border-slate-700 bg-slate-900 z-10">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-pink-500 to-violet-500 bg-clip-text text-transparent mb-1">
          AnimeFusion
        </h1>
        <p className="text-slate-400 text-xs">Studio Sáng Tạo Nhân Vật Vô Hạn</p>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
        
        {/* Presets Management */}
        <section className="bg-slate-800/30 p-4 rounded-xl border border-slate-700/50">
          <div className="flex items-center justify-between mb-3">
             <div className="flex items-center gap-2 text-purple-400 font-semibold uppercase text-xs tracking-wider">
               <FolderOpen size={14} />
               <span>Cấu Hình</span>
             </div>
             {!isSaveMode && (
               <button 
                onClick={() => setIsSaveMode(true)}
                className="text-xs flex items-center gap-1 text-purple-400 hover:text-purple-300 transition-colors"
               >
                 <Plus size={12} /> Lưu Hiện Tại
               </button>
             )}
          </div>

          {isSaveMode && (
            <div className="flex items-center gap-2 mb-4 animate-fadeIn">
              <input
                type="text"
                value={newPresetName}
                onChange={(e) => setNewPresetName(e.target.value)}
                placeholder="Đặt tên cấu hình..."
                className="flex-1 bg-slate-800 border border-slate-600 rounded text-xs px-3 py-2 text-white outline-none focus:border-purple-500"
                autoFocus
              />
              <button 
                onClick={handleSavePreset}
                disabled={!newPresetName.trim()}
                className="p-2 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded transition-colors"
              >
                <Check size={14} />
              </button>
              <button 
                onClick={() => setIsSaveMode(false)}
                className="p-2 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded transition-colors"
              >
                <X size={14} />
              </button>
            </div>
          )}

          <div className="space-y-2 max-h-32 overflow-y-auto pr-1 custom-scrollbar">
            {presets.length === 0 ? (
              <p className="text-xs text-slate-500 italic text-center py-2">Chưa có cấu hình nào được lưu.</p>
            ) : (
              presets.map(preset => (
                <div 
                  key={preset.id}
                  onClick={() => handleLoadPreset(preset)}
                  className="group flex items-center justify-between p-2 rounded bg-slate-800 border border-slate-700 hover:border-purple-500/50 hover:bg-slate-750 cursor-pointer transition-all"
                >
                  <div className="flex flex-col overflow-hidden">
                    <span className="text-xs text-slate-200 font-medium truncate">{preset.name}</span>
                    <span className="text-[10px] text-slate-500 truncate">
                      {preset.config.style} • {preset.config.gender}
                    </span>
                  </div>
                  <button 
                    onClick={(e) => handleDeletePreset(preset.id, e)}
                    className="p-1.5 text-slate-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Xóa"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              ))
            )}
          </div>
        </section>

        {/* Style & View */}
        <section>
          <SectionTitle icon={Box} title="Chế Độ & Góc Nhìn" />
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-slate-400 text-xs mb-2">Phong Cách Nghệ Thuật</label>
              <select 
                value={config.style}
                onChange={(e) => handleChange('style', e.target.value)}
                className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white focus:ring-2 focus:ring-purple-500 outline-none"
              >
                {Object.values(ArtStyle).map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            
            <div className="bg-slate-800/50 p-3 rounded-lg border border-slate-700">
               <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Rotate3d size={16} className={enable360 ? "text-purple-400" : "text-slate-500"} />
                    <span className="text-sm font-medium text-slate-200">Chế độ 360° (Beta)</span>
                  </div>
                  <button 
                    onClick={() => {
                        setEnable360(!enable360);
                        addLog(`Switched 360 Mode to: ${!enable360 ? 'ON' : 'OFF'}`, 'info');
                    }}
                    className={`w-10 h-5 rounded-full relative transition-colors ${enable360 ? 'bg-purple-600' : 'bg-slate-600'}`}
                  >
                    <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${enable360 ? 'left-6' : 'left-1'}`}></div>
                  </button>
               </div>
               {enable360 ? (
                 <p className="text-[10px] text-purple-300 mt-2 leading-tight">
                   Tạo 3 góc nhìn (Trước, Nghiêng, Sau). Thời gian xử lý x3.
                 </p>
               ) : (
                 <div className="mt-3">
                    <label className="block text-slate-400 text-xs mb-2">Góc Camera</label>
                    <select 
                      value={config.view}
                      onChange={(e) => handleChange('view', e.target.value)}
                      className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white focus:ring-2 focus:ring-purple-500 outline-none"
                    >
                      {Object.values(ViewAngle).map(v => <option key={v} value={v}>{v}</option>)}
                    </select>
                 </div>
               )}
            </div>
          </div>
        </section>

        {/* Physical Attributes */}
        <section>
          <SectionTitle icon={User} title="Ngoại Hình" />
          <div className="space-y-4">
            <div>
              <label className="block text-slate-400 text-xs mb-2">Giới Tính</label>
              <div className="flex gap-2">
                {['Nam', 'Nữ', 'Phi giới tính'].map(g => (
                  <button
                    key={g}
                    onClick={() => handleChange('gender', g)}
                    className={`flex-1 py-2 rounded-md text-xs font-medium transition-all ${
                      config.gender === g 
                        ? 'bg-purple-600 text-white shadow-lg shadow-purple-900/50' 
                        : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                    }`}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
               <div>
                <label className="block text-slate-400 text-xs mb-2">Kiểu Tóc</label>
                <select 
                  value={config.hairStyle}
                  onChange={(e) => handleChange('hairStyle', e.target.value)}
                  className="w-full bg-slate-800 border border-slate-600 rounded text-xs px-2 py-2 text-white outline-none"
                >
                  {HAIR_STYLES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-slate-400 text-xs mb-2">Màu Tóc</label>
                <input 
                  type="text" 
                  value={config.hairColor}
                  onChange={(e) => handleChange('hairColor', e.target.value)}
                  placeholder="Ví dụ: Bạch kim"
                  className="w-full bg-slate-800 border border-slate-600 rounded text-xs px-2 py-2 text-white outline-none"
                />
              </div>
            </div>

             <div className="grid grid-cols-2 gap-3">
               <div>
                <label className="block text-slate-400 text-xs mb-2">Màu Mắt</label>
                <input 
                  type="text" 
                  value={config.eyeColor}
                  onChange={(e) => handleChange('eyeColor', e.target.value)}
                  placeholder="Ví dụ: Đỏ rực"
                  className="w-full bg-slate-800 border border-slate-600 rounded text-xs px-2 py-2 text-white outline-none"
                />
              </div>
               <div>
                <label className="block text-slate-400 text-xs mb-2">Biểu Cảm</label>
                <select 
                  value={config.expression}
                  onChange={(e) => handleChange('expression', e.target.value)}
                  className="w-full bg-slate-800 border border-slate-600 rounded text-xs px-2 py-2 text-white outline-none"
                >
                   {EXPRESSIONS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
             </div>
          </div>
        </section>

        {/* Outfit & Accessories */}
        <section>
          <SectionTitle icon={Shirt} title="Trang Phục & Phụ Kiện" />
          <div className="space-y-4">
             <div>
                <label className="block text-slate-400 text-xs mb-2">Trang Phục</label>
                <select 
                  value={config.clothing}
                  onChange={(e) => handleChange('clothing', e.target.value)}
                  className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white outline-none"
                >
                   {CLOTHING_STYLES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-slate-400 text-xs mb-2">Phụ Kiện</label>
                <select 
                  value={config.accessories}
                  onChange={(e) => handleChange('accessories', e.target.value)}
                  className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white outline-none"
                >
                   {ACCESSORIES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
          </div>
        </section>

        {/* Scene */}
        <section>
          <SectionTitle icon={Camera} title="Tạo Dáng & Bối Cảnh" />
          <div className="space-y-4">
            <div>
              <label className="block text-slate-400 text-xs mb-2">Tư Thế (Pose)</label>
              <select 
                value={config.pose}
                onChange={(e) => handleChange('pose', e.target.value)}
                className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white outline-none"
              >
                 {POSES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              
              {config.pose === "Tự do sáng tạo (Nhập mô tả)" && (
                <div className="mt-2 animate-fadeIn">
                  <textarea
                    value={config.customPose || ''}
                    onChange={(e) => handleChange('customPose', e.target.value)}
                    placeholder="Mô tả tư thế bạn muốn (vd: Bay lơ lửng, cầm quyền trượng hướng về phía trước...)"
                    className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-purple-500 h-20 resize-none"
                  />
                </div>
              )}
            </div>
             <div>
              <label className="block text-slate-400 text-xs mb-2">Hình Nền</label>
              <select 
                value={config.background}
                onChange={(e) => handleChange('background', e.target.value)}
                className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white outline-none"
              >
                 {BACKGROUNDS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
        </section>

        {/* Lighting & Effects */}
        <section>
          <SectionTitle icon={Wand2} title="Ánh Sáng & Hiệu Ứng" />
          <div className="space-y-3">
             <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 text-xs mb-2">Hướng Sáng</label>
                  <select 
                    value={config.lightingStyle}
                    onChange={(e) => handleChange('lightingStyle', e.target.value)}
                    className="w-full bg-slate-800 border border-slate-600 rounded text-xs px-2 py-2 text-white outline-none"
                  >
                    {LIGHTING_STYLES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 text-xs mb-2">Màu Sáng</label>
                  <select 
                    value={config.lightingColor}
                    onChange={(e) => handleChange('lightingColor', e.target.value)}
                    className="w-full bg-slate-800 border border-slate-600 rounded text-xs px-2 py-2 text-white outline-none"
                  >
                    {LIGHTING_COLORS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
             </div>
             
             <div className="bg-slate-800/50 p-3 rounded-lg border border-slate-700/50">
                <label className="block text-purple-300 text-xs font-medium mb-2 flex items-center gap-1">
                   <Sparkles size={12} /> Hiệu Ứng Đặc Biệt (VFX)
                </label>
                <select 
                  value={config.effects}
                  onChange={(e) => handleChange('effects', e.target.value)}
                  className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white focus:ring-1 focus:ring-purple-500 outline-none"
                >
                   {SPECIAL_EFFECTS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
             </div>
          </div>
        </section>
      </div>

      <div className="p-6 border-t border-slate-700 bg-slate-900 z-10">
        <button 
          onClick={onGenerate}
          disabled={isGenerating}
          className={`w-full py-4 rounded-xl font-bold text-white shadow-lg flex items-center justify-center gap-2 transition-all transform active:scale-95 ${
            isGenerating 
              ? 'bg-slate-700 cursor-not-allowed text-slate-400' 
              : 'bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 shadow-purple-900/50 hover:shadow-purple-700/50'
          }`}
        >
          {isGenerating ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              <span>{enable360 ? 'Đang Tạo 360°...' : 'Đang Sáng Tạo...'}</span>
            </>
          ) : (
            <>
              <Sparkles size={20} />
              <span>{enable360 ? 'Tạo Nhân Vật 360°' : 'Tạo Nhân Vật'}</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default ControlPanel;
