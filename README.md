# Boda Marcelo & Alicia · 26.12.2026

Web de la invitación (sitio estático).

## Publicar en GitHub Pages
1. Crea un repositorio y sube **todo el contenido de esta carpeta** (incluida `assets/` y el archivo `.nojekyll`).
2. En el repositorio: **Settings → Pages → Build and deployment → Source: Deploy from a branch**.
3. Elige la rama `main` y la carpeta `/ (root)` y guarda.
4. En 1-2 minutos estará en `https://TU-USUARIO.github.io/NOMBRE-REPO/`.

## Estructura
- `index.html`: página principal
- `assets/styles.css`: estilos
- `assets/app.js`: la aplicación
- `assets/runtime.js`: utilidades de depuración (heredadas del proyecto original)
- `assets/img/`: imágenes

## Importante
El formulario de confirmación (RSVP) necesita un servidor con base de datos (`/api/trpc`).
GitHub Pages solo sirve archivos estáticos, así que **no guardará respuestas** sin un servicio externo.
