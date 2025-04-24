import { CertificateUploader } from "@/components/certificate-uploader"
import { CertificateViewer } from "@/components/certificate-viewer"

export default function Home() {
  return (
    <main className="container mx-auto py-10 px-4">
      <h1 className="text-3xl font-bold mb-6">证书查看器</h1>
      <div className="grid gap-8 md:grid-cols-1 lg:grid-cols-1">
        <CertificateUploader />
        <CertificateViewer />
      </div>
    </main>
  )
}