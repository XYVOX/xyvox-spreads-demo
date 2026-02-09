
export function extractContractAddress(networkData) {
    if (!networkData || !networkData.info) return null;
    const info = networkData.info;
    return info.contractAddress || info.contract_address || info.addr || info.address || null;
}

export function getStandardFundingTime(fr) {
    return fr.nextFundingTimestamp
        || fr.fundingTimestamp
        || (fr.info && fr.info.nextFundingTime ? parseInt(fr.info.nextFundingTime) : null);
}

function parseFeeData(data) {
    if (!data) return null;

    if (data.info && data.info.futures_taker_fee) {
        return {
            taker: parseFloat(data.info.futures_taker_fee),
            maker: parseFloat(data.info.futures_maker_fee || data.info.futures_taker_fee)
        };
    }

    return {
        taker: parseFloat(data.taker),
        maker: parseFloat(data.maker)
    };
}

export function resolveFee(tradingFees, symbol) {
    const spotKey = `${symbol}/USDT`;
    const linearKey = `${symbol}/USDT:USDT`;

    if (tradingFees[linearKey]) {
        return parseFeeData(tradingFees[linearKey]);
    }

    if (tradingFees[spotKey]) {
        return parseFeeData(tradingFees[spotKey]);
    }


    if (tradingFees['BTC/USDT:USDT']) {
        return parseFeeData(tradingFees['BTC/USDT:USDT']);
    }
    if (tradingFees['BTC/USDT']) {
        return parseFeeData(tradingFees['BTC/USDT']);
    }


    return { taker: 0.001, maker: 0.0005 };
}

export function parseWithdrawFee(networkData, exchangeId) {
    if (!networkData || !networkData.info) return 0;

    const info = networkData.info;

    let fee = info.withdrawFee || info.withdraw_fee || info.fee;

    if (exchangeId === 'gate') {
        if (info.withdraw_fix_on_chain) fee = info.withdraw_fix_on_chain;
        if (info.ask_fixed_rate) fee = info.ask_fixed_rate;
    }

    if (fee === "" || fee === null || fee === undefined) return 0;

    const parsed = parseFloat(fee);
    return isNaN(parsed) ? 0 : parsed;
}