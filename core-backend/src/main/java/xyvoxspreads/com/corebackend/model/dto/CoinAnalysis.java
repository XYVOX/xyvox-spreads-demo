package xyvoxspreads.com.corebackend.model.dto;

import java.util.List;

public record CoinAnalysis (
    String symbol,

    double bestSpreadPerpPerp,
    double bestSpreadSpotPerp,
    double bestSpreadSpotSpot,

    List<ArbitrageOpportunity> opportunities
) {}
