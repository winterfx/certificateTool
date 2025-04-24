"use client"

import type React from "react"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, Eye, EyeOff, Loader2 } from "lucide-react"
import { useCertificateStore } from "@/lib/certificate-store"

export function PasswordDialog() {
  const {
    mightNeedPassword,
    passwordAttempted,
    passwordError,
    isProcessing,
    setPassword,
    setPasswordAttempted,
    resetPassword,
  } = useCertificateStore()

  const [inputPassword, setInputPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [open, setOpen] = useState(false)
  const [attempts, setAttempts] = useState(0)

  // Update dialog open state when mightNeedPassword changes
  useEffect(() => {
    if (mightNeedPassword && !passwordAttempted) {
      setOpen(true)
    } else {
      setOpen(false)
    }
  }, [mightNeedPassword, passwordAttempted])

  // Reset state when dialog closes
  useEffect(() => {
    if (!open) {
      setInputPassword("")
      setShowPassword(false)
    }
  }, [open])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setPassword(inputPassword)
    setPasswordAttempted(true)
    setAttempts((prev) => prev + 1)
    useCertificateStore.getState().setIsProcessing(true)

    // Simulate password verification (in a real app, this would be handled by the certificate parser)
    setTimeout(() => {
      // For demo purposes, consider password incorrect if it's not "password123"
      if (inputPassword !== "password123") {
        useCertificateStore.getState().setPasswordError("密码不正确，请重试")
        useCertificateStore.getState().setPasswordAttempted(false)
        useCertificateStore.getState().setIsProcessing(false)
      } else {
        useCertificateStore.getState().setPasswordError(null)
        useCertificateStore.getState().setIsProcessing(false)
        setOpen(false)
      }
    }, 1500)
  }

  const handleSkip = () => {
    setPasswordAttempted(true)
    setOpen(false)
  }

  const handleClose = () => {
    if (!isProcessing) {
      setOpen(false)
      if (!passwordAttempted) {
        setPasswordAttempted(true)
      }
    }
  }

  const handleRetry = () => {
    resetPassword()
    setOpen(true)
  }

  return (
    <>
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>输入证书密码</DialogTitle>
            <DialogDescription>
              您上传的证书文件需要密码才能解密。{attempts > 0 ? `已尝试 ${attempts} 次。` : ""}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            {passwordError && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{passwordError}</AlertDescription>
              </Alert>
            )}
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="password" className="text-right">
                  密码
                </Label>
                <div className="col-span-3 relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={inputPassword}
                    onChange={(e) => setInputPassword(e.target.value)}
                    className="pr-10"
                    autoFocus
                    disabled={isProcessing}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={isProcessing}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    <span className="sr-only">{showPassword ? "隐藏密码" : "显示密码"}</span>
                  </Button>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleSkip} disabled={isProcessing}>
                跳过
              </Button>
              <Button type="submit" disabled={isProcessing}>
                {isProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    处理中
                  </>
                ) : (
                  "确认"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {passwordAttempted && mightNeedPassword && passwordError && (
        <div className="mb-4">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="flex items-center justify-between">
              <span>{passwordError}</span>
              <Button size="sm" variant="outline" onClick={handleRetry}>
                重试
              </Button>
            </AlertDescription>
          </Alert>
        </div>
      )}
    </>
  )
}
