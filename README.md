# Flexio Web

Frontend de la peluquería Flexio. SPA en **React + Vite + TypeScript + Tailwind CSS**.

Consume la API [`flexio-api-core`](../flexio-api-core) (NestJS, puerto `8080`, prefijo `/api`).

## Requisitos

- Node.js ≥ 20
- pnpm

## Puesta en marcha

```bash
pnpm install
pnpm dev
```

La app corre en `http://localhost:5173`. En desarrollo, Vite proxea `/api` hacia `http://localhost:8080` (configurado en `vite.config.ts`).

```bash
pnpm build     # build de producción
pnpm lint      # oxlint
```

## Estructura

```
src/
├── lib/            # api (cliente fetch + JWT), auth (contexto), format, useData
├── components/
│   ├── ui/         # Button, Input, Modal, Badge, Feedback (spinner, empty, confirm), Toast
│   └── layout/     # Sidebar, topbar, rutas protegidas
└── pages/
    ├── Booking.tsx      # reserva pública (sin login, sin elegir servicio)
    ├── Login.tsx
    ├── Dashboard.tsx
    ├── Appointments.tsx # crear turno, asignar servicio, extender turno
    ├── Services.tsx     # catálogo (nombre + precio)
    ├── Customers.tsx
    ├── Employees.tsx    # duración del turno + disponibilidad semanal
    ├── Cash.tsx         # pagos (admin)
    ├── Users.tsx        # usuarios (admin)
    └── Reports.tsx
```

## Flujo de reserva pública

1. `GET /public/employees` → lista de profesionales.
2. El cliente elige profesional y fecha.
3. `GET /appointments/available?employeeId&date` → slots libres (según la duración del empleado).
4. El cliente ingresa nombre + teléfono.
5. `POST /public/appointments` → crea/encuentra el cliente por teléfono y crea el turno.

## Notas

- La reserva pública **no requiere login** ni elegir servicio (el servicio se asigna después desde el panel).
- En el panel, los turnos permiten **asignar servicio** (para métricas) y **extender** la duración ocupando bloques libres.
- Los endpoints de administración requieren el rol `ADMIN` (Caja, Usuarios); el resto está disponible para `ADMIN` y `STAFF`.
