package xyvoxspreads.com.corebackend.controller;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import tools.jackson.databind.ObjectMapper;
import xyvoxspreads.com.corebackend.model.User;
import xyvoxspreads.com.corebackend.repository.UserRepository;

import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/user")
@RequiredArgsConstructor
public class UserController {

    private final UserRepository userRepository;
    private final ObjectMapper objectMapper;

    @GetMapping("/settings")
    public ResponseEntity<String> getSettings(@AuthenticationPrincipal UserDetails userDetails) {
        User user = userRepository.findByEmail(userDetails.getUsername()).orElseThrow();

        String settings = user.getSettingsJson();
        return ResponseEntity.ok(settings != null ? settings : "{}");
    }

    @PutMapping("/settings")
    public ResponseEntity<?> updateSettings(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestBody Map<String, Object> settingsMap
    ) {
        try {
            User user = userRepository.findByEmail(userDetails.getUsername()).orElseThrow();

            String settingsJson = objectMapper.writeValueAsString(settingsMap);

            user.setSettingsJson(settingsJson);
            userRepository.save(user);

            return ResponseEntity.ok().build();
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Invalid settings format");
        }
    }
}
