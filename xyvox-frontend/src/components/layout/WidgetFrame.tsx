import type { ReactNode } from 'react';
import { X } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface WidgetFrameProps {
    title: string;
    children: ReactNode;
    className?: string;
    style?: React.CSSProperties;
    onMouseDown?: React.MouseEventHandler;
    onMouseUp?: React.MouseEventHandler;
    onTouchEnd?: React.TouchEventHandler;
    onRemove?: () => void;
    headerColor?: string;
}

export const WidgetFrame = ({
                                title,
                                children,
                                className,
                                style,
                                onMouseDown,
                                onMouseUp,
                                onTouchEnd,
                                onRemove,
                                headerColor = 'text-blue-400'
                            }: WidgetFrameProps) => {
    return (
        <div
            style={style}
            onMouseDown={onMouseDown}
            onMouseUp={onMouseUp}
            onTouchEnd={onTouchEnd}
            className={twMerge(
                "flex flex-col h-full bg-[#0f1522]/80 backdrop-blur-md border border-slate-700/50 rounded-xl shadow-2xl overflow-hidden",
                className
            )}
        >
            {/* HEADER */}
            <div className="drag-handle h-9 shrink-0 bg-slate-900/50 border-b border-white/5 flex items-center justify-between px-3 cursor-grab active:cursor-grabbing select-none group">
                <div className={clsx("text-[11px] font-bold uppercase tracking-wider flex items-center gap-2", headerColor)}>
                    <div className="w-1.5 h-1.5 rounded-full bg-current opacity-60" />
                    {title}
                </div>

                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {onRemove && (
                        <button onClick={onRemove} className="p-1 hover:bg-red-500/20 rounded text-slate-500 hover:text-red-400 transition-colors">
                            <X size={12} />
                        </button>
                    )}
                </div>
            </div>

            {/* CONTENT */}
            <div className="flex-1 min-h-0 relative">
                {children}
            </div>
        </div>
    );
};