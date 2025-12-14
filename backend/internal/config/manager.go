package config

import (
	"fmt"
	"log"
	"os"
	"path/filepath"

	"github.com/ilyakaznacheev/cleanenv"
	"github.com/joho/godotenv"
)

// ConfigManager holds the application configuration.
type ConfigManager struct {
	config *Config
}

func NewConfigManager() (*ConfigManager, error) {
	var cfg Config

	envPath := findDotEnvPath()

	if envPath != "" {
		if err := godotenv.Load(envPath); err != nil {
			// Not fatal - .env might not exist in production
			log.Printf("Warning: could not load .env file from %s: %v", envPath, err)
		} else {
			log.Printf("Loaded environment variables from %s", envPath)
		}
	} else {
		log.Println("No .env file found in expected location (project root)")
	}

	if err := cleanenv.ReadEnv(&cfg); err != nil {
		return nil, fmt.Errorf("failed to read environment variables: %w", err)
	}

	// Step 4: Validate configuration
	if err := cfg.validate(); err != nil {
		return nil, fmt.Errorf("config validation failed: %w", err)
	}

	return &ConfigManager{config: &cfg}, nil
}

func (c *Config) validate() error {
	// Helper to require non-empty string fields
	requireString := func(field, name string) error {
		if field == "" {
			return fmt.Errorf("%s is required", name)
		}
		return nil
	}

	// General parameters
	if err := requireString(c.GeneralParams.SecretKey, "secret_key"); err != nil {
		return err
	}
	if c.GeneralParams.AccessTokenTTL == 0 {
		return fmt.Errorf("access_token_ttl is required and must be greater than 0")
	}
	if c.GeneralParams.RefreshTokenTTL == 0 {
		return fmt.Errorf("refresh_token_ttl is required and must be greater than 0")
	}

	// Environment validation
	switch c.GeneralParams.Env {
	case "dev", "prod", "test":
		// Valid
	case "":
		return fmt.Errorf("env is required")
	default:
		return fmt.Errorf("env is invalid: %q. Allowed values: dev, prod, test", c.GeneralParams.Env)
	}

	// HTTP server parameters
	if err := requireString(c.HttpServerParams.Address, "http server address"); err != nil {
		return err
	}
	if err := requireString(c.HttpServerParams.Port, "http server port"); err != nil {
		return err
	}

	// Database parameters (renamed from MainDB)
	dbs := map[string]DatabaseParams{
		"Database": c.DatabaseParams, // More natural name in error messages
	}

	for name, db := range dbs {
		if err := requireString(db.Host, fmt.Sprintf("%s host", name)); err != nil {
			return err
		}
		if err := requireString(db.Username, fmt.Sprintf("%s username", name)); err != nil {
			return err
		}
		if err := requireString(db.Password, fmt.Sprintf("%s password", name)); err != nil {
			return err
		}
		if db.Port != 5432 {
			return fmt.Errorf("%s port must be 5432 (got %d)", name, db.Port)
		}
		if err := requireString(db.Name, fmt.Sprintf("%s name", name)); err != nil {
			return err
		}
	}

	// S3 parameters
	if err := requireString(c.S3Params.Endpoint, "S3 endpoint"); err != nil {
		return err
	}
	if err := requireString(c.S3Params.AccessKeyID, "S3 access_key_id"); err != nil {
		return err
	}
	if err := requireString(c.S3Params.SecretAccessKey, "S3 secret_access_key"); err != nil {
		return err
	}
	if err := requireString(c.S3Params.BucketName, "S3 bucket_name"); err != nil {
		return err
	}

	return nil
}

// GetConfig returns the loaded configuration.
// The returned config should be treated as read-only.
func (cm *ConfigManager) GetConfig() *Config {
	return cm.config
}

// GetGeneral returns general parameters for convenience.
func (cm *ConfigManager) GetGeneral() GeneralParams {
	return cm.config.GeneralParams
}

// GetHTTP returns HTTP server parameters.
func (cm *ConfigManager) GetHTTP() HttpServerParams {
	return cm.config.HttpServerParams
}

// GetDatabase returns database parameters.
func (cm *ConfigManager) GetDatabase() DatabaseParams {
	return cm.config.DatabaseParams
}

// GetS3 returns S3 parameters.
func (cm *ConfigManager) GetS3() S3Params {
	return cm.config.S3Params
}

func (h *HttpServerParams) GetAddress() string {
	return fmt.Sprintf(
		"%s:%s",
		h.Address,
		h.Port,
	)
}

// Compiling a string to connect to main_db
func (db *DatabaseParams) GetDSN() string {
	return fmt.Sprintf(
		"postgres://%s:%s@%s:%d/%s?connect_timeout=%d&sslmode=disable",
		db.Username,
		db.Password,
		db.Host,
		db.Port,
		db.Name,
		db.Timeout,
	)
}

// findDotEnvPath tries to locate the .env file in the project root
// It starts from the current working directory and walks up until it finds .env
// or reaches a reasonable limit.
func findDotEnvPath() string {
	// Start from current working directory
	dir, err := os.Getwd()
	if err != nil {
		return ""
	}

	// Walk up max 3 levels looking for .env (covers backend/, backend/bin/, etc.)
	for i := 0; i < 3; i++ {
		candidate := filepath.Join(dir, ".env")
		if _, err := os.Stat(candidate); err == nil {
			return candidate
		}
		parent := filepath.Dir(dir)
		if parent == dir { // reached root
			break
		}
		dir = parent
	}

	return ""
}
