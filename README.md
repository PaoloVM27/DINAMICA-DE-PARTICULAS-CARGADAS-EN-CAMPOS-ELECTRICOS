# DINÁMICA DE PARTÍCULAS CARGADAS EN CAMPOS ELÉCTRICOS

📌 Descripción General

Este proyecto es un simulador interactivo en 2D que permite estudiar el comportamiento dinámico de una partícula cargada bajo campos eléctricos y magnéticos.
Está diseñado para apoyar el aprendizaje desde dos enfoques complementarios:

✔ Enfoque Analítico

Permite comparar las trayectorias obtenidas mediante ecuaciones físicas conocidas (parábolas, círculos, órbitas elípticas, etc.) con los casos simulados.

✔ Enfoque Computacional

El simulador implementa una integración numérica estable basada en la fuerza de Lorentz, permitiendo visualizar movimientos complejos que no tienen solución exacta.

El usuario puede seleccionar tipos de campo, modificar parámetros, cargar ejemplos predefinidos y observar la trayectoria en tiempo real.

📘 Marco Teórico y Fundamento Físico

Este simulador está basado en las ecuaciones fundamentales del electromagnetismo clásico y la dinámica newtoniana. Las fórmulas implementadas en el código representan directamente la física del movimiento de una partícula cargada.

1. Fuerza de Lorentz (Ecuación Fundamental)

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

2. Componentes de la Aceleración

Usando la segunda ley de Newton:

𝑎
⃗
=
𝐹
⃗
𝑚
a
=
m
F
	​


En 2D, tomando 
𝐵
⃗
=
(
0
,
0
,
𝐵
𝑧
)
B
=(0,0,B
z
	​

):

𝑎
𝑥
=
𝑞
𝑚
(
𝐸
𝑥
+
𝑣
𝑦
𝐵
𝑧
)
a
x
	​

=
m
q
	​

(E
x
	​

+v
y
	​

B
z
	​

)
𝑎
𝑦
=
𝑞
𝑚
(
𝐸
𝑦
−
𝑣
𝑥
𝐵
𝑧
)
a
y
	​

=
m
q
	​

(E
y
	​

−v
x
	​

B
z
	​

)
📌 Implementación directa en el código:
const ax = q_m * (Ex + particle.vy * Bz);
const ay = q_m * (Ey - particle.vx * Bz);


donde q_m = particle.q / particle.m.

3. Campo Eléctrico Radial (Ley de Coulomb)

En el caso de una carga puntual 
𝑄
Q ubicada en el origen:

𝐸
⃗
(
𝑥
,
𝑦
)
=
𝑘
𝑄
(
𝑥
2
+
𝑦
2
)
3
/
2
(
𝑥
,
𝑦
)
E
(x,y)=k
(x
2
+y
2
)
3/2
Q
	​

(x,y)

Esto permite simular:

Órbitas circulares

Órbitas elípticas

Trayectorias de escape

Movimientos de repulsión

📌 Implementación:
const r_sq = x*x + y*y + EPSILON;
const r_cubed = Math.pow(r_sq, 1.5);
const Ex = config.kQ * x / r_cubed;
const Ey = config.kQ * y / r_cubed;

4. Ecuaciones del Movimiento

Las ecuaciones diferenciales utilizadas son:

𝑑
𝑣
⃗
𝑑
𝑡
=
𝑎
⃗
,
𝑑
𝑟
⃗
𝑑
𝑡
=
𝑣
⃗
dt
d
v
	​

=
a
,
dt
d
r
	​

=
v

Como la solución analítica no siempre es posible (excepto en casos particulares), se usa un método numérico.

5. Integración Numérica — Método Euler–Cromer

El simulador emplea Euler–Cromer, una variante del método de Euler con mejor estabilidad energética.
Esto es crucial para modelar órbitas cerradas o movimientos circulares.

Actualización:

𝑣
(
𝑡
+
Δ
𝑡
)
=
𝑣
(
𝑡
)
+
𝑎
(
𝑡
)
Δ
𝑡
v(t+Δt)=v(t)+a(t)Δt
𝑥
(
𝑡
+
Δ
𝑡
)
=
𝑥
(
𝑡
)
+
𝑣
(
𝑡
+
Δ
𝑡
)
Δ
𝑡
x(t+Δt)=x(t)+v(t+Δt)Δt
📌 Código:
particle.vx += ax * dt;
particle.vy += ay * dt;
particle.x += particle.vx * dt;
particle.y += particle.vy * dt;


El programa ejecuta 10 subpasos por frame para mayor precisión.

6. Estela de la Partícula

Cada posición es almacenada:

history.push({ x: particle.x, y: particle.y });


Esto permite visualizar la trayectoria completa.

7. Representación del Campo

El simulador también dibuja visualmente los campos:

Campo eléctrico uniforme: flechas direccionales

Campo magnético: círculos con punto (saliente) o cruz (entrante)

Campo radial: líneas de campo divergentes o convergentes

Esta parte del programa refuerza la interpretación visual de la física involucrada.

🎮 Funcionalidades Principales
1. Panel Interactivo

Modificación de:

Carga y masa

Posición y velocidades iniciales

Parámetros del campo

Zoom y longitud de estela

2. Tipos de Campo Disponibles

🟡 Campo Eléctrico Uniforme (trayectorias parabólicas)

🔵 Campo Magnético Uniforme (movimiento circular)

🔴 Campo Eléctrico Radial (órbitas y repulsiones)

3. Ejemplos Predeterminados

Incluye configuraciones listas:

“Tiro parabólico”

“Círculo perfecto”

“Órbita elíptica”

4. Visualización Clara

Cuadrícula

Estela

Colores según carga

Campo representado gráficamente

💡 Beneficios del Simulador

✔ Permite estudiar soluciones analíticas y compararlas con resultados numéricos.
✔ Introduce el uso de métodos computacionales para resolver ecuaciones diferenciales reales.
✔ Facilita la comprensión de fenómenos complejos como órbitas y campos radiales.
✔ Ideal para cursos de física, electrónica, computación científica, simulación o proyectos universitarios.
✔ Completamente ejecutable desde un navegador.

🚀 Cómo Ejecutarlo

Clonar o descargar el repositorio.

Mantener juntos los archivos:

index.html

scripts.js

styles.css

Abrir index.html en un navegador.

Ajustar parámetros y comenzar a simular.

📄 Licencia

(Agrega aquí tu licencia preferida: MIT, GPL, CC-BY, etc.)
