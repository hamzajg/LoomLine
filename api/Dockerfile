# --- build -----------------------------------------------------------------
FROM eclipse-temurin:25-jdk AS build
WORKDIR /src

COPY gradlew ./
COPY gradle ./gradle
COPY settings.gradle.kts build.gradle.kts gradle.properties ./
COPY api ./api

# Flyway locations are build-time configuration. Production builds keep the
# default; the demo image adds the reference seed (see compose.yaml).
ARG FLYWAY_LOCATIONS=db/migration

RUN --mount=type=cache,target=/root/.gradle chmod +x gradlew \
 && ./gradlew :api:build -x test --no-daemon \
      -Dquarkus.flyway.locations=${FLYWAY_LOCATIONS}

# --- runtime ---------------------------------------------------------------
FROM eclipse-temurin:25-jre
WORKDIR /app

COPY --from=build /src/api/build/quarkus-app /app

EXPOSE 8080
ENTRYPOINT ["java", "-jar", "/app/quarkus-run.jar"]
