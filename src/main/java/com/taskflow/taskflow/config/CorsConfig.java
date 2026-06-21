package com.taskflow.taskflow.config;

import org.springframework.boot.web.servlet.FilterRegistrationBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.Ordered;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.filter.CorsFilter;

@Configuration
public class CorsConfig {

    @Bean
    public FilterRegistrationBean<CorsFilter> customCorsFilter() {
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        CorsConfiguration config = new CorsConfiguration();

        // The VIP List
        config.setAllowCredentials(true);
        config.addAllowedOrigin("http://localhost:5174"); // Allows your local laptop
        config.addAllowedOrigin("https://shedula-project-1.onrender.com"); // Allows your live website
        config.addAllowedHeader("*");
        config.addAllowedMethod("*");

        source.registerCorsConfiguration("/**", config);

        FilterRegistrationBean<CorsFilter> bean = new FilterRegistrationBean<>(new CorsFilter(source));

        // THE MAGIC LINE: This forces CORS to happen BEFORE Spring Security blocks it
        bean.setOrder(Ordered.HIGHEST_PRECEDENCE);
        return bean;
    }
}