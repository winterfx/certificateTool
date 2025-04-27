package main

import (
	"certificate-analyse/parser"
	"crypto/rsa"
	"crypto/sha1"
	"crypto/sha256"
	"crypto/x509"
	"encoding/hex"
	"encoding/pem"
	"errors"
	"fmt"
	"io"
	"log"
	"net/http"

	"crypto/x509/pkix"

	"github.com/gin-gonic/gin"
)

func extractCertInfo(cert *x509.Certificate, index int) CertInfo {
	info := CertInfo{
		Index:              index,
		NotBefore:          cert.NotBefore.String(),
		NotAfter:           cert.NotAfter.String(),
		SerialNumber:       cert.SerialNumber.String(),
		SignatureAlgorithm: cert.SignatureAlgorithm.String(),
		PublicKeyAlgorithm: cert.PublicKeyAlgorithm.String(),
		Version:            cert.Version,
		IsCA:               cert.IsCA,
		OCSPServers:        cert.OCSPServer,
		CRLDistribution:    cert.CRLDistributionPoints,
	}

	// 指纹
	sha1Sum := sha1.Sum(cert.Raw)
	info.FingerprintSHA1 = hex.EncodeToString(sha1Sum[:])
	sha256Sum := sha256.Sum256(cert.Raw)
	info.FingerprintSHA256 = hex.EncodeToString(sha256Sum[:])
	info.Signature = hex.EncodeToString(cert.Signature)

	// 公钥信息
	switch pub := cert.PublicKey.(type) {
	case *rsa.PublicKey:
		info.PublicKeyInfo = PublicKeyInfo{
			Modulus:   hex.EncodeToString(pub.N.Bytes()),
			Exponent:  pub.E,
			BitLen:    pub.N.BitLen(),
			Algorithm: "RSA",
		}
	// 可扩展支持 ECDSA/Ed25519
	default:
		info.PublicKeyInfo = PublicKeyInfo{
			Algorithm: fmt.Sprintf("%T", pub),
		}
	}
	// 添加 PEM 格式的公钥
	pubBytes, err := x509.MarshalPKIXPublicKey(cert.PublicKey)
	if err != nil {
		log.Printf("failed to marshal public key: %v", err)
	} else {
		pemBlock := &pem.Block{
			Type:  "PUBLIC KEY",
			Bytes: pubBytes,
		}
		info.PemPublicKey = string(pem.EncodeToMemory(pemBlock))
	}

	// Subject
	info.Subject = DNInfo{
		CommonName:         cert.Subject.CommonName,
		Organization:       cert.Subject.Organization,
		OrganizationalUnit: cert.Subject.OrganizationalUnit,
		Country:            cert.Subject.Country,
		Locality:           cert.Subject.Locality,
		Province:           cert.Subject.Province,
		AdditionalNames:    extractDNAttributes(cert.Subject.Names),
	}

	// Issuer
	info.Issuer = DNInfo{
		CommonName:         cert.Issuer.CommonName,
		Organization:       cert.Issuer.Organization,
		OrganizationalUnit: cert.Issuer.OrganizationalUnit,
		Country:            cert.Issuer.Country,
		Locality:           cert.Issuer.Locality,
		Province:           cert.Issuer.Province,
		AdditionalNames:    extractDNAttributes(cert.Issuer.Names),
	}

	// Key Usage
	if cert.KeyUsage&x509.KeyUsageDigitalSignature != 0 {
		info.KeyUsage = append(info.KeyUsage, "DigitalSignature")
	}
	if cert.KeyUsage&x509.KeyUsageKeyEncipherment != 0 {
		info.KeyUsage = append(info.KeyUsage, "KeyEncipherment")
	}
	if cert.KeyUsage&x509.KeyUsageCertSign != 0 {
		info.KeyUsage = append(info.KeyUsage, "CertSign")
	}

	// ExtKeyUsage
	for _, usage := range cert.ExtKeyUsage {
		switch usage {
		case x509.ExtKeyUsageAny:
			info.ExtKeyUsage = append(info.ExtKeyUsage, "Any")
		case x509.ExtKeyUsageServerAuth:
			info.ExtKeyUsage = append(info.ExtKeyUsage, "ServerAuth")
		case x509.ExtKeyUsageClientAuth:
			info.ExtKeyUsage = append(info.ExtKeyUsage, "ClientAuth")
		case x509.ExtKeyUsageCodeSigning:
			info.ExtKeyUsage = append(info.ExtKeyUsage, "CodeSigning")
		case x509.ExtKeyUsageEmailProtection:
			info.ExtKeyUsage = append(info.ExtKeyUsage, "EmailProtection")
		case x509.ExtKeyUsageTimeStamping:
			info.ExtKeyUsage = append(info.ExtKeyUsage, "TimeStamping")
		case x509.ExtKeyUsageOCSPSigning:
			info.ExtKeyUsage = append(info.ExtKeyUsage, "OCSPSigning")
		default:
			info.ExtKeyUsage = append(info.ExtKeyUsage, fmt.Sprintf("Unknown(%d)", usage))
		}
	}

	// SANs
	info.SANs = SubjectAltNames{
		DNSNames:       cert.DNSNames,
		EmailAddresses: cert.EmailAddresses,
	}
	for _, ip := range cert.IPAddresses {
		info.SANs.IPAddresses = append(info.SANs.IPAddresses, ip.String())
	}
	for _, uri := range cert.URIs {
		info.SANs.URIs = append(info.SANs.URIs, uri.String())
	}

	// 扩展字段提取（SKID, AKID, Policy）
	for _, ext := range cert.Extensions {
		if ext.Id.Equal([]int{2, 5, 29, 14}) { // SKID
			info.SubjectKeyID = hex.EncodeToString(ext.Value)
		}
		if ext.Id.Equal([]int{2, 5, 29, 35}) { // AKID
			info.AuthorityKeyID = hex.EncodeToString(ext.Value)
		}
	}

	for _, policy := range cert.PolicyIdentifiers {
		info.PolicyOIDs = append(info.PolicyOIDs, policy.String())
	}

	return info
}

