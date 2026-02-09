import { useEffect } from 'react';
import { useMarketStore } from '../../store/marketStore';
import { X, ArrowRight, Zap, TrendingUp } from 'lucide-react';
import { clsx } from 'clsx';

export const AlertToast = () => {
    const { lastAlert, clearAlert } = useMarketStore();

    useEffect(() => {
        if (lastAlert) {
            const timer = setTimeout(() => {
                clearAlert();
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, [lastAlert, clearAlert]);

    if (!lastAlert) return null;

    return (
        <div className="fixed bottom-6 right-6 z-[100] animate-in slide-in-from-right-10 duration-300">
            <div className="bg-[#0f1522] border border-slate-700 shadow-2xl rounded-lg w-72 overflow-hidden">
                <div className={clsx("h-1 w-full",
                    lastAlert.type === 'SPREAD' ? "bg-emerald-500" : "bg-amber-500"
                )} />

                <div className="p-4 relative">
                    <button
                        onClick={clearAlert}
                        className="absolute top-2 right-2 text-slate-500 hover:text-white transition-colors"
                    >
                        <X size={14} />
                    </button>

                    <div className="flex items-center gap-2 mb-2">
                        {lastAlert.type === 'SPREAD' ? (
                            <Zap size={14} className="text-emerald-400" />
                        ) : (
                            <TrendingUp size={14} className="text-amber-400" />
                        )}
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                            New Opportunity
                        </span>
                    </div>

                    <div className="flex justify-between items-end">
                        <div>
                            <div className="text-lg font-bold text-slate-100 leading-none">
                                {lastAlert.symbol}
                            </div>
                            <div className="flex items-center gap-1.5 mt-1.5 text-xs text-slate-400 font-mono">
                                <span className="uppercase">{lastAlert.buyEx.substring(0, 3)}</span>
                                <ArrowRight size={10} />
                                <span className="uppercase">{lastAlert.sellEx.substring(0, 3)}</span>
                            </div>
                        </div>

                        <div className={clsx("text-xl font-mono font-bold",
                            lastAlert.type === 'SPREAD' ? "text-emerald-400" : "text-amber-400"
                        )}>
                            {lastAlert.spread.toFixed(2)}%
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};