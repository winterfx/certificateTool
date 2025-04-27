"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import {
  Copy,
  ChevronDown,
  ChevronRight,
  FileText,
  Key,
  Shield,
  Calendar,
  Download,
  Loader2,
  AlertCircle,
} from "lucide-react"
import { useCertificateStore } from "@/lib/certificate-store"
import { parseCertificate } from "@/lib/certificate-parser"
import { PasswordDialog } from "@/components/password-dialog"
import { JsonView } from "@/components/json-view"
import { AlertDescription, Alert } from "@/components/ui/alert"
import { useToast } from "@/hooks/use-toast"

// Update interfaces to match API response
interface Subject {
  CommonName?: string;
  Organization?: string[] | null;
  OrganizationalUnit?: string[] | null;
  Country?: string[];
  Locality?: string[] | null;
  Province?: string[] | null;
  AdditionalNames?: string[];
  [key: string]: any;
}

interface Issuer {
  CommonName?: string;
  Organization?: string[];
  OrganizationalUnit?: string[];
  Country?: string[];
  Locality?: string[] | null;
  Province?: string[] | null;
  AdditionalNames?: string[];
  [key: string]: any;
}

interface SANs {
  DNSNames?: string[] | null;
  IPAddresses?: string[] | null;
  EmailAddresses?: string[] | null;
  URIs?: string[] | null;
  [key: string]: string[] | null | undefined;
}

interface Certificate {
  Subject: Subject;
  Issuer: Issuer;
  NotBefore: string;
  NotAfter: string;
  SerialNumber: string;
  SignatureAlgorithm: string;
  PublicKeyAlgorithm: string;
  PemPublicKey?: string;
  KeyUsage: string[] | null;
  ExtKeyUsage?: string[] | null;
  IsCA: boolean;
  Version: number;
  OCSPServers?: string[] | null;
  CRLDistribution?: string[] | null;
  SANs: SANs;
  Index: number;
  Signature: string;
  FingerprintSHA1: string;
  FingerprintSHA256: string;
  SubjectKeyID: string;
  AuthorityKeyID: string;
  PolicyOIDs?: string[] | null;
  Modulus: string;
  Exponent: number;
  BitLen: number;
  Algorithm: string;
}

interface ParsedCertificateData {
  certificates: Certificate[];
  format?: string;
  status?: string;
}

function isArrayOrNullOrUndefined(value: any): boolean {
  return value === undefined || value === null || Array.isArray(value);
}

// Add type guard function
function isParsedCertificateData(data: any): data is { certificates: Certificate[] } {
  if (!data || !Array.isArray(data.certificates)) {
    console.log("data.certificates is invalid");
    return false;
  }

  for (const [index, cert] of data.certificates.entries()) {
    if (!cert || typeof cert !== 'object') {
      console.log(`cert[${index}] is not an object`);
      return false;
    }

    const mustBeObject = ['Subject', 'Issuer', 'SANs'];
    const mustBeString = ['NotBefore', 'NotAfter', 'SerialNumber', 'SignatureAlgorithm', 'PublicKeyAlgorithm', 'Signature', 'FingerprintSHA1', 'FingerprintSHA256', 'SubjectKeyID', 'AuthorityKeyID', 'Modulus', 'Algorithm'];
    const mustBeNumber = ['Version', 'Exponent', 'BitLen'];
    const mustBeBoolean = ['IsCA'];

    for (const key of mustBeObject) {
      if (typeof cert[key] !== 'object') {
        console.log(`cert[${index}].${key} is not object`);
        return false;
      }
    }

    for (const key of mustBeString) {
      if (typeof cert[key] !== 'string') {
        console.log(`cert[${index}].${key} is not string`);
        return false;
      }
    }

    for (const key of mustBeNumber) {
      if (typeof cert[key] !== 'number') {
        console.log(`cert[${index}].${key} is not number`);
        return false;
      }
    }

    for (const key of mustBeBoolean) {
      if (typeof cert[key] !== 'boolean') {
        console.log(`cert[${index}].${key} is not boolean`);
        return false;
      }
    }

    const nullableArrays = ['KeyUsage', 'ExtKeyUsage', 'OCSPServers', 'CRLDistribution', 'PolicyOIDs'];
    for (const key of nullableArrays) {
      if (!isArrayOrNullOrUndefined(cert[key])) {
        console.log(`cert[${index}].${key} is not array/null/undefined`);
        return false;
      }
    }
  }

  return true;
}


