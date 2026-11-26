package com.systemdesign.academy;

import java.net.http.HttpClient;
import java.time.Duration;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;

@SpringBootApplication
public class AcademyApplication {
    public static void main(String[] args) {
        SpringApplication.run(AcademyApplication.class, args);
    }

    @Bean
    HttpClient upstreamClient() {
        return HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(4)).build();
    }
}
