FROM eclipse-temurin:25

WORKDIR /app

COPY target/football-xtreme-1.0.0.jar app.jar

EXPOSE 8080

ENTRYPOINT ["java", "-jar", "app.jar"]
