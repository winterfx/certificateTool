package parser

import (
	"crypto/x509"
	"errors"
	"fmt"
)

// DERParser 实现了 Parser 接口，处理 DER 格式证书
type DERParser struct {
	options *ParserOptions
}

// Parse 方法解析 DER 格式证书
func (p *DERParser) Parse(data []byte) ([]*x509.Certificate, error) {
	// 先尝试用 x509.ParseCertificates 解析所有证书（处理 trailing data）
	fmt.Println(data)
	certs, err := x509.ParseCertificates(data)
	if err != nil {
		return nil, errors.New("DER 证书解析失败: " + err.Error())
	}

	// 如果成功解析多个证书，返回第一个证书
	if len(certs) > 0 {
		return certs[:1], nil
	}

	return nil, errors.New("没有解析到证书")
}
