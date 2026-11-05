# Simulador HTTP de mediciones - SIDI (entorno local)

## Diseño
POST /api/v1/mediciones/simulaciones inicia un lote asíncrono de **100 solicitudes HTTP** a POST /api/v1/mediciones, con **al menos 1 segundo** entre envíos. Responde HTTP 202 con un id; no bloquea la petición durante unos 100 segundos.

GET /api/v1/mediciones/simulaciones/:id devuelve estado, intentadas, aceptadas_http, fallidas_http, fechas y último error. Solo permite un lote activo por proceso; un segundo intento devuelve 409. Un reinicio pierde el estado guardado en memoria (las solicitudes ya enviadas no se revierten).

## Activación
El simulador está deshabilitado por defecto y exige un token. Si usas Docker Compose desde eps_ai, agrega en **eps_ai/.env** (porque su docker-compose.yml utiliza env_file: .env):

    SIMULATOR_ENABLED=true
    SIMULATOR_TOKEN=sidi-local-cambia-este-valor

Recrear el contenedor desde la carpeta eps_ai:

    docker compose up -d --build --force-recreate api-eps-ingesta

## Iniciar lote en PowerShell

    $headers = @{ 'x-sidi-simulator-token' = 'sidi-local-cambia-este-valor' }
    $job = Invoke-RestMethod -Method Post -Uri http://localhost:5000/api/v1/mediciones/simulaciones -Headers $headers
    $job | Format-List
    Invoke-RestMethod -Method Get -Uri "http://localhost:5000/api/v1/mediciones/simulaciones/$($job.id)" -Headers $headers | Format-List

Los clientes generados son C00000 ... C00099 y los consumos contienen algunos casos de consumo cero o elevado. Son datos sintéticos; el simulador no determina las etiquetas de irregularidad y no garantiza que los 100 mensajes generen alertas.

## Condición para verificar la inferencia real
El consumidor Python consulta perfiles en public.cliente_features antes de clasificar. Los IDs generados deben existir allí. Revisa los clientes antes de comenzar, adaptando usuario y BD si corresponde:

    docker exec postgres_eps_db psql -U postgres -d eps_db -c "SELECT count(*) FROM public.cliente_features WHERE codigo_cliente BETWEEN 'C00000' AND 'C00099';"

Si la tabla no existe, **no des por validado el modelo**. Evita ejecutar sin revisión populate_features.py porque contiene TRUNCATE.

## Consultar logs

    docker compose logs --tail=130 api-eps-ingesta
    docker compose logs --tail=130 consumer-eps-ia
    docker exec rabbitmq_eps_broker rabbitmqctl list_queues name messages_ready messages_unacknowledged consumers

La métrica aceptadas_http cuenta HTTP 202, no mensajes procesados por la IA. El consumidor actual solo escribe predicciones positivas en public.alertas_irregularidades. Los dashboards existentes consultan sidi_demo y **no aumentan automáticamente** con este simulador.

Usa el simulador solo en Docker local; desactiva SIMULATOR_ENABLED cuando termines. Con varias réplicas NestJS, el control de concurrencia es por proceso, no distribuido.