function arrayBufferToHex(arrayBuffer:ArrayBuffer) {
  const uint8Array = new Uint8Array(arrayBuffer);
  return uint8Array.reduce((hexString, byte) => {
    return hexString + byte.toString(16).padStart(2, '0') + ' ';
  }, '');
}
// Update the useEffect to cast the response
export function CertificateViewer() {
  const {
    certificateData,
    fileName,
    fileType,
    password,
    passwordAttempted,
    isProcessing,
    jsonViewData,
    setJsonViewData,
    setIsProcessing,
  } = useCertificateStore()
  const { toast } = useToast()
  const [parsedData, setParsedData] = useState<ParsedCertificateData | null>(null)
  const [activeTab, setActiveTab] = useState("details")
  const [copied, setCopied] = useState(false)
  const [exportKey, setExportKey] = useState<{ type: string; data: string } | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    const parseCertificateData = async () => {
      if (!certificateData) {
        setParsedData(null)
        setExportKey(null)
        return
      }

      try {
        setIsProcessing(true)

        // 创建文件对象用于API调用
        const certificateFile = new File(
          [certificateData],
          fileName || 'certificate',
          { type: 'application/octet-stream' }
        )

        // 调用API解析证书
        const response = await parseCertificate(certificateFile, password);
        if (!isParsedCertificateData(response)) {
          throw new Error('Invalid certificate data format');
        }

        setParsedData(response);
        setJsonViewData(response);

      } catch (error) {
        console.error("证书解析失败:", error)
        setParsedData(null)
        setExportKey(null)
        toast({
          variant: "destructive",
          title: "证书解析失败",
          description: error instanceof Error ? error.message : "无法解析证书文件，请检查文件格式是否正确"
        })
      } finally {
        setIsProcessing(false)
      }
    }

    parseCertificateData()
  }, [certificateData, fileName, fileType, password, passwordAttempted])


  const copyToClipboard = (text: string, message = "已复制") => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
    toast({
      title: "复制成功",
      description: message
    })
  }

  const downloadAsFile = (content: string, filename: string) => {
    try {
      const blob = new Blob([content], { type: "text/plain" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      toast({
        title: "下载成功",
        description: `文件 ${filename} 已下载`
      })
    } catch (error) {
      toast({
        variant: "destructive",
        title: "下载失败",
        description: "文件下载过程中发生错误，请重试"
      })
    }
  }

  if (!mounted) {
    return (
      <Card className="min-h-[400px] flex items-center justify-center">
        <CardContent className="text-center">
          <Loader2 className="h-12 w-12 mx-auto mb-4 animate-spin text-primary" />
          <p>Loading...</p>
        </CardContent>
      </Card>
    )
  }

  if (isProcessing) {
    return (
      <Card className="min-h-[400px] flex items-center justify-center">
        <CardContent className="text-center">
          <Loader2 className="h-12 w-12 mx-auto mb-4 animate-spin text-primary" />
          <p>正在解析证书，请稍候...</p>
        </CardContent>
      </Card>
    )
  }

  if (!certificateData || !parsedData) {
    return (
      <Card className="min-h-[400px] flex items-center justify-center">
        <CardContent className="text-center text-gray-500">
          <h3 className="text-lg font-medium mb-2">证书查看区</h3>
          <FileText className="h-12 w-12 mx-auto mb-4 opacity-30" />
          <p>上传证书文件以查看详细信息</p>
          <p className="text-xs mt-2">支持 .pem, .crt, .cer, .pfx/.p12, .key, .der 等格式</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <PasswordDialog />
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>证书信息</CardTitle>
              <CardDescription className="flex items-center mt-1">
                {fileName}
                <Badge variant="outline" className="ml-2">
                  {fileType.toUpperCase()}
                </Badge>
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="details" value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="details">证书链</TabsTrigger>
              <TabsTrigger value="json">JSON视图</TabsTrigger>
              <TabsTrigger value="raw">原始数据</TabsTrigger>
            </TabsList>

            <TabsContent value="details" className="space-y-4">
              {parsedData.certificates && parsedData.certificates.map((cert: Certificate, index: number) => (
                <Collapsible key={index} className="border rounded-md">
                  <CollapsibleTrigger className="flex items-center justify-between w-full p-4 text-left">
                    <div className="flex items-center">
                      <Shield className="h-5 w-5 mr-2" />
                      <span>{cert.Subject.CommonName || `证书 #${index + 1}`}</span>
                      <Badge variant="outline" className="ml-2">
                        {index === 0 ? "终端证书" : index === parsedData.certificates.length - 1 ? "根证书" : "中间证书"}
                      </Badge>
                    </div>
                    <ChevronDown className="h-4 w-4" />
                  </CollapsibleTrigger>
                  <CollapsibleContent className="px-4 pb-4 border-t">
                    <div className="space-y-4 pt-4">
                      <CertificateSection title="主题信息" icon={<Shield className="h-5 w-5" />} data={cert.Subject} />
                      <CertificateSection title="签发者" icon={<Shield className="h-5 w-5" />} data={cert.Issuer} />
                      <CertificateSection
                        title="有效期"
                        icon={<Calendar className="h-5 w-5" />}
                        data={{
                          生效时间: cert.NotBefore,
                          过期时间: cert.NotAfter,
                        }}
                      />
                      <CertificateSection
                        title="证书信息"
                        icon={<Key className="h-5 w-5" />}
                        data={{
                          "序列号": cert.SerialNumber,
                          "签名算法": cert.SignatureAlgorithm,
                          "公钥算法": cert.PublicKeyAlgorithm,
                          "公钥": cert.PemPublicKey,
                          "密钥用途": cert.KeyUsage,
                          "扩展密钥用途": cert.ExtKeyUsage,
                          "是否CA": cert.IsCA ? "是" : "否",
                          "版本": cert.Version,
                          "密钥长度": cert.BitLen,
                          "指数": cert.Exponent,
                          "算法": cert.Algorithm,
                        }}
                      />
                      <CertificateSection
                        title="密钥标识符"
                        icon={<Key className="h-5 w-5" />}
                        data={{
                          "主题密钥标识符": cert.SubjectKeyID,
                          "颁发者密钥标识符": cert.AuthorityKeyID,
                        }}
                      />
                      <CertificateSection
                        title="指纹信息"
                        icon={<Shield className="h-5 w-5" />}
                        data={{
                          "SHA1指纹": cert.FingerprintSHA1,
                          "SHA256指纹": cert.FingerprintSHA256,
                        }}
                      />
                      <CertificateSection
                        title="其他信息"
                        icon={<Shield className="h-5 w-5" />}
                        data={{
                          "OCSP服务器": cert.OCSPServers,
                          "CRL分发点": cert.CRLDistribution,
                          "主题备用名称": cert.SANs,
                          "策略OID": cert.PolicyOIDs,
                          "签名": cert.Signature,
                          "模数": cert.Modulus,
                        }}
                      />
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              ))}
            </TabsContent>

            <TabsContent value="json">
              {jsonViewData ? (
                <div className="border rounded-md p-4 bg-gray-50">
                  <JsonView data={jsonViewData} />
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">无法生成JSON视图</div>
              )}
            </TabsContent>

            <TabsContent value="raw">
              <div className="bg-gray-50 p-4 rounded-md">
                <div className="overflow-auto max-h-[400px]">
                  <pre className="text-xs whitespace-pre-wrap break-all">    
                    {certificateData instanceof ArrayBuffer
                    ? // 如果是 ArrayBuffer, 转换为二进制字符串
                    arrayBufferToHex(certificateData)
                    : certificateData}
                  </pre>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </>
  )
}

function CertificateSection({ title, icon, data }: { title: string; icon?: React.ReactNode; data: any }) {
  const [isOpen, setIsOpen] = useState(true)
  const [expandedValues, setExpandedValues] = useState<{ [key: string]: boolean }>({})

  const toggleExpand = (key: string) => {
    setExpandedValues(prev => ({
      ...prev,
      [key]: !prev[key]
    }))
  }

  if (!data || typeof data !== 'object') {
    return (
      <Collapsible open={isOpen} onOpenChange={setIsOpen} className="border rounded-md">
        <CollapsibleTrigger className="flex items-center w-full p-4 text-left">
          {icon && <span className="mr-2">{icon}</span>}
          <span className="font-medium">{title}</span>
          <span className="ml-auto">
            {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </span>
        </CollapsibleTrigger>
        <CollapsibleContent className="px-4 pb-4">
          <div className="text-gray-500 text-center">无数据</div>
        </CollapsibleContent>
      </Collapsible>
    )
  }

  // 处理数组类型的数据
  const entries = Array.isArray(data) 
    ? data.map((item, index) => [`项目 ${index + 1}`, item])
    : Object.entries(data)

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="border rounded-md">
      <CollapsibleTrigger className="flex items-center w-full p-4 text-left">
        {icon && <span className="mr-2">{icon}</span>}
        <span className="font-medium">{title}</span>
        <span className="ml-auto">
          {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </span>
      </CollapsibleTrigger>
      <CollapsibleContent className="px-4 pb-4">
        <div className="space-y-2">
          {entries.map((entry: any[], index: number) => {
            const [key, value] = entry;
            // 处理不同类型的值
            let displayValue: React.ReactNode = value
            if (value === null || value === undefined) {
              displayValue = <span className="text-gray-400">-</span>
            } else if (typeof value === 'object') {
              displayValue = JSON.stringify(value, null, 2)
            } else if (Array.isArray(value)) {
              displayValue = value.join(', ')
            }

            return (
              <div key={`${key}-${index}`} className="grid grid-cols-3 gap-2">
                <div className="font-medium text-gray-700">{key}</div>
                <div className="col-span-2 break-all">
                  {typeof displayValue === "string" && displayValue.length > 100 ? (
                    <div className="relative">
                      <div className={expandedValues[key] ? "" : "overflow-hidden text-ellipsis"}>
                        {expandedValues[key] ? displayValue : displayValue.substring(0, 100) + "..."}
                      </div>
                      <div className="flex gap-2 mt-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 px-2"
                          onClick={() => toggleExpand(key)}
                        >
                          {expandedValues[key] ? "收起" : "展开"}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 px-2"
                          onClick={() => navigator.clipboard.writeText(displayValue as string)}
                        >
                          <Copy className="h-3 w-3 mr-1" />
                          复制
                        </Button>
                      </div>
                    </div>
                  ) : (
                    displayValue
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
}
