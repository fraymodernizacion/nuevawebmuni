export type User = {
    id: number;
    name: string;
    username?: string | null;
    email: string;
    avatar?: string;
    role?: string | null;
    module_permissions?: Record<string, boolean> | null;
    active?: boolean;
    email_verified_at: string | null;
    created_at: string;
    updated_at: string;
    [key: string]: unknown;
};

export type Auth = {
    user: User;
};

/* @chisel-passkeys */
export type Passkey = {
    id: number;
    name: string;
    authenticator: string | null;
    created_at_diff: string;
    last_used_at_diff: string | null;
};
/* @end-chisel-passkeys */
