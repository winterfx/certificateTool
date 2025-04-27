package parser

import (
	"crypto/x509"
	"encoding/base64"
	"encoding/pem"
	"errors"
	"fmt"
)

// CertParser 是实现 ParserCer 接口的结构体
type CertParser struct {
	options *ParserOptions
}

// Parse 实现了 ParserCer 接口
func (p *CertParser) Parse(data []byte) ([]*x509.Certificate, error) {
	decodedData, err := base64.StdEncoding.DecodeString(string(data))
	if err != nil {
		return nil, fmt.Errorf("Base64 解码失败: %v", err)
	}
	var certs []*x509.Certificate
	var block *pem.Block
	rest := decodedData

	for {
		block, rest = pem.Decode(rest)
		if block == nil {
			break
		}
		if block.Type != "CERTIFICATE" {
			continue
		}
		cert, err := x509.ParseCertificate(block.Bytes)
		if err != nil {
			return nil, err
		}
		certs = append(certs, cert)
	}

	// 如果没有解析出 PEM 块，尝试直接作为 DER 解析
	if len(certs) == 0 {
		cert, err := x509.ParseCertificate(decodedData)
		if err != nil {
			fmt.Printf("ParseCertificate error: %v\n", err)
			return nil, errors.New("无法解析为证书格式")
		}
		certs = append(certs, cert)
	}

	return certs, nil
}
