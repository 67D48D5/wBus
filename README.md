# wBus

Visualized Bus Information Service for Wonju, South Korea.

## Architecture

```txt
+-----------+       HTTP        +-----------+        React UI        +----------+
| Public API| <---------------> | Telemetry | <--------------------> |  Vista   |
|  (공공버스) |   (poll/caching)  |  (Rust)   |      (REST/GraphQL)    | (Next.js)|
+-----------+                   +-----------+                        +----------+
```

## Stacks

### Vista

- [공공데이터포털](https://www.data.go.kr/)
- [AWS API Gateway](https://aws.amazon.com/ko/api-gateway/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Vercel](https://vercel.com/)
- [Next.js](https://nextjs.org/)
- [Leaflet](https://leafletjs.com/)
- [OpenStreetMap](https://www.openstreetmap.org/)
- [Typescript](https://www.typescriptlang.org/)
- [React](https://reactjs.org/)

### Telemetry

- [Rust](https://www.rust-lang.org/)
- [Actix](https://actix.rs/)

## License

wBus is open-sourced under the **MIT License**.

> See [LICENSE](./LICENSE) for more details.
