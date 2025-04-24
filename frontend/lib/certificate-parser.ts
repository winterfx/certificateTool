"use client"

interface Subject {
  common_name?: string
  organization?: string[]
  organizational_unit?: string[]
  country?: string[]
  locality?: string[]
  province?: string[]
  additional_names?: string[]
}

interface Issuer {
  common_name?: string
  organization?: string[]
  organizational_unit?: string[]
  country?: string[]
  locality?: string[]
  province?: string[]
  additional_names?: string[]
}

interface SANs {
  dns_names?: string[]
  ip_addresses?: string[]
  email_addresses?: string[]
  uris?: string[]
  [key: string]: string[] | undefined
}

export interface CertificateResponse {
  status: string
  format: string
  certificates: Array<{
    subject: Subject
    issuer: Issuer
    not_before: string
    not_after: string
    serial_number: string
    signature_algorithm: string
    public_key_algorithm: string
    pem_public_key: string
    key_usage: string[]
    ext_key_usage?: string[]
    is_ca: boolean
    version: number
    ocsp_servers?: string[]
    crl_distribution_points?: string[]
    subject_alternative_names: SANs
    index: number
  }>
}

export async function parseCertificate(file: File, password: string | null = null): Promise<CertificateResponse> {
  const formData = new FormData()
  formData.append('file', file)
  
  let endpoint = '/api/parse'
  if (password) {
    endpoint = '/api/parse-with-password'
    formData.append('password', password)
  }

  const response = await fetch(endpoint, {
    method: 'POST',
    body: formData,
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || '证书解析失败')
  }

  return response.json()
}
