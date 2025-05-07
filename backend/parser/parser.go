package parser

import (
	"crypto/x509"
	"strings"
)

type CertType string

const (
	PFX     CertType = "pfx"
	CER     CertType = "cer"
	CSR     CertType = "csr"
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
	return CER
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
	case PFX:
		return &PFXParser{options: options}
	case CER:
		return &CertParser{options: options}
	default:
		return nil
	}
}
