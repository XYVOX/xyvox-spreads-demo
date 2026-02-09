package xyvoxspreads.com.corebackend.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import xyvoxspreads.com.corebackend.model.PriceSnapshot;
import xyvoxspreads.com.corebackend.model.dto.ArbitrageOpportunity;
import xyvoxspreads.com.corebackend.model.dto.CoinAnalysis;

import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

/**
 * [PORTFOLIO DEMO NOTE]
 * ===================================================================================
 * This service is the core engine for detecting arbitrage opportunities.
 *
 * IN PRODUCTION:
 * - Implements O(n^2) cross-exchange analysis.
 * - Uses graph algorithms (Bellman-Ford) for complex triangular arbitrage.
 * - Validates network compatibility (TRC20 vs ERC20) via dynamic metadata.
 * - Calculates real-time transfer fees and slippage risks.
 *
 * IN THIS DEMO:
 * - The proprietary matching algorithms have been simplified to basic comparison.
 * - A stochastic "Demo Boost" factor is applied to ensure the UI displays
 * active opportunities for visualization purposes, even when using mock market data.
 * ===================================================================================
 */

@Slf4j
@Service
public class ArbitrageService {

    private final MetadataService metadataService;
    private final Map<String, Map<String, PriceSnapshot>> priceCache = new ConcurrentHashMap<>();
    private final Map<String, Long> spreadStartTimes = new ConcurrentHashMap<>();

    // Demo thresholds to keep the UI populated
    private static final double MIN_SPREAD_TO_INCLUDE = 0.1;
    private static final long STALE_PRICE_THRESHOLD_MS = 10000;

    public ArbitrageService(MetadataService metadataService) {
        this.metadataService = metadataService;
    }

    /**
     * Periodic cleanup of stale market data to prevent "ghost" opportunities.
     */
    @Scheduled(fixedRate = 1000)
    public void cleanupStalePrices() {
        long now = System.currentTimeMillis();
        Iterator<Map.Entry<String, Map<String, PriceSnapshot>>> it = priceCache.entrySet().iterator();
        while (it.hasNext()) {
            Map.Entry<String, Map<String, PriceSnapshot>> entry = it.next();
            Map<String, PriceSnapshot> sources = entry.getValue();
            if (sources != null) {
                sources.values().removeIf(snapshot -> (now - snapshot.timestamp()) > STALE_PRICE_THRESHOLD_MS);
                if (sources.isEmpty()) {
                    it.remove();
                    spreadStartTimes.keySet().removeIf(k -> k.startsWith(entry.getKey() + ":"));
                }
            }
        }
    }

    /**
     * Ingests real-time price updates (from Redis/WebSocket stream).
     */
    public void updatePrice(String exchange, String type, String symbol, double bid, double ask, double bidQty, double askQty, double markPrice) {
        String sourceKey = exchange + ":" + type;
        priceCache.computeIfAbsent(symbol, k -> new ConcurrentHashMap<>())
                .put(sourceKey, new PriceSnapshot(bid, ask, bidQty, askQty, markPrice, type, System.currentTimeMillis()));
    }

    /**
     * Generates the market snapshot for the frontend dashboard.
     */
    public List<CoinAnalysis> calculateMarketSnapshot() {
        // [DEMO] Skip check or strictly mock metadata readiness
        // if(!metadataService.isReady()) return Collections.emptyList();

        List<CoinAnalysis> result = new ArrayList<>();
        Set<String> allSymbols = new HashSet<>(priceCache.keySet());

        for (String symbol : allSymbols) {
            Map<String, PriceSnapshot> sources = priceCache.get(symbol);
            if (sources == null || sources.size() < 2) continue;

            // [DEMO] Simplified logic call
            List<ArbitrageOpportunity> opportunities = findDemoOpportunities(symbol, sources);
            if (opportunities.isEmpty()) continue;

            // Logic to determine best spread types (Spot-Spot, Spot-Perp, Perp-Perp)
            double maxPerpPerp = 0.0;
            double maxSpotPerp = 0.0;
            double maxSpotSpot = 0.0;

            for (ArbitrageOpportunity opp : opportunities) {
                boolean buyIsSpot = "SPOT".equals(opp.buyType());
                boolean sellIsSpot = "SPOT".equals(opp.sellType());
                double spread = opp.netSpreadPct();

                if (!buyIsSpot && !sellIsSpot) {
                    if(spread > maxPerpPerp) maxPerpPerp = spread;
                } else if (buyIsSpot && sellIsSpot) {
                    if(spread > maxSpotSpot) maxSpotSpot = spread;
                } else {
                    if(spread > maxSpotPerp) maxSpotPerp = spread;
                }
            }

            opportunities.sort(Comparator.comparingDouble(ArbitrageOpportunity::netSpreadPct).reversed());
            result.add(new CoinAnalysis(symbol, maxPerpPerp, maxSpotPerp, maxSpotSpot, opportunities));
        }

        // Sort by most profitable opportunities to keep the dashboard interesting
        result.sort(Comparator.comparingDouble(CoinAnalysis::bestSpreadPerpPerp).reversed());
        return result;
    }

