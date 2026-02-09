import type { CoinAnalysis, MatrixRow, WorkerOutput, ExchangePrice, ArbitrageOpportunity } from '../types';

interface FilterConfig {
    minSpread: number;
    minFunding: number;
    hiddenCoins: string[];
    hiddenExchanges: string[];
}

const processData = (raw: CoinAnalysis[], config: FilterConfig): WorkerOutput => {
    const result: WorkerOutput = {
        spotSpot: [],
        spotPerp: [],
        perpPerp: [],
        funding: [],
        timestamp: Date.now()
    };

    const hiddenCoinsSet = new Set(config.hiddenCoins);
    const hiddenExchangesSet = new Set(config.hiddenExchanges || []);

    for (const coin of raw) {
        if (hiddenCoinsSet.has(coin.symbol)) continue;

        const groups = {
            spotSpot: [] as ArbitrageOpportunity[],
            spotPerp: [] as ArbitrageOpportunity[],
            perpPerp: [] as ArbitrageOpportunity[],
            funding: [] as ArbitrageOpportunity[]
        };

        const priceMap: Record<string, ExchangePrice> = {};

        for (const opp of coin.opportunities) {
            if (hiddenExchangesSet.has(opp.buyExchange) || hiddenExchangesSet.has(opp.sellExchange)) {
                continue;
            }

            if (!priceMap[opp.buyExchange]) {
                priceMap[opp.buyExchange] = {
                    price: opp.buyPrice,
                    type: opp.buyType as 'SPOT' | 'PERP',
                    fundingRate: opp.buyType !== 'SPOT' ? opp.fundingRateBuy : undefined,
                    canWithdraw: opp.buyWithdrawEnabled,
                    canDeposit: opp.buyDepositEnabled
                };
            }
            if (!priceMap[opp.sellExchange]) {
                priceMap[opp.sellExchange] = {
                    price: opp.sellPrice,
                    type: opp.sellType as 'SPOT' | 'PERP',
                    fundingRate: opp.sellType !== 'SPOT' ? opp.fundingRateSell : undefined,
                    canWithdraw: opp.sellWithdrawEnabled,
                    canDeposit: opp.sellDepositEnabled
                };
            }


            if (opp.netSpreadPct < config.minSpread && opp.buyType === 'SPOT' && opp.sellType === 'SPOT') continue;

            const isSpotSpot = opp.buyType === 'SPOT' && opp.sellType === 'SPOT';
            const isSpotPerp = (opp.buyType === 'SPOT' || opp.sellType === 'SPOT') && opp.buyType !== opp.sellType;
            const isPerpStrategy = opp.buyType !== 'SPOT' && opp.sellType !== 'SPOT';

            if (isSpotSpot) {
                if (opp.netSpreadPct >= config.minSpread) groups.spotSpot.push(opp);
            }
            else if (isSpotPerp) {
                if (Math.abs(opp.netSpreadPct) >= config.minSpread) groups.spotPerp.push(opp);
            }
            else if (isPerpStrategy) {
                if (opp.grossSpreadPct >= config.minSpread) groups.perpPerp.push(opp);

                const netYield = ((opp.fundingRateBuy || 0) * -1) + (opp.fundingRateSell || 0);
                if (netYield >= config.minFunding) groups.funding.push(opp);
            }
        }

        const createRow = (opps: ArbitrageOpportunity[], sortFn: (a: any, b: any) => number): MatrixRow | null => {
            if (opps.length === 0) return null;
            opps.sort(sortFn);
            const best = opps[0];
            best.id = `${coin.symbol}-${best.buyExchange}-${best.sellExchange}`;

            return {
                id: best.id,
                symbol: coin.symbol,
                bestOpp: best,
                prices: priceMap
            };
        };

        const rowSS = createRow(groups.spotSpot, (a, b) => b.netSpreadPct - a.netSpreadPct);
        if (rowSS) result.spotSpot.push(rowSS);

        const rowSP = createRow(groups.spotPerp, (a, b) => Math.abs(b.netSpreadPct) - Math.abs(a.netSpreadPct));
        if (rowSP) result.spotPerp.push(rowSP);

        const rowPP = createRow(groups.perpPerp, (a, b) => b.grossSpreadPct - a.grossSpreadPct);
        if (rowPP) result.perpPerp.push(rowPP);

        const rowF = createRow(groups.funding, (a, b) => {
            const getYield = (o: ArbitrageOpportunity) => ((o.fundingRateBuy || 0) * -1) + (o.fundingRateSell || 0);
            return getYield(b) - getYield(a);
        });
        if (rowF) result.funding.push(rowF);
    }

    result.spotSpot.sort((a, b) => b.bestOpp.netSpreadPct - a.bestOpp.netSpreadPct);
    result.spotPerp.sort((a, b) => Math.abs(b.bestOpp.netSpreadPct) - Math.abs(a.bestOpp.netSpreadPct));
    result.perpPerp.sort((a, b) => b.bestOpp.grossSpreadPct - a.bestOpp.grossSpreadPct);
    result.funding.sort((a, b) => {
        const getYield = (o: ArbitrageOpportunity) => ((o.fundingRateBuy || 0) * -1) + (o.fundingRateSell || 0);
        return getYield(b.bestOpp) - getYield(a.bestOpp);
    });

    return result;
};

self.onmessage = (e: MessageEvent) => {
    const { data, config } = e.data;
    if (!data) return;
    const processed = processData(data, config || { minSpread: 0, minFunding: 0, hiddenCoins: [], hiddenExchanges: [] });
    self.postMessage(processed);
};