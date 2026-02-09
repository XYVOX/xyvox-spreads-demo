package xyvoxspreads.com.corebackend.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import xyvoxspreads.com.corebackend.model.dto.CoinAnalysis;

import java.util.List;

@Slf4j
@Service
public class MarketBroadcastService {

    private final ArbitrageService arbitrageService;
    private final SimpMessagingTemplate messagingTemplate;

    public MarketBroadcastService(ArbitrageService arbitrageService, SimpMessagingTemplate messagingTemplate) {
        this.arbitrageService = arbitrageService;
        this.messagingTemplate = messagingTemplate;
    }

    @Scheduled(fixedRate = 500)
    public void broadcastMarketSnapshot() {

        List<CoinAnalysis> snapshot = arbitrageService.calculateMarketSnapshot();

        if(snapshot.isEmpty()) {
            return;
        }

        messagingTemplate.convertAndSend("/topic/spreads", snapshot);

    }
}
