import {X, Eye, Trash2, Volume2, VolumeX, Bell, Code, ShieldAlert} from 'lucide-react';
import { useMarketStore } from '../../store/marketStore';
import { Play } from 'lucide-react';

interface SettingsPanelProps {
    isOpen: boolean;
    onClose: () => void;
}

const EXCHANGES = ['binance', 'bybit', 'okx', 'bitget', 'gate', 'mexc'];

export const SettingsPanel = ({ isOpen, onClose }: SettingsPanelProps) => {
    const { settings, updateSettings, toggleHiddenCoin, toggleExchange, testSound } = useMarketStore();

    if (!isOpen) return null;

    return (
        <>
            <div
                className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 transition-opacity"
                onClick={onClose}
            />

            <div className="fixed right-0 top-0 h-full w-80 bg-[#0f1522] border-l border-slate-800 shadow-2xl z-50 transform transition-transform duration-300 ease-in-out overflow-y-auto">

                <div className="flex items-center justify-between p-4 border-b border-slate-800">
                    <h2 className="text-sm font-bold tracking-wider text-slate-200">SETTINGS</h2>
                    <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors">
                        <X size={18} />
                    </button>
                </div>

                <div className="p-4 space-y-6">

                    <div className="flex items-center justify-between bg-slate-800/50 p-3 rounded-lg border border-slate-700">
                        <div className="flex items-center gap-2 text-slate-300">
                            {settings.soundEnabled ? <Volume2 size={16} className="text-emerald-400"/> : <VolumeX size={16} className="text-slate-500"/>}
                            <span className="text-xs font-bold uppercase">Sound Alerts</span>
                        </div>

                        <div className="flex items-center gap-2">
                            <button
                                onClick={testSound}
                                className="px-2 py-1 bg-slate-700 hover:bg-slate-600 rounded text-[10px] font-bold text-slate-300 flex items-center gap-1 transition-colors"
                                title="Test Sound"
                            >
                                <Play size={8} /> TEST
                            </button>

                            <button
                                onClick={() => updateSettings({ soundEnabled: !settings.soundEnabled })}
                                className={`w-10 h-5 rounded-full relative transition-colors ${settings.soundEnabled ? 'bg-emerald-500' : 'bg-slate-700'}`}
                            >
                                <div className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-all ${settings.soundEnabled ? 'left-6' : 'left-1'}`} />
                            </button>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <div className="flex justify-between items-center">
                            <label className="text-xs font-bold text-red-400 uppercase flex items-center gap-1">
                                <Bell size={10} /> Alert At
                            </label>
                            <span className="text-xs font-mono bg-slate-800 px-2 py-1 rounded text-red-400">
                                {settings.alertSpread.toFixed(1)}%
                            </span>
                        </div>
                        <input
                            type="range"
                            min="0" max="50" step="0.5"
                            value={settings.alertSpread}
                            onChange={(e) => updateSettings({ alertSpread: Number(e.target.value) })}
                            className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-red-500"
                        />
                        <p className="text-[10px] text-slate-500">
                            Play sound only when profit exceeds this value.
                        </p>
                    </div>

                    <div className="space-y-3">
                        <div className="flex justify-between items-center">
                            <label className="text-xs font-bold text-emerald-400 uppercase">Min Spread</label>
                            <span className="text-xs font-mono bg-slate-800 px-2 py-1 rounded text-emerald-400">
                                {settings.minSpread.toFixed(1)}%
                            </span>
                        </div>
                        <input
                            type="range"
                            min="0" max="20" step="0.1"
                            value={settings.minSpread}
                            onChange={(e) => updateSettings({ minSpread: Number(e.target.value) })}
                            className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                        />
                        <p className="text-[10px] text-slate-500">
                            Hide opportunities with profit lower than this value.
                        </p>
                    </div>

                    <div className="space-y-3 pt-4 border-t border-slate-800">
                        <div className="flex justify-between items-center">
                            <label className="text-xs font-bold text-amber-400 uppercase">Min Funding</label>
                            <span className="text-xs font-mono bg-slate-800 px-2 py-1 rounded text-amber-400">
                                {(settings.minFunding * 100).toFixed(3)}%
                            </span>
                        </div>
                        <input
                            type="range"
                            min="0" max="0.05" step="0.0001"
                            value={settings.minFunding}
                            onChange={(e) => updateSettings({ minFunding: Number(e.target.value) })}
                            className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
                        />
                        <p className="text-[10px] text-slate-500">
                            Filter for Funding Rate strategies.
                        </p>
                    </div>

                    <div className="space-y-3 pt-4 border-t border-slate-800">
                        <div className="flex justify-between items-center">
                            <label className="text-xs font-bold text-slate-400 uppercase">Hidden Assets</label>
                            {settings.hiddenCoins.length > 0 && (
                                <button
                                    onClick={() => updateSettings({ hiddenCoins: [] })}
                                    className="text-[10px] text-red-400 hover:text-red-300 flex items-center gap-1"
                                >
                                    <Trash2 size={10} /> Clear All
                                </button>
                            )}
                        </div>

                        {settings.hiddenCoins.length === 0 ? (
                            <div className="text-center py-4 text-xs text-slate-600 italic bg-slate-900/50 rounded">
                                No hidden assets. <br/> Click <Eye size={10} className="inline"/> on table to hide.
                            </div>
                        ) : (
                            <div className="flex flex-wrap gap-2">
                                {settings.hiddenCoins.map(coin => (
                                    <div key={coin} className="flex items-center gap-1 bg-slate-800 text-slate-300 px-2 py-1 rounded text-xs border border-slate-700">
                                        <span>{coin}</span>
                                        <button
                                            onClick={() => toggleHiddenCoin(coin)}
                                            className="hover:text-white"
                                        >
                                            <X size={10} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="space-y-3 pt-4 border-t border-slate-800">
                        <label className="text-xs font-bold text-slate-400 uppercase">Active Exchanges</label>
                        <div className="grid grid-cols-2 gap-2">
                            {EXCHANGES.map(ex => {
                                const isActive = !settings.hiddenExchanges.includes(ex);
                                return (
                                    <button
                                        key={ex}
                                        onClick={() => toggleExchange(ex)}
                                        className={`px-2 py-1.5 rounded text-[10px] uppercase font-bold border transition-all ${
                                            isActive
                                                ? 'bg-blue-500/20 border-blue-500/50 text-blue-400'
                                                : 'bg-slate-800 border-slate-700 text-slate-500'
                                        }`}
                                    >
                                        {ex}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <div className="mt-8 pt-6 border-t border-slate-800">
                        {/* Disclaimer */}
                        <div className="bg-amber-900/10 border border-amber-500/20 rounded-lg p-3 mb-4">
                            <div className="flex items-center gap-2 mb-2">
                                <ShieldAlert size={14} className="text-amber-500" />
                                <span className="text-[10px] font-bold text-amber-500 uppercase tracking-wide">
                                    Disclaimer
                                </span>
                            </div>
                            <p className="text-[9px] text-amber-200/60 leading-relaxed text-justify font-sans">
                                This software is for <b>informational purposes only</b>. It does not constitute financial advice.
                                Cryptocurrency trading involves significant risk. The developer is not responsible for any financial losses or API errors.
                                Always DYOR (Do Your Own Research).
                            </p>
                        </div>

                        {/* Developer Info */}
                        <div className="flex items-center justify-between bg-slate-800/30 p-3 rounded-lg border border-slate-800">
                            <div className="flex items-center gap-2">
                                <div className="p-1.5 bg-blue-500/10 rounded-md text-blue-400">
                                    <Code size={14} />
                                </div>
                                <div>
                                    <div className="text-[10px] font-bold text-slate-300">Developer</div>
                                    <a
                                        href="https://t.me/novikdanik"
                                        target="_blank"
                                        rel="noreferrer"
                                        className="text-[10px] text-blue-400 hover:text-blue-300 transition-colors"
                                    >
                                        @novikdanik
                                    </a>
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="text-[10px] font-bold text-slate-500">Version</div>
                                <div className="text-[10px] text-slate-400 font-mono">1.0.0 PRO</div>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </>
    );
};