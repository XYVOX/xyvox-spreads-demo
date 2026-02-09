import { create } from 'zustand';
import { Client } from '@stomp/stompjs';
import type { WorkerOutput, CoinAnalysis, AlertData } from '../types';
import DataWorker from '../workers/dataProcessor?worker';
import { api } from '../api/axios';

const playAlertSound = () => {
    try {
        const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioContext) return;
        const ctx = new AudioContext();

        const createOscillator = (freq: number, startTime: number) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.type = 'square';
            osc.frequency.setValueAtTime(freq, startTime);
            gain.gain.setValueAtTime(0.1, startTime);
            gain.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.15);
            osc.start(startTime);
            osc.stop(startTime + 0.2);
        };

        const now = ctx.currentTime;
        createOscillator(900, now);
        createOscillator(1200, now + 0.15);
        setTimeout(() => { if (ctx.state !== 'closed') ctx.close(); }, 1000);
    } catch (e) {
        console.error("Audio synth error:", e);
    }
};

export interface MarketSettings {
    minSpread: number;
    alertSpread: number;
    minFunding: number;
    hiddenCoins: string[];
    hiddenExchanges: string[];
    soundEnabled: boolean;
}

interface MarketState {
    data: WorkerOutput;
    isConnected: boolean;
    isPaused: boolean;
    settings: MarketSettings;
    lastAlert: AlertData | null;
    clearAlert: () => void;
    connect: (token: string) => void;
    disconnect: () => void;
    setPaused: (paused: boolean) => void;
    updateSettings: (newSettings: Partial<MarketSettings>) => void;
    toggleHiddenCoin: (symbol: string) => void;
    toggleExchange: (exchange: string) => void;
    testSound: () => void;
}

const worker = new DataWorker();