    /**
     * [PORTFOLIO STUB]
     * Replaces the complex 'findOpportunitiesForSymbol' method.
     * Uses simplified math + a random boost factor to demonstrate the UI capabilities.
     */
    private List<ArbitrageOpportunity> findDemoOpportunities(String symbol, Map<String, PriceSnapshot> sources) {
        List<ArbitrageOpportunity> opps = new ArrayList<>();
        List<String> keys = new ArrayList<>(sources.keySet());

        for (int i = 0; i < keys.size(); i++) {
            for (int j = 0; j < keys.size(); j++) {
                if (i == j) continue;

                String keyA = keys.get(i); // Buy Source
                String keyB = keys.get(j); // Sell Source

                PriceSnapshot pA = sources.get(keyA);
                PriceSnapshot pB = sources.get(keyB);
                if (pA == null || pB == null) continue;

                // [DEMO] Basic spread calculation
                double rawSpread = ((pB.bid() - pA.ask()) / pA.ask()) * 100;

                // [DEMO TRICK] Inject artificial volatility to ensure some pairs show positive spread
                // This simulates "finding" an opportunity without needing real market inefficiencies.
                double demoBoost = (symbol.hashCode() % 10 == 0) ? (Math.random() * 1.5) : 0.0;
                double finalSpread = rawSpread + demoBoost;

                if (finalSpread > MIN_SPREAD_TO_INCLUDE) {
                    String[] partsA = keyA.split(":");
                    String[] partsB = keyB.split(":");

                    opps.add(buildDemoOpportunity(
                            partsA[0], partsA[1], pA,
                            partsB[0], partsB[1], pB,
                            finalSpread, symbol
                    ));
                }
            }
        }
        return opps;
    }

    /**
     * Constructs the DTO. In a real app, this calculates precise fees and network costs.
     * In this demo, it uses static or simplified values.
     */
    private ArbitrageOpportunity buildDemoOpportunity(
            String exBuy, String typeBuy, PriceSnapshot pBuy,
            String exSell, String typeSell, PriceSnapshot pSell,
            double netSpread, String symbol
    ) {
        // [DEMO] Mocking fees
        double feeBuy = 0.1;
        double feeSell = 0.1;

        // Funding Rates (Mocked via MetadataService which reads from our Mock Node.js ingest)
        Double fundingRateBuy = metadataService.getFundingRate(exBuy, symbol);
        Double fundingRateSell = metadataService.getFundingRate(exSell, symbol);

        // Duration tracking for UI "Age" column
        String spreadKey = String.format("%s:%s-%s:%s-%s", symbol, exBuy, typeBuy, exSell, typeSell);
        spreadStartTimes.putIfAbsent(spreadKey, System.currentTimeMillis());
        Long durationSeconds = (System.currentTimeMillis() - spreadStartTimes.get(spreadKey)) / 1000;

        return new ArbitrageOpportunity(
                exBuy, typeBuy.toUpperCase(), pBuy.ask(), pBuy.markPrice(), feeBuy,
                exSell, typeSell.toUpperCase(), pSell.bid(), pSell.markPrice(), feeSell,
                netSpread + 0.2, // Gross
                netSpread,       // Net
                fundingRateBuy != null ? fundingRateBuy : 0.0001,
                fundingRateSell != null ? fundingRateSell : 0.0001,
                System.currentTimeMillis() + 3600000, // Next funding in 1h
                true, // Networks match
                Collections.singletonList("TRC20"), // Mock network
                true, true, true, true, // Withdraw/Deposit enabled
                1.0, // Transfer fee
                50000.0, // Max position limit
                pBuy.ask() * pBuy.askQty(), // Liquidity
                pSell.bid() * pSell.bidQty(),
                spreadStartTimes.get(spreadKey),
                durationSeconds
        );
    }
}