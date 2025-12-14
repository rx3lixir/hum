package config

type Config struct {
	GeneralParams    GeneralParams
	HttpServerParams HttpServerParams
	DatabaseParams   DatabaseParams
	S3Params         S3Params
}

type GeneralParams struct {
	Env             string `env:"APP_ENV" envDefault:"dev"`
	SecretKey       string `env:"API_GENERAL_PARAMS_SECRET_KEY" envRequired:"true"`
	AccessTokenTTL  int    `env:"API_GENERAL_PARAMS_ACCESS_TOKEN_TTL" envDefault:"15"`
	RefreshTokenTTL int    `env:"API_GENERAL_PARAMS_REFRESH_TOKEN_TTL" envDefault:"7"`
}

type HttpServerParams struct {
	Address string `env:"API_HTTP_SERVER_PARAMS_HTTP_SERVER_ADDRESS" envDefault:"0.0.0.0"`
	Port    string `env:"API_HTTP_SERVER_PARAMS_HTTP_SERVER_PORT" envDefault:"8080"`
}

type DatabaseParams struct {
	Host     string `env:"DB_HOST" envRequired:"true"`
	Port     int    `env:"DB_PORT" envDefault:"5432"`
	Username string `env:"DB_USERNAME" envRequired:"true"`
	Password string `env:"DB_PASSWORD" envRequired:"true"`
	Name     string `env:"DB_NAME" envRequired:"true"`
	Timeout  int    `env:"DB_TIMEOUT" envDefault:"15"`
}

type S3Params struct {
	Endpoint        string `env:"S3_ENDPOINT" envRequired:"true"`
	AccessKeyID     string `env:"S3_ACCESS_KEY_ID" envRequired:"true"`
	SecretAccessKey string `env:"S3_SECRET_ACCESS_KEY" envRequired:"true"`
	BucketName      string `env:"S3_BUCKET_NAME" envRequired:"true"`
	UseSSL          bool   `env:"S3_USE_SSL" envDefault:"false"`
}
