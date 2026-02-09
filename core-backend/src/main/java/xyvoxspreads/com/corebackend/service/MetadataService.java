package xyvoxspreads.com.corebackend.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import tools.jackson.core.type.TypeReference;
import tools.jackson.databind.ObjectMapper;
import xyvoxspreads.com.corebackend.model.ExchangeMetadata;

import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

@Slf4j
@Service
public class MetadataService {

    private final StringRedisTemplate redisTemplate;
    private final ObjectMapper objectMapper;

    // Exchange -> Symbol -> Metadata
    // cache.get("binance").get("BTC")
    private final Map<String, Map<String, ExchangeMetadata>> metadataCache = new ConcurrentHashMap<>();
    private Map<String, Map<String, String>> identityCache = new ConcurrentHashMap<>();
    private Map<String, String> cgMap = new ConcurrentHashMap<>();
    private static final Map<String, String> NETWORK_ALIASES = new HashMap<>();

    static {
        NETWORK_ALIASES.put("eth", "eth");
        NETWORK_ALIASES.put("erc20", "eth");
        NETWORK_ALIASES.put("ethereum", "eth");

        NETWORK_ALIASES.put("trx", "trx");
        NETWORK_ALIASES.put("trc20", "trx");
        NETWORK_ALIASES.put("tron", "trx");

        NETWORK_ALIASES.put("bsc", "bsc");
        NETWORK_ALIASES.put("bep20", "bsc");
        NETWORK_ALIASES.put("bsc (bep20)", "bsc");

        NETWORK_ALIASES.put("sol", "sol");
        NETWORK_ALIASES.put("solana", "sol");

        NETWORK_ALIASES.put("matic", "matic");
        NETWORK_ALIASES.put("polygon", "matic");
        NETWORK_ALIASES.put("erc20 (polygon)", "matic");

        NETWORK_ALIASES.put("arbitrum", "arb");
        NETWORK_ALIASES.put("arbone", "arb");
        NETWORK_ALIASES.put("arb", "arb");

        NETWORK_ALIASES.put("optimism", "op");
        NETWORK_ALIASES.put("op", "op");

        NETWORK_ALIASES.put("avax", "avax");
        NETWORK_ALIASES.put("avaxc", "avax");
        NETWORK_ALIASES.put("c-chain", "avax");
    }

    private final Map<String, Long> logCooldownMap = new ConcurrentHashMap<>();

    private volatile boolean isReady = false;

    private final String[] EXCHANGES = {"binance", "bybit", "bitget", "gate", "mexc", "okx"};

    public MetadataService(StringRedisTemplate redisTemplate, ObjectMapper objectMapper) {
        this.redisTemplate = redisTemplate;
        this.objectMapper = objectMapper;
    }

    @Scheduled(fixedRate = 60000)
    public void refreshMetadata() {
        for (String exchange : EXCHANGES) {
            loadExchangeData(exchange);
        }
        refreshIdentityMap();
        refreshCgMap();
    }

    public void refreshIdentityMap() {
        String json = redisTemplate.opsForValue().get("meta:identity-map");
        if (json != null) {
            try {
                identityCache = objectMapper.readValue(json, new TypeReference<Map<String, Map<String, String>>>() {});
            } catch (Exception e) {
            }
        }
    }

    private void refreshCgMap() {
        String json = redisTemplate.opsForValue().get("meta:cg-map");
        if (json != null) {
            try {
                Map<String, String> loadedMap = objectMapper.readValue(json, new TypeReference<Map<String, String>>() {});

                if (!loadedMap.isEmpty()) {
                    this.cgMap = loadedMap;
                    this.isReady = true;
                }
            } catch (Exception e) {
                this.isReady = false;
            }
        } else {
            this.isReady = false;
        }
    }

    private String normalizeNetwork(String rawName) {
        if (rawName == null) return "";
        String lower = rawName.toLowerCase().trim();
        return NETWORK_ALIASES.getOrDefault(lower, lower);
    }

    public boolean areCoinsIdentical(String symbol, String exA, String exB) {
        String keyA = exA.toLowerCase() + ":" + symbol;
        String keyB = exB.toLowerCase() + ":" + symbol;

        String idA = cgMap.get(keyA);
        String idB = cgMap.get(keyB);

        if (idA != null && idB != null) {
            if (!idA.equals(idB)) {
                String errorKey = symbol + ":" + exA + ":" + exB;
                long now = System.currentTimeMillis();
                long lastLogTime = logCooldownMap.getOrDefault(errorKey, 0L);

                if (now - lastLogTime > 1800000) {
                    logCooldownMap.put(errorKey, now);
                }

                return false;
            }
            return true;
        }

        if (identityCache.isEmpty()) return true;

        Map<String, String> identities = identityCache.get(symbol);
        if (identities == null) return false;

        String nameA = identities.get(exA.toLowerCase());
        String nameB = identities.get(exB.toLowerCase());

        if (nameA == null || nameB == null) return false;

        return nameA.equals(nameB);
    }

