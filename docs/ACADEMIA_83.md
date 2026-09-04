# Academia Under Tango — Departamento 83

La Academia se integra en el proyecto existente `undertangoweb`, sin dependencias nuevas ni cambios en la portada, APRENDE o Elitros.

## Rutas

- `/academia`: directorio de proyectos.
- `/academia/tango`: modalidades presencial y online, con consultas al contacto público existente.
- `/academia/contador-de-palabras`: herramienta gratuita, sin registro, persistencia ni envío del texto.
- APRENDE conserva `https://aprende.undertangoclub.com` y su embudo vigente.

`app/academia/projects.ts` contiene el catálogo: cada proyecto tiene identificador, título, descripción, destino y etiqueta. Para agregar otro, añadir una entrada y, si lo necesita, su página debajo de `app/academia`. Los estilos están limitados al módulo de Academia.

## Dominio

La dirección es `83.undertangoclub.com`: utiliza el dominio existente `undertangoclub.com` y no requiere comprar otro dominio. El host exacto se reescribe a `/academia` y sus rutas hijas, sin capturar otros hosts. Las rutas `/academia/...` también funcionan desde ese host para conservar enlaces y permitir publicación desde el dominio principal.

El subdominio está agregado al entorno Production de `undertangoweb`. El CNAME `83` apunta a `63801b4d9ab61603.vercel-dns-017.com`, guardado en Squarespace el 4 de septiembre de 2026. Se conservaron los demás registros del dominio.

`academyOrigin` define `https://83.undertangoclub.com` como URL canónica de la Academia. Sus rutas públicas son `/`, `/tango` y `/contador-de-palabras`; las rutas `/academia/...` continúan disponibles. La configuración anteriormente asociada por error a `83.undertango.club` se reemplazó por la dirección correcta; no se compra ni se utiliza `undertango.club`.

## Contador y privacidad

Los grupos de letras/números cuentan como palabras; los apóstrofes internos permanecen unidos, los guiones separan y los signos/emojis solos no cuentan. Los caracteres son grafemas Unicode, incluidos emojis combinados. Se excluyen espacios, tabulaciones y saltos de línea en la métrica sin espacios. No hay almacenamiento del texto ni llamadas de red desde el contador. El bot de chat y el rastreador general se excluyen de las rutas y del host de Academia.

Pruebas: `node --test scripts/test-academia.mjs` (Node 24). El despliegue conserva el proceso y el lockfile del repositorio.
