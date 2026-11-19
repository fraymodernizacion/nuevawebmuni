<!DOCTYPE html>
<html lang="es">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Mesa de Entrada Virtual</title></head>
<body style="margin:0;padding:0;background-color:#f3f7fb;font-family:'Instrument Sans',Arial,Helvetica,sans-serif;color:#202833;">
<table role="presentation" style="width:100%;border-collapse:collapse;background-color:#f3f7fb;"><tr><td align="center" style="padding:24px 12px;">
<table role="presentation" style="width:100%;max-width:600px;border-collapse:collapse;background-color:#ffffff;">
<tr><td style="padding:22px 28px;border-bottom:4px solid #84bd1a;"><img src="{{ $logoUrl }}" width="150" alt="Fray Municipalidad" style="display:block;width:150px;max-width:100%;height:auto;"><p style="margin:12px 0 0;color:#123d67;font-size:14px;">Municipalidad de Fray Mamerto Esquiú</p></td></tr>
<tr><td style="padding:26px 28px;background-color:#123d67;color:#ffffff;"><p style="margin:0 0 8px;color:#ffffff;font-size:14px;">Mesa de Entrada Virtual</p><h1 style="margin:0;color:#ffffff;font-size:26px;line-height:1.3;">{{ $received ? 'Recibimos tu trámite' : 'Tu trámite tiene una actualización' }}</h1></td></tr>
<tr><td style="padding:26px 28px;">
<p style="margin:0 0 6px;font-size:14px;color:#495466;">Número de trámite</p>
<p style="margin:0 0 22px;font-size:22px;font-weight:bold;color:#123d67;overflow-wrap:anywhere;">{{ $publicCode }}</p>
<p style="margin:0 0 6px;font-size:14px;color:#495466;">Estado registrado en esta actualización</p>
<p style="margin:0 0 22px;font-size:18px;font-weight:bold;color:#123d67;">{{ $statusLabel }}</p>
<p style="font-size:16px;line-height:1.65;">{{ $needsDocumentation ? 'Entrá al seguimiento para ver qué documentación te pidieron y adjuntarla.' : 'Entrá al seguimiento para consultar la respuesta del municipio, el historial y los documentos que estén disponibles.' }}</p>
<table role="presentation" style="border-collapse:collapse;margin:24px 0;"><tr><td style="background-color:#123d67;border-radius:8px;"><a href="{{ $trackingUrl }}" style="display:inline-block;padding:16px 24px;color:#ffffff;text-decoration:none;font-size:16px;font-weight:bold;">Ver mi trámite</a></td></tr></table>
<p style="font-size:14px;line-height:1.6;color:#495466;">Este enlace abre tu trámite directamente y tiene una vigencia de siete días. Compartilo solo con personas autorizadas a consultar tu solicitud.</p>
<p style="font-size:14px;line-height:1.6;color:#495466;">También podés <a href="{{ route('intake.public.track') }}" style="color:#123d67;">consultar desde el portal</a> con el número de trámite y tu DNI sin puntos.</p>
<p style="font-size:13px;line-height:1.6;color:#495466;">Si el botón no abre, copiá este enlace en tu navegador.</p>
<p style="font-size:12px;line-height:1.6;word-break:break-all;overflow-wrap:anywhere;"><a href="{{ $trackingUrl }}" style="color:#123d67;">{{ $trackingUrl }}</a></p>
</td></tr>
<tr><td style="padding:18px 28px;border-top:2px solid #d93397;font-size:13px;line-height:1.6;color:#495466;">Mesa de Entrada Virtual<br>Municipalidad de Fray Mamerto Esquiú</td></tr>
</table></td></tr></table>
</body></html>
