<x-mail::message>
# {{ $received ? 'Recibimos tu trámite' : 'Tu trámite cambió de estado' }}

**Número de trámite:** {{ $publicCode }}

**Estado:** {{ $statusLabel }}

@if ($needsDocumentation)
Entrá al seguimiento para ver qué documentación te pidieron y adjuntarla.
@else
Podés consultar el detalle y los mensajes del municipio desde el seguimiento.
@endif

<x-mail::button :url="$trackingUrl">
Consultar mi trámite
</x-mail::button>

Para consultar, ingresá el número de trámite y el DNI sin puntos de quien hizo la solicitud.

Mesa de Entrada Virtual · Municipalidad de Fray Mamerto Esquiú
</x-mail::message>
