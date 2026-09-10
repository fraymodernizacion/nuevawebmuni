<?php

namespace Database\Seeders;

use App\Enums\IntakeDerivationStatus;
use App\Enums\IntakeRequestStatus;
use App\Models\IntakeAssistanceType;
use App\Models\IntakeDepartment;
use App\Models\IntakeDerivation;
use App\Models\IntakeRequest;
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
        foreach ($this->types() as $type) {
            IntakeRequestType::updateOrCreate(
                ['slug' => $type['slug']],
                $type,
            );
        }

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

        User::updateOrCreate(
            ['email' => 'sonido@municipio.test'],
            [
                'name' => 'Encargado Sonido y Logistica',
                'password' => Hash::make('password'),
                'role' => 'intake_department',
                'intake_department_id' => $departments['sonido-logistica']?->id,
                'email_verified_at' => now(),
            ],
        );

        $this->seedSoundDemo($departments['sonido-logistica'], IntakeAssistanceType::where('slug', 'sonido-logistica')->first());
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
                'estimated_time' => '8 minutos',
                'requirements' => ['Datos de contacto', 'Detalle de la solicitud'],
                'schema' => [
                    ['type' => 'textarea', 'name' => 'detalle', 'label' => 'Escribi tu solicitud con tus palabras', 'required' => true],
                    ['type' => 'text', 'name' => 'referencia', 'label' => 'Referencia o ubicacion si corresponde', 'required' => false],
                ],
                'active' => true,
            ],
            [
                'slug' => 'nota-municipio',
                'name' => 'Presentar una nota al municipio',
                'category' => 'Presentaciones',
                'description' => 'Conta que necesitas sin elegir areas internas. El municipio derivara la solicitud.',
                'icon' => 'file-text',
                'color' => '#d93397',
                'estimated_time' => '8 minutos',
                'requirements' => ['Datos de contacto', 'Detalle de la solicitud'],
                'schema' => [
                    ['type' => 'textarea', 'name' => 'detalle', 'label' => 'Escribi tu solicitud', 'required' => true],
                    ['type' => 'text', 'name' => 'area_sugerida', 'label' => 'Area sugerida si la conoces', 'required' => false],
                ],
                'active' => true,
            ],
            [
                'slug' => 'habilitacion-comercial',
                'name' => 'Alta de contribuyente comercial',
                'category' => 'Comercio',
                'description' => 'Registra un comercio, emprendimiento o actividad economica para iniciar la habilitacion municipal.',
                'icon' => 'store',
                'color' => '#2e75b8',
                'estimated_time' => '14 minutos',
                'requirements' => ['DNI', 'Constancia de CUIT', 'Ubicacion del comercio'],
                'schema' => [
                    ['type' => 'text', 'name' => 'cuit', 'label' => 'CUIT', 'required' => true],
                    ['type' => 'text', 'name' => 'razon_social', 'label' => 'Nombre, apellido o razon social', 'required' => true],
                    ['type' => 'text', 'name' => 'nombre_fantasia', 'label' => 'Nombre de fantasia', 'required' => false],
                    ['type' => 'textarea', 'name' => 'actividad', 'label' => 'Actividad comercial', 'required' => true],
                    ['type' => 'text', 'name' => 'domicilio_comercial', 'label' => 'Domicilio comercial', 'required' => true],
                ],
                'active' => true,
            ],
            [
                'slug' => 'asistencia-instituciones',
                'name' => 'Solicitar asistencia para una institucion',
                'category' => 'Instituciones',
                'description' => 'Pedi colaboracion municipal para una escuela u organismo del departamento.',
                'icon' => 'file-plus',
                'color' => '#2e75b8',
                'estimated_time' => '10 minutos',
                'requirements' => ['Institucion', 'Detalle de la solicitud', 'Nota o respaldo si corresponde'],
                'schema' => [
                    ['type' => 'text', 'name' => 'institucion', 'label' => 'Institucion u organismo', 'required' => true],
                    ['type' => 'text', 'name' => 'cargo', 'label' => 'Cargo o vinculo del solicitante', 'required' => false],
                    ['type' => 'textarea', 'name' => 'necesidad', 'label' => 'Detalle de la asistencia solicitada', 'required' => true],
                    ['type' => 'date', 'name' => 'fecha_evento', 'label' => 'Fecha del evento o necesidad', 'required' => false],
                ],
                'active' => true,
            ],
            [
                'slug' => 'obras-privadas',
                'name' => 'Consultar por obra o construccion',
                'category' => 'Obras',
                'description' => 'Inicia una consulta sobre permisos, documentacion o seguimiento de una obra privada.',
                'icon' => 'home',
                'color' => '#123d67',
                'estimated_time' => '12 minutos',
                'requirements' => ['DNI', 'Plano o documentacion disponible', 'Ubicacion'],
                'schema' => [
                    ['type' => 'text', 'name' => 'ubicacion_obra', 'label' => 'Ubicacion de la obra', 'required' => true],
                    ['type' => 'textarea', 'name' => 'consulta', 'label' => 'Detalle de la consulta', 'required' => true],
                ],
                'active' => true,
            ],
            [
                'slug' => 'rentas-consulta',
                'name' => 'Consultar tasas o deuda municipal',
                'category' => 'Rentas',
                'description' => 'Pedi ayuda sobre tasas, pagos, comprobantes o deuda municipal.',
                'icon' => 'credit-card',
                'color' => '#2e75b8',
                'estimated_time' => '6 minutos',
                'requirements' => ['DNI o CUIT', 'Numero de cuenta si lo tenes'],
                'schema' => [
                    ['type' => 'text', 'name' => 'dni_cuit', 'label' => 'DNI o CUIT', 'required' => true],
                    ['type' => 'text', 'name' => 'cuenta', 'label' => 'Numero de cuenta si lo tenes', 'required' => false],
                    ['type' => 'textarea', 'name' => 'consulta', 'label' => 'Detalle de la consulta', 'required' => true],
                ],
                'active' => true,
            ],
            [
                'slug' => 'solicitud-turno',
                'name' => 'Pedir un turno o atencion',
                'category' => 'Atencion',
                'description' => 'Solicita atencion municipal y explica brevemente el motivo.',
                'icon' => 'calendar',
                'color' => '#84bd1a',
                'estimated_time' => '4 minutos',
                'requirements' => ['Datos de contacto'],
                'schema' => [
                    ['type' => 'select', 'name' => 'area', 'label' => 'Area de atencion', 'required' => true, 'options' => ['Rentas', 'Obras Privadas', 'Gobierno', 'Desarrollo Social', 'Otra']],
                    ['type' => 'textarea', 'name' => 'motivo', 'label' => 'Motivo del turno', 'required' => true],
                ],
                'active' => true,
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
                'slug' => 'sonido-logistica',
                'name' => 'Sonido y Logistica',
                'description' => 'Equipamiento de sonido, apoyo tecnico y logistica para actividades institucionales.',
                'color' => '#7c3aed',
                'active' => true,
            ],
            [
                'slug' => 'servicios-publicos',
                'name' => 'Servicios Publicos',
                'description' => 'Limpieza, desmalezado, apoyo operativo y mantenimiento urbano.',
                'color' => '#16a34a',
                'active' => true,
            ],
            [
                'slug' => 'transito',
                'name' => 'Transito y Seguridad Vial',
                'description' => 'Ordenamiento vehicular, cortes, acompanamiento y seguridad vial.',
                'color' => '#dc2626',
                'active' => true,
            ],
            [
                'slug' => 'gobierno',
                'name' => 'Gobierno',
                'description' => 'Autorizaciones, permisos y coordinacion institucional.',
                'color' => '#2563eb',
                'active' => true,
            ],
        ];
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    private function assistanceTypes(): array
    {
        return [
            [
                'slug' => 'sonido-logistica',
                'name' => 'Sonido y logistica',
                'description' => 'Pedido de sonido, escenario, apoyo tecnico o elementos logisticos.',
                'color' => '#7c3aed',
                'department_slug' => 'sonido-logistica',
                'active' => true,
            ],
            [
                'slug' => 'transporte',
                'name' => 'Transporte',
                'description' => 'Traslado de personas, delegaciones o elementos.',
                'color' => '#0f766e',
                'department_slug' => 'gobierno',
                'active' => true,
            ],
            [
                'slug' => 'limpieza-desmalezado',
                'name' => 'Limpieza / desmalezado',
                'description' => 'Limpieza, desmalezado o acondicionamiento de espacios.',
                'color' => '#16a34a',
                'department_slug' => 'servicios-publicos',
                'active' => true,
            ],
            [
                'slug' => 'poda-arbolado',
                'name' => 'Poda / arbolado',
                'description' => 'Intervenciones vinculadas a poda o arbolado urbano.',
                'color' => '#15803d',
                'department_slug' => 'servicios-publicos',
                'active' => true,
            ],
            [
                'slug' => 'transito-seguridad-vial',
                'name' => 'Transito y seguridad vial',
                'description' => 'Personal de transito, cortes o acompanamiento vial.',
                'color' => '#dc2626',
                'department_slug' => 'transito',
                'active' => true,
            ],
            [
                'slug' => 'autorizaciones-permisos',
                'name' => 'Autorizaciones / permisos',
                'description' => 'Permisos, autorizaciones y notas institucionales.',
                'color' => '#2563eb',
                'department_slug' => 'gobierno',
                'active' => true,
            ],
            [
                'slug' => 'actividad-educativa-institucional',
                'name' => 'Actividad educativa o institucional',
                'description' => 'Actividades pedagogicas, protocolares o institucionales.',
                'color' => '#2e75b8',
                'department_slug' => 'gobierno',
                'active' => true,
            ],
            [
                'slug' => 'asistencia-general',
                'name' => 'Asistencia general',
                'description' => 'Pedidos que requieren evaluacion o coordinacion general.',
                'color' => '#64748b',
                'department_slug' => 'gobierno',
                'active' => true,
            ],
        ];
    }

    private function seedSoundDemo(?IntakeDepartment $department, ?IntakeAssistanceType $assistanceType): void
    {
        if (! $department || ! $assistanceType) {
            return;
        }

        $type = IntakeRequestType::where('slug', 'asistencia-instituciones')->first();

        if (! $type) {
            return;
        }

        $request = IntakeRequest::updateOrCreate(
            ['public_code' => 'FME-2026-SONIDO'],
            [
                'intake_request_type_id' => $type->id,
                'status' => IntakeRequestStatus::Routed,
                'priority' => 'normal',
                'area' => 'Sonido y Logistica',
                'source' => 'web',
                'applicant_name' => 'Escuela Secundaria Demo',
                'applicant_dni' => null,
                'applicant_phone' => '3834000000',
                'applicant_email' => 'escuela.demo@municipio.test',
                'applicant_address' => 'Piedra Blanca',
                'subject' => $type->name,
                'summary' => 'La institucion solicita equipo de sonido y apoyo logistico para un acto escolar.',
                'payload' => [
                    'institucion' => 'Escuela Secundaria Demo',
                    'cargo' => 'Directora',
                    'necesidad' => 'Necesitamos sonido para acto institucional y apoyo para ubicar parlantes.',
                    'fecha_evento' => now()->addDays(10)->toDateString(),
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
                'operator_note' => 'Revisar disponibilidad de equipo de sonido para la fecha indicada.',
            ],
        );

        $request->histories()->firstOrCreate(
            ['action' => 'derived', 'to_status' => IntakeRequestStatus::Routed->value],
            [
                'from_status' => IntakeRequestStatus::Received->value,
                'internal_comment' => 'Caso demo derivado a Sonido y Logistica.',
                'changed_at' => now(),
            ],
        );
    }
}
