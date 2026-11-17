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
use Illuminate\Support\Facades\Hash;

class IntakeModuleSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $this->call(IntakeCatalogSeeder::class);

        $department = IntakeDepartment::where('slug', 'servicios-publicos')->first();

        User::updateOrCreate(
            ['email' => 'servicios@municipio.test'],
            [
                'name' => 'Encargado Servicios Publicos',
                'password' => Hash::make('password'),
                'role' => 'intake_department',
                'intake_department_id' => $department?->id,
                'email_verified_at' => now(),
            ],
        );

        $this->seedServicesDemo($department, IntakeAssistanceType::where('slug', 'servicios-publicos-asistencia-operativa')->first());
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
