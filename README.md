# NutriTrack

PWA de conteo de calorías y macros (React + Vite + Tailwind). Datos en `localStorage`.

## Desarrollo
```bash
npm install
npm run dev      # http://localhost:5173 (la cámara funciona en localhost)
npm run build    # genera /dist
```

## Subir a GitHub y desplegar en Netlify (4 pasos)
1. Crea un repo vacío en GitHub y sube el proyecto:
   `git init && git add . && git commit -m "NutriTrack" && git branch -M main && git remote add origin <URL_DEL_REPO> && git push -u origin main`
2. En Netlify: **Add new site → Import an existing project → GitHub** y elige el repo.
3. Netlify detecta `netlify.toml` (build: `npm run build`, publish: `dist`). Pulsa **Deploy**.
4. Abre la URL `https://…netlify.app` en el teléfono: iPhone → Safari → Compartir → *Añadir a pantalla de inicio*; Android → Chrome → ⋮ → *Instalar app*.

Notas: la cámara exige HTTPS (Netlify ya lo da). Los enlaces de WhatsApp apuntan al dominio desde el que compartes, así que comparte siempre desde la versión desplegada.
