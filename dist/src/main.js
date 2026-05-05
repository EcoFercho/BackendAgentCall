"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const nestjs_api_reference_1 = require("@scalar/nestjs-api-reference");
const swagger_1 = require("@nestjs/swagger");
const app_module_1 = require("./app.module");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule, { cors: true });
    app.setGlobalPrefix("api");
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true
    }));
    const openApiConfig = new swagger_1.DocumentBuilder()
        .setTitle("Voice App Backend")
        .setDescription("Referencia de endpoints para autenticacion, Gmail y programacion de turnos.")
        .setVersion("1.0.0")
        .addBearerAuth({
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
        description: "Pega aqui el access token obtenido desde /api/auth/login"
    }, "bearerAuth")
        .addServer("http://localhost:3000", "Local")
        .build();
    const openApiDocument = swagger_1.SwaggerModule.createDocument(app, openApiConfig);
    const expressApp = app.getHttpAdapter().getInstance();
    expressApp.get("/api/openapi.json", (_request, response) => {
        response.json(openApiDocument);
    });
    app.use("/scalar", (0, nestjs_api_reference_1.apiReference)({
        content: openApiDocument,
        theme: "default"
    }));
    await app.listen(3000);
}
bootstrap();
//# sourceMappingURL=main.js.map