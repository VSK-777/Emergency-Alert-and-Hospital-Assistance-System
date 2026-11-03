# Multi-stage Docker build for Emergency Alert and Hospital Assistance Backend
# Base image with Maven & Eclipse Temurin Java 21
FROM maven:3.9.9-eclipse-temurin-21-alpine AS build
WORKDIR /app

# Copy pom.xml and source code to package executable jar
COPY pom.xml .
COPY src ./src
RUN mvn clean package -DskipTests -B

# Lightweight JRE runtime container
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

# Create non-root user for production security
RUN addgroup -S spring && adduser -S spring -G spring
USER spring:spring

# Copy built jar from build stage
COPY --from=build /app/target/emergency-assistance-backend-*.jar app.jar

# Default port and JVM memory tuning optimized for Render free tier (512MB RAM)
ENV PORT=8080
ENV JAVA_OPTS="-Xmx384m -Xms128m -XX:+UseG1GC"
EXPOSE 8080

ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -Dserver.port=${PORT:-8080} -jar app.jar"]
