import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Upload, X, Plus, CheckCircle2 } from "lucide-react"
import { motion } from "framer-motion"
import type { BackendFormData } from "@/types"
import { validateZipFile, validateDockerImage, validateDNS } from "@/lib/validators"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { HintBox } from "@/components/user/HintBox"
import { useWizardStore } from "@/stores/wizard-store"
import { toast } from "sonner"

const backendSchema = z.object({
  name: z.string().min(1, "Tên backend không được để trống"),
  tech: z.enum(["spring", "node"]),
  sourceType: z.enum(["zip", "image"]),
  dockerImage: z.string().optional(),
  dns: z.string().optional(),
  // Database connection fields
  dbName: z.string().optional(),
  dbIp: z.string().optional(),
  dbPort: z.string().optional(),
  dbUsername: z.string().optional(),
  dbPassword: z.string().optional(),
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
 * Step 3: Cấu hình Backend
 */
export function StepBackend() {
  // Subscribe cụ thể vào backends và databases để đảm bảo re-render
  const backends = useWizardStore((state) => state.backends)
  const databases = useWizardStore((state) => state.databases)
  const addBackend = useWizardStore((state) => state.addBackend)
  const removeBackend = useWizardStore((state) => state.removeBackend)
  const [showForm, setShowForm] = useState(false)
  const [zipFile, setZipFile] = useState<File | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [dbConnectionMode, setDbConnectionMode] = useState<"manual" | "select">("manual")
  const [selectedDbId, setSelectedDbId] = useState<string>("")

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
    },
  })

  const sourceType = watch("sourceType")
  const dockerImage = watch("dockerImage")
  const dns = watch("dns")

  // Khi chọn database từ danh sách, tự động điền các trường
  const handleSelectDatabase = (dbIndex: number) => {
    const selectedDb = databases[dbIndex]
    if (selectedDb) {
      setSelectedDbId(String(dbIndex))
      // Điền thông tin từ database đã chọn
      if (selectedDb.databaseName) {
        setValue("dbName", selectedDb.databaseName)
      }
      if (selectedDb.ip) {
        setValue("dbIp", selectedDb.ip)
      }
      if (selectedDb.port) {
        setValue("dbPort", selectedDb.port)
      }
      if (selectedDb.username) {
        setValue("dbUsername", selectedDb.username)
      }
      if (selectedDb.password) {
        setValue("dbPassword", selectedDb.password)
      }
    }
  }

  // Khi chuyển sang chế độ nhập thủ công, xóa selection
  const handleModeChange = (mode: "manual" | "select") => {
    setDbConnectionMode(mode)
    if (mode === "manual") {
      setSelectedDbId("")
    }
  }

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

    // Tạo env vars từ database connection fields
    const env: Array<{ key: string; value: string }> = []
    if (data.dbName) env.push({ key: "DB_NAME", value: data.dbName })
    if (data.dbIp) env.push({ key: "DB_HOST", value: data.dbIp })
    if (data.dbPort) env.push({ key: "DB_PORT", value: data.dbPort })
    if (data.dbUsername) env.push({ key: "DB_USERNAME", value: data.dbUsername })
    if (data.dbPassword) env.push({ key: "DB_PASSWORD", value: data.dbPassword })

    const beData: BackendFormData = {
      name: data.name,
      tech: data.tech,
      sourceType: data.sourceType,
      zipFile: data.sourceType === "zip" ? zipFile : undefined,
      dockerImage: data.sourceType === "image" ? data.dockerImage : undefined,
      env,
      dns: data.dns || undefined,
    }

    addBackend(beData)
    reset()
    setZipFile(null)
    setErrors({})
    setShowForm(false)
    toast.success(`Đã thêm backend "${beData.name}"`)
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground mb-2">
          Bước 3/5 — Cấu hình Backend
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
            <strong>Kết nối Database:</strong> Bạn có thể nhập thủ công thông tin kết nối database hoặc chọn từ danh sách database đã tạo ở bước trước
          </li>
        </ul>
      </HintBox>

      <Card>
        <CardHeader>
          <CardTitle>Backends đã thêm ({backends.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {backends.length > 0 ? (
            <div className="space-y-3">
              {backends.map((be, index) => (
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
                          <h4 className="font-medium">{be.name}</h4>
                          <p className="text-sm text-muted-foreground">
                            {be.tech === "spring" ? "Spring Boot" : "Node.js"}
                          </p>
                          {be.dns && (
                            <p className="text-sm text-muted-foreground mt-1">
                              DNS: {be.dns}
                            </p>
                          )}
                          {be.dockerImage && (
                            <p className="text-sm text-muted-foreground mt-1 font-mono text-xs">
                              {be.dockerImage}
                            </p>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            removeBackend(index)
                            toast.success(`Đã xóa backend "${be.name}"`)
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
              Chưa có backend nào. Nhấn "Thêm Backend" để bắt đầu.
            </p>
          )}
        </CardContent>
      </Card>

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
                  <Select id="tech" {...register("tech")}>
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
                <div className="flex gap-2">
                  <Input
                    id="dns"
                    {...register("dns")}
                    placeholder="api-myapp"
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      const dnsValue = watch("dns")
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

              {/* Database connection fields */}
              <div className="p-4 bg-muted rounded-lg space-y-4">
                <div>
                  <Label className="text-sm font-medium mb-2 block">
                    Kết nối Database
                  </Label>
                  <p className="text-xs text-muted-foreground mb-3">
                    Chọn cách nhập thông tin kết nối database
                  </p>
                </div>

                {/* Chọn chế độ: Nhập thủ công hoặc Chọn từ danh sách */}
                <div className="flex gap-2 mb-4">
                  <Button
                    type="button"
                    variant={dbConnectionMode === "manual" ? "default" : "outline"}
                    onClick={() => handleModeChange("manual")}
                    size="sm"
                  >
                    Nhập thủ công
                  </Button>
                  <Button
                    type="button"
                    variant={dbConnectionMode === "select" ? "default" : "outline"}
                    onClick={() => handleModeChange("select")}
                    size="sm"
                    disabled={databases.length === 0}
                  >
                    Chọn từ danh sách {databases.length > 0 && `(${databases.length})`}
                  </Button>
                </div>

                {dbConnectionMode === "select" && databases.length > 0 ? (
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="select-db">Chọn Database</Label>
                      <Select
                        id="select-db"
                        value={selectedDbId}
                        onChange={(e) => {
                          const index = parseInt(e.target.value)
                          if (!isNaN(index)) {
                            handleSelectDatabase(index)
                          }
                        }}
                      >
                        <option value="">-- Chọn database --</option>
                        {databases.map((db, index) => (
                          <option key={index} value={String(index)}>
                            {db.name} ({db.type === "mysql" ? "MySQL" : "MongoDB"})
                            {db.databaseName && ` - ${db.databaseName}`}
                          </option>
                        ))}
                      </Select>
                      {selectedDbId && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Đã chọn: {databases[parseInt(selectedDbId)]?.name}
                        </p>
                      )}
                    </div>
                    {/* Hiển thị thông tin đã chọn (read-only) */}
                    {selectedDbId && databases[parseInt(selectedDbId)] && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        transition={{ duration: 0.2 }}
                        className="p-3 bg-background rounded-md border space-y-2"
                      >
                        <div className="grid grid-cols-12 gap-4">
                          <div className="col-span-5">
                            <Label className="text-xs text-muted-foreground">Tên Database</Label>
                            <p className="text-sm font-medium">
                              {databases[parseInt(selectedDbId)].databaseName || "-"}
                            </p>
                          </div>
                          <div className="col-span-5">
                            <Label className="text-xs text-muted-foreground">IP/Host Database</Label>
                            <p className="text-sm font-medium">
                              {databases[parseInt(selectedDbId)].ip || "-"}
                            </p>
                          </div>
                          <div className="col-span-2">
                            <Label className="text-xs text-muted-foreground">Port</Label>
                            <p className="text-sm font-medium">
                              {databases[parseInt(selectedDbId)].port || "-"}
                            </p>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label className="text-xs text-muted-foreground">Username</Label>
                            <p className="text-sm font-medium">
                              {databases[parseInt(selectedDbId)].username || "-"}
                            </p>
                          </div>
                          <div>
                            <Label className="text-xs text-muted-foreground">Password</Label>
                            <p className="text-sm font-medium">
                              {databases[parseInt(selectedDbId)].password ? "••••••••" : "-"}
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="grid grid-cols-12 gap-4">
                      <div className="col-span-5">
                        <Label htmlFor="dbName">
                          Tên Database
                        </Label>
                        <Input
                          id="dbName"
                          {...register("dbName")}
                          placeholder="my_database"
                        />
                      </div>
                      <div className="col-span-5">
                        <Label htmlFor="dbIp">
                          IP/Host Database
                        </Label>
                        <Input
                          id="dbIp"
                          {...register("dbIp")}
                          placeholder="192.168.1.100"
                        />
                      </div>
                      <div className="col-span-2">
                        <Label htmlFor="dbPort">
                          Port
                        </Label>
                        <Input
                          id="dbPort"
                          {...register("dbPort")}
                          placeholder="3306"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="dbUsername">
                          Username Database
                        </Label>
                        <Input
                          id="dbUsername"
                          {...register("dbUsername")}
                          placeholder="admin"
                        />
                      </div>
                      <div>
                        <Label htmlFor="dbPassword">
                          Password Database
                        </Label>
                        <Input
                          id="dbPassword"
                          type="password"
                          {...register("dbPassword")}
                          placeholder="••••••••"
                        />
                      </div>
                    </div>
                  </div>
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
                    setErrors({})
                    setDbConnectionMode("manual")
                    setSelectedDbId("")
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

