// pem_parser.go
package parser

import (
	"crypto/x509"
	"encoding/pem"
	"errors"
)

// PEMParser 实现了 Parser 接口，处理 PEM 格式证书
type PEMParser struct {
	options *ParserOptions
}

// Parse 方法解析 PEM 格式证书
func (p *PEMParser) Parse(data []byte) ([]*x509.Certificate, error) {
	var certs []*x509.Certificate

	// 通过 pem.Decode 解码 PEM 数据
	for {
		block, rest := pem.Decode(data)
		if block == nil {
			break
		}
		if block.Type == "CERTIFICATE" {
			// 解析证书
			cert, err := x509.ParseCertificate(block.Bytes)
			if err != nil {
				return nil, errors.New("PEM 证书解析失败: " + err.Error())
			}
			certs = append(certs, cert)
		}
		data = rest
	}

	// 如果没有找到证书
	if len(certs) == 0 {
		return nil, errors.New("没有找到有效的证书")
	}

	return certs, nil
}
