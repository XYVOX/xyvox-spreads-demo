package xyvoxspreads.com.corebackend.service;

import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import xyvoxspreads.com.corebackend.exception.UserAlreadyExistsException;
import xyvoxspreads.com.corebackend.model.User;
import xyvoxspreads.com.corebackend.model.dto.AuthResponse;
import xyvoxspreads.com.corebackend.model.dto.LoginRequest;
import xyvoxspreads.com.corebackend.model.dto.RegisterRequest;
import xyvoxspreads.com.corebackend.model.enums.Role;
import xyvoxspreads.com.corebackend.repository.UserRepository;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;

    private static final String DEFAULT_SETTINGS = "{\"minSpread\":0.1,\"minFunding\":0.0001,\"soundEnabled\":false,\"hiddenCoins\":[],\"hiddenExchanges\":[],\"alertSpread\":5.0}";

    public void register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.email())) {
            throw new UserAlreadyExistsException("Email already in use");
        }

        User user = new User();
        user.setEmail(request.email());
        user.setPassword(passwordEncoder.encode(request.password()));
        user.setRole(Role.ROLE_USER);
        user.setSettingsJson(DEFAULT_SETTINGS);
        userRepository.save(user);
    }

    public AuthResponse login(LoginRequest request) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        request.email(),
                        request.password()
                )
        );

        var user = userRepository.findByEmail(request.email()).orElseThrow();

        var jwtToken = jwtService.generateToken(user);

        return new AuthResponse(jwtToken);
    }

}
