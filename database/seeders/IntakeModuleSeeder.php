<?php

namespace Database\Seeders;

use App\Enums\IntakeDerivationStatus;
use App\Enums\IntakeRequestStatus;
use App\Models\IntakeAssistanceType;
use App\Models\IntakeDepartment;
use App\Models\IntakeDerivation;
use App\Models\IntakeRequest;
use App\Models\IntakeRequestSubtype;
use App\Models\IntakeRequestType;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\Hash;

class IntakeModuleSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $activeTypeSlugs = collect($this->types())->pluck('slug')->all();

        foreach ($this->types() as $type) {
            IntakeRequestType::updateOrCreate(
                ['slug' => $type['slug']],
                $type,
            );
        }

        IntakeRequestType::whereIn('slug', $this->legacyPublicTypeSlugs())
            ->whereNotIn('slug', $activeTypeSlugs)
            ->update(['active' => false]);

        $departments = collect($this->departments())->mapWithKeys(function (array $department): array {
            return [
                $department['slug'] => IntakeDepartment::updateOrCreate(
                    ['slug' => $department['slug']],
                    $department,
                ),
            ];
        });

        foreach ($this->assistanceTypes() as $assistanceType) {
            IntakeAssistanceType::updateOrCreate(
                ['slug' => $assistanceType['slug']],
                [
                    ...Arr::except($assistanceType, 'department_slug'),
                    'default_intake_department_id' => $departments[$assistanceType['department_slug']]?->id,
                ],
            );
        }

        $types = IntakeRequestType::whereIn('slug', collect($this->types())->pluck('slug'))->get()->keyBy('slug');
        $assistanceTypes = IntakeAssistanceType::whereIn('slug', collect($this->assistanceTypes())->pluck('slug'))->get()->keyBy('slug');

        foreach ($this->subtypes() as $subtype) {
            $type = $types[$subtype['type_slug']] ?? null;

            if (! $type) {
                continue;
            }

            IntakeRequestSubtype::updateOrCreate(
                [
                    'intake_request_type_id' => $type->id,
                    'slug' => $subtype['slug'],
                ],
                [
                    ...Arr::except($subtype, ['type_slug', 'assistance_type_slug']),
                    'default_intake_assistance_type_id' => isset($subtype['assistance_type_slug'])
                        ? ($assistanceTypes[$subtype['assistance_type_slug']]?->id ?? null)
                        : null,
                ],
            );
        }

        User::updateOrCreate(
            ['email' => 'servicios@municipio.test'],
            [
                'name' => 'Encargado Servicios Publicos',
                'password' => Hash::make('password'),
                'role' => 'intake_department',
                'intake_department_id' => $departments['servicios-publicos']?->id,
                'email_verified_at' => now(),
            ],
        );

        $this->seedServicesDemo($departments['servicios-publicos'], IntakeAssistanceType::where('slug', 'servicios-publicos-asistencia-operativa')->first());
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    private function types(): array
    {
        return [
            [
                'slug' => 'presentacion-general',
                'name' => 'Presentacion general',
                'category' => 'Presentaciones',
                'description' => 'Usa esta opcion cuando ninguna alternativa coincide exactamente con lo que necesitas.',
                'icon' => 'file-text',
                'color' => '#d93397',
                'estimated_time' => null,
                'cost_information' => 'Segun el tramite, Mesa de Entrada informara si corresponde algun arancel.',
                'requirements' => ['Datos de contacto', 'Detalle de la solicitud'],
                'schema' => [
                    ['type' => 'textarea', 'name' => 'detalle', 'label' => 'Escribi tu solicitud con tus palabras', 'required' => true],
                    ['type' => 'text', 'name' => 'referencia', 'label' => 'Referencia o ubicacion si corresponde', 'required' => false],
                ],
                'active' => true,
            ],
            [
                'slug' => 'comercio-bromatologia',
                'name' => 'Comercio, habilitaciones y bromatologia',
                'category' => 'Gobierno',
                'description' => 'Inicia solicitudes vinculadas a habilitaciones comerciales, bromatologia, espectaculos publicos y controles sanitarios.',
                'icon' => 'store',
                'color' => '#2e75b8',
                'estimated_time' => null,
                'cost_information' => 'La mayoria figura sin costo en el relevamiento; el area confirmara si corresponde arancel o multa.',
                'requirements' => ['DNI o CUIT', 'Datos del comercio o actividad', 'Documentacion respaldatoria si corresponde'],
                'schema' => [
                    ['type' => 'select', 'name' => 'tipo_tramite', 'label' => 'Tipo de tramite', 'required' => true, 'options' => ['Habilitacion comercial', 'Habilitacion comercial y bromatologica', 'Renovacion bromatologica', 'Espectaculo publico', 'Manipulacion de alimentos', 'Muestras de agua', 'Denuncia o reclamo bromatologico', 'Otro']],
                    ['type' => 'text', 'name' => 'cuit', 'label' => 'CUIT si corresponde', 'required' => false],
                    ['type' => 'text', 'name' => 'comercio_actividad', 'label' => 'Comercio, actividad o evento', 'required' => false],
                    ['type' => 'textarea', 'name' => 'detalle', 'label' => 'Detalle de la solicitud', 'required' => true],
                ],
                'active' => true,
            ],
            [
                'slug' => 'rentas-tasas',
                'name' => 'Rentas y tasas municipales',
                'category' => 'Hacienda',
                'description' => 'Solicita libres deuda, altas o bajas comerciales, consultas de deuda, pagos y exenciones de tasas municipales.',
                'icon' => 'credit-card',
                'color' => '#2563eb',
                'estimated_time' => null,
                'cost_information' => 'Puede tener costo segun la tasa, deuda o tramite solicitado.',
                'requirements' => ['DNI o CUIT', 'Numero de cuenta o partida si lo tenes', 'Comprobante si corresponde'],
                'schema' => [
                    ['type' => 'select', 'name' => 'tipo_tramite', 'label' => 'Tipo de tramite', 'required' => true, 'options' => ['Libre deuda inmobiliario', 'Libre deuda comercial', 'Libre deuda escuela municipal', 'Alta comercial', 'Baja comercial', 'Consulta de deuda o pago', 'Exencion de tasas', 'Otro']],
                    ['type' => 'text', 'name' => 'dni_cuit', 'label' => 'DNI o CUIT', 'required' => true],
                    ['type' => 'text', 'name' => 'cuenta_partida', 'label' => 'Cuenta, partida o comercio', 'required' => false],
                    ['type' => 'textarea', 'name' => 'consulta', 'label' => 'Detalle de la consulta', 'required' => true],
                ],
                'active' => true,
            ],
            [
                'slug' => 'catastro-obras-cementerio',
                'name' => 'Catastro, obras privadas y cementerio',
                'category' => 'Obras y Servicios Publicos',
                'description' => 'Presenta consultas o solicitudes sobre inmuebles, planos, subdivisiones, loteos, obras privadas y gestiones de cementerio.',
                'icon' => 'home',
                'color' => '#123d67',
                'estimated_time' => null,
                'cost_information' => 'Puede tener costo segun la gestion o derecho municipal aplicable.',
                'requirements' => ['DNI o CUIT', 'Ubicacion del inmueble o cementerio', 'Plano o documentacion disponible si corresponde'],
                'schema' => [
                    ['type' => 'select', 'name' => 'tipo_tramite', 'label' => 'Tipo de tramite', 'required' => true, 'options' => ['Aprobacion de planos', 'Subdivision o loteo', 'Gestion de cementerio', 'Consulta sobre inmueble', 'Otra presentacion']],
                    ['type' => 'text', 'name' => 'ubicacion', 'label' => 'Ubicacion o referencia', 'required' => true],
                    ['type' => 'textarea', 'name' => 'detalle', 'label' => 'Detalle de la solicitud', 'required' => true],
                ],
                'active' => true,
            ],
            [
                'slug' => 'juzgado-faltas',
                'name' => 'Juzgado de Faltas',
                'category' => 'Juzgado de Faltas',
                'description' => 'Consulta actas o infracciones, solicita informes libres de infracciones, presenta descargos o denuncias por contravenciones.',
                'icon' => 'scale',
                'color' => '#64748b',
                'estimated_time' => null,
                'cost_information' => 'Sin costo informado; una infraccion puede derivar en multa segun corresponda.',
                'requirements' => ['DNI', 'Numero de acta o dominio si corresponde', 'Documentacion respaldatoria'],
                'schema' => [
                    ['type' => 'select', 'name' => 'tipo_tramite', 'label' => 'Tipo de tramite', 'required' => true, 'options' => ['Informacion por acta o infraccion', 'Informe libre de infracciones', 'Descargo por infraccion', 'Denuncia por contravencion', 'Otro']],
                    ['type' => 'text', 'name' => 'acta_dominio', 'label' => 'Numero de acta, expediente o dominio', 'required' => false],
                    ['type' => 'textarea', 'name' => 'detalle', 'label' => 'Detalle de la solicitud', 'required' => true],
                ],
                'active' => true,
            ],
            [
                'slug' => 'tesoreria-proveedores',
                'name' => 'Tesoreria y proveedores',
                'category' => 'Hacienda',
                'description' => 'Realiza consultas de pagos a proveedores, actualiza CBU, reclama pagos no acreditados o solicita comprobantes y retenciones.',
                'icon' => 'receipt',
                'color' => '#0f766e',
                'estimated_time' => null,
                'cost_information' => 'Sin costo informado.',
                'schema' => [
                    ['type' => 'select', 'name' => 'tipo_tramite', 'label' => 'Tipo de tramite', 'required' => true, 'options' => ['Consulta de estado de pago', 'Actualizar CBU', 'Reclamo por pago no acreditado', 'Solicitar comprobante o retenciones', 'Otro']],
                    ['type' => 'text', 'name' => 'cuit_proveedor', 'label' => 'CUIT o identificacion del proveedor', 'required' => false],
                    ['type' => 'textarea', 'name' => 'detalle', 'label' => 'Detalle de la solicitud', 'required' => true],
                ],
                'requirements' => ['DNI o CUIT', 'Datos del proveedor o expediente si corresponde', 'Comprobante si corresponde'],
                'active' => true,
            ],
            [
                'slug' => 'modernizacion-punto-digital',
                'name' => 'Modernizacion y Punto Digital',
                'category' => 'Hacienda',
                'description' => 'Inscribite o solicita informacion sobre cursos, capacitaciones, inteligencia artificial y uso de espacios de Punto Digital o Microcine.',
                'icon' => 'monitor',
                'color' => '#84bd1a',
                'estimated_time' => null,
                'cost_information' => 'Gratuito segun el relevamiento.',
                'requirements' => ['Datos de contacto', 'Actividad o espacio solicitado'],
                'schema' => [
                    ['type' => 'select', 'name' => 'tipo_solicitud', 'label' => 'Tipo de solicitud', 'required' => true, 'options' => ['Cursos y capacitaciones', 'Capacitacion sobre inteligencia artificial', 'Uso de Punto Digital', 'Uso de Microcine', 'Otra']],
                    ['type' => 'textarea', 'name' => 'detalle', 'label' => 'Detalle de la solicitud', 'required' => true],
                ],
                'active' => true,
            ],
            [
                'slug' => 'servicios-publicos-asistencia-operativa',
                'name' => 'Servicios publicos y asistencia operativa',
                'category' => 'Obras y Servicios Publicos',
                'description' => 'Solicita servicio atmosferico, poda, desmalezado, limpieza, mantenimiento institucional, asistencia a eventos u obras menores.',
                'icon' => 'wrench',
                'color' => '#16a34a',
                'estimated_time' => null,
                'cost_information' => 'Algunas prestaciones pueden requerir colaboracion o arancel; el area lo confirmara. Alumbrado se gestiona en Reclamos.',
                'requirements' => ['Datos de contacto', 'Ubicacion precisa', 'Fotos o documentacion si corresponde'],
                'schema' => [
                    ['type' => 'select', 'name' => 'tipo_solicitud', 'label' => 'Tipo de solicitud', 'required' => true, 'options' => ['Servicio atmosferico', 'Poda', 'Desmalezado o limpieza', 'Mantenimiento institucional', 'Asistencia a eventos', 'Obras nuevas o mantenimiento edilicio', 'Otro']],
                    ['type' => 'text', 'name' => 'ubicacion', 'label' => 'Ubicacion del pedido', 'required' => true],
                    ['type' => 'textarea', 'name' => 'detalle', 'label' => 'Detalle de la solicitud', 'required' => true],
                ],
                'active' => true,
            ],
            [
                'slug' => 'desarrollo-social-area-mujer-infancias',
                'name' => 'Desarrollo Social, Area Mujer e Infancias',
                'category' => 'Desarrollo Social',
                'description' => 'Solicita orientacion juridica, psicologica o social, charlas, talleres y programas de infancias, juventudes y familias.',
                'icon' => 'heart-handshake',
                'color' => '#d93397',
                'estimated_time' => null,
                'cost_information' => 'Gratuito segun el relevamiento.',
                'requirements' => ['Datos de contacto', 'Motivo de la solicitud', 'Documentacion si corresponde'],
                'schema' => [
                    ['type' => 'select', 'name' => 'tipo_solicitud', 'label' => 'Tipo de solicitud', 'required' => true, 'options' => ['Atencion juridica', 'Atencion psicologica', 'Trabajo social', 'Charla o taller', 'Programa de infancias o juventudes', 'Otro']],
                    ['type' => 'textarea', 'name' => 'detalle', 'label' => 'Detalle de la solicitud', 'required' => true],
                ],
                'active' => true,
            ],
            [
                'slug' => 'cultura-deportes-turismo-emprendedurismo',
                'name' => 'Cultura, deportes, turismo y emprendedurismo',
                'category' => 'Turismo, Deporte, Cultura y Emprendedurismo',
                'description' => 'Solicita ayudas economicas, uso de instalaciones, visitas guiadas, talleres deportivos o culturales y actividades turisticas.',
                'icon' => 'landmark',
                'color' => '#7c3aed',
                'estimated_time' => null,
                'cost_information' => 'En general gratuito; las ayudas y usos de espacios quedan sujetos a evaluacion del area.',
                'requirements' => ['Datos de contacto', 'Institucion o actividad si corresponde', 'Nota o respaldo si corresponde'],
                'schema' => [
                    ['type' => 'select', 'name' => 'tipo_solicitud', 'label' => 'Tipo de solicitud', 'required' => true, 'options' => ['Ayuda economica deportiva', 'Ayuda economica para emprendedores', 'Ayuda economica cultural', 'Uso de instalaciones o elementos', 'Visita guiada', 'Taller deportivo', 'Taller cultural', 'Actividad turistica', 'Otro']],
                    ['type' => 'text', 'name' => 'institucion_actividad', 'label' => 'Institucion, club, emprendimiento o actividad', 'required' => false],
                    ['type' => 'date', 'name' => 'fecha_evento', 'label' => 'Fecha del evento o actividad', 'required' => false],
                    ['type' => 'textarea', 'name' => 'detalle', 'label' => 'Detalle de la solicitud', 'required' => true],
                ],
                'active' => true,
            ],
            [
                'slug' => 'rrhh-empleados-municipales',
                'name' => 'RRHH para empleados municipales',
                'category' => 'Gobierno',
                'description' => 'Tramites internos para empleados municipales: jubilaciones, certificaciones, liquidaciones, OSEP, sumarios y consultas previsionales.',
                'icon' => 'users',
                'color' => '#475569',
                'estimated_time' => null,
                'cost_information' => 'Sin costo informado.',
                'requirements' => ['Solo para empleados municipales', 'DNI o legajo', 'Documentacion respaldatoria segun tramite'],
                'schema' => [
                    ['type' => 'select', 'name' => 'tipo_tramite', 'label' => 'Tipo de tramite', 'required' => true, 'options' => ['Jubilaciones y pensiones', 'Baja por fallecimiento', 'Liquidacion final', '82% movil', 'Planilla complementaria', 'Sumario', 'Certificacion', 'Afiliacion OSEP', 'Consulta previsional', 'Otro']],
                    ['type' => 'text', 'name' => 'legajo', 'label' => 'Legajo si lo conoce', 'required' => false],
                    ['type' => 'textarea', 'name' => 'detalle', 'label' => 'Detalle de la solicitud', 'required' => true],
                ],
                'active' => false,
            ],
        ];
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    private function departments(): array
    {
        return [
            [
                'slug' => 'servicios-publicos',
                'name' => 'Servicios Publicos',
                'description' => 'Limpieza, desmalezado, apoyo operativo y mantenimiento urbano.',
                'secretariat' => 'Obras y Servicios Publicos',
                'color' => '#16a34a',
                'active' => true,
            ],
            [
                'slug' => 'transito',
                'name' => 'Transito y Seguridad Vial',
                'description' => 'Ordenamiento vehicular, cortes, acompanamiento y seguridad vial.',
                'secretariat' => 'Obras y Servicios Publicos',
                'color' => '#dc2626',
                'active' => true,
            ],
            [
                'slug' => 'gobierno',
                'name' => 'Gobierno',
                'description' => 'Autorizaciones, permisos y coordinacion institucional.',
                'secretariat' => 'Gobierno',
                'color' => '#2563eb',
                'active' => true,
            ],
            [
                'slug' => 'inspeccion-comercio',
                'name' => 'Inspeccion y Comercio',
                'description' => 'Habilitaciones comerciales, espectaculos publicos y controles de convivencia.',
                'secretariat' => 'Gobierno',
                'color' => '#2e75b8',
                'active' => true,
            ],
            [
                'slug' => 'bromatologia',
                'name' => 'Bromatologia',
                'description' => 'Habilitaciones, capacitaciones, muestras y controles bromatologicos.',
                'secretariat' => 'Gobierno',
                'color' => '#0f766e',
                'active' => true,
            ],
            [
                'slug' => 'rrhh',
                'name' => 'Recursos Humanos',
                'description' => 'Tramites internos de agentes municipales.',
                'secretariat' => 'Gobierno',
                'color' => '#475569',
                'active' => true,
            ],
            [
                'slug' => 'rentas',
                'name' => 'Rentas',
                'description' => 'Tasas, deudas, libres deuda, altas y bajas comerciales.',
                'secretariat' => 'Hacienda',
                'color' => '#2563eb',
                'active' => true,
            ],
            [
                'slug' => 'caja-previsional',
                'name' => 'Caja Previsional',
                'description' => 'Consultas y certificaciones previsionales.',
                'secretariat' => 'Hacienda',
                'color' => '#64748b',
                'active' => true,
            ],
            [
                'slug' => 'tesoreria',
                'name' => 'Tesoreria',
                'description' => 'Pagos a proveedores, CBU, comprobantes y retenciones.',
                'secretariat' => 'Hacienda',
                'color' => '#0f766e',
                'active' => true,
            ],
            [
                'slug' => 'juzgado-faltas',
                'name' => 'Juzgado Administrativo Municipal de Faltas',
                'description' => 'Actas, infracciones, descargos y denuncias contravencionales.',
                'secretariat' => 'Juzgado Administrativo Municipal de Faltas',
                'color' => '#64748b',
                'active' => true,
            ],
            [
                'slug' => 'modernizacion',
                'name' => 'Modernizacion',
                'description' => 'Punto Digital, capacitaciones y uso de espacios tecnologicos.',
                'secretariat' => 'Hacienda',
                'color' => '#84bd1a',
                'active' => true,
            ],
            [
                'slug' => 'catastro',
                'name' => 'Catastro',
                'description' => 'Planos, subdivisiones, loteos y gestiones de cementerio.',
                'secretariat' => 'Obras y Servicios Publicos',
                'color' => '#123d67',
                'active' => true,
            ],
            [
                'slug' => 'servicios-generales',
                'name' => 'Servicios Generales',
                'description' => 'Servicio atmosferico y apoyo operativo institucional.',
                'secretariat' => 'Obras y Servicios Publicos',
                'color' => '#15803d',
                'active' => true,
            ],
            [
                'slug' => 'area-mujer',
                'name' => 'Area de la Mujer',
                'description' => 'Atencion juridica, psicologica, social, talleres y acompanamiento.',
                'secretariat' => 'Desarrollo Social',
                'color' => '#d93397',
                'active' => true,
            ],
            [
                'slug' => 'infancias-juventudes-familias',
                'name' => 'Infancias, Juventudes y Familias',
                'description' => 'Programas y talleres para infancias, juventudes y familias.',
                'secretariat' => 'Desarrollo Social',
                'color' => '#db2777',
                'active' => true,
            ],
            [
                'slug' => 'cultura',
                'name' => 'Cultura',
                'description' => 'Talleres, artistas, visitas y actividades culturales.',
                'secretariat' => 'Turismo, Deporte, Cultura y Emprendedurismo',
                'color' => '#7c3aed',
                'active' => true,
            ],
            [
                'slug' => 'deportes',
                'name' => 'Deportes',
                'description' => 'Talleres deportivos, clubes, ayudas y uso de instalaciones.',
                'secretariat' => 'Turismo, Deporte, Cultura y Emprendedurismo',
                'color' => '#dc2626',
                'active' => true,
            ],
            [
                'slug' => 'turismo',
                'name' => 'Turismo',
                'description' => 'Actividades turisticas y recreativas.',
                'secretariat' => 'Turismo, Deporte, Cultura y Emprendedurismo',
                'color' => '#ca8a04',
                'active' => true,
            ],
            [
                'slug' => 'administracion-emprendedurismo',
                'name' => 'Administracion y Emprendedurismo',
                'description' => 'Ayudas economicas y acompaniamiento a emprendedores.',
                'secretariat' => 'Turismo, Deporte, Cultura y Emprendedurismo',
                'color' => '#9333ea',
                'active' => true,
            ],
        ];
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    private function subtypes(): array
    {
        return [
            ...$this->subtypesFor('comercio-bromatologia', 'comercio-habilitaciones', [
                ['habilitacion-comercial', 'Habilitacion comercial', 'Registro o inicio de habilitacion municipal de comercio.', 'Certificado de habilitacion municipal.', 'Sin costo informado; el area confirma si corresponde arancel.', ['DNI o CUIT', 'Constancia de CUIT', 'Datos del local y actividad comercial']],
                ['habilitacion-comercial-bromatologica', 'Habilitacion comercial y bromatologica', 'Habilitacion para actividades comerciales que requieren intervencion bromatologica.', 'Certificado de habilitacion comercial y bromatologica.', 'Sin costo informado; el area confirma si corresponde arancel.', ['DNI o CUIT', 'Constancia de CUIT', 'Datos del local', 'Documentacion bromatologica disponible']],
                ['espectaculo-publico', 'Espectaculo publico', 'Autorizacion para espectaculos bailables, deportivos o a beneficio.', 'Certificado o autorizacion para el evento.', 'Sin costo informado; puede derivar en derechos o tasas segun corresponda.', ['Nota dirigida al area competente', 'Datos del organizador', 'Lugar y fecha del evento']],
            ], [
                ['type' => 'text', 'name' => 'cuit', 'label' => 'CUIT si corresponde', 'required' => false],
                ['type' => 'text', 'name' => 'actividad', 'label' => 'Actividad, comercio o evento', 'required' => true],
                ['type' => 'text', 'name' => 'domicilio_comercial', 'label' => 'Domicilio o lugar', 'required' => true],
                ['type' => 'textarea', 'name' => 'detalle', 'label' => 'Detalle de la solicitud', 'required' => true],
            ]),
            ...$this->subtypesFor('comercio-bromatologia', 'bromatologia', [
                ['renovacion-bromatologica', 'Renovacion bromatologica', 'Renovacion anual de habilitacion bromatologica.', 'Renovacion de habilitacion bromatologica.', 'Sin costo informado.', ['Nota de solicitud', 'DNI del titular', 'Carnet de manipulacion vigente', 'Certificado de desinfeccion vigente']],
                ['manipulacion-alimentos', 'Capacitacion en manipulacion de alimentos', 'Inscripcion o consulta sobre capacitaciones en manipulacion de alimentos.', 'Inscripcion o informacion de capacitacion.', 'Sin costo informado.', ['Datos de contacto', 'DNI']],
                ['muestras-agua', 'Muestras de agua', 'Solicitud vinculada a muestras de agua de red o tanque.', 'Recepcion y derivacion de muestra o informe correspondiente.', 'Sin costo informado.', ['Datos de contacto', 'Ubicacion de la muestra', 'Tipo de analisis requerido si lo conoce']],
                ['reclamo-bromatologico', 'Reclamo bromatologico', 'Reclamo por mercaderia vencida u otra situacion sanitaria.', 'Recepcion de denuncia y derivacion al area de control.', 'Sin costo informado; puede derivar en actuaciones segun corresponda.', ['Descripcion del hecho', 'Comercio o lugar', 'Fotos o respaldo si corresponde']],
            ], [
                ['type' => 'text', 'name' => 'lugar', 'label' => 'Comercio, institucion o lugar', 'required' => false],
                ['type' => 'textarea', 'name' => 'detalle', 'label' => 'Detalle de la solicitud', 'required' => true],
            ]),
            ...$this->subtypesFor('rentas-tasas', 'rentas-tasas', [
                ['libre-deuda-inmobiliario', 'Libre deuda inmobiliario', 'Solicitud de libre deuda por tasa de barrido, limpieza e higiene urbana.', 'Informe o certificado de libre deuda.', 'Puede tener costo segun la tasa o deuda.', ['DNI o CUIT', 'Cuenta, partida o domicilio del inmueble']],
                ['libre-deuda-comercial', 'Libre deuda comercial', 'Solicitud de libre deuda por tasa de seguridad e higiene.', 'Informe o certificado de libre deuda comercial.', 'Puede tener costo segun la tasa o deuda.', ['DNI o CUIT', 'Datos del comercio']],
                ['alta-comercial-rentas', 'Alta comercial en tasas', 'Alta o empadronamiento comercial en tasa de seguridad e higiene.', 'Alta o empadronamiento en Rentas.', 'Puede tener costo segun normativa vigente.', ['DNI o CUIT', 'Datos del comercio', 'Domicilio comercial']],
                ['baja-comercial-rentas', 'Baja comercial en tasas', 'Baja comercial en tasa de seguridad e higiene.', 'Baja o constancia de tramite.', 'Puede tener costo segun estado de deuda.', ['DNI o CUIT', 'Datos del comercio']],
                ['consulta-deuda-pago-tasas', 'Consulta de deuda o pago de tasas', 'Consulta sobre deuda, pagos, comprobantes o tasas municipales.', 'Respuesta de Rentas o indicacion de pago.', 'Puede tener costo si existe deuda o tasa pendiente.', ['DNI o CUIT', 'Numero de cuenta si lo tenes']],
                ['exencion-tasas', 'Exencion de tasas municipales', 'Solicitud o consulta sobre exencion de pago de tasas municipales.', 'Recepcion y analisis de exencion.', 'Puede tener costo segun documentacion o tasa aplicable.', ['DNI o CUIT', 'Documentacion que respalde la exencion']],
            ], [
                ['type' => 'text', 'name' => 'dni_cuit', 'label' => 'DNI o CUIT', 'required' => true],
                ['type' => 'text', 'name' => 'cuenta_partida', 'label' => 'Cuenta, partida, comercio o domicilio', 'required' => false],
                ['type' => 'textarea', 'name' => 'consulta', 'label' => 'Detalle de la consulta', 'required' => true],
            ]),
            ...$this->subtypesFor('catastro-obras-cementerio', 'catastro-obras-cementerio', [
                ['aprobacion-planos', 'Aprobacion de planos, subdivisiones y loteos', 'Presentacion o consulta sobre planos, subdivisiones y loteos.', 'Recepcion para evaluacion por Catastro.', 'Puede tener costo segun derecho municipal aplicable.', ['DNI o CUIT', 'Ubicacion del inmueble', 'Plano o documentacion disponible']],
                ['gestion-cementerio', 'Gestion de cementerio', 'Solicitud por asignacion de nichos u otras gestiones de cementerio.', 'Recepcion y derivacion de la gestion.', 'Puede tener costo segun gestion solicitada.', ['DNI', 'Datos del cementerio o nicho si corresponde']],
                ['consulta-inmueble', 'Consulta sobre inmueble', 'Consulta o presentacion vinculada a inmueble, catastro u obra privada.', 'Respuesta o derivacion al area competente.', 'Puede tener costo segun tramite.', ['DNI o CUIT', 'Ubicacion o referencia']],
            ], [
                ['type' => 'text', 'name' => 'ubicacion', 'label' => 'Ubicacion o referencia', 'required' => true],
                ['type' => 'textarea', 'name' => 'detalle', 'label' => 'Detalle de la solicitud', 'required' => true],
            ]),
            ...$this->subtypesFor('juzgado-faltas', 'juzgado-faltas', [
                ['informacion-actas-infracciones', 'Informacion por actas o infracciones', 'Consulta sobre actas de comprobacion o infracciones.', 'Informacion del estado o indicacion de pasos a seguir.', 'Gratuito segun el relevamiento.', ['DNI', 'Numero de acta, expediente o dominio si corresponde']],
                ['libre-infracciones', 'Informe libre de infracciones', 'Solicitud de informe libre de infracciones.', 'Informe o constancia correspondiente.', 'Gratuito segun el relevamiento.', ['DNI', 'Dominio si corresponde']],
                ['descargo-infraccion', 'Descargo por infraccion', 'Presentacion de descargo ante una infraccion.', 'Recepcion de descargo para evaluacion.', 'Gratuito segun el relevamiento.', ['DNI', 'Numero de acta o expediente', 'Documentacion respaldatoria']],
                ['denuncia-contravencion', 'Denuncia por contravencion', 'Denuncia por contravenciones en general.', 'Recepcion y derivacion para intervencion.', 'Gratuito; una infraccion puede derivar en multa.', ['Descripcion del hecho', 'Lugar', 'Fotos o respaldo si corresponde']],
            ], [
                ['type' => 'text', 'name' => 'acta_dominio', 'label' => 'Acta, expediente o dominio', 'required' => false],
                ['type' => 'textarea', 'name' => 'detalle', 'label' => 'Detalle de la solicitud', 'required' => true],
            ]),
            ...$this->subtypesFor('tesoreria-proveedores', 'tesoreria-proveedores', [
                ['estado-pago-proveedores', 'Consulta de estado de pago a proveedores', 'Consulta sobre pagos a proveedores.', 'Respuesta sobre estado de pago.', 'Sin costo informado.', ['DNI o CUIT', 'Datos del proveedor o expediente si corresponde']],
                ['actualizacion-cbu', 'Presentacion o actualizacion de CBU', 'Carga o actualizacion de CBU para cobro de proveedores.', 'Recepcion de CBU para evaluacion.', 'Sin costo informado.', ['DNI o CUIT', 'Constancia de CBU']],
                ['pago-no-acreditado', 'Reclamo por pago no acreditado', 'Reclamo por transferencia o pago no acreditado.', 'Recepcion y revision por Tesoreria.', 'Sin costo informado.', ['DNI o CUIT', 'Comprobante o datos del pago']],
                ['comprobante-retenciones', 'Comprobante de pago o retenciones', 'Solicitud de comprobante de pago o detalle de retenciones.', 'Emision o respuesta sobre comprobante.', 'Sin costo informado.', ['DNI o CUIT', 'Datos del pago o periodo']],
            ], [
                ['type' => 'text', 'name' => 'cuit_proveedor', 'label' => 'CUIT o identificacion del proveedor', 'required' => false],
                ['type' => 'textarea', 'name' => 'detalle', 'label' => 'Detalle de la solicitud', 'required' => true],
            ]),
            ...$this->subtypesFor('modernizacion-punto-digital', 'modernizacion-punto-digital', [
                ['cursos-punto-digital', 'Cursos y capacitaciones en Punto Digital', 'Inscripcion o consulta por cursos y capacitaciones.', 'Inscripcion o informacion sobre curso.', 'Gratuito segun el relevamiento.', ['Datos de contacto']],
                ['capacitacion-ia', 'Capacitacion sobre inteligencia artificial', 'Solicitud o consulta por capacitacion sobre inteligencia artificial.', 'Inscripcion o informacion sobre capacitacion.', 'Gratuito segun el relevamiento.', ['Datos de contacto']],
                ['uso-punto-digital-microcine', 'Uso de Punto Digital o Microcine', 'Solicitud de uso de espacios de Punto Digital o Microcine.', 'Reserva o derivacion para autorizacion.', 'Gratuito segun el relevamiento.', ['Datos de contacto', 'Fecha tentativa', 'Actividad propuesta']],
            ], [
                ['type' => 'date', 'name' => 'fecha', 'label' => 'Fecha tentativa', 'required' => false],
                ['type' => 'textarea', 'name' => 'detalle', 'label' => 'Detalle de la solicitud', 'required' => true],
            ]),
            ...$this->subtypesFor('servicios-publicos-asistencia-operativa', 'servicios-publicos-asistencia-operativa', [
                ['servicio-atmosferico', 'Servicio atmosferico', 'Solicitud de servicio atmosferico.', 'Recepcion y derivacion a Servicios Generales.', 'Puede requerir colaboracion o arancel; el area lo confirmara.', ['Datos de contacto', 'Ubicacion precisa']],
                ['poda', 'Poda', 'Solicitud de poda de arbolado.', 'Recepcion y evaluacion operativa.', 'Sin costo informado.', ['Ubicacion precisa', 'Fotos si corresponde']],
                ['desmalezado-limpieza', 'Desmalezado o limpieza', 'Solicitud de desmalezado, limpieza o intervencion en instituciones.', 'Recepcion y evaluacion operativa.', 'Sin costo informado.', ['Ubicacion precisa', 'Fotos si corresponde']],
                ['mantenimiento-institucional', 'Mantenimiento institucional', 'Solicitud de mantenimiento institucional o conservacion edilicia.', 'Recepcion y derivacion operativa.', 'Sin costo informado.', ['Institucion o edificio', 'Ubicacion', 'Detalle del trabajo']],
                ['asistencia-eventos', 'Asistencia a eventos', 'Solicitud de tableros electricos u otra asistencia operativa para eventos.', 'Recepcion y evaluacion por Servicios Publicos.', 'Puede requerir colaboracion; el area lo confirmara.', ['Datos del evento', 'Fecha', 'Lugar']],
            ], [
                ['type' => 'text', 'name' => 'ubicacion', 'label' => 'Ubicacion del pedido', 'required' => true],
                ['type' => 'date', 'name' => 'fecha_evento', 'label' => 'Fecha si corresponde', 'required' => false],
                ['type' => 'textarea', 'name' => 'detalle', 'label' => 'Detalle de la solicitud', 'required' => true],
            ]),
            ...$this->subtypesFor('desarrollo-social-area-mujer-infancias', 'desarrollo-social-area-mujer-infancias', [
                ['atencion-juridica', 'Atencion juridica', 'Solicitud de orientacion juridica del Area de la Mujer.', 'Derivacion al equipo tecnico correspondiente.', 'Gratuito segun el relevamiento.', ['Datos de contacto', 'Motivo de consulta']],
                ['atencion-psicologica', 'Atencion psicologica', 'Solicitud de orientacion psicologica.', 'Derivacion al equipo tecnico correspondiente.', 'Gratuito segun el relevamiento.', ['Datos de contacto', 'Motivo de consulta']],
                ['trabajo-social', 'Trabajo social', 'Solicitud de intervencion o consulta social.', 'Derivacion al equipo tecnico correspondiente.', 'Gratuito segun el relevamiento.', ['Datos de contacto', 'Motivo de consulta']],
                ['charlas-talleres-sociales', 'Charlas y talleres', 'Solicitud o inscripcion en charlas y talleres.', 'Inscripcion o derivacion al programa.', 'Gratuito segun el relevamiento.', ['Datos de contacto', 'Actividad de interes']],
                ['programas-infancias-juventudes-familias', 'Programas de infancias, juventudes y familias', 'Solicitud por programas como Jugar o estimulacion cognitiva.', 'Derivacion al programa correspondiente.', 'Gratuito segun el relevamiento.', ['Datos de contacto', 'Programa de interes']],
            ], [
                ['type' => 'textarea', 'name' => 'detalle', 'label' => 'Detalle de la solicitud', 'required' => true],
            ]),
            ...$this->subtypesFor('cultura-deportes-turismo-emprendedurismo', 'cultura-deportes-turismo-emprendedurismo', [
                ['ayuda-economica-deportes', 'Ayuda economica para deportes', 'Solicitud de ayuda economica para deportistas o clubes.', 'Recepcion y evaluacion del area.', 'Sujeto a evaluacion del area.', ['Datos del solicitante', 'Club o actividad si corresponde', 'Nota o respaldo']],
                ['ayuda-economica-emprendedores', 'Ayuda economica para emprendedores', 'Solicitud de ayuda economica para emprendedores.', 'Recepcion y evaluacion del area.', 'Sujeto a evaluacion del area.', ['Datos del emprendimiento', 'Nota o respaldo']],
                ['ayuda-economica-cultura', 'Ayuda economica para artistas o cultura', 'Solicitud de ayuda economica para artistas o actividades culturales.', 'Recepcion y evaluacion del area.', 'Sujeto a evaluacion del area.', ['Datos de la actividad artistica', 'Nota o respaldo']],
                ['prestamo-instalaciones-elementos', 'Prestamo o uso de instalaciones y elementos', 'Solicitud de instalaciones deportivas, espacios recreativos, sillas u otros elementos.', 'Recepcion y evaluacion de disponibilidad.', 'En general gratuito; sujeto a disponibilidad.', ['Institucion o solicitante', 'Fecha', 'Lugar o elemento solicitado']],
                ['visitas-guiadas', 'Visitas guiadas', 'Solicitud de visitas guiadas a salas o espacios municipales.', 'Recepcion y coordinacion de visita.', 'Gratuito segun el relevamiento.', ['Institucion', 'Cantidad estimada de personas', 'Fecha tentativa']],
                ['talleres-deportivos-culturales', 'Talleres deportivos o culturales', 'Inscripcion o consulta sobre talleres deportivos y culturales.', 'Inscripcion o informacion del taller.', 'Gratuito segun el relevamiento.', ['Datos de contacto', 'Taller de interes']],
            ], [
                ['type' => 'text', 'name' => 'institucion_actividad', 'label' => 'Institucion, club, emprendimiento o actividad', 'required' => false],
                ['type' => 'date', 'name' => 'fecha_evento', 'label' => 'Fecha del evento o actividad', 'required' => false],
                ['type' => 'textarea', 'name' => 'detalle', 'label' => 'Detalle de la solicitud', 'required' => true],
            ]),
            ...$this->subtypesFor('rrhh-empleados-municipales', 'rrhh-empleados-municipales', [
                ['jubilaciones-pensiones', 'Jubilaciones y pensiones', 'Tramites internos vinculados a jubilaciones y pensiones.', 'Recepcion por Recursos Humanos.', 'Sin costo informado.', ['Solo empleados municipales', 'DNI o legajo']],
                ['certificaciones-rrhh', 'Certificaciones', 'Certificaciones de servicios, ANSES, mutuales, banco u otras.', 'Recepcion por Recursos Humanos.', 'Sin costo informado.', ['Solo empleados municipales', 'DNI o legajo']],
                ['liquidaciones-bajas', 'Liquidaciones, bajas y 82% movil', 'Solicitudes por baja, fallecimiento, liquidacion final o 82% movil.', 'Recepcion por Recursos Humanos.', 'Sin costo informado.', ['Solo empleados municipales', 'DNI o legajo', 'Documentacion respaldatoria']],
                ['afiliaciones-osep-sumarios', 'Afiliaciones OSEP, planillas y sumarios', 'Tramites internos de OSEP, planillas complementarias o sumarios.', 'Recepcion por Recursos Humanos.', 'Sin costo informado.', ['Solo empleados municipales', 'DNI o legajo']],
            ], [
                ['type' => 'text', 'name' => 'legajo', 'label' => 'Legajo si lo conoce', 'required' => false],
                ['type' => 'textarea', 'name' => 'detalle', 'label' => 'Detalle de la solicitud', 'required' => true],
            ], false),
        ];
    }

    /**
     * @param  array<int, array{0: string, 1: string, 2: string, 3: string, 4: string, 5: array<int, string>}>  $items
     * @param  array<int, array<string, mixed>>  $schema
     * @return array<int, array<string, mixed>>
     */
    private function subtypesFor(string $typeSlug, string $assistanceTypeSlug, array $items, array $schema, bool $active = true): array
    {
        return collect($items)
            ->map(fn (array $item, int $index): array => [
                'type_slug' => $typeSlug,
                'assistance_type_slug' => $assistanceTypeSlug,
                'slug' => $item[0],
                'name' => $item[1],
                'description' => $item[2],
                'result_information' => $item[3],
                'cost_information' => $item[4],
                'requirements' => $item[5],
                'schema' => $schema,
                'sort_order' => ($index + 1) * 10,
                'publication_status' => $active ? 'published' : 'draft',
                'active' => $active,
            ])
            ->all();
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    private function assistanceTypes(): array
    {
        return [
            [
                'slug' => 'presentacion-general',
                'name' => 'Presentacion general',
                'description' => 'Pedidos que requieren evaluacion inicial de Mesa de Entrada.',
                'color' => '#d93397',
                'department_slug' => 'gobierno',
                'active' => true,
            ],
            [
                'slug' => 'comercio-habilitaciones',
                'name' => 'Comercio y habilitaciones',
                'description' => 'Habilitaciones comerciales y de espectaculos publicos.',
                'color' => '#2e75b8',
                'department_slug' => 'inspeccion-comercio',
                'active' => true,
            ],
            [
                'slug' => 'bromatologia',
                'name' => 'Bromatologia',
                'description' => 'Capacitaciones, controles, muestras y habilitaciones bromatologicas.',
                'color' => '#0f766e',
                'department_slug' => 'bromatologia',
                'active' => true,
            ],
            [
                'slug' => 'rentas-tasas',
                'name' => 'Rentas y tasas',
                'description' => 'Libres deuda, altas, bajas, consultas de deuda, pagos y exenciones.',
                'color' => '#2563eb',
                'department_slug' => 'rentas',
                'active' => true,
            ],
            [
                'slug' => 'catastro-obras-cementerio',
                'name' => 'Catastro, obras y cementerio',
                'description' => 'Planos, subdivisiones, loteos, inmuebles y cementerio.',
                'color' => '#123d67',
                'department_slug' => 'catastro',
                'active' => true,
            ],
            [
                'slug' => 'juzgado-faltas',
                'name' => 'Juzgado de Faltas',
                'description' => 'Actas, infracciones, descargos y denuncias contravencionales.',
                'color' => '#64748b',
                'department_slug' => 'juzgado-faltas',
                'active' => true,
            ],
            [
                'slug' => 'tesoreria-proveedores',
                'name' => 'Tesoreria y proveedores',
                'description' => 'Pagos, CBU, comprobantes y retenciones.',
                'color' => '#0f766e',
                'department_slug' => 'tesoreria',
                'active' => true,
            ],
            [
                'slug' => 'modernizacion-punto-digital',
                'name' => 'Modernizacion y Punto Digital',
                'description' => 'Cursos, capacitaciones y uso de espacios tecnologicos.',
                'color' => '#84bd1a',
                'department_slug' => 'modernizacion',
                'active' => true,
            ],
            [
                'slug' => 'servicios-publicos-asistencia-operativa',
                'name' => 'Servicios publicos y asistencia operativa',
                'description' => 'Poda, limpieza, servicio atmosferico, mantenimiento y asistencia a eventos.',
                'color' => '#16a34a',
                'department_slug' => 'servicios-publicos',
                'active' => true,
            ],
            [
                'slug' => 'desarrollo-social-area-mujer-infancias',
                'name' => 'Desarrollo Social, Area Mujer e Infancias',
                'description' => 'Atencion profesional, programas, charlas y talleres sociales.',
                'color' => '#d93397',
                'department_slug' => 'area-mujer',
                'active' => true,
            ],
            [
                'slug' => 'cultura-deportes-turismo-emprendedurismo',
                'name' => 'Cultura, deportes, turismo y emprendedurismo',
                'description' => 'Ayudas, talleres, visitas guiadas, uso de espacios y actividades.',
                'color' => '#7c3aed',
                'department_slug' => 'cultura',
                'active' => true,
            ],
            [
                'slug' => 'rrhh-empleados-municipales',
                'name' => 'RRHH para empleados municipales',
                'description' => 'Tramites internos de empleados municipales.',
                'color' => '#475569',
                'department_slug' => 'rrhh',
                'active' => true,
            ],
        ];
    }

    /**
     * @return array<int, string>
     */
    private function legacyPublicTypeSlugs(): array
    {
        return [
            'nota-municipio',
            'habilitacion-comercial',
            'asistencia-instituciones',
            'obras-privadas',
            'rentas-consulta',
            'solicitud-turno',
        ];
    }

    private function seedServicesDemo(?IntakeDepartment $department, ?IntakeAssistanceType $assistanceType): void
    {
        if (! $department || ! $assistanceType) {
            return;
        }

        $type = IntakeRequestType::where('slug', 'servicios-publicos-asistencia-operativa')->first();

        if (! $type) {
            return;
        }

        $request = IntakeRequest::updateOrCreate(
            ['public_code' => 'FME-2026-SONIDO'],
            [
                'intake_request_type_id' => $type->id,
                'status' => IntakeRequestStatus::Routed,
                'priority' => 'normal',
                'area' => 'Servicios Publicos',
                'source' => 'web',
                'applicant_name' => 'Escuela Secundaria Demo',
                'applicant_dni' => null,
                'applicant_phone' => '3834000000',
                'applicant_email' => 'escuela.demo@municipio.test',
                'applicant_address' => 'Piedra Blanca',
                'subject' => $type->name,
                'summary' => 'La institucion solicita asistencia operativa para acondicionar el predio antes de un acto escolar.',
                'payload' => [
                    'tipo_solicitud' => 'Desmalezado o limpieza',
                    'ubicacion' => 'Piedra Blanca',
                    'detalle' => 'Necesitamos acondicionar el predio escolar antes del acto institucional.',
                ],
            ],
        );

        $request->assistanceTypes()->syncWithoutDetaching([$assistanceType->id]);

        IntakeDerivation::updateOrCreate(
            [
                'intake_request_id' => $request->id,
                'intake_department_id' => $department->id,
                'intake_assistance_type_id' => $assistanceType->id,
            ],
            [
                'status' => IntakeDerivationStatus::Pending,
                'operator_note' => 'Revisar disponibilidad de cuadrilla para el predio escolar.',
            ],
        );

        $request->histories()->firstOrCreate(
            ['action' => 'derived', 'to_status' => IntakeRequestStatus::Routed->value],
            [
                'from_status' => IntakeRequestStatus::Received->value,
                'internal_comment' => 'Caso demo derivado a Servicios Publicos.',
                'changed_at' => now(),
            ],
        );
    }
}
