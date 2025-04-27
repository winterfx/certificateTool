package parser

import (
	"crypto/x509"
	"strings"
)

type CertType string

const (
	PEM     CertType = "pem"
	PFX     CertType = "pfx"
	DER     CertType = "der"
	CER     CertType = "cer"
	UNKNOWN CertType = "unknown"
)

type ParserCer interface {
	Parse(data []byte) ([]*x509.Certificate, error)
}

type ParserKey interface {
	Parse(data []byte)
}

func DetectType(data []byte, filename string) CertType {
	name := strings.ToLower(filename)

	if strings.HasSuffix(name, ".pfx") || strings.HasSuffix(name, ".p12") {
		return PFX
	}
	if strings.HasSuffix(name, ".pem") {
		return PEM
	}
	if strings.HasSuffix(name, ".der") {
		return DER
	}
	if strings.HasSuffix(name, ".csr") || strings.HasSuffix(name, ".cer") || strings.HasSuffix(name, ".crt") {
		return CER
	}
	return UNKNOWN
}

type ParserOptions struct {
	Password string
}

type ParserOptionFunc func(*ParserOptions)

func WithPassword(password string) ParserOptionFunc {
	return func(options *ParserOptions) {
		options.Password = password
	}
}

func (ct CertType) NewParser(p ...ParserOptionFunc) ParserCer {
	options := &ParserOptions{}
	for _, f := range p {
		f(options)
	}
	switch ct {
	case PEM:
		return &PEMParser{options: options}
	case PFX:
		return &PFXParser{options: options}
	case DER:
		return &DERParser{options: options}
	case CER:
		return &CertParser{options: options}
	default:
		return nil
	}
}
