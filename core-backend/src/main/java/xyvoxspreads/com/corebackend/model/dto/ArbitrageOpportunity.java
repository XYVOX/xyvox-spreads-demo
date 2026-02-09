package xyvoxspreads.com.corebackend.model.dto;

import java.util.List;

public record ArbitrageOpportunity (

        String buyExchange,
        String buyType,
        double buyPrice,
        double buyMarkPrice,
        double buyFeeTaker,

        String sellExchange,
        String sellType,
        double sellPrice,
        double sellMarkPrice,
        double sellFeeTaker,

        double grossSpreadPct,
        double netSpreadPct,

        Double fundingRateBuy,
        Double fundingRateSell,
        Long nextFundingTime,

        boolean networksMatch,
        List<String> commonNetworks,

        boolean buyWithdrawEnabled,
        boolean buyDepositEnabled,

        boolean sellWithdrawEnabled,
        boolean sellDepositEnabled,

        Double transferFeeUsd,
        Double maxVolumeUsd,

        Double buyLiquidityUsd,
        Double sellLiquidityUsd,

        Long startedAt,
        Long durationSeconds
) {}
