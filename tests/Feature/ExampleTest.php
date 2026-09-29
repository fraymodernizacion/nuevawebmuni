<?php

test('returns a successful response', function () {
    $response = $this->get(route('home'));

    $response->assertOk();
    $response->assertSee('<html lang="es-AR"', false);
    $response->assertSee('<meta name="google" content="notranslate">', false);
});
