import 'dotenv/config';
import Redis from 'ioredis';
import { processBitget } from './strategies/bitget.js';
import { processGate } from './strategies/gate.js';
import { processBybit } from './strategies/bybit.js';
import { processMexc } from "./strategies/mexc.js";
import { processBinance } from "./strategies/binance.js";
import { processOkx } from "./strategies/okx.js";

/**
 * [PORTFOLIO DEMO NOTE]
 * ===================================================================================
 * This service orchestrates the fetching of static metadata (funding intervals,
 * withdrawal fees, leverage limits).
 * * In production: Instantiates CCXT exchange clients and rotates through API keys.
 * * In demo: Calls mock strategy handlers to populate Redis with simulated constraint data.
 * ===================================================================================
 */

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
const REDIS_KEY_COINS = 'config:active-coins';
const UPDATE_INTERVAL = 10 * 60 * 1000; // 10 min

const redis = new Redis(REDIS_URL);
const redisSub = new Redis(REDIS_URL);

const EXCHANGES_CONFIG = {
    'bybit':   { enableRateLimit: true },
    'gate':    { enableRateLimit: true },
    'bitget':  { enableRateLimit: true },
    'binance': { enableRateLimit: true },
    'mexc':    { enableRateLimit: true },
    'okx':     { enableRateLimit: true },
};

const STRATEGIES = {
    'bitget': processBitget,
    'gate': processGate,
    'bybit': processBybit,
    'binance': processBinance,
    'mexc': processMexc,
    'okx': processOkx,
};

async function getActiveCoins() {
    try {
        const raw = await redis.get(REDIS_KEY_COINS);
        // Fallback если Redis пустой
        return raw ? JSON.parse(raw) : ['BTC', 'ETH', 'SOL', 'XRP', 'DOGE'];
    } catch (e) {
        return ['BTC', 'ETH'];
    }
}

let isRunning = false;

async function fetchMetadata(triggerSource = 'TIMER') {
    if (isRunning) return;
    isRunning = true;

    console.log(`[Metadata] Starting update cycle (${triggerSource})...`);
    const targetCoins = await getActiveCoins();

    for (const [exchangeId, config] of Object.entries(EXCHANGES_CONFIG)) {
        try {
            const processFn = STRATEGIES[exchangeId];
            if (!processFn) continue;

            const mockExchange = {
                id: exchangeId,
                has: { fetchCurrencies: true, fetchFundingRates: true }
            };

            const metadataMap = await processFn(
                mockExchange,
                targetCoins,
                {}, // tickers
                {}, // fundingRates
                {}, // leverageTiers
                {}  // tradingFees
            );

            await redis.set(`meta:info:${exchangeId}`, JSON.stringify(metadataMap));
            await redis.publish('control:metadata-update', exchangeId);
            console.log(`[Metadata] Updated ${exchangeId}`);

        } catch (e) {
            console.error(`Error processing ${exchangeId}:`, e);
        }
    }
    isRunning = false;
}

async function main() {
    await fetchMetadata('STARTUP');

    redisSub.subscribe('control:coins-update');
    redisSub.on('message', (channel) => {
        if (channel === 'control:coins-update') fetchMetadata('EVENT_TRIGGER');
    });

    setInterval(() => fetchMetadata('TIMER'), UPDATE_INTERVAL);
}

main();