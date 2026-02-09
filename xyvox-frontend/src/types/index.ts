export interface ArbitrageOpportunity {
    id?: string;

    buyExchange: string;
    buyType: 'SPOT' | 'PERP' | 'FUTURE' | 'SWAP';
    buyPrice: number;
    buyMarkPrice: number;
    buyFeeTaker: number;

    sellExchange: string;
    sellType: 'SPOT' | 'PERP' | 'FUTURE' | 'SWAP';
    sellPrice: number;
    sellMarkPrice: number;
    sellFeeTaker: number;

    grossSpreadPct: number;
    netSpreadPct: number;

    fundingRateBuy?: number | null;
    fundingRateSell?: number | null;
    nextFundingTime?: number;

    networksMatch: boolean;
    commonNetworks: string[];

    buyWithdrawEnabled: boolean;
    buyDepositEnabled: boolean;
    sellWithdrawEnabled: boolean;
    sellDepositEnabled: boolean;

    transferFeeUsd?: number;
    maxVolumeUsd?: number;

    buyLiquidityUsd?: number;
    sellLiquidityUsd?: number;

    startedAt?: number;
    durationSeconds?: number;


}

export interface CoinAnalysis {
    symbol: string;

    bestSpreadPerpPerp: number;
    bestSpreadSpotPerp: number;
    bestSpreadSpotSpot: number;

    opportunities: ArbitrageOpportunity[];
}

export interface ExchangePrice {
    price: number;
    type: 'SPOT' | 'PERP';
    fundingRate?: number | null;
    canWithdraw?: boolean;
    canDeposit?: boolean;
}

export interface MatrixRow {
    id: string;
    symbol: string;
    bestOpp: ArbitrageOpportunity;
    prices: Record<string, ExchangePrice>;
}

export interface WorkerOutput {
    spotSpot: MatrixRow[];
    spotPerp: MatrixRow[];
    perpPerp: MatrixRow[];
    funding: MatrixRow[];
    timestamp: number;
}

export interface AlertData {
    id: string;
    symbol: string;
    spread: number;
    buyEx: string;
    sellEx: string;
    type: 'SPREAD' | 'FUNDING';
}