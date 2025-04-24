package parser

import (
	"crypto/x509"
	"errors"
	"fmt"

	"golang.org/x/crypto/pkcs12"
)

type PFXParser struct {
	options *ParserOptions
}

func (p *PFXParser) Parse(data []byte) ([]*x509.Certificate, error) {
	var (
		certs *x509.Certificate
		err   error
	)

	password := p.options.Password
	if password == "" {
		// 没有设置密码，尝试使用空密码
		_, certs, err = pkcs12.Decode(data, "")
		if err != nil {
			return nil, fmt.Errorf("PFX 解析失败（尝试空密码）: %w", err)
		}
	} else {
		// 使用设置的密码
		_, certs, err = pkcs12.Decode(data, password)
		if err != nil {
			return nil, fmt.Errorf("PFX 解析失败（使用密码）: %w", err)
		}
	}

	if certs == nil {
		return nil, errors.New("没有找到有效的证书")
	}

	return []*x509.Certificate{certs}, nil
}
