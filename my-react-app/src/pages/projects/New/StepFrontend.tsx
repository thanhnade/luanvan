import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Upload, X, Plus, Trash2 } from "lucide-react"
import { motion } from "framer-motion"
import type { FrontendFormData } from "@/types"
import { validateZipFile, validateDockerImage, validateDNS } from "@/lib/validators"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { HintBox } from "@/components/HintBox"
import { useWizardStore } from "@/stores/wizard-store"

const frontendSchema = z.object({
  name: z.string().min(1, "Tên frontend không được để trống"),
  tech: z.enum(["react", "vue", "angular"]),
  sourceType: z.enum(["zip", "image"]),
  dockerImage: z.string().optional(),
  publicUrl: z.string().optional(),
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

type FormData = z.infer<typeof frontendSchema>

/**
 * Step 3: Cấu hình Frontend
 */
export function StepFrontend() {
  const { frontends, addFrontend, removeFrontend } = useWizardStore()
  const [showForm, setShowForm] = useState(false)
  const [zipFile, setZipFile] = useState<File | null>(null)
  const [runtimeEnv, setRuntimeEnv] = useState<Array<{ key: string; value: string }>>([])
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
      buildCommand: "",
      outputDir: "",
    },
  })

  const sourceType = watch("sourceType")
  const dockerImage = watch("dockerImage")
  const publicUrl = watch("publicUrl")
  const tech = watch("tech")

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
    if (publicUrl) {
      const validation = validateDNS(publicUrl)
      if (!validation.valid) {
        setErrors({ ...errors, publicUrl: validation.message || "" })
      } else {
        setErrors({ ...errors, publicUrl: "" })
      }
    }
  }

  // Apply preset
  const applyPreset = () => {
    if (tech === "react") {
      setValue("buildCommand", "npm run build")
      setValue("outputDir", "dist")
    } else if (tech === "vue") {
      setValue("buildCommand", "npm run build")
      setValue("outputDir", "dist")
    } else {
      setValue("buildCommand", "ng build")
      setValue("outputDir", "dist")
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

    if (data.publicUrl) {
      const dnsValidation = validateDNS(data.publicUrl)
      if (!dnsValidation.valid) {
        setErrors({ ...errors, publicUrl: dnsValidation.message || "" })
        return
      }
    }

    const feData: FrontendFormData = {
      name: data.name,
      tech: data.tech,
      sourceType: data.sourceType,
      zipFile: data.sourceType === "zip" ? zipFile : undefined,
      dockerImage: data.sourceType === "image" ? data.dockerImage : undefined,
      runtimeEnv: runtimeEnv.filter((e) => e.key && e.value),
      publicUrl: data.publicUrl || undefined,
      buildCommand: data.buildCommand || undefined,
      outputDir: data.outputDir || undefined,
    }

    addFrontend(feData)
    reset()
    setZipFile(null)
    setRuntimeEnv([])
    setErrors({})
    setShowForm(false)
  }

  const addRuntimeEnv = () => {
    setRuntimeEnv([...runtimeEnv, { key: "", value: "" }])
  }

  const removeRuntimeEnv = (index: number) => {
    setRuntimeEnv(runtimeEnv.filter((_, i) => i !== index))
  }

  const updateRuntimeEnv = (index: number, field: "key" | "value", value: string) => {
    const newEnv = [...runtimeEnv]
    newEnv[index] = { ...newEnv[index], [field]: value }
    setRuntimeEnv(newEnv)
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground mb-2">
          Bước 3/4 — Cấu hình Frontend
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
            <strong>Config build:</strong> Build command và output directory (ví dụ: <code className="bg-muted px-1 rounded">npm run build</code>, <code className="bg-muted px-1 rounded">dist/</code>)
          </li>
          <li>
            <strong>Runtime ENV:</strong> Ví dụ <code className="bg-muted px-1 rounded">VITE_API_BASE_URL</code>, <code className="bg-muted px-1 rounded">REACT_APP_API_URL</code>
          </li>
          <li>
            <strong>DNS:</strong> Ví dụ <code className="bg-muted px-1 rounded">fe.myapp.local.test</code>
          </li>
        </ul>
      </HintBox>

      {frontends.length > 0 && (
        <div className="space-y-4">
          <h3 className="font-semibold">Frontends đã thêm ({frontends.length})</h3>
          <div className="grid gap-4">
            {frontends.map((fe, index) => (
              <Card key={index}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-medium">{fe.name}</h4>
                      <p className="text-sm text-muted-foreground">
                        {fe.tech === "react" ? "React" : fe.tech === "vue" ? "Vue" : "Angular"}
                      </p>
                      {fe.publicUrl && (
                        <p className="text-sm text-muted-foreground mt-1">
                          URL: {fe.publicUrl}
                        </p>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeFrontend(index)}
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
                  <Select id="tech" {...register("tech")} onChange={(e) => {
                    register("tech").onChange(e)
                    applyPreset()
                  }}>
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

                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <div>
                      <Label htmlFor="buildCommand">Build Command</Label>
                      <Input
                        id="buildCommand"
                        {...register("buildCommand")}
                        placeholder="npm run build"
                      />
                    </div>
                    <div>
                      <Label htmlFor="outputDir">Output Directory</Label>
                      <Input
                        id="outputDir"
                        {...register("outputDir")}
                        placeholder="dist"
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
                <Label htmlFor="publicUrl">DNS/URL (tùy chọn)</Label>
                <Input
                  id="publicUrl"
                  {...register("publicUrl")}
                  placeholder="fe-myapp"
                  onBlur={validateDNSField}
                />
                {errors.publicUrl && (
                  <p className="text-sm text-destructive mt-1">{errors.publicUrl}</p>
                )}
              </div>

              {/* Runtime ENV */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label>Biến môi trường runtime</Label>
                  <Button type="button" variant="outline" size="sm" onClick={addRuntimeEnv}>
                    <Plus className="w-4 h-4 mr-1" />
                    Thêm
                  </Button>
                </div>
                {runtimeEnv.length > 0 ? (
                  <div className="space-y-2">
                    {runtimeEnv.map((env, index) => (
                      <div key={index} className="flex gap-2">
                        <Input
                          placeholder="Tên biến (ví dụ: VITE_API_BASE_URL)"
                          value={env.key}
                          onChange={(e) => updateRuntimeEnv(index, "key", e.target.value)}
                        />
                        <Input
                          placeholder="Giá trị"
                          value={env.value}
                          onChange={(e) => updateRuntimeEnv(index, "value", e.target.value)}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeRuntimeEnv(index)}
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
                    setRuntimeEnv([])
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

