{{ $received ? 'Recibimos tu trámite' : 'Tu trámite tiene una actualización' }}

Municipalidad de Fray Mamerto Esquiú
Mesa de Entrada Virtual

Número de trámite {{ $publicCode }}
Estado registrado {{ $statusLabel }}

@if ($needsDocumentation)
Entrá al seguimiento para ver qué documentación te pidieron y adjuntarla.
@else
Consultá las respuestas, el historial y los documentos disponibles.
@endif

Ver mi trámite
{{ $trackingUrl }}

El enlace abre tu trámite directamente y tiene una vigencia de siete días.
Compartilo solo con personas autorizadas a consultar tu solicitud.
También podés consultar desde el portal con el número de trámite y tu DNI sin puntos.
