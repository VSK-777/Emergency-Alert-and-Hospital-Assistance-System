package net.vvit.csp.emergency.config;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI emergencyOpenAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("Emergency Alert and Hospital Assistance System API")
                        .description("REST API documentation for B.Tech CSE Batch 8 Community Service Project (VVIT - VSK). " +
                                "Supports offline-first smartwatch accident detection, mobile application coordination, " +
                                "emergency triage, hospital preparation, responder dispatch, and medical expense tracking.")
                        .version("1.0.0")
                        .contact(new Contact()
                                .name("VSK & Team Batch 8 (VVIT)")
                                .email("vsk@vvit.net")
                                .url("https://vvitguntur.com"))
                        .license(new License().name("Apache 2.0").url("https://springdoc.org")))
                .addSecurityItem(new SecurityRequirement().addList("BearerAuth"))
                .components(new Components()
                        .addSecuritySchemes("BearerAuth",
                                new SecurityScheme()
                                        .name("BearerAuth")
                                        .type(SecurityScheme.Type.HTTP)
                                        .scheme("bearer")
                                        .bearerFormat("JWT")
                                        .description("Enter your JWT Bearer token obtained from /api/v1/auth/login or /api/v1/auth/register")));
    }
}
