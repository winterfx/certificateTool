package main

type CertInfo struct {
	Index              int
	NotBefore          string
	NotAfter           string
	SerialNumber       string
	SignatureAlgorithm string
	PublicKeyAlgorithm string
	Version            int
	IsCA               bool
	KeyUsage           []string
	ExtKeyUsage        []string
	OCSPServers        []string
	CRLDistribution    []string
	Signature          string
	FingerprintSHA1    string
	FingerprintSHA256  string
	SubjectKeyID       string
	AuthorityKeyID     string
	PolicyOIDs         []string

	Subject      DNInfo
	Issuer       DNInfo
	SANs         SubjectAltNames
	PemPublicKey string
	PublicKeyInfo
}

type DNInfo struct {
	CommonName         string
	Organization       []string
	OrganizationalUnit []string
	Country            []string
	Locality           []string
	Province           []string
	AdditionalNames    []string
}

type SubjectAltNames struct {
	DNSNames       []string
	IPAddresses    []string
	EmailAddresses []string
	URIs           []string
}

type PublicKeyInfo struct {
	Modulus   string
	Exponent  int
	BitLen    int
	Algorithm string
}
