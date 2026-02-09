package xyvoxspreads.com.corebackend.controller;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.stereotype.Controller;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;
import xyvoxspreads.com.corebackend.service.ArbitrageService;

@Slf4j
@Controller
@RequiredArgsConstructor
public class IngestController {

    private final ArbitrageService arbitrageService;
    private final ObjectMapper objectMapper;

    @MessageMapping("/ingest")
    public void handleMarketData(String payload) {
        try {
            JsonNode node = objectMapper.readTree(payload);

            String exchange = node.path("exchange").asString();
            String marketType = node.path("type").asString("SPOT");
            String symbol = node.path("symbol").asString();

            double bid = node.path("bid").asDouble(0.0);
            double ask = node.path("ask").asDouble(0.0);

            double bidQty = node.path("bidQty").asDouble(0.0);
            double askQty = node.path("askQty").asDouble(0.0);


            double markPrice = (bid + ask) / 2;

            arbitrageService.updatePrice(exchange, marketType, symbol, bid, ask, bidQty, askQty, markPrice);

        } catch (Exception e) {
        }
    }
}