import { useState, useMemo, memo } from 'react';
import { TableVirtuoso } from 'react-virtuoso';
import type { MatrixRow, ExchangePrice } from '../../types';
import {ArrowRight, Clock, EyeOff, ArrowUp, ArrowDown} from 'lucide-react';
import { useMarketStore } from '../../store/marketStore';
import { clsx } from 'clsx';
import { getExchangeUrl } from '../../utils/links';

const ALL_EXCHANGES = ['binance', 'bybit', 'okx', 'bitget', 'gate', 'mexc'];

interface OpportunityTableProps {
    data: MatrixRow[];
    type?: 'spot' | 'perp' | 'funding';
}

const formatPrice = (price: number) => {
    if (!price) return '-';
    if (price < 1) return price.toFixed(6);
    if (price < 10) return price.toFixed(4);
    return price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const formatDuration = (seconds?: number) => {
    if (!seconds) return 'New';
    if (seconds < 60) return `${seconds}s`;
    const m = Math.floor(seconds / 60);
    return `${m}m`;
};

const formatLimit = (val?: number) => {
    if (val === undefined || val === null) return '>1k';
    if (val >= 1000) return '>1k';
    return `$${val.toFixed(0)}`;
};

const PriceCell = memo(({
                            price, canWithdraw, canDeposit, typeLabel, exchange, symbol, isMatrix = false, isBest = false, isBestSell = false, fundingRate, isFundingMode
                        }: {
    price: number, canWithdraw?: boolean, canDeposit?: boolean, typeLabel: string, exchange: string, symbol: string, isMatrix?: boolean, isBest?: boolean, isBestSell?: boolean, fundingRate?: number | null, isFundingMode?: boolean
}) => {
    const url = getExchangeUrl(exchange, symbol, typeLabel as any);

    if (isMatrix) {
        return (
            <a
                href={url}
                target="_blank"
                rel="noreferrer"
                className="flex flex-col items-center justify-center h-full px-1 cursor-pointer w-full block group/link"
            >
                <span className={`text-[11px] font-mono tracking-tight ${isBest ? 'text-emerald-300 font-bold' : isBestSell ? 'text-red-300 font-bold' : 'text-slate-400'}`}>
                    {formatPrice(price)}
                </span>

                <div className="flex items-center gap-1 mt-0.5">
                    <span className={`text-[8px] leading-none ${typeLabel === 'SPOT' ? 'text-slate-600' : 'text-purple-400'}`}>
                        {typeLabel === 'SPOT' ? 'S' : 'P'}
                    </span>

                    {typeLabel !== 'SPOT' && fundingRate !== undefined && fundingRate !== null && (
                        <span className={clsx("text-[8px] font-mono leading-none",
                            isFundingMode ? "font-bold text-[9px]" : "",
                            fundingRate < 0 ? "text-emerald-400" : "text-red-400"
                        )}>
                            {(fundingRate * 100).toFixed(3)}%
                        </span>
                    )}

                    {typeLabel === 'SPOT' && (
                        <div className="flex -space-x-0.5 opacity-60">
                            {canWithdraw && <ArrowUp size={8} className="text-emerald-500" />}
                            {canDeposit && <ArrowDown size={8} className="text-emerald-500" />}
                        </div>
                    )}
                </div>
            </a>
        );
    }

    return (
        <a
            href={url}
            target="_blank"
            rel="noreferrer"
            className="flex flex-col items-center hover:scale-105 transition-transform cursor-pointer"
        >
            <span className={clsx("text-[9px] px-1 py-0.5 rounded uppercase font-bold mb-0.5 border border-transparent hover:border-white/20",
                typeLabel === 'SPOT' ? "bg-emerald-500/10 text-emerald-500" : "bg-purple-500/10 text-purple-500"
            )}>
                {exchange.substring(0, 3)}
            </span>
        </a>
    );
});

const MatrixCell = memo(({
                             ex, rowSymbol, cellData, bestBuyEx, bestSellEx, isFundingMode, className
                         }: {
    ex: string, rowSymbol: string, cellData: ExchangePrice | undefined, bestBuyEx: string, bestSellEx: string, isFundingMode: boolean, className?: string
}) => {
    const isBestBuy = bestBuyEx === ex;
    const isBestSell = bestSellEx === ex;

    const cellClass = isBestBuy
        ? "bg-emerald-500/5 ring-1 ring-inset ring-emerald-500/20"
        : isBestSell
            ? "bg-red-500/5 ring-1 ring-inset ring-red-500/20"
            : "hover:bg-slate-800/30";

    return (
        <td className={`py-1.5 border-b border-l border-slate-800/50 text-center ${cellClass} transition-colors ${className || ''}`}>
            {cellData ? (
                <PriceCell
                    price={cellData.price}
                    typeLabel={cellData.type}
                    exchange={ex}
                    symbol={rowSymbol}
                    canWithdraw={cellData.canWithdraw}
                    canDeposit={cellData.canDeposit}
                    fundingRate={cellData.fundingRate}
                    isMatrix={true}
                    isBest={isBestBuy}
                    isBestSell={isBestSell}
                    isFundingMode={isFundingMode}
                />
            ) : (
                <span className="text-[10px] text-slate-800">-</span>
            )}
        </td>
    );
});

export const OpportunityTable = ({ data, type }: OpportunityTableProps) => {
    const { toggleHiddenCoin, settings } = useMarketStore();

    const [frozenData, setFrozenData] = useState<MatrixRow[] | null>(null);

    const visibleExchanges = useMemo(() =>
            ALL_EXCHANGES.filter(ex => !settings.hiddenExchanges.includes(ex)),
        [settings.hiddenExchanges]);

    const isFundingMode = type === 'funding';

    const rows = frozenData || data;

    if (rows.length === 0) {
        return (
            <div className="h-full flex flex-col items-center justify-center text-slate-600 space-y-2 select-none">
                <span className="text-xs uppercase tracking-widest opacity-50">Scd canning market...</span>
            </div>
        );
    }

    return (
        <div
            className="h-full w-full overflow-x-auto relative"
            onMouseEnter={() => setFrozenData(data)}
            onMouseLeave={() => setFrozenData(null)}
        >
            <TableVirtuoso
                style={{ height: '100%', width: '100%' }}
                data={rows}
                increaseViewportBy={200}
                components={{
                    Table: (props) => <table {...props} className="w-full table-fixed border-collapse" />
                }}
                fixedHeaderContent={() => (
                    <tr className="bg-[#0f1522] text-[10px] uppercase text-slate-500 font-bold tracking-wider border-b border-slate-800">
                        <th className="py-2 pl-3 text-left w-[70px] bg-[#0f1522] z-10 sticky left-0 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.5)]">Asset</th>
                        <th className="py-2 text-left w-[110px]">Route</th>
                        <th className="py-2 text-right w-[90px]">
                            {isFundingMode ? 'Yield / Entry' : 'Spread / Yield'}
                        </th>
                        {visibleExchanges.map(ex => (
                            <th key={ex} className="py-2 text-center border-l border-slate-800/30 hidden md:table-cell">
                                {ex}
                            </th>
                        ))}
                        <th className="py-2 pr-3 text-right w-[50px]">Age</th>
                    </tr>
                )}
                itemContent={(_index, row) => {
                    const { bestOpp, prices } = row;
                    const buyRate = bestOpp.fundingRateBuy || 0;
                    const sellRate = bestOpp.fundingRateSell || 0;
                    const netYield = (buyRate * -1) + sellRate;
                    const hasFunding = bestOpp.buyType !== 'SPOT' || bestOpp.sellType !== 'SPOT';

                    const limitVal = bestOpp.maxVolumeUsd;
                    const isLowLimit = limitVal !== undefined && limitVal < 1000;

                    return (
                        <>
                            {/* 1. ASSET */}
                            <td className="py-1.5 pl-3 border-b border-slate-800/50 bg-[#0b1120] sticky left-0 z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.5)]">
                                <div className="flex flex-col justify-center">
                                    <div className="flex items-center gap-1.5 group">
                                        <div className="max-w-[55px] truncate" title={row.symbol}>
                                            <span className="font-bold text-slate-200 text-xs">{row.symbol}</span>
                                        </div>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); toggleHiddenCoin(row.symbol); }}
                                            className="opacity-0 group-hover:opacity-100 p-0.5 hover:text-white text-slate-600 transition-opacity"
                                            title="Hide asset"
                                        >
                                            <EyeOff size={11} />
                                        </button>
                                    </div>
                                </div>
                            </td>

                            {/* 2. ROUTE */}
                            <td className="py-1.5 border-b border-slate-800/50">
                                <div className="flex items-center gap-1.5">
                                    <PriceCell
                                        price={0}
                                        typeLabel={bestOpp.buyType}
                                        exchange={bestOpp.buyExchange}
                                        symbol={row.symbol}
                                    />
                                    <div className="flex flex-col items-center">
                                        <ArrowRight size={11} className="text-slate-600" />

                                        {/* Max Limit Display */}
                                        <span
                                            className={clsx(
                                                "text-[8px] font-mono mt-[-2px]",
                                                isLowLimit ? "text-red-400 font-bold" : "text-slate-600"
                                            )}
                                            title="Max Position Limit (USD)"
                                        >
                                            {formatLimit(limitVal)}
                                        </span>
                                    </div>
                                    <PriceCell
                                        price={0}
                                        typeLabel={bestOpp.sellType}
                                        exchange={bestOpp.sellExchange}
                                        symbol={row.symbol}
                                    />
                                </div>
                            </td>

                            {/* 3. VALUE */}
                            <td className="py-1.5 text-right border-b border-slate-800/50 pr-2">
                                {isFundingMode ? (
                                    <div className="flex flex-col items-end leading-tight">
                                        <span className={clsx("font-bold font-mono text-sm", netYield > 0 ? "text-amber-400" : "text-slate-400")}>
                                            {(netYield * 100).toFixed(3)}%
                                        </span>
                                        <span className={clsx("text-[10px] font-mono", bestOpp.netSpreadPct >= 0 ? "text-emerald-500" : "text-red-400")}>
                                            {bestOpp.netSpreadPct > 0 ? '+' : ''}{bestOpp.netSpreadPct.toFixed(2)}%
                                        </span>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-end leading-tight">
                                        <span className={clsx("font-bold font-mono text-sm", bestOpp.netSpreadPct > 0 ? "text-emerald-400" : "text-red-400")}>
                                            {bestOpp.netSpreadPct.toFixed(2)}%
                                        </span>
                                        {hasFunding && (
                                            <span className={clsx("text-[10px] font-mono", netYield > 0 ? "text-amber-400" : "text-red-400/70")}>
                                                Y: {(netYield * 100).toFixed(3)}%
                                            </span>
                                        )}
                                        {!hasFunding && (
                                            <span className="text-[10px] text-slate-600 font-mono">
                                                G: {bestOpp.grossSpreadPct.toFixed(2)}%
                                            </span>
                                        )}
                                    </div>
                                )}
                            </td>

                            {/* 4. MATRIX CELLS (Rendered via Component) */}
                            {visibleExchanges.map(ex => (
                                <MatrixCell
                                    key={ex}
                                    ex={ex}
                                    rowSymbol={row.symbol}
                                    cellData={prices[ex]}
                                    bestBuyEx={bestOpp.buyExchange}
                                    bestSellEx={bestOpp.sellExchange}
                                    isFundingMode={isFundingMode}
                                    className="hidden md:table-cell"
                                />
                            ))}

                            {/* 5. AGE */}
                            <td className="py-1.5 pr-3 text-right border-b border-slate-800/50 text-[10px] text-slate-500 hidden md:table-cell">
                                <div className="flex items-center justify-end gap-0.5">
                                    <Clock size={9} />
                                    {formatDuration(bestOpp.durationSeconds)}
                                </div>
                            </td>
                        </>
                    );
                }}
            />
        </div>
    );
};