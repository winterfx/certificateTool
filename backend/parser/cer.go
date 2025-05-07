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

func tryBase64Decode(data []byte) ([]byte, error) {
	// 移除可能的换行和空格
	return base64.StdEncoding.DecodeString(string(data))
}

// Parse 实现了 ParserCer 接口
func (p *CertParser) Parse(data []byte) ([]*x509.Certificate, error) {
	var certs []*x509.Certificate
	var block *pem.Block

	// 尝试将输入数据视为 Base64 编码
	base64Decoded, err := tryBase64Decode(data)
	if err == nil && len(base64Decoded) > 0 {

		// 如果 Base64 解码成功并且结果非空，则使用解码后的数据继续
		data = base64Decoded
	}

	rest := data

	// 1. 尝试将输入数据作为 PEM 格式解析
	for {
		block, rest = pem.Decode(rest) // pem.Decode 会处理 PEM 中的 Base64 部分
		if block == nil {
			// 如果 rest 中没有更多 PEM 块了，则跳出循环
			// 如果一开始 data 就不是有效的 PEM，block 也会是 nil
			break
		}
		if block.Type == "CERTIFICATE" {
			cert, err := x509.ParseCertificate(block.Bytes) // block.Bytes 是 DER 编码的数据
			if err != nil {
				// 如果 PEM 块内的证书数据无法解析，这可能是一个问题，但我们继续尝试其他块
				// 或者，如果严格要求所有块都有效，可以在这里返回错误
				fmt.Printf("Failed to parse certificate from PEM block: %v\n", err)
				continue // 或者 return nil, fmt.Errorf("failed to parse certificate from PEM block: %w", err)
			}
			certs = append(certs, cert)
		}
	}

	// 2. 如果通过 PEM 解码没有得到任何证书 (certs 仍为空)
	//    并且原始数据 data 也可能本身就是 DER 格式
	//    则尝试将整个原始输入 data 作为 DER 格式解析
	if len(certs) == 0 {
		// 此时，我们假设原始的 data 可能就是 DER 编码的证书
		cert, err := x509.ParseCertificate(data)
		if err != nil {
			// 如果两种方式都失败了，返回一个通用错误或者更具体的错误
			// 原始的 Base64 解码错误在此处不再适用，因为我们改变了策略
			return nil, errors.New("无法将数据解析为 PEM 或 DER 证书格式")
		}
		certs = append(certs, cert)
	}

	// 如果解析后一个证书都没有，也应该算错误
	if len(certs) == 0 {
		return nil, errors.New("未能从输入数据中解析出任何证书")
	}

	return certs, nil
}
