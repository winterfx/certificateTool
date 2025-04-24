"use client"

import type React from "react"

import { useState } from "react"
import { useToast } from "@/hooks/use-toast"
import { Upload, X, FileText, Lock, CheckCircle, XCircle } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useCertificateStore } from "@/lib/certificate-store"

interface FileStatus {
  id: string
  name: string
  type: string
  status: "pending" | "encrypted" | "success" | "error"
  data: string | null
  error?: string
}

export function CertificateUploader() {
  const { toast } = useToast()
  const [isDragging, setIsDragging] = useState(false)
  const [files, setFiles] = useState<FileStatus[]>([])
  const { setCertificateData, setFileName, setFileType, setSelectedFileId } = useCertificateStore()

  const getFileIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <FileText className="h-4 w-4 text-gray-500" />
      case "encrypted":
        return <Lock className="h-4 w-4 text-amber-500" />
      case "success":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "error":
        return <XCircle className="h-4 w-4 text-red-500" />
      default:
        return <FileText className="h-4 w-4" />
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="outline">待处理</Badge>
      case "encrypted":
        return (
          <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
            加密
          </Badge>
        )
      case "success":
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            已解析
          </Badge>
        )
      case "error":
        return (
          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
            错误
          </Badge>
        )
      default:
        return <Badge variant="outline">未知</Badge>
    }
  }

  const handleFiles = async (fileList: FileList) => {
    const newFiles: FileStatus[] = []

    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i]
      const extension = file.name.split(".").pop()?.toLowerCase() || ""
      const fileId = `file-${Date.now()}-${i}`
      const isPotentiallyEncrypted = ["pfx", "p12"].includes(extension)

      // Add file to list with pending status
      const fileStatus: FileStatus = {
        id: fileId,
        name: file.name,
        type: extension,
        status: isPotentiallyEncrypted ? "encrypted" : "pending",
        data: null,
      }

      newFiles.push(fileStatus)

      // Process file
      try {
        const reader = new FileReader()

        reader.onload = async (e) => {
          const result = e.target?.result
          let fileData: string | null = null
          let fileStatus: "pending" | "encrypted" | "success" | "error" = "success"

          if (typeof result === "string") {
            fileData = result
            // Check if encrypted
            if (result.includes("ENCRYPTED")) {
              fileStatus = "encrypted"
            }
          } else if (result instanceof ArrayBuffer) {
            const uint8Array = new Uint8Array(result)
            fileData = btoa(String.fromCharCode.apply(null, Array.from(uint8Array)))
          }

          // Keep encrypted status for p12/pfx files
          if (isPotentiallyEncrypted) {
            fileStatus = "encrypted"
          }

          // Update file status
          setFiles((prev) => prev.map((f) => (f.id === fileId ? { ...f, status: fileStatus, data: fileData } : f)))

          // If this is the first file or if it's encrypted, select it automatically
          if (i === 0 || fileStatus === "encrypted") {
            selectFile(fileId, fileData, file.name, extension)
          }
        }

        reader.onerror = () => {
          setFiles((prev) => prev.map((f) => (f.id === fileId ? { ...f, status: "error", error: "读取文件失败" } : f)))
          toast({
            variant: "destructive",
            title: "文件读取失败",
            description: `无法读取文件 ${file.name}，请重试。`
          })
        }

        if (["der", "pfx", "p12"].includes(extension)) {
          reader.readAsArrayBuffer(file)
        } else {
          reader.readAsText(file)
        }
      } catch (err) {
        setFiles((prev) => prev.map((f) => (f.id === fileId ? { ...f, status: "error", error: "处理文件失败" } : f)))
        toast({
          variant: "destructive",
          title: "文件处理失败",
          description: `处理文件 ${file.name} 时发生错误，请重试。`
        })
      }
    }

    setFiles((prev) => [...prev, ...newFiles])
  }

  const selectFile = (id: string, data: string | null, name: string, type: string) => {
    if (!data) return

    setCertificateData(data)
    setFileName(name)
    setFileType(type)
    setSelectedFileId(id)

    // Check if file might need password
    const mightNeedPassword = ["pfx", "p12"].includes(type) || (typeof data === "string" && data.includes("ENCRYPTED"))

    if (mightNeedPassword) {
      useCertificateStore.getState().setMightNeedPassword(true)
      useCertificateStore.getState().setPasswordAttempted(false)
    } else {
      useCertificateStore.getState().setMightNeedPassword(false)
    }
  }

  const removeFile = (id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id))

    // If the removed file was selected, clear the selection
    if (useCertificateStore.getState().selectedFileId === id) {
      setCertificateData(null)
      setFileName(null)
      setFileType("")
      setSelectedFileId(null)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>上传证书</CardTitle>
        <CardDescription>支持多种证书格式（.pem, .crt, .cer, .pfx/.p12, .key, .der, .csr 等）</CardDescription>
      </CardHeader>
      <CardContent>
        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
            isDragging ? "border-primary bg-primary/5" : "border-gray-300 hover:border-primary"
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => document.getElementById("file-upload")?.click()}
        >
          <div className="flex flex-col items-center justify-center space-y-4">
            <div className="p-3 rounded-full bg-primary/10">
              <Upload className="h-8 w-8 text-primary" />
            </div>
            <div>
              <p className="text-lg font-medium">拖放证书文件或点击上传</p>
              <p className="text-sm text-gray-500 mt-1">支持多文件上传，自动识别并解析证书格式</p>
            </div>
          </div>
          <input
            id="file-upload"
            type="file"
            className="hidden"
            accept=".pem,.crt,.cer,.pfx,.p12,.key,.der.,.csr"
            onChange={handleFileChange}
            multiple
          />
        </div>

        {files.length > 0 && (
          <div className="mt-4">
            <h3 className="text-sm font-medium mb-2">已上传文件</h3>
            <ScrollArea className="h-[200px] rounded-md border">
              <div className="p-4 space-y-2">
                {files.map((file) => (
                  <div
                    key={file.id}
                    className={`flex items-center justify-between p-2 rounded-md hover:bg-gray-50 cursor-pointer ${
                      useCertificateStore.getState().selectedFileId === file.id ? "bg-gray-100" : ""
                    }`}
                    onClick={() => file.data && selectFile(file.id, file.data, file.name, file.type)}
                  >
                    <div className="flex items-center space-x-3">
                      {getFileIcon(file.status)}
                      <div>
                        <p className="text-sm font-medium">{file.name}</p>
                        <div className="flex items-center space-x-2">
                          <span className="text-xs text-gray-500">{file.type.toUpperCase()}</span>
                          {getStatusBadge(file.status)}
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={(e) => {
                        e.stopPropagation()
                        removeFile(file.id)
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
