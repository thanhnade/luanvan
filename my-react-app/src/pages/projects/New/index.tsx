import { useNavigate } from "react-router-dom"
import { ArrowLeft, ArrowRight } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { Stepper } from "@/components/Stepper"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { StepDatabase } from "./StepDatabase"
import { StepBackend } from "./StepBackend"
import { StepFrontend } from "./StepFrontend"
import { StepSummary } from "./StepSummary"
import { useWizardStore } from "@/stores/wizard-store"

const steps = ["Database", "Backend", "Frontend", "Tổng quan"]

/**
 * Trang tạo Project mới - Wizard 4 bước
 */
export function ProjectNew() {
  const navigate = useNavigate()
  const { currentStep, setCurrentStep } = useWizardStore()

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  return (
    <div className="min-h-screen bg-background py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate("/projects")}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Quay lại
          </Button>
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Tạo Project Mới
          </h1>
          <p className="text-muted-foreground">
            Thiết lập và triển khai ứng dụng của bạn
          </p>
        </div>

        {/* Stepper */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <Stepper steps={steps} currentStep={currentStep} />
          </CardContent>
        </Card>

        {/* Step content */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
              >
                {currentStep === 0 && <StepDatabase />}
                {currentStep === 1 && <StepBackend />}
                {currentStep === 2 && <StepFrontend />}
                {currentStep === 3 && <StepSummary />}
              </motion.div>
            </AnimatePresence>
          </CardContent>
        </Card>

        {/* Navigation */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <Button
                variant="outline"
                onClick={handleBack}
                disabled={currentStep === 0}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Quay lại
              </Button>

              {currentStep < steps.length - 1 && (
                <Button onClick={handleNext}>
                  Tiếp theo
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

