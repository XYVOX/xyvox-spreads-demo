package xyvoxspreads.com.corebackend.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.stream.StreamMessageListenerContainer;
import org.springframework.data.redis.stream.Subscription;
import xyvoxspreads.com.corebackend.service.IngestService;

import java.time.Duration;

@Configuration
public class RedisStreamConfig {

    private final String STREAM_KEY = "market:agg";

    @Bean
    public Subscription subscription(RedisConnectionFactory redisConnectionFactory,
                                     IngestService streamListener){

        var options = StreamMessageListenerContainer
                .StreamMessageListenerContainerOptions.builder()
                .pollTimeout(Duration.ofMillis(100)).build();

        var container = StreamMessageListenerContainer.create(redisConnectionFactory, options);

        var subscription = container.receive(
                org.springframework.data.redis.connection.stream.StreamOffset.latest(STREAM_KEY),
                streamListener
        );

        container.start();

        return subscription;
    }
}
