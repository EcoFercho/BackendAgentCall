# Backend

Backend base con NestJS para el flujo Gmail -> filtro antispam -> ticker en tiempo real.

## Modulos incluidos

- `auth`: login JWT para un unico usuario admin.
- `gmail`: configuracion de cuenta base, prueba de conexion IMAP, sincronizacion de inbox y filtro antispam.
- `notifications`: WebSocket para empujar correos aprobados al frontend.
- `prisma`: persistencia en PostgreSQL.

## Arranque

1. Copiar `.env.example` a `.env`.
2. Completar `GMAIL_APP_PASSWORD` con una App Password de Gmail.
3. Instalar dependencias con `npm install`.
4. Ejecutar:

```bash
npm run prisma:generate
npm run prisma:migrate
npm run seed
npm run start:dev
```

## Credenciales iniciales

- email admin: `erwin0pisis@gmail.com`
- password admin: valor de `ADMIN_PASSWORD`

## Criterio antispam

Primero respeta el marcado nativo de Gmail. Luego suma una heuristica simple por terminos sospechosos, remitentes anormales y formato del asunto. Solo los mensajes `APPROVED` se publican al ticker.
