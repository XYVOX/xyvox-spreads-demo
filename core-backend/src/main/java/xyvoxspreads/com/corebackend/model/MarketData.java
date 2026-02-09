package xyvoxspreads.com.corebackend.model;

import com.fasterxml.jackson.annotation.JsonProperty;

import java.io.Serializable;

public record MarketData (
        @JsonProperty("ex") String exchange,
        @JsonProperty("mt") String marketType,
        @JsonProperty("s") String symbol,
        @JsonProperty("b") Double bid,
        @JsonProperty("a") Double ask,
        @JsonProperty("bl") Double bidLiquidity,
        @JsonProperty("al") Double askLiquidity,
        @JsonProperty("mp") Double markPrice,
        @JsonProperty("ts") Long timestamp,
        @JsonProperty("sys_ts") Long systemTimestamp
) implements Serializable {}
