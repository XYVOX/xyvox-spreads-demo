import Redis from 'ioredis';
import 'dotenv/config';

/**
 * [PORTFOLIO DEMO NOTE]
 * ===================================================================================
 * Service for mapping exchange tickers to CoinGecko IDs (for logos/metadata).
 * * In production: Crawls CoinGecko API (paginated) to map thousands of assets.
 * * In demo: Uses a static 'Top-20' map to ensure icons load correctly on the frontend
 * without hitting CoinGecko API rate limits during demonstration.
 * ===================================================================================
 */

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
const redis = new Redis(REDIS_URL);

const STATIC_MAP = {
    // Bitcoin
    'binance:BTC': 'bitcoin', 'bybit:BTC': 'bitcoin', 'gate:BTC': 'bitcoin', 'okx:BTC': 'bitcoin',
    // Ethereum
    'binance:ETH': 'ethereum', 'bybit:ETH': 'ethereum', 'gate:ETH': 'ethereum', 'okx:ETH': 'ethereum',
    // Solana
    'binance:SOL': 'solana', 'bybit:SOL': 'solana', 'gate:SOL': 'solana',
    // USDT
    'binance:USDT': 'tether', 'bybit:USDT': 'tether',
    // XRP
    'binance:XRP': 'ripple', 'bybit:XRP': 'ripple',
    // DOGE
    'binance:DOGE': 'dogecoin', 'bybit:DOGE': 'dogecoin',
    // ADA
    'binance:ADA': 'cardano', 'bybit:ADA': 'cardano',
    // AVAX
    'binance:AVAX': 'avalanche-2',
    // MATIC
    'binance:MATIC': 'matic-network',
    // DOT
    'binance:DOT': 'polkadot',
    // LINK
    'binance:LINK': 'chainlink'
};

const UPDATE_INTERVAL = 12 * 60 * 60 * 1000;

async function fetchMapping() {
    console.log("[CoinGecko] Seeding static ID map for demo...");

    await redis.set('meta:cg-map', JSON.stringify(STATIC_MAP));

    console.log("[CoinGecko] Map seeded successfully.");
}

fetchMapping();
setInterval(fetchMapping, UPDATE_INTERVAL);