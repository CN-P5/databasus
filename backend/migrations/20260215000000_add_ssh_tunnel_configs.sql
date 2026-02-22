-- +goose Up
-- +goose StatementBegin
CREATE TABLE ssh_tunnel_configs (
    id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    database_id          UUID NOT NULL REFERENCES databases(id) ON DELETE CASCADE,
    enabled              BOOLEAN NOT NULL DEFAULT FALSE,
    host                 TEXT,
    port                 INTEGER DEFAULT 22,
    username             TEXT,
    auth_type            TEXT DEFAULT 'password',
    password             TEXT,
    private_key          TEXT,
    passphrase           TEXT,
    skip_host_key_verify BOOLEAN DEFAULT FALSE,
    created_at           TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at           TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
-- +goose StatementEnd

-- +goose StatementBegin
CREATE INDEX idx_ssh_tunnel_configs_database_id ON ssh_tunnel_configs(database_id);
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
DROP INDEX IF EXISTS idx_ssh_tunnel_configs_database_id;
-- +goose StatementEnd

-- +goose StatementBegin
DROP TABLE IF EXISTS ssh_tunnel_configs;
-- +goose StatementEnd
