export const getExchangeUrl = (exchange: string, symbol: string, type: 'SPOT' | 'PERP' | 'SWAP' | 'FUTURE') => {
    const ex = exchange.toLowerCase();
    const s = symbol.toUpperCase();
    const isSpot = type === 'SPOT';


    switch (ex) {
        case 'binance':
            // Spot: https://www.binance.com/en/trade/BTC_USDT?type=spot
            // Perp: https://www.binance.com/en/futures/BTCUSDT
            return isSpot
                ? `https://www.binance.com/en/trade/${s}_USDT?type=spot`
                : `https://www.binance.com/en/futures/${s}USDT`;

        case 'bybit':
            // Spot: https://www.bybit.com/trade/spot/BTC/USDT
            // Perp: https://www.bybit.com/trade/usdt/BTCUSDT
            return isSpot
                ? `https://www.bybit.com/trade/spot/${s}/USDT`
                : `https://www.bybit.com/trade/usdt/${s}USDT`;

        case 'okx':
            // Spot: https://www.okx.com/trade-spot/btc-usdt
            // Perp: https://www.okx.com/trade-swap/btc-usdt-swap
            return isSpot
                ? `https://www.okx.com/trade-spot/${s.toLowerCase()}-usdt`
                : `https://www.okx.com/trade-swap/${s.toLowerCase()}-usdt-swap`;

        case 'gate':
            // Spot: https://www.gate.io/trade/BTC_USDT
            // Perp: https://www.gate.io/trade/BTC_USDT
            return isSpot
                ? `https://www.gate.io/trade/${s}_USDT`
                : `https://www.gate.io/futures/USDT/${s}_USDT`;

        case 'mexc':
            // Spot: https://www.mexc.com/exchange/BTC_USDT
            // Perp: https://futures.mexc.com/exchange/BTC_USDT
            return isSpot
                ? `https://www.mexc.com/exchange/${s}_USDT`
                : `https://futures.mexc.com/exchange/${s}_USDT`;

        case 'bitget':
            // Spot: https://www.bitget.com/spot/BTCUSDT
            // Perp: https://www.bitget.com/futures/usdt/BTCUSDT
            return isSpot
                ? `https://www.bitget.com/spot/${s}USDT`
                : `https://www.bitget.com/futures/usdt/${s}USDT`;

        default:
            return '#';
    }
};