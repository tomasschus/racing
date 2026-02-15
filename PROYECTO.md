# Racing — Juego de carreras multijugador online

## ¿Qué es este proyecto?

**Racing** es un **juego de carreras 3D** pensado para jugarse **online en modo multijugador** usando **WebSockets**. Los jugadores conducen coches en una pista, compiten por vueltas y comparten la partida en tiempo real a través de la red.

---

## Objetivo: multijugador online con WebSockets

El proyecto está orientado a ser un **juego de carreras multijugador en línea** donde:

- Varios jugadores se conectan al mismo servidor.
- Cada uno ve su coche y el de los demás en la misma pista.
- Las posiciones, velocidades y estados se **sincronizan en tiempo real** mediante **WebSockets** (conexión bidireccional, baja latencia).
- Se pueden hacer carreras por vueltas, clasificaciones y partidas compartidas.

### Por qué WebSockets

- **Tiempo real**: el servidor puede enviar actualizaciones en cuanto ocurren (posición, choques, cruce de meta).
- **Conexión persistente**: no hace falta hacer polling; cliente y servidor mantienen un canal abierto.
- **Bajo overhead**: ideal para juegos donde cada frame (o cada N ms) se envían posiciones y estados.

---

## Estado actual del proyecto

Hoy el juego funciona en **modo un solo jugador** en el navegador:

| Componente        | Descripción |
|-------------------|-------------|
| **Motor 3D**      | React Three Fiber + Three.js |
| **Física**       | Rapier (via `@react-three/rapier`) — gravedad, colisiones, impulsos |
| **Coche**        | Modelo Lamborghini (GLB), controles WASD, aceleración/freno/dirección |
| **Pista**        | Circuito con colisiones |
| **Cámara**       | Sigue al coche del jugador |
| **Estado**       | Zustand — posición, velocidad, estado de carrera, vueltas |

La base (física, controles, pista, UI de carrera) está lista para extenderla con **lógica de red** y un **servidor WebSocket**.

---

## Arquitectura objetivo (multijugador con WebSockets)

```
┌─────────────────┐         WebSockets          ┌─────────────────┐
│   Cliente 1     │ ◄──────────────────────────► │                 │
│   (navegador)   │                               │    Servidor     │
└─────────────────┘                               │   WebSocket     │
                                                  │  (Node/Deno/…)  │
┌─────────────────┐         WebSockets          │                 │
│   Cliente 2     │ ◄──────────────────────────► │  - Partidas     │
│   (navegador)   │                               │  - Posiciones   │
└─────────────────┘                               │  - Vueltas      │
                                                  └─────────────────┘
```

- **Cliente**: envía inputs (acelerar, frenar, girar) y/o estado del coche; recibe estado de todos los coches y de la carrera.
- **Servidor**: autoridad (opcional) para posiciones y reglas, broadcast de estados, gestión de salas/partidas.

---

## Cómo ejecutar el proyecto (desarrollo)

```bash
npm install
npm run dev
```

Abre la URL que indique Vite (por ejemplo `http://localhost:5173`). Haz clic en la pantalla y usa **WASD** para conducir.

---

## Resumen

| Aspecto        | Descripción |
|----------------|-------------|
| **Tipo**       | Juego de carreras 3D en el navegador |
| **Modo**       | Objetivo: **online multijugador** con WebSockets |
| **Stack**      | React, Three.js, Rapier, Zustand, Vite |
| **Controles**  | Teclado (WASD) |
| **Próximo paso** | Servidor WebSocket + sincronización de jugadores y carrera |

Este documento describe qué es el proyecto (un juego de carreras) y que está pensado para ser **online multijugador con WebSockets**.
