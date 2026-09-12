package com.footballxtreme.settings;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
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

        Map<String, String> config = new HashMap<>();

        config.put("name", safe(clientConfig.getName()));
        config.put("shortName", safe(clientConfig.getShortName()));
        config.put("phone", safe(clientConfig.getPhone()));
        config.put("email", safe(clientConfig.getEmail()));
        config.put("address", safe(clientConfig.getAddress()));
        config.put("language", safe(clientConfig.getLanguage()));
        config.put("currency", safe(clientConfig.getCurrency()));

        return config;
    }

    private String safe(String value) {
        return value == null ? "" : value;
    }
}