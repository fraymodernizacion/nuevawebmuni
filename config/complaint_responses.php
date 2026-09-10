<?php

use App\Enums\ComplaintStatus;

return [
    'crew' => [
        [
            'code' => 'falta_insumos',
            'label' => 'Falta de insumos',
            'suggested_status' => ComplaintStatus::NeedsSecondVisit->value,
            'message' => 'En la visita realizada verificamos el inconveniente informado. Para poder resolverlo necesitamos contar con insumos que actualmente no se encuentran disponibles. El reclamo continuara abierto y sera retomado cuando contemos con el material necesario.',
        ],
        [
            'code' => 'clima',
            'label' => 'Suspension por clima',
            'suggested_status' => ComplaintStatus::NeedsSecondVisit->value,
            'message' => 'Por razones climaticas, la intervencion debio ser suspendida. Reprogramaremos la atencion del reclamo cuando las condiciones permitan realizar el trabajo de forma segura.',
        ],
        [
            'code' => 'ec_sapem',
            'label' => 'EC SAPEM',
            'suggested_status' => ComplaintStatus::NeedsSecondVisit->value,
            'message' => 'Durante el relevamiento verificamos que la resolucion corresponde a EC SAPEM. Desde el municipio gestionaremos el reclamo ante el organismo correspondiente.',
        ],
        [
            'code' => 'telecom',
            'label' => 'TELECOM',
            'suggested_status' => ComplaintStatus::NeedsSecondVisit->value,
            'message' => 'Durante el relevamiento verificamos que la resolucion corresponde a TELECOM. Desde el municipio gestionaremos el reclamo ante la empresa correspondiente.',
        ],
        [
            'code' => 'ultranet',
            'label' => 'ULTRANET',
            'suggested_status' => ComplaintStatus::NeedsSecondVisit->value,
            'message' => 'Durante el relevamiento verificamos que la resolucion corresponde a ULTRANET. Desde el municipio gestionaremos el reclamo ante la empresa correspondiente.',
        ],
        [
            'code' => 'claro',
            'label' => 'CLARO',
            'suggested_status' => ComplaintStatus::NeedsSecondVisit->value,
            'message' => 'Durante el relevamiento verificamos que la resolucion corresponde a CLARO. Desde el municipio gestionaremos el reclamo ante la empresa correspondiente.',
        ],
        [
            'code' => 'supercanal',
            'label' => 'SUPERCANAL',
            'suggested_status' => ComplaintStatus::NeedsSecondVisit->value,
            'message' => 'Durante el relevamiento verificamos que la resolucion corresponde a SUPERCANAL. Desde el municipio gestionaremos el reclamo ante la empresa correspondiente.',
        ],
        [
            'code' => 'resuelto',
            'label' => 'Resuelto',
            'suggested_status' => ComplaintStatus::Resolved->value,
            'message' => 'El reclamo fue intervenido y se encuentra resuelto. Muchas gracias por colaborar con el cuidado del alumbrado publico.',
        ],
        [
            'code' => 'resuelto_aporte_vecino',
            'label' => 'Resuelto con aporte del vecino',
            'suggested_status' => ComplaintStatus::Resolved->value,
            'message' => 'El reclamo fue intervenido y se encuentra resuelto. Dejamos constancia y agradecemos la colaboracion del vecino mediante el aporte de insumos necesarios para realizar la intervencion.',
        ],
        [
            'code' => 'segunda_visita',
            'label' => 'Segunda visita',
            'suggested_status' => ComplaintStatus::NeedsSecondVisit->value,
            'message' => 'Se realizo el relevamiento inicial y se requiere una nueva visita para completar la intervencion. El reclamo continuara abierto hasta finalizar el trabajo.',
        ],
        [
            'code' => 'urgencia_operativa',
            'label' => 'Urgencia operativa',
            'suggested_status' => ComplaintStatus::NeedsSecondVisit->value,
            'message' => 'Durante la intervencion se presento una urgencia operativa que debe ser atendida de forma prioritaria. La visita sera reprogramada para completar la resolucion del reclamo.',
        ],
    ],
];
