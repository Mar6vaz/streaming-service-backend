Explicarles cómo deben subir su trabajo
Tus backend NO deben subir directo a main.
Deben crear una rama feature.
Ejemplo:
git checkout develop
git pull origin develop
git checkout -b feature/streaming-endpoints
Ahí programan todo.

Cuando terminen:
git add .
git commit -m "Streaming endpoints completed"
git push origin feature/streaming-endpoints

Crear el Pull Request para revisión
En GitHub aparecerá un botón:
Compare & Pull Request
El backend debe hacer:
feature/streaming-endpoints → testing
Esto significa:
Backend terminó → pasa a testing.

Trabajo del tester
El tester entra al Pull Request y revisa los endpoints.
Puede probarlos con:
Postman
Insomnia
curl
Ejemplo de prueba:
GET /streams
POST /streams
DELETE /streams/:id
Si algo falla ❌
Deja comentarios en el Pull Request.

Cuando el tester aprueba
El tester presiona:
Approve
Ahora te toca a ti como Project Manager.

Tu revisión como Project Manager
Tú revisas:
✔ que el código esté ordenado
✔ que coincida con la documentación
✔ que los endpoints funcionen
Si todo está bien haces el merge.
Presionas:
Merge Pull Request
Esto hará:
feature → testing

Merge final
Cuando varios endpoints estén aprobados haces:
testing → develop
Y cuando todo el módulo esté listo:
develop → main
