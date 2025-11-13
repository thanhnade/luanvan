import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { CheckCircle2, AlertCircle } from "lucide-react"
import { createProject } from "@/lib/mock-api"
import type { DatabaseItem, BackendItem, FrontendItem } from "@/types"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useWizardStore } from "@/stores/wizard-store"
import { toast } from "sonner"

/**
 * Step 4: Tổng quan và xác nhận
 */
export function StepSummary() {
  const navigate = useNavigate()
  const {
    projectName,
    description,
    databases,
    backends,
    frontends,
    setProjectName,
    setDescription,
    resetWizard,
  } = useWizardStore()

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [acceptedTerms, setAcceptedTerms] = useState(false)

  // Convert form data sang API format
  const convertToAPIFormat = () => {
    const dbItems: DatabaseItem[] = databases.map((db, index) => ({
      id: `db-${index}`,
      name: db.name,
      type: db.type,
      provision: db.provision,
      endpoint: db.provision === "user" && db.ip ? `${db.ip}:${db.port}` : undefined,
      username: db.provision === "user" ? db.username : undefined,
      hasSeedZip: !!db.seedZip,
      status: "pending" as const,
    }))

    const beItems: BackendItem[] = backends.map((be, index) => ({
      id: `be-${index}`,
      name: be.name,
      tech: be.tech,
      source: {
        kind: be.sourceType,
        ref: be.sourceType === "zip" ? "uploaded.zip" : be.dockerImage || "",
      },
      env: be.env?.reduce((acc, e) => {
        if (e.key && e.value) acc[e.key] = e.value
        return acc
      }, {} as Record<string, string>),
      dns: be.dns,
      status: "pending" as const,
      buildCommand: be.buildCommand,
      outputDir: be.outputDir,
    }))

    const feItems: FrontendItem[] = frontends.map((fe, index) => ({
      id: `fe-${index}`,
      name: fe.name,
      tech: fe.tech,
      source: {
        kind: fe.sourceType,
        ref: fe.sourceType === "zip" ? "uploaded.zip" : fe.dockerImage || "",
      },
      runtimeEnv: fe.runtimeEnv?.reduce((acc, e) => {
        if (e.key && e.value) acc[e.key] = e.value
        return acc
      }, {} as Record<string, string>),
      publicUrl: fe.publicUrl,
      status: "pending" as const,
      buildCommand: fe.buildCommand,
      outputDir: fe.outputDir,
    }))

    return { dbItems, beItems, feItems }
  }

  const handleSubmit = async () => {
    if (!projectName.trim()) {
      setError("Tên project không được để trống")
      return
    }

    if (!acceptedTerms) {
      setError("Vui lòng xác nhận điều khoản")
      return
    }

    setIsSubmitting(true)
    setError("")

    try {
      const { dbItems, beItems, feItems } = convertToAPIFormat()

      const project = await createProject({
        name: projectName,
        description,
        databases: dbItems,
        backends: beItems,
        frontends: feItems,
      })

      toast.success("Tạo project thành công!")
      resetWizard()
      navigate(`/projects/${project.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Có lỗi xảy ra khi tạo project")
      toast.error("Có lỗi xảy ra khi tạo project")
    } finally {
      setIsSubmitting(false)
    }
  }

  const hasErrors = !projectName.trim()

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground mb-2">
          Bước 4/4 — Tổng quan
        </h2>
        <p className="text-muted-foreground">
          Kiểm tra lại và xác nhận triển khai
        </p>
      </div>

      {/* Thông tin project */}
      <Card>
        <CardHeader>
          <CardTitle>Thông tin Project</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="projectName">
              Tên Project <span className="text-destructive">*</span>
            </Label>
            <Input
              id="projectName"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              placeholder="my-project"
            />
          </div>
          <div>
            <Label htmlFor="description">Mô tả (tùy chọn)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Mô tả về project..."
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* Tổng hợp */}
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Databases ({databases.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {databases.length > 0 ? (
              <div className="space-y-2">
                {databases.map((db, index) => (
                  <div
                    key={index}
                    className="p-3 bg-muted rounded-md text-sm"
                  >
                    <div className="font-medium">{db.name}</div>
                    <div className="text-muted-foreground">
                      {db.type === "mysql" ? "MySQL" : "MongoDB"} -{" "}
                      {db.provision === "user" ? "Của người dùng" : "Của hệ thống"}
                    </div>
                    {db.ip && (
                      <div className="text-muted-foreground text-xs mt-1">
                        {db.ip}:{db.port}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Chưa có database nào</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Backends ({backends.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {backends.length > 0 ? (
              <div className="space-y-2">
                {backends.map((be, index) => (
                  <div
                    key={index}
                    className="p-3 bg-muted rounded-md text-sm"
                  >
                    <div className="font-medium">{be.name}</div>
                    <div className="text-muted-foreground">
                      {be.tech === "spring" ? "Spring Boot" : "Node.js"}
                    </div>
                    {be.dns && (
                      <div className="text-muted-foreground text-xs mt-1">
                        DNS: {be.dns}
                      </div>
                    )}
                    {be.dockerImage && (
                      <div className="text-muted-foreground text-xs mt-1 font-mono">
                        {be.dockerImage}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Chưa có backend nào</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Frontends ({frontends.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {frontends.length > 0 ? (
              <div className="space-y-2">
                {frontends.map((fe, index) => (
                  <div
                    key={index}
                    className="p-3 bg-muted rounded-md text-sm"
                  >
                    <div className="font-medium">{fe.name}</div>
                    <div className="text-muted-foreground">
                      {fe.tech === "react"
                        ? "React"
                        : fe.tech === "vue"
                        ? "Vue"
                        : "Angular"}
                    </div>
                    {fe.publicUrl && (
                      <div className="text-muted-foreground text-xs mt-1">
                        URL: {fe.publicUrl}
                      </div>
                    )}
                    {fe.dockerImage && (
                      <div className="text-muted-foreground text-xs mt-1 font-mono">
                        {fe.dockerImage}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Chưa có frontend nào</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Xác nhận điều khoản */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-start gap-3">
            <Checkbox
              checked={acceptedTerms}
              onCheckedChange={(checked) => setAcceptedTerms(checked === true)}
            />
            <div className="flex-1">
              <Label htmlFor="terms" className="cursor-pointer">
                Tôi xác nhận đã đọc và đồng ý với điều khoản sử dụng (mock)
              </Label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Error message */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Warning */}
      {hasErrors && (
        <Alert variant="info">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Vui lòng điền đầy đủ thông tin bắt buộc trước khi xác nhận
          </AlertDescription>
        </Alert>
      )}

      {/* Submit button */}
      <div className="flex justify-end">
        <Button
          onClick={handleSubmit}
          disabled={isSubmitting || hasErrors || !acceptedTerms}
          size="lg"
        >
          {isSubmitting ? "Đang xử lý..." : "Xác nhận triển khai"}
        </Button>
      </div>
    </div>
  )
}

