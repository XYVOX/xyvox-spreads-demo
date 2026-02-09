import 'dotenv/config';
import Redis from 'ioredis';

/**
 * [PORTFOLIO DEMO NOTE]
 * ===================================================================================
 * This service normalizes asset names across exchanges (e.g. "BTC" -> "Bitcoin").
 * * In production: Queries exchange APIs to build a unified identity map.
 * * In demo: Uses a static algorithmic generator to simulate this mapping without external calls.
 * ===================================================================================
 */

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
const redis = new Redis(REDIS_URL);
const redisSub = new Redis(REDIS_URL);
const IDENTITY_KEY = 'meta:identity-map';

const EXCHANGES = ['binance', 'bybit', 'gate', 'bitget', 'mexc', 'okx'];

async function updateIdentityMap(specificSymbols = null) {
    console.log("[Identity] Normalizing asset names...");

    let currentMap = {};
    const raw = await redis.get(IDENTITY_KEY);
    if (raw) currentMap = JSON.parse(raw);

    const targets = specificSymbols || ['BTC', 'ETH', 'SOL', 'XRP', 'DOGE', 'ADA'];

    targets.forEach(symbol => {
        if (!currentMap[symbol]) currentMap[symbol] = {};

        let name = symbol;
        if (symbol === 'BTC') name = 'Bitcoin';
        if (symbol === 'ETH') name = 'Ethereum';
        if (symbol === 'SOL') name = 'Solana';

        EXCHANGES.forEach(ex => {
            currentMap[symbol][ex] = name;
        });
    });

    await redis.set(IDENTITY_KEY, JSON.stringify(currentMap));
    console.log("[Identity] Map updated.");
}

async function main() {
    await updateIdentityMap(null);

    redisSub.subscribe('control:check-identity');
    redisSub.on('message', async (channel, message) => {
        if (channel === 'control:check-identity') {
            try {
                const newCoins = JSON.parse(message);
                if (Array.isArray(newCoins)) await updateIdentityMap(newCoins);
            } catch (e) {}
        }
    });

    setInterval(() => updateIdentityMap(null), 24 * 60 * 60 * 1000);
}

main();