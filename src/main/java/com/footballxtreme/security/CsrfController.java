package com.footballxtreme.security;
import org.springframework.security.web.csrf.CsrfToken;
import org.springframework.web.bind.annotation.*;
@RestController
public class CsrfController {
    @GetMapping("/api/csrf") public CsrfToken csrf(CsrfToken token) { return token; }
}
