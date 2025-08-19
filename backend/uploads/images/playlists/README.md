# Imágenes de Playlists

Esta carpeta contiene las imágenes subidas para las playlists de los usuarios.

## Estructura de archivos

- Los archivos se nombran automáticamente con el patrón: `playlist-{timestamp}-{random}.{extension}`
- Formatos soportados: JPEG, PNG, GIF, WebP
- Tamaño máximo: 5MB por imagen
- Las imágenes son servidas desde `/uploads/images/playlists/` por el servidor Express

## Uso

Las imágenes se suben a través del endpoint `POST /api/playlists` y `PUT /api/playlists/:id` usando multipart/form-data con el campo `image`.

## Limpieza automática

Cuando se elimina una playlist o se actualiza la imagen, el archivo anterior se elimina automáticamente del sistema de archivos.
