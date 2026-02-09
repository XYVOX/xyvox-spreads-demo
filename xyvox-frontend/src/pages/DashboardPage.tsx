import { useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useMarketStore } from '../store/marketStore';
import { DashboardGrid } from '../components/layout/DashboardGrid';
import {LogOut, Wifi, WifiOff, PlayCircle, PauseCircle, Clock} from 'lucide-react';
import { useState } from 'react';
import { Settings2 } from 'lucide-react';
import { SettingsPanel } from '../components/dashboard/SettingsPanel';
import {AlertToast} from "../components/ui/AlertToast.tsx";


const MarketClock = () => {
    const [now, setNow] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => setNow(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const utcTime = now.toISOString().split('T')[1].split('.')[0];

    const getFundingCountdown = () => {
        const nextFunding = new Date(now);
        nextFunding.setUTCMinutes(0);
        nextFunding.setUTCSeconds(0);
        nextFunding.setUTCMilliseconds(0);

        const currentHour = now.getUTCHours();

        if (currentHour < 8) {
            nextFunding.setUTCHours(8);
        } else if (currentHour < 16) {
            nextFunding.setUTCHours(16);
        } else {
            nextFunding.setUTCHours(0);
            nextFunding.setUTCDate(now.getUTCDate() + 1);
        }

        const diff = nextFunding.getTime() - now.getTime();

        const h = Math.floor(diff / 3600000);
        const m = Math.floor((diff % 3600000) / 60000);
        const s = Math.floor((diff % 60000) / 1000);

        return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    return (
        <div className="flex flex-col items-end mr-4 text-[10px] font-mono leading-tight border-r border-slate-700/50 pr-4 h-8 justify-center">
            <div className="text-slate-500 flex items-center gap-1.5">
                <Clock size={10} />
                <span>UTC <span className="text-slate-300 font-bold">{utcTime}</span></span>
            </div>
            <div className="text-slate-500">
                NEXT <span className="text-amber-400 font-bold">{getFundingCountdown()}</span>
            </div>
        </div>
    );
};


export const DashboardPage = () => {
    const { token, logout } = useAuth();
    const { connect, disconnect, isConnected, isPaused, setPaused } = useMarketStore();

    const [isSettingsOpen, setIsSettingsOpen] = useState(false);

    useEffect(() => {
        const REFRESH_THRESHOLD_MS = 15 * 60 * 1000;
        const startTime = Date.now();

        const interval = setInterval(() => {
            const uptime = Date.now() - startTime;

            if (uptime > REFRESH_THRESHOLD_MS && document.hidden) {
                window.location.reload();
            }
        }, 10000);

        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        if (token) {
            connect(token);
        }
        return () => {
            disconnect();
        };
    }, [token, connect, disconnect]);

    return (
        <div className="h-screen bg-[#0b1120] text-slate-300 font-sans flex flex-col overflow-hidden">
            {/* HEADER */}
            <header className="h-12 bg-[#0f1522]/90 border-b border-slate-800 flex items-center justify-between px-4 shrink-0 backdrop-blur-sm z-50">
                <div className="flex items-center gap-4">
                    <div className="font-bold text-blue-500 tracking-wider text-sm">
                        XYVOX<span className="text-slate-600 font-light">PRO</span>
                    </div>

                    {/* Status Badge */}
                    <div className={`flex items-center gap-1.5 text-[10px] px-2 py-0.5 rounded-full border ${
                        isConnected
                            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                            : 'bg-red-500/10 border-red-500/20 text-red-400'
                    }`}>
                        {isConnected ? <Wifi size={10} /> : <WifiOff size={10} />}
                        <span className="font-bold tracking-wide">{isConnected ? 'SYSTEM ONLINE' : 'DISCONNECTED'}</span>
                    </div>
                </div>

                <MarketClock />

                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setPaused(!isPaused)}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded text-xs font-bold transition-all ${
                            isPaused
                                ? 'bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30'
                                : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'
                        }`}
                    >
                        {isPaused ? <PlayCircle size={14} /> : <PauseCircle size={14} />}
                        {isPaused ? 'RESUME STREAM' : 'PAUSE STREAM'}
                    </button>

                    <button
                        onClick={() => setIsSettingsOpen(true)}
                        className="flex items-center gap-2 px-3 py-1.5 rounded text-xs font-bold bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-all"
                    >
                        <Settings2 size={14} />
                        SETTINGS
                    </button>

                    <button onClick={logout} className="p-2 hover:bg-red-500/10 hover:text-red-400 rounded transition-colors text-slate-500">
                        <LogOut size={16} />
                    </button>
                </div>
            </header>

            {/* MAIN CONTENT (GRID) */}
            <DashboardGrid />
            <SettingsPanel isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
            <AlertToast />
        </div>
    );
};