package io.toro.workshop;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.security.core.userdetails.UserDetailsService;

import io.toro.workshop.blog.BlogService;
import io.toro.workshop.config.security.InMemoryUserDetailsService;
import io.toro.workshop.blog.InMemoryBlogServiceImpl;

@SpringBootApplication
public class BloggingApp {

    public static void main( String[] args ) {
        SpringApplication.run( BloggingApp.class, args );
    }

    @Bean
    BlogService blogService() {
        return new InMemoryBlogServiceImpl();
    }
    
    // TODO Declare UserDetailsService as bean

}