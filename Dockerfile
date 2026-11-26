FROM node:24-bookworm-slim AS web
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY app ./app
COPY scripts ./scripts
COPY public ./public
COPY next.config.ts tsconfig.json ./
ENV NEXT_TELEMETRY_DISABLED=1 NEXT_PUBLIC_API_URL=same-origin
RUN npm run build && node scripts/build-tutor-library.mjs /app/tutor-library.json

FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /app
COPY server/pom.xml ./pom.xml
COPY server/src ./src
COPY --from=web /app/out/ ./src/main/resources/static/
COPY --from=web /app/tutor-library.json ./src/main/resources/
RUN mvn --batch-mode -DskipTests package

FROM eclipse-temurin:21-jre
WORKDIR /app
RUN groupadd --system academy && useradd --system --gid academy academy
COPY --from=build /app/target/academy-0.1.0.jar ./academy.jar
USER academy
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "/app/academy.jar"]
