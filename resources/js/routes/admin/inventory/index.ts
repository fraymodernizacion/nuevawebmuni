import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition, applyUrlDefaults } from './../../../wayfinder'
import labels from './labels'
/**
* @see \App\Http\Controllers\Admin\InventoryController::index
* @see app/Http/Controllers/Admin/InventoryController.php:18
* @route '/admin/inventario'
*/
export const index = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})

index.definition = {
    methods: ["get","head"],
    url: '/admin/inventario',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Admin\InventoryController::index
* @see app/Http/Controllers/Admin/InventoryController.php:18
* @route '/admin/inventario'
*/
index.url = (options?: RouteQueryOptions) => {
    return index.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\InventoryController::index
* @see app/Http/Controllers/Admin/InventoryController.php:18
* @route '/admin/inventario'
*/
index.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Admin\InventoryController::index
* @see app/Http/Controllers/Admin/InventoryController.php:18
* @route '/admin/inventario'
*/
index.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: index.url(options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\Admin\InventoryController::index
* @see app/Http/Controllers/Admin/InventoryController.php:18
* @route '/admin/inventario'
*/
const indexForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: index.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Admin\InventoryController::index
* @see app/Http/Controllers/Admin/InventoryController.php:18
* @route '/admin/inventario'
*/
indexForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: index.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Admin\InventoryController::index
* @see app/Http/Controllers/Admin/InventoryController.php:18
* @route '/admin/inventario'
*/
indexForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: index.url({
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'HEAD',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'get',
})

index.form = indexForm

/**
* @see \App\Http\Controllers\Admin\InventoryController::create
* @see app/Http/Controllers/Admin/InventoryController.php:66
* @route '/admin/inventario/crear'
*/
export const create = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: create.url(options),
    method: 'get',
})

create.definition = {
    methods: ["get","head"],
    url: '/admin/inventario/crear',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Admin\InventoryController::create
* @see app/Http/Controllers/Admin/InventoryController.php:66
* @route '/admin/inventario/crear'
*/
create.url = (options?: RouteQueryOptions) => {
    return create.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\InventoryController::create
* @see app/Http/Controllers/Admin/InventoryController.php:66
* @route '/admin/inventario/crear'
*/
create.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: create.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Admin\InventoryController::create
* @see app/Http/Controllers/Admin/InventoryController.php:66
* @route '/admin/inventario/crear'
*/
create.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: create.url(options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\Admin\InventoryController::create
* @see app/Http/Controllers/Admin/InventoryController.php:66
* @route '/admin/inventario/crear'
*/
const createForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: create.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Admin\InventoryController::create
* @see app/Http/Controllers/Admin/InventoryController.php:66
* @route '/admin/inventario/crear'
*/
createForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: create.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Admin\InventoryController::create
* @see app/Http/Controllers/Admin/InventoryController.php:66
* @route '/admin/inventario/crear'
*/
createForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: create.url({
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'HEAD',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'get',
})

create.form = createForm

/**
* @see \App\Http\Controllers\Admin\InventoryController::store
* @see app/Http/Controllers/Admin/InventoryController.php:83
* @route '/admin/inventario'
*/
export const store = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

store.definition = {
    methods: ["post"],
    url: '/admin/inventario',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Admin\InventoryController::store
* @see app/Http/Controllers/Admin/InventoryController.php:83
* @route '/admin/inventario'
*/
store.url = (options?: RouteQueryOptions) => {
    return store.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\InventoryController::store
* @see app/Http/Controllers/Admin/InventoryController.php:83
* @route '/admin/inventario'
*/
store.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\Admin\InventoryController::store
* @see app/Http/Controllers/Admin/InventoryController.php:83
* @route '/admin/inventario'
*/
const storeForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: store.url(options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\Admin\InventoryController::store
* @see app/Http/Controllers/Admin/InventoryController.php:83
* @route '/admin/inventario'
*/
storeForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: store.url(options),
    method: 'post',
})

store.form = storeForm

/**
* @see \App\Http\Controllers\Admin\InventoryController::show
* @see app/Http/Controllers/Admin/InventoryController.php:106
* @route '/admin/inventario/{inventoryItem}'
*/
export const show = (args: { inventoryItem: number | { id: number } } | [inventoryItem: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: show.url(args, options),
    method: 'get',
})

show.definition = {
    methods: ["get","head"],
    url: '/admin/inventario/{inventoryItem}',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Admin\InventoryController::show
* @see app/Http/Controllers/Admin/InventoryController.php:106
* @route '/admin/inventario/{inventoryItem}'
*/
show.url = (args: { inventoryItem: number | { id: number } } | [inventoryItem: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { inventoryItem: args }
    }

    if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
        args = { inventoryItem: args.id }
    }

    if (Array.isArray(args)) {
        args = {
            inventoryItem: args[0],
        }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
        inventoryItem: typeof args.inventoryItem === 'object'
        ? args.inventoryItem.id
        : args.inventoryItem,
    }

    return show.definition.url
            .replace('{inventoryItem}', parsedArgs.inventoryItem.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\InventoryController::show
* @see app/Http/Controllers/Admin/InventoryController.php:106
* @route '/admin/inventario/{inventoryItem}'
*/
show.get = (args: { inventoryItem: number | { id: number } } | [inventoryItem: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: show.url(args, options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Admin\InventoryController::show
* @see app/Http/Controllers/Admin/InventoryController.php:106
* @route '/admin/inventario/{inventoryItem}'
*/
show.head = (args: { inventoryItem: number | { id: number } } | [inventoryItem: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: show.url(args, options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\Admin\InventoryController::show
* @see app/Http/Controllers/Admin/InventoryController.php:106
* @route '/admin/inventario/{inventoryItem}'
*/
const showForm = (args: { inventoryItem: number | { id: number } } | [inventoryItem: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: show.url(args, options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Admin\InventoryController::show
* @see app/Http/Controllers/Admin/InventoryController.php:106
* @route '/admin/inventario/{inventoryItem}'
*/
showForm.get = (args: { inventoryItem: number | { id: number } } | [inventoryItem: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: show.url(args, options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Admin\InventoryController::show
* @see app/Http/Controllers/Admin/InventoryController.php:106
* @route '/admin/inventario/{inventoryItem}'
*/
showForm.head = (args: { inventoryItem: number | { id: number } } | [inventoryItem: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: show.url(args, {
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'HEAD',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'get',
})

show.form = showForm

/**
* @see \App\Http\Controllers\Admin\InventoryController::edit
* @see app/Http/Controllers/Admin/InventoryController.php:127
* @route '/admin/inventario/{inventoryItem}/editar'
*/
export const edit = (args: { inventoryItem: number | { id: number } } | [inventoryItem: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: edit.url(args, options),
    method: 'get',
})

edit.definition = {
    methods: ["get","head"],
    url: '/admin/inventario/{inventoryItem}/editar',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Admin\InventoryController::edit
* @see app/Http/Controllers/Admin/InventoryController.php:127
* @route '/admin/inventario/{inventoryItem}/editar'
*/
edit.url = (args: { inventoryItem: number | { id: number } } | [inventoryItem: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { inventoryItem: args }
    }

    if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
        args = { inventoryItem: args.id }
    }

    if (Array.isArray(args)) {
        args = {
            inventoryItem: args[0],
        }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
        inventoryItem: typeof args.inventoryItem === 'object'
        ? args.inventoryItem.id
        : args.inventoryItem,
    }

    return edit.definition.url
            .replace('{inventoryItem}', parsedArgs.inventoryItem.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\InventoryController::edit
* @see app/Http/Controllers/Admin/InventoryController.php:127
* @route '/admin/inventario/{inventoryItem}/editar'
*/
edit.get = (args: { inventoryItem: number | { id: number } } | [inventoryItem: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: edit.url(args, options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Admin\InventoryController::edit
* @see app/Http/Controllers/Admin/InventoryController.php:127
* @route '/admin/inventario/{inventoryItem}/editar'
*/
edit.head = (args: { inventoryItem: number | { id: number } } | [inventoryItem: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: edit.url(args, options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\Admin\InventoryController::edit
* @see app/Http/Controllers/Admin/InventoryController.php:127
* @route '/admin/inventario/{inventoryItem}/editar'
*/
const editForm = (args: { inventoryItem: number | { id: number } } | [inventoryItem: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: edit.url(args, options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Admin\InventoryController::edit
* @see app/Http/Controllers/Admin/InventoryController.php:127
* @route '/admin/inventario/{inventoryItem}/editar'
*/
editForm.get = (args: { inventoryItem: number | { id: number } } | [inventoryItem: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: edit.url(args, options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Admin\InventoryController::edit
* @see app/Http/Controllers/Admin/InventoryController.php:127
* @route '/admin/inventario/{inventoryItem}/editar'
*/
editForm.head = (args: { inventoryItem: number | { id: number } } | [inventoryItem: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: edit.url(args, {
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'HEAD',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'get',
})

edit.form = editForm

/**
* @see \App\Http\Controllers\Admin\InventoryController::update
* @see app/Http/Controllers/Admin/InventoryController.php:136
* @route '/admin/inventario/{inventoryItem}'
*/
export const update = (args: { inventoryItem: number | { id: number } } | [inventoryItem: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'patch'> => ({
    url: update.url(args, options),
    method: 'patch',
})

update.definition = {
    methods: ["patch"],
    url: '/admin/inventario/{inventoryItem}',
} satisfies RouteDefinition<["patch"]>

/**
* @see \App\Http\Controllers\Admin\InventoryController::update
* @see app/Http/Controllers/Admin/InventoryController.php:136
* @route '/admin/inventario/{inventoryItem}'
*/
update.url = (args: { inventoryItem: number | { id: number } } | [inventoryItem: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { inventoryItem: args }
    }

    if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
        args = { inventoryItem: args.id }
    }

    if (Array.isArray(args)) {
        args = {
            inventoryItem: args[0],
        }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
        inventoryItem: typeof args.inventoryItem === 'object'
        ? args.inventoryItem.id
        : args.inventoryItem,
    }

    return update.definition.url
            .replace('{inventoryItem}', parsedArgs.inventoryItem.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\InventoryController::update
* @see app/Http/Controllers/Admin/InventoryController.php:136
* @route '/admin/inventario/{inventoryItem}'
*/
update.patch = (args: { inventoryItem: number | { id: number } } | [inventoryItem: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'patch'> => ({
    url: update.url(args, options),
    method: 'patch',
})

/**
* @see \App\Http\Controllers\Admin\InventoryController::update
* @see app/Http/Controllers/Admin/InventoryController.php:136
* @route '/admin/inventario/{inventoryItem}'
*/
const updateForm = (args: { inventoryItem: number | { id: number } } | [inventoryItem: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: update.url(args, {
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'PATCH',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'post',
})

/**
* @see \App\Http\Controllers\Admin\InventoryController::update
* @see app/Http/Controllers/Admin/InventoryController.php:136
* @route '/admin/inventario/{inventoryItem}'
*/
updateForm.patch = (args: { inventoryItem: number | { id: number } } | [inventoryItem: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: update.url(args, {
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'PATCH',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'post',
})

update.form = updateForm

const inventory = {
    index: Object.assign(index, index),
    labels: Object.assign(labels, labels),
    create: Object.assign(create, create),
    store: Object.assign(store, store),
    show: Object.assign(show, show),
    edit: Object.assign(edit, edit),
    update: Object.assign(update, update),
}

export default inventory