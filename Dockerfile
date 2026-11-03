# Multi-stage Docker build for Emergency Alert and Hospital Assistance Backend (Repository Root)
FROM maven:3.9.9-eclipse-temurin-21-alpine AS build
WORKDIR /app

# Copy Backend module files using JSON array syntax for paths with spaces
COPY ["Web Development/Backend/pom.xml", "./"]
COPY ["Web Development/Backend/src", "./src"]
RUN mvn clean package -DskipTests -B

# Lightweight JRE runtime container
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

RUN addgroup -S spring && adduser -S spring -G spring
USER spring:spring

COPY --from=build /app/target/emergency-assistance-backend.jar app.jar

ENV PORT=8080
ENV JAVA_OPTS="-Xmx384m -Xms128m -XX:+UseG1GC"
EXPOSE 8080

ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -Dserver.port=${PORT:-8080} -jar app.jar"]