    private void loadExchangeData(String exchange) {
        String key = "meta:info:" + exchange;
        String json = redisTemplate.opsForValue().get(key);

        if (json != null) {
            try {
                Map<String, ExchangeMetadata> data = objectMapper.readValue(
                        json,
                        new TypeReference<HashMap<String, ExchangeMetadata>>() {}
                );

                metadataCache.put(exchange, data);
            } catch (Exception e) {
            }
        }
    }



    private ExchangeMetadata getMetadata(String sourceExchange, String symbol) {
        if (!metadataCache.containsKey(sourceExchange)) return null;
        return metadataCache.get(sourceExchange).get(symbol);
    }

    public double getTakerFee(String exchange, String symbol, String type) {
        ExchangeMetadata meta = getMetadata(exchange, symbol);
        double defaultFee = 0.001;
        if (meta == null || meta.fees() == null) return defaultFee;

        Double fee = meta.fees().taker();
        return fee != null ? fee : defaultFee;
    }

    public Double getMaxPositionCost(String exchange, String symbol) {
        if (!metadataCache.containsKey(exchange)) return null;
        ExchangeMetadata meta = metadataCache.get(exchange).get(symbol);
        if (meta == null || meta.futures() == null) return null;

        return meta.futures().maxCost();
    }

    public Double getFundingRate(String exchange, String symbol) {
        if (!metadataCache.containsKey(exchange)) return null;
        ExchangeMetadata meta = metadataCache.get(exchange).get(symbol);
        if (meta == null || meta.futures() == null) return null;

        return meta.futures().fundingRate();
    }

    public Long getNextFundingTime(String exchange, String symbol) {
        if (!metadataCache.containsKey(exchange)) return null;
        ExchangeMetadata meta = metadataCache.get(exchange).get(symbol);
        if (meta == null || meta.futures() == null) return null;
        return meta.futures().nextFundingTime();
    }

    public double getNetworkWithdrawFee(String exchange, String symbol, String network) {
        if (!metadataCache.containsKey(exchange)) return 0.0;

        ExchangeMetadata meta = metadataCache.get(exchange).get(symbol);
        if (meta == null || meta.wallet() == null || meta.wallet().networks() == null) return 0.0;

        var netInfo = meta.wallet().networks().get(network);
        if (netInfo == null || netInfo.withdrawFee() == null) return 0.0;

        return netInfo.withdrawFee();
    }

    public List<String> findCommonNetworks(String sourceExchange, String targetExchange, String symbol) {
        ExchangeMetadata sourceMeta = getMetadata(sourceExchange, symbol);
        ExchangeMetadata targetMeta = getMetadata(targetExchange, symbol);

        if (sourceMeta == null || targetMeta == null ||
                sourceMeta.wallet() == null || targetMeta.wallet() == null) {
            return Collections.emptyList();
        }

        var sourceNetworks = sourceMeta.wallet().networks();
        var targetNetworks = targetMeta.wallet().networks();

        if (sourceNetworks == null || targetNetworks == null) return Collections.emptyList();

        Set<String> targetCanonicalNames = targetNetworks.entrySet().stream()
                .filter(e -> e.getValue().deposit()) // Цель должна принимать депозит
                .map(e -> normalizeNetwork(e.getKey()))
                .collect(Collectors.toSet());

        List<String> validSourceNetworks = new ArrayList<>();

        for (var entry : sourceNetworks.entrySet()) {
            String rawNetName = entry.getKey();
            var details = entry.getValue();

            if (!details.withdraw()) continue;

            String canonical = normalizeNetwork(rawNetName);

            if (targetCanonicalNames.contains(canonical)) {
                validSourceNetworks.add(rawNetName);
            }
        }

        validSourceNetworks.sort((net1, net2) -> {
            double fee1 = getNetworkWithdrawFee(sourceExchange, symbol, net1);
            double fee2 = getNetworkWithdrawFee(sourceExchange, symbol, net2);
            return Double.compare(fee1, fee2);
        });

        return validSourceNetworks;
    }

    public boolean isWithdrawalEnabled(String exchange, String symbol) {
        if (!metadataCache.containsKey(exchange)) return true;

        ExchangeMetadata meta = metadataCache.get(exchange).get(symbol);
        if (meta == null || meta.wallet() == null) return true;

        return meta.wallet().withdraw();
    }

    public boolean isDepositEnabled(String exchange, String symbol) {
        if (!metadataCache.containsKey(exchange)) return true;
        ExchangeMetadata meta = metadataCache.get(exchange).get(symbol);
        if (meta == null || meta.wallet() == null) return true;

        return meta.wallet().deposit();
    }

    public boolean isReady() {
        return isReady;
    }
}