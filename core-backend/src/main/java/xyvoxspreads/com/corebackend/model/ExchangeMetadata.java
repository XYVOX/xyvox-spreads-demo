package xyvoxspreads.com.corebackend.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

import java.util.Map;

@JsonIgnoreProperties(ignoreUnknown=true)
public record ExchangeMetadata (
        @JsonProperty("s") String symbol,
        @JsonProperty("w") WalletInfo wallet,
        @JsonProperty("f") FuturesInfo futures,
        @JsonProperty("fees") FeeInfo fees,
        @JsonProperty("ts") Long timestamp
) {

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record WalletInfo (
            boolean deposit,
            boolean withdraw,
            Map<String, NetworkDetail> networks
    ) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record  NetworkDetail (
            boolean deposit,
            boolean withdraw,
            String contractAddress,
            Double withdrawFee
    ) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record FuturesInfo (
            Double maxCost,
            Double fundingRate,
            Long nextFundingTime
    ) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record FeeInfo (
            Double taker,
            Double maker
    ) {}
}


