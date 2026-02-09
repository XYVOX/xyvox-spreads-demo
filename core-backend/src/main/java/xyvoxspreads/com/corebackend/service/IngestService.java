package xyvoxspreads.com.corebackend.service;


import lombok.NonNull;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.connection.stream.MapRecord;
import org.springframework.data.redis.stream.StreamListener;
import org.springframework.stereotype.Service;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

@Slf4j
@Service
public class IngestService implements StreamListener<String, @NonNull MapRecord<String, String, String>> {

    private final ObjectMapper objectMapper;
    private final ArbitrageService arbitrageService;

    public IngestService(ObjectMapper objectMapper, ArbitrageService arbitrageService) {
        this.objectMapper = objectMapper;
        this.arbitrageService = arbitrageService;
    }

    @Override
    public void onMessage(MapRecord<String, String, String> message) {
        try {
            String json = message.getValue().get("data");
            if (json == null) return;

            JsonNode node = objectMapper.readTree(json);

            String exchange = node.path("ex").asString();
            String marketType = node.path("mt").asString("spot");
            String symbol = node.path("s").asString();
            double bid = node.path("b").asDouble(0.0);
            double ask = node.path("a").asDouble(0.0);

            double bidQty = node.path("bl").asDouble(0.0);
            double askQty = node.path("al").asDouble(0.0);

            double markPrice = node.path("mp").asDouble(0.0);

            arbitrageService.updatePrice(exchange, marketType, symbol, bid, ask, bidQty, askQty, markPrice);
        } catch (Exception e) {
        }
    }

}
