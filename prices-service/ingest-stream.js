import 'dotenv/config';
import Redis from 'ioredis';
import { Client } from '@stomp/stompjs';
import { WebSocket } from 'ws';
import crc32 from 'crc-32';

/**
 * [PORTFOLIO DEMO NOTE]
 * ===================================================================================
 * This service simulates high-frequency market data ingestion using Geometric Brownian Motion.
 * * In the production environment, this service utilizes the 'ccxt.pro' library
 * to establish WebSocket connections with exchanges (Binance, Bybit, etc.)
 * and normalize order book packets in real-time.
 * * For this public repository, the direct exchange connection logic has been replaced
 * with a stochastic simulation to:
 * 1. Protect proprietary high-frequency trading strategies.
 * 2. Avoid exposing sensitive API keys in a public codebase.
 * 3. Demonstrate the system architecture (Redis Pub/Sub + WebSocket STOMP)
 * without external dependencies.
 * ===================================================================================
 */

Object.assign(global, { WebSocket });

// Configuration
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
const BACKEND_URL = process.env.BACKEND_URL || 'ws://localhost:8080';
const REDIS_KEY_COINS = 'config:active-coins';

// Simulation parameters (Network latency emulation)
const MIN_INTERVAL_MS = 100;
const MAX_INTERVAL_MS = 800;

const args = process.argv.slice(2);
const EXCHANGE_ID = args[0] || 'binance';
const MARKET_TYPE = args[1] || 'spot';
const shardArg = args.find(a => a.startsWith('--shard='));
const totalArg = args.find(a => a.startsWith('--total='));
const SHARD_ID = shardArg ? parseInt(shardArg.split('=')[1]) : 0;
const TOTAL_SHARDS = totalArg ? parseInt(totalArg.split('=')[1]) : 1;

// State map to maintain price continuity (prevents erratic jumps)
const priceState = new Map();

const redis = new Redis(REDIS_URL);
const stompClient = new Client({
    brokerURL: `${BACKEND_URL}/ws-arbitrage/websocket`,
    reconnectDelay: 5000,
    onConnect: () => console.log(`[${EXCHANGE_ID.toUpperCase()}] Connected to STOMP bus`),
    onStompError: (frame) => console.error('Stomp Error: ' + frame.headers['message']),
});
stompClient.activate();

function isMyCoin(symbol) {
    return (Math.abs(crc32.str(symbol)) % TOTAL_SHARDS) === SHARD_ID;
}

/**
 * Generates a deterministic "seed" price based on the asset symbol.
 * Ensures BTC always starts around ~45k, ETH ~2.5k, etc.
 */
function getSeedPrice(symbol) {
    let hash = 0;
    for (let i = 0; i < symbol.length; i++) {
        hash = symbol.charCodeAt(i) + ((hash << 5) - hash);
    }
    const normalized = Math.abs(hash) % 10000;

    if (symbol.includes('BTC')) return 45000 + normalized;
    if (symbol.includes('ETH')) return 2500 + (normalized / 10);
    if (symbol.includes('SOL')) return 100 + (normalized / 100);
    return (normalized / 100) + 0.5;
}

/**
 * Simulates an order book snapshot using random walk.
 */
function generateMockOrderBook(symbol) {
    // 1. Initialize or retrieve previous state
    let currentPrice = priceState.get(symbol);
    if (!currentPrice) {
        currentPrice = getSeedPrice(symbol);
    }

    // 2. Apply random volatility (0.1%)
    const volatility = 0.001;
    const change = 1 + (Math.random() * volatility * 2 - volatility);
    let newPrice = currentPrice * change;

    // Persist new state
    priceState.set(symbol, newPrice);

    // 3. Calculate spread (0.05%)
    const spread = newPrice * 0.0005;
    const bid = newPrice - spread;
    const ask = newPrice + spread;

    // 4. Simulate volume
    const volume = Math.random() * 5 + 0.1;

    return {
        exchange: EXCHANGE_ID,
        symbol: symbol,
        type: MARKET_TYPE.toUpperCase(),
        bid: bid,
        ask: ask,
        bidQty: volume,
        askQty: volume,
        bl: volume,
        al: volume,
        bidVol: bid * volume,
        askVol: ask * volume,
        fundingRate: MARKET_TYPE === 'swap' ? 0.0001 : 0, // Mock positive funding
        timestamp: Date.now()
    };
}

async function main() {
    console.log(`[${EXCHANGE_ID}:${SHARD_ID}] Starting SIMULATION STREAM...`);

    // Graceful startup delay
    await new Promise(r => setTimeout(r, 2000));

    // Fetch active assets from Redis or fallback to default list
    let myCoins = [];
    try {
        const raw = await redis.get(REDIS_KEY_COINS);
        const allCoins = raw ? JSON.parse(raw) : ['BTC', 'ETH', 'SOL', 'XRP', 'DOGE', 'ADA', 'AVAX'];
        myCoins = allCoins.filter(c => isMyCoin(c));
        console.log(`[${EXCHANGE_ID}] Simulating market data for ${myCoins.length} assets`);
    } catch (e) {
        console.warn("Redis unavailable, using fallback asset list");
        myCoins = ['BTC', 'ETH', 'SOL'];
    }

    // Infinite simulation loop
    while (true) {
        for (const coin of myCoins) {
            if (!stompClient.connected) continue;

            const mockData = generateMockOrderBook(coin);

            stompClient.publish({
                destination: '/app/ingest',
                body: JSON.stringify(mockData)
            });

            // Micro-delay to throttle CPU usage
            await new Promise(r => setTimeout(r, 10));
        }

        // Simulate network jitter
        const delay = Math.floor(Math.random() * (MAX_INTERVAL_MS - MIN_INTERVAL_MS + 1) + MIN_INTERVAL_MS);
        await new Promise(r => setTimeout(r, delay));
    }
}

main();