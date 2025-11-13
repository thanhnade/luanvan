import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Upload, X, Plus } from "lucide-react"
import { motion } from "framer-motion"
import type { DatabaseFormData } from "@/types"
import { validateZipFile, validateIP, validatePort } from "@/lib/validators"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { HintBox } from "@/components/HintBox"
import { useWizardStore } from "@/stores/wizard-store"

// Schema validation
const databaseSchema = z.object({
  name: z.string().min(1, "Tên database không được để trống"),
  type: z.enum(["mysql", "mongodb"]),
  provision: z.enum(["user", "system"]),
  ip: z.string().optional(),
  port: z.string().optional(),
  username: z.string().optional(),
  password: z.string().optional(),
}).refine((data) => {
  if (data.provision === "user") {
    return !!(data.ip && data.port && data.username && data.password)
  }
  return true
}, {
  message: "Khi chọn 'Của người dùng', vui lòng điền đầy đủ IP, Port, Username và Password",
  path: ["ip"]
})

type FormData = z.infer<typeof databaseSchema>

/**
 * Step 1: Cấu hình Database
 */
export function StepDatabase() {
  const { databases, addDatabase, removeDatabase } = useWizardStore()
  const [showForm, setShowForm] = useState(false)
  const [zipFile, setZipFile] = useState<File | null>(null)
  const [zipError, setZipError] = useState<string>("")

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(databaseSchema),
    defaultValues: {
      type: "mysql",
      provision: "system",
    },
  })

  const provision = watch("provision")

  const onSubmit = (data: FormData) => {
    // Validate ZIP nếu có
    if (zipFile) {
      const validation = validateZipFile(zipFile)
      if (!validation.valid) {
        setZipError(validation.message || "")
        return
      }
    }

    const dbData: DatabaseFormData = {
      name: data.name,
      type: data.type,
      provision: data.provision,
      ip: data.provision === "user" ? data.ip : undefined,
      port: data.provision === "user" ? data.port : undefined,
      username: data.provision === "user" ? data.username : undefined,
      password: data.provision === "user" ? data.password : undefined,
      seedZip: zipFile || undefined,
    }

    addDatabase(dbData)
    reset()
    setZipFile(null)
    setZipError("")
    setShowForm(false)
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground mb-2">
          Bước 1/4 — Cấu hình Database
        </h2>
        <p className="text-muted-foreground">
          Thiết lập các database cho project của bạn
        </p>
      </div>

      {/* Hướng dẫn */}
      <HintBox title="Hướng dẫn">
        <ul className="list-disc list-inside space-y-1 text-sm">
          <li>Chọn loại database: MySQL hoặc MongoDB</li>
          <li>
            <strong>Của người dùng:</strong> Nhập IP, Port, Username, Password để kết nối database có sẵn
          </li>
          <li>
            <strong>Của hệ thống:</strong> Hệ thống sẽ tự động tạo và quản lý database (chỉ thao tác qua ứng dụng, không cấp quyền đăng nhập DB)
          </li>
          <li>
            Upload file ZIP: Chỉ nhận tệp .zip. Khi giải nén, tên thư mục gốc phải trùng với tên database
          </li>
          <li>Ví dụ cấu trúc: <code className="bg-muted px-1 rounded">my-database/schema.sql</code></li>
        </ul>
      </HintBox>

      {/* Danh sách databases đã thêm */}
      {databases.length > 0 && (
        <div className="space-y-4">
          <h3 className="font-semibold">
            Databases đã thêm ({databases.length})
          </h3>
          <div className="grid gap-4">
            {databases.map((db, index) => (
              <Card key={index}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-medium">{db.name}</h4>
                      <p className="text-sm text-muted-foreground">
                        {db.type === "mysql" ? "MySQL" : "MongoDB"} -{" "}
                        {db.provision === "user" ? "Của người dùng" : "Của hệ thống"}
                      </p>
                      {db.ip && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {db.ip}:{db.port}
                        </p>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeDatabase(index)}
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

      {/* Form thêm database */}
      {showForm ? (
        <Card>
          <CardHeader>
            <CardTitle>Thêm Database</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <Label htmlFor="name">
                  Tên Database <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="name"
                  {...register("name")}
                  placeholder="my-database"
                />
                {errors.name && (
                  <p className="text-sm text-destructive mt-1">
                    {errors.name.message}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="type">
                    Loại Database <span className="text-destructive">*</span>
                  </Label>
                  <Select id="type" {...register("type")}>
                    <option value="mysql">MySQL</option>
                    <option value="mongodb">MongoDB</option>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="provision">
                    Nguồn <span className="text-destructive">*</span>
                  </Label>
                  <Select id="provision" {...register("provision")}>
                    <option value="system">Của hệ thống</option>
                    <option value="user">Của người dùng</option>
                  </Select>
                </div>
              </div>

              {/* Form fields cho USER provision */}
              {provision === "user" && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="p-4 bg-muted rounded-lg space-y-4"
                >
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="ip">
                        IP/Host <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="ip"
                        {...register("ip")}
                        placeholder="192.168.1.100"
                      />
                      {errors.ip && (
                        <p className="text-sm text-destructive mt-1">
                          {errors.ip.message}
                        </p>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="port">
                        Port <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="port"
                        {...register("port")}
                        placeholder="3306"
                      />
                      {errors.port && (
                        <p className="text-sm text-destructive mt-1">
                          {errors.port.message}
                        </p>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="username">
                        Username <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="username"
                        {...register("username")}
                        placeholder="admin"
                      />
                      {errors.username && (
                        <p className="text-sm text-destructive mt-1">
                          {errors.username.message}
                        </p>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="password">
                        Password <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="password"
                        type="password"
                        {...register("password")}
                        placeholder="••••••••"
                      />
                      {errors.password && (
                        <p className="text-sm text-destructive mt-1">
                          {errors.password.message}
                        </p>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Upload ZIP */}
              <div>
                <Label>Upload file ZIP (tùy chọn)</Label>
                <div
                  className="mt-2 border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:bg-muted transition-colors"
                  onClick={() => document.getElementById("zip-input-db")?.click()}
                >
                  {zipFile ? (
                    <div>
                      <p className="font-medium">{zipFile.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {(zipFile.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="mt-2"
                        onClick={(e) => {
                          e.stopPropagation()
                          setZipFile(null)
                          setZipError("")
                        }}
                      >
                        Xóa file
                      </Button>
                    </div>
                  ) : (
                    <div>
                      <Upload className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                      <p className="text-sm">Chọn file hoặc kéo thả vào đây</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        File ZIP, tối đa 100 MB
                      </p>
                    </div>
                  )}
                </div>
                <input
                  id="zip-input-db"
                  type="file"
                  accept=".zip"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) {
                      const validation = validateZipFile(file)
                      if (validation.valid) {
                        setZipFile(file)
                        setZipError("")
                      } else {
                        setZipError(validation.message || "")
                      }
                    }
                  }}
                />
                {zipError && (
                  <p className="text-sm text-destructive mt-1">{zipError}</p>
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
                    setZipError("")
                  }}
                >
                  Hủy
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      ) : (
        <Button
          variant="outline"
          className="w-full"
          onClick={() => setShowForm(true)}
        >
          <Plus className="w-4 h-4 mr-2" />
          Thêm Database
        </Button>
      )}
    </div>
  )
}

