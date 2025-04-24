package parser

import (
	"crypto/x509"
	"errors"
)

// DERParser 实现了 Parser 接口，处理 DER 格式证书
type DERParser struct {
	options *ParserOptions
}

// Parse 方法解析 DER 格式证书
func (p *DERParser) Parse(data []byte) ([]*x509.Certificate, error) {
	// 尝试解析 DER 格式证书
	cert, err := x509.ParseCertificate(data)
	if err != nil {
		return nil, errors.New("DER 证书解析失败: " + err.Error())
	}
	return []*x509.Certificate{cert}, nil
}
