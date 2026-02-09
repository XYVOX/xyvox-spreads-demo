
const SHARD_CONFIG = {
    'gate_spot': 3,
    'gate_swap': 3,
    'bybit_swap': 3,
    'mexc_spot': 3,
    'bybit_spot': 1,
    'mexc_swap': 1,
    'binance_spot': 1,
    'binance_swap': 1,
    'bitget_spot': 1,
    'bitget_swap': 1,
    'okx_spot': 1,
    'okx_swap': 1
};

const DEFAULT_SHARDS = 1;

const TARGETS = [
    { id: 'bybit', types: ['spot', 'swap'] },
    { id: 'binance', types: ['spot', 'swap'] },
    { id: 'gate', types: ['spot', 'swap'] },
    { id: 'bitget', types: ['spot', 'swap'] },
    { id: 'mexc', types: ['spot', 'swap'] },
    { id: 'okx', types: ['spot', 'swap'] },
];

const apps = [];

const commonConfig = {
    instances: 1,
    autorestart: true,
    watch: false,
    exec_mode: 'fork',
    env: {
        NODE_ENV: 'production'
    }
};

apps.push({
    name: 'discovery',
    script: './discovery-service.js',
    max_memory_restart: '300M',
    ...commonConfig
});

apps.push({
    name: 'identity',
    script: './metadata-identity.js',
    max_memory_restart: '300M',
    ...commonConfig
});

apps.push({
    name: 'coingecko',
    script: './service-coingecko.js',
    max_memory_restart: '300M',
    ...commonConfig
});

apps.push({
    name: 'meta-ingest',
    script: './ingest-metadata.js',
    max_memory_restart: '400M',
    ...commonConfig
});

TARGETS.forEach(target => {
    target.types.forEach(type => {
        const configKey = `${target.id}_${type}`;
        const totalShards = SHARD_CONFIG[configKey] || DEFAULT_SHARDS;

        for (let shardId = 0; shardId < totalShards; shardId++) {
            apps.push({
                name: `${target.id}-${type}-${shardId}`,
                script: './ingest-stream.js',
                args: [
                    target.id,
                    type,
                    `--shard=${shardId}`,
                    `--total=${totalShards}`
                ],
                max_memory_restart: '600M',
                restart_delay: 3000,
                ...commonConfig
            });
        }
    });
});

module.exports = {
    apps: apps
};