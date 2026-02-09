import 'dotenv/config';
import Redis from 'ioredis';

/**
 * [PORTFOLIO DEMO NOTE]
 * ===================================================================================
 * This service is responsible for discovering new trading pairs across exchanges.
 * * In production: It connects to multiple exchanges via CCXT, fetches all available
 * markets, filters for USDT pairs, and normalizes tickers (e.g., '1000PEPE' -> 'PEPE').
 * * In demo: It simulates the scanning process and returns a curated list of
 * popular assets to ensure the dashboard is populated with recognizable data.
 * ===================================================================================
 */

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
const REDIS_KEY_COINS = 'config:active-coins';
const UPDATE_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

// List of exchanges supposedly being scanned
const EXCHANGES_TO_SCAN = [
    'binance',
    'bybit',
    'gate',
    'bitget',
    'mexc',
    'okx'
];

// Curated list of assets for the demo environment to ensure UI is populated
const DEMO_ASSETS = [
    'BTC', 'ETH', 'SOL', 'XRP', 'DOGE', 'ADA', 'AVAX', 'LINK', 'DOT', 'MATIC',
    'LTC', 'UNI', 'ATOM', 'IMX', 'APT', 'ARB', 'OP', 'INJ', 'RNDR', 'PEPE',
    'SUI', 'SEI', 'TIA', 'BLUR', 'MEME'
];

const redis = new Redis(REDIS_URL);

async function runDiscovery() {
    console.log(`[Discovery] Starting market scan cycle...`);

    // Simulate network latency for scanning multiple exchanges
    for (const exchangeId of EXCHANGES_TO_SCAN) {
        // Mock delay per exchange (300-600ms)
        const delay = Math.floor(Math.random() * 300) + 300;
        await new Promise(r => setTimeout(r, delay));

        // Log "fake" progress to make logs look alive
        // const scannedCount = Math.floor(Math.random() * 100) + 200;
        // console.log(`   [${exchangeId}] Indexing complete.`);
    }

    const allCoins = DEMO_ASSETS.sort();
    console.log(`[Discovery] Aggregated ${allCoins.length} unique assets from ${EXCHANGES_TO_SCAN.length} sources.`);

    try {
        const oldCoinsRaw = await redis.get(REDIS_KEY_COINS);
        const oldCoinsSet = new Set(oldCoinsRaw ? JSON.parse(oldCoinsRaw) : []);

        const newCoins = allCoins.filter(coin => !oldCoinsSet.has(coin));

        // Save unified list to Redis
        await redis.set(REDIS_KEY_COINS, JSON.stringify(allCoins));

        // Notify other services about the update
        await redis.publish('control:coins-update', allCoins.length);

        if (newCoins.length > 0) {
            console.log(`[Discovery] Found ${newCoins.length} new assets: ${newCoins.join(', ')}`);
            // Trigger identity resolution (fetching full names like "Bitcoin")
            await redis.publish('control:check-identity', JSON.stringify(newCoins));
        } else {
            console.log(`[Discovery] No new assets detected.`);
        }

    } catch (e) {
        console.error(`[Discovery] Redis error: ${e.message}`);
    }
}

// Start initial scan
runDiscovery();
// Schedule periodic scans
setInterval(runDiscovery, UPDATE_INTERVAL_MS);