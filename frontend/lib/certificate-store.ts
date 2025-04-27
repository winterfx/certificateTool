"use client"

import { create } from "zustand"
import type { CertificateResponse } from "./certificate-parser"

interface CertificateStore {
  fileName: string | null
  fileType: string
  selectedFileId: string | null
  mightNeedPassword: boolean
  password: string | null
  passwordAttempted: boolean
  passwordError: string | null
  isProcessing: boolean
  certificateResponse: CertificateResponse | null
  jsonViewData: any | null
  certificateData: string | ArrayBuffer | null
  setFileName: (name: string | null) => void
  setFileType: (type: string) => void
  setSelectedFileId: (id: string | null) => void
  setMightNeedPassword: (value: boolean) => void
  setPassword: (password: string | null) => void
  setPasswordAttempted: (value: boolean) => void
  setPasswordError: (error: string | null) => void
  setIsProcessing: (value: boolean) => void
  setCertificateResponse: (data: CertificateResponse | null) => void
  setJsonViewData: (data: any | null) => void
  setCertificateData: (data: string | ArrayBuffer | null ) => void
  resetPassword: () => void
  reset: () => void
}

export const useCertificateStore = create<CertificateStore>((set) => ({
  fileName: null,
  fileType: "",
  selectedFileId: null,
  mightNeedPassword: false,
  password: null,
  passwordAttempted: false,
  passwordError: null,
  isProcessing: false,
  certificateResponse: null,
  jsonViewData: null,
  certificateData: null,
  setFileName: (name) => set({ fileName: name }),
  setFileType: (type) => set({ fileType: type }),
  setSelectedFileId: (id) => set({ selectedFileId: id }),
  setMightNeedPassword: (value) => set({ mightNeedPassword: value }),
  setPassword: (password) => set({ password }),
  setPasswordAttempted: (value) => set({ passwordAttempted: value }),
  setPasswordError: (error) => set({ passwordError: error }),
  setIsProcessing: (value) => set({ isProcessing: value }),
  setCertificateResponse: (data) => set({ certificateResponse: data }),
  setJsonViewData: (data) => set({ jsonViewData: data }),
  setCertificateData: (data) => set({ certificateData: data }),
  resetPassword: () =>
    set({
      password: null,
      passwordAttempted: false,
      passwordError: null,
    }),
  reset: () =>
    set({
      fileName: null,
      fileType: "",
      selectedFileId: null,
      mightNeedPassword: false,
      password: null,
      passwordAttempted: false,
      passwordError: null,
      isProcessing: false,
      certificateResponse: null,
      jsonViewData: null,
      certificateData: null,
    }),
}))
