# DINÁMICA DE PARTÍCULAS CARGADAS EN CAMPOS ELÉCTRICOS

## 📌 Descripción General

Este proyecto es un simulador interactivo en 2D que permite estudiar el comportamiento dinámico de una partícula cargada bajo campos eléctricos y magnéticos.
Está diseñado para apoyar el aprendizaje desde dos enfoques complementarios:

**✔ Enfoque Analítico**

Permite comparar las trayectorias obtenidas mediante ecuaciones físicas conocidas (parábolas, círculos, órbitas elípticas, etc.) con los casos simulados.

**✔ Enfoque Computacional**

El simulador implementa una integración numérica estable basada en la fuerza de Lorentz, permitiendo visualizar movimientos complejos que no tienen solución exacta.

El usuario puede seleccionar tipos de campo, modificar parámetros, cargar ejemplos predefinidos y observar la trayectoria en tiempo real.

## 📘 Marco Teórico y Fundamento Físico

Este simulador está basado en las ecuaciones fundamentales del electromagnetismo clásico y la dinámica newtoniana. Las fórmulas implementadas en el código representan directamente la física del movimiento de una partícula cargada.

**1. Fuerza de Lorentz (Ecuación Fundamental)**

La fuerza total sobre la partícula es:

$$
\vec{F} = q(\vec{E} + \vec{v} \times \vec{B})
$$

donde:
<p align="center"><b><i>q : carga de la partícula</i></b></p>

$$
\vec{E} : campo eléctrico
$$

$$
\vec{v}: velocidad
$$

$$
\vec{B}: campo magnético
$$

Esta es la ecuación central modelada en el simulador.

**2. Componentes de la Aceleración**

Usando la segunda ley de Newton:

$$
\vec{F} = m \vec{a}
$$
​
En 2D, tomando 
$$
a_x = \frac{q}{m}(E_x + v_y B_z)
$$

$$
a_y = \frac{q}{m}(E_y - v_x B_z)
$$

📌 Implementación directa en el código:
```javascript
const ax = q_m * (Ex + particle.vy * Bz);
const ay = q_m * (Ey - particle.vx * Bz);
```
```javascript
donde q_m = particle.q / particle.m.
```

**3. Campo Eléctrico Radial (Ley de Coulomb)**

En el caso de una carga puntual 
𝑄
Q ubicada en el origen:

$$
\vec{E}(x,y) = k\frac{Q}{(x^2 + y^2)^{3/2}}(x, y)
$$

Esto permite simular:

Órbitas circulares

Órbitas elípticas

Trayectorias de escape

Movimientos de repulsión

📌 Implementación:
```javascript
const r_sq = x*x + y*y + EPSILON;
const r_cubed = Math.pow(r_sq, 1.5);
const Ex = config.kQ * x / r_cubed;
const Ey = config.kQ * y / r_cubed;
```
**4. Ecuaciones del Movimiento**

Las ecuaciones diferenciales utilizadas son:

$$
\frac{d\vec{v}}{dt} = \vec{a}
$$

$$
\frac{d\vec{r}}{dt} = \vec{v}
$$

Como la solución analítica no siempre es posible (excepto en casos particulares), se usa un método numérico.

**5. Integración Numérica — Método Euler–Cromer**

El simulador emplea Euler–Cromer, una variante del método de Euler con mejor estabilidad energética.
Esto es crucial para modelar órbitas cerradas o movimientos circulares.

Actualización:

$$
v(t+\Delta t) = v(t) + a(t)\Delta t
$$

$$
x(t+\Delta t) = x(t) + v(t+\Delta t)\Delta t
$$

📌 Código:
```javascript
particle.vx += ax * dt;
particle.vy += ay * dt;
particle.x += particle.vx * dt;
particle.y += particle.vy * dt;
```

El programa ejecuta 10 subpasos por frame para mayor precisión.

**6. Estela de la Partícula**

Cada posición es almacenada:

```javascript
history.push({ x: particle.x, y: particle.y });
```

Esto permite visualizar la trayectoria completa.

**7. Representación del Campo**

El simulador también dibuja visualmente los campos:

Campo eléctrico uniforme: flechas direccionales

Campo magnético: círculos con punto (saliente) o cruz (entrante)

Campo radial: líneas de campo divergentes o convergentes

Esta parte del programa refuerza la interpretación visual de la física involucrada.

## 🎮 Funcionalidades Principales

<span style="font-size: 20px; font-weight: bold;">Panel Interactivo</span>

Modificación de:

Carga y masa

Posición y velocidades iniciales

Parámetros del campo

Zoom y longitud de estela

<span style="font-size: 20px; font-weight: bold;">Tipos de Campo Disponibles</span>

🟡 Campo Eléctrico Uniforme (trayectorias parabólicas)

🔵 Campo Magnético Uniforme (movimiento circular)

🔴 Campo Eléctrico Radial (órbitas y repulsiones)

Incluyendo configuraciones listas:

“Tiro parabólico”

“Círculo perfecto”

“Órbita elíptica”

## 🎯 Finalidad del Proyecto

El propósito de este proyecto es proporcionar una herramienta interactiva que permita a los estudiantes de Electromagnetismo comprender de manera visual y computacional el comportamiento dinámico de partículas cargadas sometidas a distintos tipos de campos eléctricos.

Mediante una simulación 3D desarrollada en JavaScript y Three.js, este programa facilita la interpretación de conceptos fundamentales como fuerza eléctrica, trayectoria de partículas, superposición de campos y la aplicación directa de la segunda ley de Newton en sistemas con cargas.

Para los estudiantes de Ciencias de la Computación, este proyecto aporta una conexión clara entre teoría física y modelado computacional, permitiendo:

Visualizar ecuaciones electromagnéticas mediante animaciones interactivas.

Comprender cómo se implementan modelos físicos dentro de un motor gráfico 3D.

Explorar la relación entre programación, simulación numérica y fenómenos físicos.

Analizar cómo pequeñas variaciones en parámetros (carga, masa, magnitud del campo, posición inicial) afectan las trayectorias de las partículas.

En conjunto, este proyecto actúa como un puente entre la teoría electromagnética y las habilidades de programación, ayudando a consolidar el aprendizaje mediante la experimentación directa y la visualización científica.

## 🚀 Cómo Ejecutarlo

<span style="font-size: 20px; font-weight: bold;">✔️ Opción 1</span>

Ingresar directamente al link para pobrar el simulador
[Ir a la simulación](https://paolovm27.github.io/DINAMICA-DE-PARTICULAS-CARGADAS-EN-CAMPOS-ELECTRICOS)

<span style="font-size: 20px; font-weight: bold;">✔️ Opción 2</span>

Clonar o descargar el repositorio.

Mantener juntos los archivos:

index.html
scripts.js
styles.css

Abrir index.html en un navegador.

Ajustar parámetros y comenzar a simular.

## 📄 Licencia

Este proyecto está licenciado bajo la Licencia MIT.  

Copyright (c) 2025 Paolo Villavicencio Merella  

El texto completo de la licencia se encuentra en el archivo [LICENSE](https://github.com/PaoloVM27/DINAMICA-DE-PARTICULAS-CARGADAS-EN-CAMPOS-ELECTRICOS/blob/main/LICENSE) de este repositorio.

