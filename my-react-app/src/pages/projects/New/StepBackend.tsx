import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Upload, X, Plus, Trash2 } from "lucide-react"
import { motion } from "framer-motion"
import type { BackendFormData } from "@/types"
import { validateZipFile, validateDockerImage, validateDNS } from "@/lib/validators"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { HintBox } from "@/components/HintBox"
import { useWizardStore } from "@/stores/wizard-store"

const backendSchema = z.object({
  name: z.string().min(1, "Tên backend không được để trống"),
  tech: z.enum(["spring", "node"]),
  sourceType: z.enum(["zip", "image"]),
  dockerImage: z.string().optional(),
  dns: z.string().optional(),
  buildCommand: z.string().optional(),
  outputDir: z.string().optional(),
}).refine((data) => {
  if (data.sourceType === "image") {
    return !!data.dockerImage && data.dockerImage.trim() !== ""
  }
  return true
}, {
  message: "Vui lòng nhập Docker image hoặc upload file ZIP",
  path: ["dockerImage"]
})

type FormData = z.infer<typeof backendSchema>

/**
 * Step 2: Cấu hình Backend
 */
export function StepBackend() {
  const { backends, addBackend, removeBackend } = useWizardStore()
  const [showForm, setShowForm] = useState(false)
  const [zipFile, setZipFile] = useState<File | null>(null)
  const [envVars, setEnvVars] = useState<Array<{ key: string; value: string }>>([])
  const [errors, setErrors] = useState<Record<string, string>>({})

  const {
    register,
    handleSubmit,
    watch,
    reset,
    setValue,
    formState: { errors: formErrors },
  } = useForm<FormData>({
    resolver: zodResolver(backendSchema),
    defaultValues: {
      tech: "spring",
      sourceType: "zip",
      buildCommand: "",
      outputDir: "",
    },
  })

  const sourceType = watch("sourceType")
  const dockerImage = watch("dockerImage")
  const dns = watch("dns")

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

  // Validate DNS
  const validateDNSField = () => {
    if (dns) {
      const validation = validateDNS(dns)
      if (!validation.valid) {
        setErrors({ ...errors, dns: validation.message || "" })
      } else {
        setErrors({ ...errors, dns: "" })
      }
    }
  }

  const onSubmit = (data: FormData) => {
    // Validate ZIP nếu có
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

    // Validate Docker image
    if (data.sourceType === "image") {
      const validation = validateDockerImage(data.dockerImage || "")
      if (!validation.valid) {
        setErrors({ ...errors, dockerImage: validation.message || "" })
        return
      }
    }

    // Validate DNS
    if (data.dns) {
      const dnsValidation = validateDNS(data.dns)
      if (!dnsValidation.valid) {
        setErrors({ ...errors, dns: dnsValidation.message || "" })
        return
      }
    }

    const beData: BackendFormData = {
      name: data.name,
      tech: data.tech,
      sourceType: data.sourceType,
      zipFile: data.sourceType === "zip" ? zipFile : undefined,
      dockerImage: data.sourceType === "image" ? data.dockerImage : undefined,
      env: envVars.filter((e) => e.key && e.value),
      dns: data.dns || undefined,
      buildCommand: data.buildCommand || undefined,
      outputDir: data.outputDir || undefined,
    }

    addBackend(beData)
    reset()
    setZipFile(null)
    setEnvVars([])
    setErrors({})
    setShowForm(false)
  }

  const addEnvVar = () => {
    setEnvVars([...envVars, { key: "", value: "" }])
  }

  const removeEnvVar = (index: number) => {
    setEnvVars(envVars.filter((_, i) => i !== index))
  }

  const updateEnvVar = (index: number, field: "key" | "value", value: string) => {
    const newEnvVars = [...envVars]
    newEnvVars[index] = { ...newEnvVars[index], [field]: value }
    setEnvVars(newEnvVars)
  }

  // Preset cho Spring Boot và Node.js
  const applyPreset = () => {
    const tech = watch("tech")
    if (tech === "spring") {
      setValue("buildCommand", "mvn clean package")
      setValue("outputDir", "target")
    } else {
      setValue("buildCommand", "npm run build")
      setValue("outputDir", "dist")
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground mb-2">
          Bước 2/4 — Cấu hình Backend
        </h2>
        <p className="text-muted-foreground">
          Thiết lập các backend services
        </p>
      </div>

      <HintBox title="Hướng dẫn">
        <ul className="list-disc list-inside space-y-1 text-sm">
          <li>Chọn Spring Boot hoặc Node.js</li>
          <li>
            <strong>Upload ZIP:</strong> Tên thư mục gốc trùng với tên dự án. Spring Boot cần <code className="bg-muted px-1 rounded">pom.xml</code> hoặc <code className="bg-muted px-1 rounded">build.gradle</code>. Node cần <code className="bg-muted px-1 rounded">package.json</code>
          </li>
          <li>
            <strong>Docker Image:</strong> Định dạng <code className="bg-muted px-1 rounded">owner/name:tag</code> (ví dụ: <code className="bg-muted px-1 rounded">docker.io/user/app:1.0.0</code>)
          </li>
          <li>
            <strong>DNS:</strong> Chỉ a-z, 0-9, '-', dài 3-63 ký tự, không bắt đầu/kết thúc bằng '-' (ví dụ: <code className="bg-muted px-1 rounded">api.myapp.local.test</code>)
          </li>
          <li>
            <strong>Env:</strong> Gợi ý <code className="bg-muted px-1 rounded">SPRING_DATASOURCE_URL</code>, <code className="bg-muted px-1 rounded">NODE_ENV</code>
          </li>
        </ul>
      </HintBox>

      {backends.length > 0 && (
        <div className="space-y-4">
          <h3 className="font-semibold">Backends đã thêm ({backends.length})</h3>
          <div className="grid gap-4">
            {backends.map((be, index) => (
              <Card key={index}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-medium">{be.name}</h4>
                      <p className="text-sm text-muted-foreground">
                        {be.tech === "spring" ? "Spring Boot" : "Node.js"}
                      </p>
                      {be.dns && (
                        <p className="text-sm text-muted-foreground mt-1">
                          DNS: {be.dns}
                        </p>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeBackend(index)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {showForm ? (
        <Card>
          <CardHeader>
            <CardTitle>Thêm Backend</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Tên Backend <span className="text-destructive">*</span></Label>
                  <Input id="name" {...register("name")} placeholder="api-service" />
                  {formErrors.name && (
                    <p className="text-sm text-destructive mt-1">{formErrors.name.message}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="tech">Technology <span className="text-destructive">*</span></Label>
                  <Select id="tech" {...register("tech")} onChange={(e) => {
                    register("tech").onChange(e)
                    applyPreset()
                  }}>
                    <option value="spring">Spring Boot</option>
                    <option value="node">Node.js</option>
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
                    onClick={() => document.getElementById("zip-input-be")?.click()}
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
                    id="zip-input-be"
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

                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <div>
                      <Label htmlFor="buildCommand">Build Command</Label>
                      <Input
                        id="buildCommand"
                        {...register("buildCommand")}
                        placeholder="mvn clean package"
                      />
                    </div>
                    <div>
                      <Label htmlFor="outputDir">Output Directory</Label>
                      <Input
                        id="outputDir"
                        {...register("outputDir")}
                        placeholder="target"
                      />
                    </div>
                  </div>
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
                <Label htmlFor="dns">DNS (tùy chọn)</Label>
                <Input
                  id="dns"
                  {...register("dns")}
                  placeholder="api-myapp"
                  onBlur={validateDNSField}
                />
                {errors.dns && (
                  <p className="text-sm text-destructive mt-1">{errors.dns}</p>
                )}
              </div>

              {/* Env variables */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label>Biến môi trường</Label>
                  <Button type="button" variant="outline" size="sm" onClick={addEnvVar}>
                    <Plus className="w-4 h-4 mr-1" />
                    Thêm
                  </Button>
                </div>
                {envVars.length > 0 ? (
                  <div className="space-y-2">
                    {envVars.map((env, index) => (
                      <div key={index} className="flex gap-2">
                        <Input
                          placeholder="Tên biến"
                          value={env.key}
                          onChange={(e) => updateEnvVar(index, "key", e.target.value)}
                        />
                        <Input
                          placeholder="Giá trị"
                          value={env.value}
                          onChange={(e) => updateEnvVar(index, "value", e.target.value)}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeEnvVar(index)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4 bg-muted rounded-md">
                    Chưa có biến môi trường nào
                  </p>
                )}
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
                    setEnvVars([])
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
          Thêm Backend
        </Button>
      )}
    </div>
  )
}

