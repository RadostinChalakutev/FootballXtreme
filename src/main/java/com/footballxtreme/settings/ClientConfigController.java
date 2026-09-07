package com.footballxtreme.settings;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/config")
public class ClientConfigController {

    private final ClientConfig clientConfig;

    public ClientConfigController(ClientConfig clientConfig) {
        this.clientConfig = clientConfig;
    }

    @GetMapping
    public Map<String, String> getConfig() {
        return Map.of(
                "name", clientConfig.getName(),
                "shortName", clientConfig.getShortName(),
                "phone", clientConfig.getPhone(),
                "email", clientConfig.getEmail(),
                "address", clientConfig.getAddress(),
                "language", clientConfig.getLanguage(),
                "currency", clientConfig.getCurrency()
        );
    }
}