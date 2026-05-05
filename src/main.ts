import { ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { apiReference } from "@scalar/nestjs-api-reference";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { cors: true });

  app.setGlobalPrefix("api");
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true
    })
  );

  const openApiConfig = new DocumentBuilder()
    .setTitle("Voice App Backend")
    .setDescription("Referencia de endpoints para autenticacion, Gmail y programacion de turnos.")
    .setVersion("1.0.0")
    .addBearerAuth(
      {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
        description: "Pega aqui el access token obtenido desde /api/auth/login"
      },
      "bearerAuth"
    )
    .addServer("http://localhost:3000", "Local")
    .build();

  const openApiDocument = SwaggerModule.createDocument(app, openApiConfig);
  const expressApp = app.getHttpAdapter().getInstance();

  expressApp.get("/api/openapi.json", (_request: unknown, response: { json: (body: unknown) => void }) => {
    response.json(openApiDocument);
  });

  app.use(
    "/scalar",
    apiReference({
      content: openApiDocument,
      theme: "default"
    })
  );

  await app.listen(3000);
}

bootstrap();