export const useMarketStore = create<MarketState>((set, get) => {
    let client: Client | null = null;
    let lastRawData: CoinAnalysis[] = [];
    let lastUpdate = 0;
    let pendingUpdate: WorkerOutput | null = null;
    let animationFrameId: number | null = null;

    const alertHistory = new Map<string, number>();
    const ALERT_COOLDOWN_MS = 3 * 60 * 1000;

    let saveTimeout: any = null;

    const checkAlerts = (output: WorkerOutput) => {
        const { settings } = get();
        if (!settings.soundEnabled) return;

        let alertToTrigger: any = null;

        const check = (row: any, value: number, type: 'SPREAD' | 'FUNDING') => {
            if (value >= settings.alertSpread) {
                const lastAlertTime = alertHistory.get(row.id) || 0;
                const now = Date.now();

                if (now - lastAlertTime > ALERT_COOLDOWN_MS) {
                    if (!alertToTrigger || value > alertToTrigger.spread) {
                        alertToTrigger = {
                            id: row.id,
                            symbol: row.symbol,
                            spread: value,
                            buyEx: row.bestOpp.buyExchange,
                            sellEx: row.bestOpp.sellExchange,
                            type: type
                        };
                    }
                }
            }
        };

        for (const r of output.spotSpot) check(r, r.bestOpp.netSpreadPct, 'SPREAD');
        for (const r of output.spotPerp) check(r, Math.abs(r.bestOpp.netSpreadPct), 'SPREAD');
        for (const r of output.perpPerp) check(r, r.bestOpp.grossSpreadPct, 'SPREAD');
        for (const r of output.funding) {
            const yieldVal = ((r.bestOpp.fundingRateBuy || 0) * -1) + (r.bestOpp.fundingRateSell || 0);
            check(r, yieldVal * 100, 'FUNDING');
        }

        if (alertToTrigger) {
            const now = Date.now();
            alertHistory.set(alertToTrigger.id, now);
            playAlertSound();


            set({ lastAlert: alertToTrigger });
        }

        if (alertHistory.size > 200) {
            const now = Date.now();
            for (const [id, time] of alertHistory) {
                if (now - time > ALERT_COOLDOWN_MS * 2) alertHistory.delete(id);
            }
        }
    };

    const scheduleUpdate = (newData: WorkerOutput) => {
        pendingUpdate = newData;
        checkAlerts(newData);
        if (animationFrameId) return;

        const performUpdate = () => {
            if (pendingUpdate && !get().isPaused) {
                set({ data: pendingUpdate });
                lastUpdate = Date.now();
            }
            pendingUpdate = null;
            animationFrameId = null;
        };

        const now = Date.now();
        const timeSinceLast = now - lastUpdate;
        const THROTTLE_MS = 500;
        if (timeSinceLast >= THROTTLE_MS) {
            performUpdate();
        } else {
            animationFrameId = window.setTimeout(performUpdate, THROTTLE_MS - timeSinceLast);
        }
    };

    worker.onmessage = (e: MessageEvent<WorkerOutput>) => {
        scheduleUpdate(e.data);
    };

    const processData = (rawData: CoinAnalysis[]) => {
        const { settings } = get();
        worker.postMessage({
            data: rawData,
            config: {
                minSpread: settings.minSpread,
                minFunding: settings.minFunding,
                hiddenCoins: settings.hiddenCoins,
                hiddenExchanges: settings.hiddenExchanges || []
            }
        });
    };

    const defaultSettings: MarketSettings = {
        minSpread: 0.1,
        alertSpread: 5.0,
        minFunding: 0.0001,
        hiddenCoins: [],
        hiddenExchanges: [],
        soundEnabled: false
    };

    const savedSettingsStr = localStorage.getItem('xyvox:settings');
    const initialSettings: MarketSettings = savedSettingsStr
        ? { ...defaultSettings, ...JSON.parse(savedSettingsStr) }
        : defaultSettings;

    return {
        data: { spotSpot: [], spotPerp: [], perpPerp: [], funding: [], timestamp: 0 },
        isConnected: false,
        isPaused: false,
        settings: initialSettings,
        lastAlert: null,

        clearAlert: () => set({ lastAlert: null }),

        testSound: () => {
            playAlertSound();
            set({
                lastAlert: {
                    id: 'test', symbol: 'TEST', spread: 12.5, buyEx: 'binance', sellEx: 'bybit', type: 'SPREAD'
                }
            });
        },

        setPaused: (paused) => set({ isPaused: paused }),

        updateSettings: (updates) => {
            const newSettings = { ...get().settings, ...updates };
            set({ settings: newSettings });
            localStorage.setItem('xyvox:settings', JSON.stringify(newSettings));

            if (lastRawData.length > 0) processData(lastRawData);

            if (saveTimeout) {
                clearTimeout(saveTimeout);
            }

            saveTimeout = setTimeout(() => {
                if (get().isConnected || localStorage.getItem('token')) {
                    api.put('/user/settings', newSettings)
                        .catch(() => {});
                }
            }, 1500);
        },

        toggleHiddenCoin: (symbol) => {
            const { settings } = get();
            const isHidden = settings.hiddenCoins.includes(symbol);
            const newHidden = isHidden ? settings.hiddenCoins.filter(s => s !== symbol) : [...settings.hiddenCoins, symbol];
            get().updateSettings({ hiddenCoins: newHidden });
        },

        toggleExchange: (exchange) => {
            const { settings } = get();
            const currentHidden = settings.hiddenExchanges || [];
            const isHidden = currentHidden.includes(exchange);
            const newHidden = isHidden ? currentHidden.filter(e => e !== exchange) : [...currentHidden, exchange];
            get().updateSettings({ hiddenExchanges: newHidden });
        },

        connect:  async (token) => {
            if (client?.active) return;

            try {
                const res = await api.get('/user/settings');
                if (res.data) {
                    const serverSettings = typeof res.data === 'string' ? JSON.parse(res.data) : res.data;
                    const merged = { ...defaultSettings, ...serverSettings };
                    set({ settings: merged });
                    localStorage.setItem('xyvox:settings', JSON.stringify(merged));
                }
            } catch (e) {
                console.warn("Could not fetch settings, using local", e);
            }

            const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
            const host = window.location.host;

            const wsUrl = import.meta.env.PROD
                ? `${protocol}//${host}/ws-arbitrage/websocket`
                : 'ws://localhost:8080/ws-arbitrage/websocket';

            client = new Client({
                brokerURL: wsUrl,
                connectHeaders: { Authorization: `Bearer ${token}` },
                reconnectDelay: 5000,
                onConnect: () => {
                    set({ isConnected: true });
                    client?.subscribe('/topic/spreads', (message) => {
                        if (!message.body) return;
                        const rawData = JSON.parse(message.body);
                        lastRawData = rawData;
                        processData(rawData);
                    });
                },
                onDisconnect: () => set({ isConnected: false }),
            });
            client.activate();
        },

        disconnect: () => {
            if (animationFrameId) clearTimeout(animationFrameId);
            client?.deactivate();
            client = null;
            set({ isConnected: false });
        }
    };
});