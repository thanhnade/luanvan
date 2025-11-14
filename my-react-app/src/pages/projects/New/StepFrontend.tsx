import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Upload, X, Plus, CheckCircle2 } from "lucide-react"
import { motion } from "framer-motion"
import type { FrontendFormData } from "@/types"
import { validateZipFile, validateDockerImage, validateDNS } from "@/lib/validators"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { HintBox } from "@/components/user/HintBox"
import { useWizardStore } from "@/stores/wizard-store"
import { toast } from "sonner"

const frontendSchema = z.object({
  name: z.string().min(1, "Tên frontend không được để trống"),
  tech: z.enum(["react", "vue", "angular"]),
  sourceType: z.enum(["zip", "image"]),
  dockerImage: z.string().optional(),
  publicUrl: z.string().optional(),
}).refine((data) => {
  if (data.sourceType === "image") {
    return !!data.dockerImage && data.dockerImage.trim() !== ""
  }
  return true
}, {
  message: "Vui lòng nhập Docker image hoặc upload file ZIP",
  path: ["dockerImage"]
})

type FormData = z.infer<typeof frontendSchema>

/**
 * Step 4: Cấu hình Frontend
 */
export function StepFrontend() {
  // Subscribe cụ thể vào frontends để đảm bảo re-render
  const frontends = useWizardStore((state) => state.frontends)
  const addFrontend = useWizardStore((state) => state.addFrontend)
  const removeFrontend = useWizardStore((state) => state.removeFrontend)
  const [showForm, setShowForm] = useState(false)
  const [zipFile, setZipFile] = useState<File | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const {
    register,
    handleSubmit,
    watch,
    reset,
    setValue,
    formState: { errors: formErrors },
  } = useForm<FormData>({
    resolver: zodResolver(frontendSchema),
    defaultValues: {
      tech: "react",
      sourceType: "zip",
    },
  })

  const sourceType = watch("sourceType")
  const dockerImage = watch("dockerImage")
  const publicUrl = watch("publicUrl")

  // Validate Docker image
  const validateDocker = () => {
    if (sourceType === "image" && dockerImage) {
      const validation = validateDockerImage(dockerImage)
      if (!validation.valid) {
        setErrors({ ...errors, dockerImage: validation.message || "" })
      } else {
        setErrors({ ...errors, dockerImage: "" })
      }
    }
  }


  const onSubmit = (data: FormData) => {
    if (data.sourceType === "zip" && !zipFile) {
      setErrors({ ...errors, zipFile: "Vui lòng chọn file ZIP" })
      return
    }

    if (data.sourceType === "zip" && zipFile) {
      const validation = validateZipFile(zipFile)
      if (!validation.valid) {
        setErrors({ ...errors, zipFile: validation.message || "" })
        return
      }
    }

    if (data.sourceType === "image") {
      const validation = validateDockerImage(data.dockerImage || "")
      if (!validation.valid) {
        setErrors({ ...errors, dockerImage: validation.message || "" })
        return
      }
    }

    const feData: FrontendFormData = {
      name: data.name,
      tech: data.tech,
      sourceType: data.sourceType,
      zipFile: data.sourceType === "zip" ? zipFile : undefined,
      dockerImage: data.sourceType === "image" ? data.dockerImage : undefined,
      publicUrl: data.publicUrl || undefined,
    }

    addFrontend(feData)
    reset()
    setZipFile(null)
    setErrors({})
    setShowForm(false)
    toast.success(`Đã thêm frontend "${feData.name}"`)
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground mb-2">
          Bước 4/5 — Cấu hình Frontend
        </h2>
        <p className="text-muted-foreground">
          Thiết lập các frontend applications
        </p>
      </div>

      <HintBox title="Hướng dẫn">
        <ul className="list-disc list-inside space-y-1 text-sm">
          <li>Chọn React, Vue hoặc Angular</li>
          <li>
            <strong>Upload ZIP:</strong> Tên thư mục gốc trùng với tên dự án
          </li>
          <li>
            <strong>Docker Image:</strong> Định dạng <code className="bg-muted px-1 rounded">owner/name:tag</code>
          </li>
          <li>
            <strong>DNS:</strong> Chỉ a-z, 0-9, '-', dài 3-63 ký tự, không bắt đầu/kết thúc bằng '-' (ví dụ: <code className="bg-muted px-1 rounded">fe.myapp.local.test</code>)
          </li>
        </ul>
      </HintBox>

      <Card>
        <CardHeader>
          <CardTitle>Frontends đã thêm ({frontends.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {frontends.length > 0 ? (
            <div className="space-y-3">
              {frontends.map((fe, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <Card className="border">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium">{fe.name}</h4>
                          <p className="text-sm text-muted-foreground">
                            {fe.tech === "react" ? "React" : fe.tech === "vue" ? "Vue" : "Angular"}
                          </p>
                          {fe.publicUrl && (
                            <p className="text-sm text-muted-foreground mt-1">
                              URL: {fe.publicUrl}
                            </p>
                          )}
                          {fe.dockerImage && (
                            <p className="text-sm text-muted-foreground mt-1 font-mono text-xs">
                              {fe.dockerImage}
                            </p>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            removeFrontend(index)
                            toast.success(`Đã xóa frontend "${fe.name}"`)
                          }}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">
              Chưa có frontend nào. Nhấn "Thêm Frontend" để bắt đầu.
            </p>
          )}
        </CardContent>
      </Card>

      {showForm ? (
        <Card>
          <CardHeader>
            <CardTitle>Thêm Frontend</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Tên Frontend <span className="text-destructive">*</span></Label>
                  <Input id="name" {...register("name")} placeholder="web-app" />
                  {formErrors.name && (
                    <p className="text-sm text-destructive mt-1">{formErrors.name.message}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="tech">Technology <span className="text-destructive">*</span></Label>
                  <Select id="tech" {...register("tech")}>
                    <option value="react">React</option>
                    <option value="vue">Vue</option>
                    <option value="angular">Angular</option>
                  </Select>
                </div>
              </div>

              <div>
                <Label>Nguồn mã nguồn <span className="text-destructive">*</span></Label>
                <div className="flex gap-2 mt-2">
                  <Button
                    type="button"
                    variant={sourceType === "zip" ? "default" : "outline"}
                    onClick={() => setValue("sourceType", "zip")}
                  >
                    Upload ZIP
                  </Button>
                  <Button
                    type="button"
                    variant={sourceType === "image" ? "default" : "outline"}
                    onClick={() => setValue("sourceType", "image")}
                  >
                    Docker Image
                  </Button>
                </div>
              </div>

              {sourceType === "zip" ? (
                <div>
                  <Label>File ZIP <span className="text-destructive">*</span></Label>
                  <div
                    className="mt-2 border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:bg-muted transition-colors"
                    onClick={() => document.getElementById("zip-input-fe")?.click()}
                  >
                    {zipFile ? (
                      <div>
                        <p className="font-medium">{zipFile.name}</p>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="mt-2"
                          onClick={(e) => {
                            e.stopPropagation()
                            setZipFile(null)
                            setErrors({ ...errors, zipFile: "" })
                          }}
                        >
                          Xóa file
                        </Button>
                      </div>
                    ) : (
                      <div>
                        <Upload className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                        <p className="text-sm">Chọn file ZIP</p>
                      </div>
                    )}
                  </div>
                  <input
                    id="zip-input-fe"
                    type="file"
                    accept=".zip"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) {
                        const validation = validateZipFile(file)
                        if (validation.valid) {
                          setZipFile(file)
                          setErrors({ ...errors, zipFile: "" })
                        } else {
                          setErrors({ ...errors, zipFile: validation.message || "" })
                        }
                      }
                    }}
                  />
                  {errors.zipFile && (
                    <p className="text-sm text-destructive mt-1">{errors.zipFile}</p>
                  )}
                </div>
              ) : (
                <div>
                  <Label htmlFor="dockerImage">Docker Image <span className="text-destructive">*</span></Label>
                  <Input
                    id="dockerImage"
                    {...register("dockerImage")}
                    placeholder="docker.io/user/app:1.0.0"
                    className="font-mono"
                    onBlur={validateDocker}
                  />
                  {errors.dockerImage && (
                    <p className="text-sm text-destructive mt-1">{errors.dockerImage}</p>
                  )}
                </div>
              )}

              <div>
                <Label htmlFor="publicUrl">DNS (tùy chọn)</Label>
                <div className="flex gap-2">
                  <Input
                    id="publicUrl"
                    {...register("publicUrl")}
                    placeholder="fe-myapp"
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      const dnsValue = watch("publicUrl")
                      if (dnsValue) {
                        const validation = validateDNS(dnsValue)
                        if (validation.valid) {
                          toast.success("DNS hợp lệ!")
                        } else {
                          toast.error(validation.message || "DNS không hợp lệ")
                        }
                      } else {
                        toast.info("Vui lòng nhập DNS trước khi kiểm tra")
                      }
                    }}
                  >
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Kiểm tra
                  </Button>
                </div>
              </div>

              <div className="flex gap-2">
                <Button type="submit">Thêm</Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowForm(false)
                    reset()
                    setZipFile(null)
                    setErrors({})
                  }}
                >
                  Hủy
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      ) : (
        <Button variant="outline" className="w-full" onClick={() => setShowForm(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Thêm Frontend
        </Button>
      )}
    </div>
  )
}