func extractDNAttributes(names []pkix.AttributeTypeAndValue) []string {
	var result []string
	for _, name := range names {
		result = append(result, fmt.Sprintf("%s=%s", name.Type.String(), name.Value))
	}
	return result
}

// handler function
func handleCertParse(c *gin.Context) {
	file, err := c.FormFile("file")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"status": "error", "error": "未提供文件"})
		return
	}
	f, _ := file.Open()
	defer f.Close()
	data, _ := io.ReadAll(f)

	typeName := parser.DetectType(data, file.Filename)
	if typeName == parser.UNKNOWN {
		c.JSON(http.StatusBadRequest, gin.H{"status": "error", "error": "不支持的证书格式"})
		return
	}
	p := typeName.NewParser()
	certs, err := p.Parse(data)
	if errors.Is(err, parser.ErrInvalidFormat) {
		c.JSON(http.StatusBadRequest, gin.H{"status": "error", "error": "证书格式错误"})
		return
	}
	if err != nil {
		msg := fmt.Sprintf("Parse error: %v\n", err)
		c.JSON(http.StatusInternalServerError, gin.H{"status": "error", "error": msg})
		return
	}
	resp := []CertInfo{}
	for i, cert := range certs {
		resp = append(resp, extractCertInfo(cert, i))
	}
	c.JSON(http.StatusOK, gin.H{"status": "ok", "format": typeName, "certificates": resp})
}

func handleCertParseWithPassword(c *gin.Context) {
	file, err := c.FormFile("file")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"status": "error", "error": "未提供文件"})
		return
	}
	password := c.PostForm("password")
	if password == "" {
		c.JSON(http.StatusBadRequest, gin.H{"status": "error", "error": "未提供密码"})
		return
	}
	f, _ := file.Open()
	defer f.Close()
	data, _ := io.ReadAll(f)
	parser := parser.PFX.NewParser(parser.WithPassword(password))
	certs, err := parser.Parse(data)
	if err != nil {
		errmsg := fmt.Sprintf("Parse error: %v\n", err)
		c.JSON(http.StatusInternalServerError, gin.H{"status": "error", "error": errmsg})
		return
	}
	resp := []CertInfo{}
	for i, cert := range certs {
		resp = append(resp, extractCertInfo(cert, i))
	}
	c.JSON(http.StatusOK, gin.H{"status": "ok", "format": "pfx", "certificates": resp})
}
