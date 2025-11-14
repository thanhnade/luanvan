import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Info } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { HintBox } from "@/components/user/HintBox"
import { useWizardStore } from "@/stores/wizard-store"
import { useEffect } from "react"

// Schema validation
const projectInfoSchema = z.object({
  projectName: z.string().min(1, "Tên project không được để trống"),
  description: z.string().optional(),
})

type FormData = z.infer<typeof projectInfoSchema>

/**
 * Step 1: Thông tin Project (Tên và Mô tả)
 */
export function StepProjectInfo() {
  const { projectName, description, setProjectName, setDescription } = useWizardStore()

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(projectInfoSchema),
    defaultValues: {
      projectName: projectName || "",
      description: description || "",
    },
  })

  // Sync form với store khi store thay đổi
  useEffect(() => {
    setValue("projectName", projectName)
    setValue("description", description)
  }, [projectName, description, setValue])

  // Watch để auto-save vào store
  const watchedProjectName = watch("projectName")
  const watchedDescription = watch("description")

  useEffect(() => {
    if (watchedProjectName !== projectName) {
      setProjectName(watchedProjectName || "")
    }
  }, [watchedProjectName, projectName, setProjectName])

  useEffect(() => {
    if (watchedDescription !== description) {
      setDescription(watchedDescription || "")
    }
  }, [watchedDescription, description, setDescription])

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground mb-2">
          Bước 1/5 — Thông tin Project
        </h2>
        <p className="text-muted-foreground">
          Nhập tên và mô tả cho project của bạn
        </p>
      </div>

      {/* Hướng dẫn */}
      <HintBox title="Hướng dẫn">
        <ul className="list-disc list-inside space-y-1 text-sm">
          <li>Tên project sẽ được dùng để hiển thị trong danh sách và URL</li>
          <li>Tên project nên ngắn gọn, dễ nhớ và mô tả rõ mục đích của project</li>
          <li>Mô tả là tùy chọn, nhưng nên điền để dễ quản lý sau này</li>
        </ul>
      </HintBox>

      {/* Form */}
      <Card>
        <CardHeader>
          <CardTitle>Thông tin Project</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleSubmit(() => {})} className="space-y-4">
            <div>
              <Label htmlFor="projectName">
                Tên Project <span className="text-destructive">*</span>
              </Label>
              <Input
                id="projectName"
                {...register("projectName")}
                placeholder="my-awesome-project"
                className={errors.projectName ? "border-destructive" : ""}
              />
              {errors.projectName && (
                <p className="text-sm text-destructive mt-1">
                  {errors.projectName.message}
                </p>
              )}
              <p className="text-xs text-muted-foreground mt-1">
                Tên project sẽ được dùng làm identifier cho project
              </p>
            </div>

            <div>
              <Label htmlFor="description">Mô tả (tùy chọn)</Label>
              <Textarea
                id="description"
                {...register("description")}
                placeholder="Mô tả về project của bạn..."
                rows={4}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Mô tả ngắn gọn về mục đích và chức năng của project
              </p>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

