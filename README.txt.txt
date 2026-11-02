Instalación y ejecución de Pizzeria Napolitana WebApp
===============================================================


OPCIÓN A — Portable (recomendado para la PC del local)
---------------------------------------------------------------

No necesita Node.js ni internet en la PC destino.

En ESTA PC (la de desarrollo):

  1. Ejecutar CREAR_PORTABLE.bat
     Genera dist\PizzeriaNapolitana-Portable.zip (~48 MB)

En la PC DESTINO:

  2. Copiar el ZIP y descomprimirlo en una ruta CORTA,
     por ejemplo C:\PizzeriaNapolitana
     (las rutas muy largas rompen la descompresión en Windows)

  3. Copiar el archivo data\pizzeria.sqlite de la PC en uso
     dentro de la carpeta data\ del portable, para llevar
     los productos, precios y ventas.
     Si no se copia nada, arranca con una base vacía.

  4. Doble clic en INICIAR_PIZZERIA.bat

Dentro del portable hay un LEEME.txt con estas mismas
instrucciones, escrito para quien no conoce el proyecto.


OPCIÓN B — Instalación desde el código fuente
---------------------------------------------------------------

  1. Instalar Node.js desde https://nodejs.org (versión LTS)
     y reiniciar la PC

  2. Descargar el repositorio (ZIP desde GitHub o git clone)

  3. Ejecutar CONSTRUIR.bat
     Hace todo solo: dependencias, base de datos, compilación

  4. De ahí en adelante, solo INICIAR_PIZZERIA.bat para arrancar


Dónde viven los datos
---------------------------------------------------------------

  Todo está en un solo archivo: data\pizzeria.sqlite
  Copiarlo a un pendrive cada tanto alcanza como backup.
