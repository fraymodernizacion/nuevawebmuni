<?php

namespace Database\Seeders;

use App\Models\IntakeAssistanceType;
use App\Models\IntakeDepartment;
use App\Models\IntakeRequestSubtype;
use App\Models\IntakeRequestType;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class IntakeNovemberCatalogSeeder extends Seeder
{
    public function run(): void
    {
        DB::transaction(function (): void {
            foreach ([
                'eventos' => ['Eventos y apoyo municipal', 'Eventos', 'Sonido, locución, transporte y cobertura para eventos.', '#0f766e', true],
                'juventudes' => ['Juventudes, orientación y becas', 'Educación y juventudes', 'Orientación vocacional, talleres de prevención y consultas sobre becas.', '#2e75b8', true],
                'ambiente' => ['Ambiente, producción y animales', 'Ambiente y animales', 'Residuos, visitas, producción, donaciones y servicios de Zoonosis.', '#15803d', true],
                'haberes-institucional' => ['Novedades de haberes de organismos', 'Gestiones institucionales', 'Presentaciones de organismos habilitados.', '#475569', false],
            ] as $slug => [$name, $category, $description, $color, $active]) {
                IntakeRequestType::updateOrCreate(
                    ['slug' => $slug],
                    compact('name', 'category', 'description', 'color', 'active') + ['icon' => 'file-text'],
                );
            }

            $departments = [
                'comunicacion' => ['Dirección de Comunicación', 'Intendencia'],
                'privada-intendencia' => ['Dirección Privada de Intendencia', 'Intendencia'],
                'politicas-juveniles' => ['Políticas Juveniles', 'Gobierno'],
                'guardia-urbana' => ['Guardia Urbana', 'Gobierno'],
                'accion-social' => ['Acción Social', 'Desarrollo Social'],
                'administracion-social' => ['Administración de Desarrollo Social', 'Desarrollo Social'],
                'liquidacion-haberes' => ['Informática y Liquidación de Haberes', 'Hacienda'],
                'medio-ambiente' => ['Medio Ambiente y Planta de Tratamiento', 'Producción y Medio Ambiente'],
                'produccion' => ['Dirección de Producción', 'Producción y Medio Ambiente'],
                'zoonosis' => ['Dirección de Zoonosis', 'Producción y Medio Ambiente'],
                'parque-botanico' => ['Parque Botánico', 'Producción y Medio Ambiente'],
                'espacios-verdes' => ['Espacios Verdes', 'Producción y Medio Ambiente'],
            ];
            foreach ($departments as $slug => [$name, $secretariat]) {
                IntakeDepartment::firstOrCreate(['slug' => $slug], compact('name', 'secretariat'));
            }
            IntakeDepartment::where('slug', 'transito')
                ->where('secretariat', 'Obras y Servicios Publicos')
                ->update(['secretariat' => 'Gobierno']);

            $types = IntakeRequestType::all()->keyBy('slug');
            $areas = IntakeDepartment::all()->keyBy('slug');
            $assistanceTypes = [];
            IntakeAssistanceType::firstOrCreate(
                ['slug' => 'solicitudes-guardia-urbana'],
                ['name' => 'Guardia Urbana', 'color' => $areas['guardia-urbana']->color, 'default_intake_department_id' => $areas['guardia-urbana']->id, 'active' => true],
            );

            foreach ($this->entries() as $entry) {
                [$rows, $group, $slug, $name, $area, $audience, $fields, $result] = $entry;
                $type = $types->get($group);
                $department = $areas->get($area);
                if (! $type || ! $department) {
                    throw new \RuntimeException('Falta el catálogo base de Mesa de Entrada. Ejecutá IntakeCatalogSeeder.');
                }

                $assistance = $assistanceTypes[$area] ??= IntakeAssistanceType::firstOrCreate(
                    ['slug' => 'solicitudes-'.$area],
                    [
                        'name' => $department->name,
                        'color' => $department->color,
                        'default_intake_department_id' => $department->id,
                        'active' => true,
                    ],
                );

                $requirements = ['Pueden solicitarlo: '.$audience.'.'];
                if (! in_array($rows, ['9', '19', '53,54'], true)) {
                    $requirements[] = 'Nota firmada dirigida a Intendencia. Si corresponde, con firma y sello de la autoridad de la institución.';
                }
                if (isset($entry[9])) {
                    $requirements[] = $entry[9].'.';
                }

                IntakeRequestSubtype::updateOrCreate(
                    ['intake_request_type_id' => $type->id, 'slug' => $slug],
                    [
                        'name' => $name,
                        'description' => $audience.'.',
                        'result_information' => $result,
                        'cost_information' => ($entry[8] ?? '') ?: 'Sin costo.',
                        'requirements' => $requirements,
                        'schema' => $this->schema($fields),
                        'sort_order' => (int) $rows,
                        'publication_status' => $type->active ? 'published' : 'draft',
                        'active' => $type->active,
                        'default_intake_assistance_type_id' => $assistance->id,
                    ],
                );
            }
        });
    }

    /**
     * @return list<array{name: string, label: string, type: string, required: bool, options?: list<string>}>
     */
    private function schema(string $fields): array
    {
        $definitions = [
            'lugar' => ['Lugar o domicilio', 'text'],
            'fecha' => ['Fecha preferida', 'date'],
            'desde' => ['Horario de inicio', 'time'],
            'hasta' => ['Horario de finalización', 'time'],
            'personas' => ['Cantidad estimada de personas', 'text'],
            'equipos' => ['Equipamiento solicitado', 'textarea'],
            'grilla' => ['Grilla del evento', 'textarea'],
            'origen' => ['Lugar de salida', 'text'],
            'destino' => ['Destino', 'text'],
            'salida' => ['Horario de salida', 'time'],
            'regreso' => ['Horario de regreso', 'time'],
            'origen_agua' => ['Origen del agua', 'select', ['Red', 'Tanque', 'Red y tanque']],
            'analisis' => ['Tipo de análisis', 'select', ['Bacteriológico', 'Fisicoquímico', 'Ambos', 'Necesito orientación']],
            'tema' => ['Tema de la actividad', 'text'],
            'edades' => ['Edades de los participantes', 'text'],
            'modalidad' => ['Modalidad solicitada', 'text'],
            'consulta' => ['¿Qué querés consultar?', 'textarea'],
            'cobertura' => ['Tipo de cobertura', 'select', ['Tránsito o corte de calle', 'Guardia Urbana', 'Tránsito y Guardia Urbana']],
            'detalle' => ['Detalle del pedido', 'textarea'],
            'institucion' => ['Nombre de la institución', 'text'],
            'ciclo' => ['Curso o ciclo escolar', 'text'],
            'motivo' => ['Motivo de la solicitud', 'textarea'],
            'charla' => ['Modalidad de la charla', 'select', ['Institucional', 'Abierta al público']],
            'elemento' => ['Elemento solicitado', 'text'],
            'edad' => ['Edad', 'text'],
            'actividad' => ['Actividad prevista', 'textarea'],
            'interferencia' => ['¿Afecta cables o luminarias?', 'select', ['Sí', 'No', 'No sé']],
            'identificacion' => ['DNI o CUIT del titular', 'text'],
            'cuenta' => ['Cuenta o partida', 'text'],
            'periodo' => ['Período de aplicación', 'text'],
            'novedad' => ['Tipo de novedad', 'select', ['Alta', 'Baja', 'Altas y bajas']],
            'servicio' => ['Servicio o descuento', 'text'],
            'importe' => ['Importe', 'text'],
            'espacio' => ['Espacio solicitado', 'select', [
                'Punto Digital Piedra Blanca',
                'Punto Digital La Tercena',
                'Punto Digital San Antonio',
            ]],
            'duracion' => ['Duración estimada', 'text'],
            'refrigerios' => ['¿Llevarán refrigerios?', 'select', ['Sí', 'No']],
            'procedencia' => ['Localidad o departamento de procedencia', 'text'],
            'vehiculos' => ['Vehículos previstos', 'text'],
            'sede' => ['Sede solicitada', 'select', ['Polideportivo', 'Microestadio Evita']],
            'residuo' => ['Tipo de residuo', 'text'],
            'cantidad' => ['Cantidad aproximada', 'text'],
            'especie' => ['Especie solicitada', 'text'],
            'animales' => ['Tipo de animales', 'text'],
            'visitante' => ['Tipo de visitante', 'select', ['Institución', 'Público general']],
        ];

        return array_map(function (string $field) use ($definitions): array {
            $name = rtrim($field, '?');
            [$label, $type] = $definitions[$name];

            return [
                'name' => $name,
                'label' => $label,
                'type' => $type,
                'required' => $name === $field,
                ...($type === 'select' ? ['options' => $definitions[$name][2]] : []),
            ];
        }, explode(' ', $fields));
    }

    /**
     * @return list<list<string>>
     */
    private function entries(): array
    {
        return [
            ['2', 'eventos', 'sonido', 'Solicitar sonido para un evento', 'comunicacion', 'Vecinos e instituciones', 'lugar fecha desde hasta personas equipos', 'Comunicación evalúa la agenda y la disponibilidad de equipos.'],
            ['3', 'eventos', 'locucion', 'Solicitar locución', 'comunicacion', 'Vecinos e instituciones', 'lugar fecha desde hasta personas equipos grilla', 'Comunicación confirma si puede cubrir el evento.'],
            ['4', 'eventos', 'transporte', 'Solicitar transporte municipal', 'privada-intendencia', 'Vecinos e instituciones', 'origen destino fecha salida regreso personas', 'Intendencia confirma disponibilidad y condiciones del traslado.'],
            ['5', 'comercio-bromatologia', 'muestras-agua', 'Análisis de agua de red o tanque', 'bromatologia', 'Instituciones', 'origen_agua lugar analisis', 'Bromatología indica cómo tomar y entregar la muestra.', 'Arancel según el análisis. Monto a confirmar por Bromatología.'],
            ['6', 'comercio-bromatologia', 'charlas-alimentacion', 'Charlas sobre alimentación y salud', 'bromatologia', 'Vecinos, instituciones y emprendimientos', 'tema lugar fecha personas edades', 'Bromatología coordina la actividad.'],
            ['7', 'juventudes', 'orientacion-vocacional', 'Orientación vocacional', 'politicas-juveniles', 'Estudiantes próximos a egresar, centros de estudiantes e instituciones', 'modalidad lugar fecha personas edades', 'Políticas Juveniles indica la modalidad y coordina el encuentro.'],
            ['8', 'juventudes', 'talleres-prevencion', 'Talleres de prevención para instituciones', 'politicas-juveniles', 'Instituciones', 'tema lugar fecha personas edades', 'Políticas Juveniles confirma tema y fecha.'],
            ['9', 'juventudes', 'consulta-beca', 'Consultar por la beca estudiantil municipal', 'politicas-juveniles', 'Jóvenes y estudiantes', 'consulta', 'Políticas Juveniles orienta sobre requisitos y canal de postulación.', 'Sin costo para la consulta.'],
            ['10,11', 'eventos', 'cobertura-eventos', 'Pedir cobertura para un evento', 'transito', 'Vecinos e instituciones', 'cobertura lugar fecha desde hasta personas detalle', 'Mesa de Entrada confirma el área principal y coordina con Guardia Urbana cuando corresponde.', '', 'Croquis del operativo o recorrido'],
            ['12', 'desarrollo-social-area-mujer-infancias', 'juego-aprendo', 'Juego, aprendo y me divierto', 'infancias-juventudes-familias', 'Escuelas iniciales y primarias, para grupos de 3 a 11 años', 'institucion lugar fecha personas edades', 'Infancias confirma la actividad y fecha.'],
            ['13', 'desarrollo-social-area-mujer-infancias', 'estimulacion-cognitiva', 'Taller de estimulación cognitiva', 'infancias-juventudes-familias', 'Personas desde 55 años y centros de jubilados', 'lugar fecha personas edades', 'Infancias confirma modalidad y fecha.'],
            ['14', 'desarrollo-social-area-mujer-infancias', 'emociones-bullying', 'Taller sobre emociones y bullying', 'infancias-juventudes-familias', 'Instituciones con alumnos de primer o segundo ciclo', 'institucion ciclo lugar fecha personas edades', 'Infancias confirma la actividad y fecha.'],
            ['15', 'desarrollo-social-area-mujer-infancias', 'primeras-infancias', 'Primeras Infancias Primero (PIP)', 'infancias-juventudes-familias', 'Familias con niños de hasta 5 años. Las embarazadas pueden consultar por el programa', 'motivo lugar fecha', 'Infancias evalúa la incorporación e informa el próximo paso.'],
            ['16,17', 'desarrollo-social-area-mujer-infancias', 'charlas-area-mujer', 'Charlas del Área de la Mujer', 'area-mujer', 'Instituciones y público general, según la modalidad', 'charla tema lugar fecha personas edades', 'El Área de la Mujer confirma actividad institucional o abierta.'],
            ['18', 'desarrollo-social-area-mujer-infancias', 'prestamo-ortopedia', 'Pedir un elemento de ortopedia en préstamo', 'accion-social', 'Vecinos con domicilio en el departamento', 'elemento lugar edad fecha', 'Acción Social confirma disponibilidad y coordina la entrega.', '', 'Copia del DNI'],
            ['19', 'desarrollo-social-area-mujer-infancias', 'que-bien-te-veo', 'Consultar por el programa Qué Bien Te Veo', 'accion-social', 'Vecinos con domicilio en el departamento', 'consulta', 'Acción Social informa apertura y cómo presentar la documentación cuando se habilite el período.', 'Sin costo para la consulta.'],
            ['20', 'desarrollo-social-area-mujer-infancias', 'modulo-alimentario', 'Solicitar un módulo alimentario', 'accion-social', 'Vecinos con domicilio en el departamento', 'lugar motivo', 'Acción Social evalúa la solicitud y coordina según disponibilidad.', '', 'Copia del DNI'],
            ['21', 'cultura-deportes-turismo-emprendedurismo', 'prestamo-campamento', 'Pedir el Campamento Juvenil en préstamo', 'accion-social', 'Instituciones', 'institucion actividad fecha desde hasta personas', 'Acción Social valida el pedido y coordina disponibilidad con Administración.', '', 'Copia del DNI de la persona responsable'],
            ['22', 'cultura-deportes-turismo-emprendedurismo', 'alquiler-campamento', 'Alquilar el Campamento Juvenil', 'administracion-social', 'Vecinos e instituciones', 'actividad fecha desde hasta personas', 'Administración confirma disponibilidad, importe y forma de pago.', 'Arancel por persona. Importe a confirmar.', 'Copia del DNI de la persona responsable'],
            ['23', 'servicios-publicos-asistencia-operativa', 'desmalezado-limpieza', 'Pedir limpieza, desmalezado o retiro asociado', 'servicios-generales', 'Vecinos e instituciones', 'lugar detalle', 'Servicios Generales evalúa y programa la intervención.', 'Puede requerir colaboración de combustible. Condiciones a confirmar.', 'Fotos del lugar'],
            ['24', 'servicios-publicos-asistencia-operativa', 'poda-cerca-cables', 'Pedir poda cerca de cables o luminarias', 'servicios-publicos', 'Vecinos e instituciones', 'lugar interferencia detalle', 'Servicios Públicos evalúa el pedido y coordina la intervención.', '', 'Fotos del lugar'],
            ['25', 'servicios-publicos-asistencia-operativa', 'mantenimiento-institucional', 'Solicitar mantenimiento eléctrico institucional', 'servicios-publicos', 'Instituciones', 'institucion lugar detalle', 'Servicios Públicos revisa insumos y confirma la intervención.', '', 'Fotos del lugar'],
            ['26', 'servicios-publicos-asistencia-operativa', 'asistencia-eventos', 'Pedir asistencia eléctrica para un evento', 'servicios-publicos', 'Vecinos e instituciones', 'lugar fecha desde hasta equipos', 'Servicios Públicos verifica suministro y agenda.', '', 'Fotos del lugar'],
            ['27', 'rentas-tasas', 'exencion-tasas', 'Solicitar exención de tasas municipales', 'rentas', 'Titulares, representantes e instituciones', 'identificacion motivo cuenta', 'Rentas evalúa la acreditación y comunica la resolución.', 'Costo a confirmar por Rentas.', 'Acreditación de la exención y personería cuando corresponda'],
            ['28', 'haberes-institucional', 'novedades-descuentos', 'Informar altas o bajas de descuentos sobre haberes', 'liquidacion-haberes', 'Organismos habilitados', 'institucion periodo novedad', 'Liquidación de Haberes comunica aplicación u observación.', '', 'Nómina identificada y documentación respaldatoria'],
            ['29', 'haberes-institucional', 'altas-sidca', 'Informar altas por servicios de SIDCA', 'liquidacion-haberes', 'SIDCA', 'periodo servicio importe', 'Liquidación de Haberes registra el período aplicado.', '', 'Nómina identificada y respaldo del descuento'],
            ['30', 'modernizacion-punto-digital', 'capacitacion-ia', 'Solicitar capacitación en inteligencia artificial', 'modernizacion', 'Instituciones', 'institucion tema lugar fecha personas edades equipos?', 'Modernización confirma sede, equipamiento y fecha.'],
            ['31', 'modernizacion-punto-digital', 'uso-punto-digital-microcine', 'Pedir un espacio en Punto Digital', 'modernizacion', 'Instituciones', 'institucion espacio actividad fecha desde duracion personas equipos refrigerios', 'Modernización confirma disponibilidad o propone otra fecha.'],
            ['32', 'cultura-deportes-turismo-emprendedurismo', 'club-campo', 'Solicitar el Club de Campo Municipal', 'turismo', 'Instituciones', 'institucion procedencia actividad fecha desde hasta personas edades equipos?', 'Turismo confirma disponibilidad y condiciones.', 'Gratuidad para instituciones locales según condiciones. Otras tarifas a confirmar.', 'DNI responsable y personería cuando corresponda'],
            ['33', 'cultura-deportes-turismo-emprendedurismo', 'camping-pirquitas', 'Solicitar el Camping Municipal Las Pirquitas', 'turismo', 'Instituciones', 'institucion procedencia actividad fecha desde hasta personas edades vehiculos?', 'Turismo verifica cupo e informa condiciones.', 'Gratuidad para instituciones locales según condiciones. Otras tarifas a confirmar.', 'DNI responsable y personería cuando corresponda'],
            ['34', 'cultura-deportes-turismo-emprendedurismo', 'prestamo-instalaciones-elementos', 'Pedir instalaciones recreativas o elementos prestados', 'administracion-emprendedurismo', 'Instituciones', 'institucion actividad fecha desde hasta personas elemento', 'Administración confirma disponibilidad y coordina entrega y devolución.', '', 'DNI responsable y personería cuando corresponda'],
            ['35', 'cultura-deportes-turismo-emprendedurismo', 'visita-sala-malvinas', 'Visita escolar a la sala Malvinas', 'cultura', 'Escuelas', 'institucion fecha personas edades', 'Cultura confirma cupo y horario.'],
            ['36', 'cultura-deportes-turismo-emprendedurismo', 'juego-ludico-esquiu', 'Solicitar Juego Lúdico de Esquiú', 'cultura', 'Instituciones', 'institucion lugar fecha personas edades', 'Cultura confirma modalidad y fecha.'],
            ['37', 'cultura-deportes-turismo-emprendedurismo', 'arte-en-tus-manos', 'Solicitar Arte en tus Manos', 'cultura', 'Instituciones', 'institucion lugar fecha personas edades', 'Cultura acuerda la actividad y confirma fecha.'],
            ['38', 'cultura-deportes-turismo-emprendedurismo', 'participacion-artistas', 'Pedir participación de artistas en un evento', 'cultura', 'Vecinos, instituciones y emprendimientos', 'actividad lugar fecha personas edades', 'Cultura verifica disponibilidad y responde.'],
            ['39', 'cultura-deportes-turismo-emprendedurismo', 'cancha-futbol-11', 'Alquilar cancha de fútbol 11', 'deportes', 'Vecinos e instituciones', 'procedencia actividad fecha desde hasta personas edades', 'Deportes confirma turno, condiciones e importe.', 'Arancel por hora o gratuidad institucional local según condiciones. Importe a confirmar.', 'DNI responsable y personería cuando corresponda'],
            ['40', 'cultura-deportes-turismo-emprendedurismo', 'cancha-hockey', 'Alquilar cancha de hockey', 'deportes', 'Vecinos e instituciones', 'procedencia actividad fecha desde hasta personas edades', 'Deportes confirma turno, condiciones e importe.', 'Arancel por hora o gratuidad institucional local según condiciones. Importe a confirmar.', 'DNI responsable y personería cuando corresponda'],
            ['41', 'cultura-deportes-turismo-emprendedurismo', 'polideportivo-evita', 'Solicitar Polideportivo o Microestadio Evita', 'deportes', 'Instituciones', 'institucion procedencia sede actividad fecha desde hasta personas', 'Deportes confirma elegibilidad, agenda y condiciones.', 'Arancel o gratuidad según procedencia. Importe a confirmar.', 'DNI responsable y personería cuando corresponda'],
            ['42', 'ambiente', 'retiro-residuos-domicilio', 'Pedir retiro de residuos en domicilio', 'medio-ambiente', 'Vecinos, instituciones y comercios', 'lugar residuo cantidad', 'Medio Ambiente verifica si el residuo es admisible y confirma retiro o alternativa.', '', 'Fotos de los residuos'],
            ['43', 'ambiente', 'charla-ambiente', 'Pedir una charla de ambiente y residuos', 'medio-ambiente', 'Instituciones', 'institucion tema lugar fecha personas edades', 'Medio Ambiente confirma la actividad o propone otra fecha.'],
            ['44', 'ambiente', 'visita-planta', 'Visitar la planta de tratamiento', 'medio-ambiente', 'Instituciones', 'institucion fecha personas edades', 'Medio Ambiente verifica cupo y confirma visita.'],
            ['45', 'ambiente', 'desinfeccion-institucional', 'Pedir desinfección institucional', 'produccion', 'Instituciones', 'institucion lugar fecha detalle', 'Producción evalúa la intervención y coordina el servicio.'],
            ['46', 'ambiente', 'donacion-plantines', 'Solicitar donación de plantines', 'produccion', 'Instituciones y productores', 'lugar destino cantidad? fecha?', 'Producción informa disponibilidad y modalidad de entrega.'],
            ['47', 'ambiente', 'donacion-forestales', 'Solicitar donación de árboles forestales', 'produccion', 'Instituciones', 'institucion lugar destino cantidad? especie?', 'Producción confirma disponibilidad y coordina entrega.'],
            ['48', 'ambiente', 'charla-huertas', 'Pedir una charla sobre huertas o producción', 'produccion', 'Instituciones y productores', 'tema lugar fecha personas edades', 'Producción acuerda contenidos y confirma fecha.'],
            ['49', 'ambiente', 'vacunacion-produccion', 'Consultar por vacunación para animales de producción', 'produccion', 'Productores', 'lugar animales cantidad detalle', 'Producción confirma especies, cobertura y condiciones.'],
            ['50', 'ambiente', 'campana-prevencion', 'Solicitar una campaña de prevención', 'produccion', 'Vecinos, instituciones y productores', 'tema lugar fecha detalle', 'Producción confirma el alcance o indica el área correspondiente.'],
            ['51', 'ambiente', 'castracion-domiciliaria', 'Solicitar castración domiciliaria', 'zoonosis', 'Vecinos con domicilio en el departamento', 'lugar fecha animales?', 'Zoonosis evalúa la inclusión en el programa y confirma los pasos.'],
            ['52', 'ambiente', 'charla-zoonosis', 'Pedir una charla de Zoonosis', 'zoonosis', 'Instituciones, vecinos y productores', 'tema lugar fecha personas edades', 'Zoonosis acuerda contenido y agenda.'],
            ['53,54', 'ambiente', 'visita-botanico', 'Solicitar visita al Parque Botánico', 'parque-botanico', 'Instituciones locales o de otros departamentos y público general', 'visitante procedencia fecha personas edades', 'Parque Botánico confirma si requiere reserva, cupo y condiciones.', 'Tarifa, descuentos o gratuidad según visitante. A confirmar.', 'Nota firmada para instituciones'],
            ['55', 'servicios-publicos-asistencia-operativa', 'poda', 'Pedir poda o trozado', 'espacios-verdes', 'Vecinos e instituciones', 'lugar interferencia fecha detalle', 'Espacios Verdes verifica el alcance. Para interferencia con cables o luminarias, elegí la ficha de poda cerca de cables.'],
            ['56', 'ambiente', 'donacion-lena', 'Solicitar donación de leña', 'espacios-verdes', 'Vecinos, instituciones y emprendimientos', 'lugar destino cantidad? fecha?', 'Espacios Verdes verifica stock y coordina entrega o retiro.'],
        ];
    }
}
