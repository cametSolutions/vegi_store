

import { useState } from "react"
import { AlertCircle, CheckCircle2 } from "lucide-react"
import { RegisterOptions } from "react-hook-form"
import { ZodObject, ZodError, array } from "zod"

interface Field<T> {
  name: keyof T
  label: string
  type: string
  placeholder?: string
  required?: boolean
  validation?: RegisterOptions
}

interface DynamicFormProps<T> {
  fields: Field<T>[]
  onSubmit: (data: T) => Promise<void> | void
  schema?: ZodObject
  buttons?: {
    label: string
    action: () => void
    variant?: "primary" | "secondary" | "danger"
  }[]
  title?: string
  subtitle?: string
}

const DynamicForm = <T,>({
  fields,
  schema,
  onSubmit,
  buttons
}: DynamicFormProps<T>) => {
  const [formData, setFormData] = useState<Partial<T>>({})
  const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitSuccess, setSubmitSuccess] = useState(false)
const handleInputChange = (field: Field<T>, value: string) => {
  let parsedValue: string | number | undefined = value
  //convert numeric fields
  if (field.type === "number") {
    parsedValue = value === "" ? undefined : Number(value)
  }

  setFormData((prev) => ({ ...prev, [field.name]: parsedValue }))
  // Validate single field if schema exists
  if (schema) {
    try {
      const singleFieldSchema = schema.pick({ [field.name]: true } as Record<
        string,
        true
      >)
      singleFieldSchema.parse({ [field.name as string]: parsedValue })
      setErrors((prev) => ({ ...prev, [field.name as string]: "" })) // valid, remove error
    } catch (err: unknown) {
      if (err instanceof ZodError) {
        const message = err.issues[0]?.message || "Invalid input"
        setErrors((prev) => ({
          ...prev,
          [field.name as string]: message
        }))
      }
    }
  } else {
    // Optional: custom validation if no schema
    setErrors((prev) => ({ ...prev, [field.name as string]: "" }))
  }
}

  const handleFormSubmit = async () => {
    if (schema) {
      const parsed = schema.safeParse(formData)
      if (!parsed.success) {
        const newErrors: Partial<Record<keyof T, string>> = {}

        parsed.error.issues.forEach((issue) => {
          if (issue.path.length) {
            const key = issue.path[0] as keyof T
            newErrors[key] = issue.message
          }
          setErrors(newErrors)
          return
        })
      }
      setIsSubmitting(true)
      try {
        await onSubmit(formData as T)
        setSubmitSuccess(true)
        setTimeout(() => setSubmitSuccess(false), 3000)
      } catch (error) {
        console.error("Form submission error:", error)
      } finally {
        setIsSubmitting(false)
      }
    }
  }

  const resetForm = () => {
    setFormData({})
    setErrors({})
    setSubmitSuccess(false)
  }

  const getButtonStyles = (variant: string = "secondary") => {
    const baseStyles =
      "px-6 py-2 rounded-lg font-medium transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 cursor-pointer"

    switch (variant) {
      case "primary":
        return `${baseStyles} bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg hover:from-blue-700 hover:to-indigo-700 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100`
      case "danger":
        return `${baseStyles} bg-gradient-to-r from-red-500 to-red-600 text-white shadow-lg hover:from-red-600 hover:to-red-700 focus:ring-red-500`
      default:
        return `${baseStyles} bg-white text-gray-700 border-2 border-gray-300 shadow-sm hover:border-gray-400 hover:bg-gray-50 focus:ring-gray-500`
    }
  }

  const getInputStyles = (hasError: boolean) => {
    const baseStyles =
      "w-full px-4 py-3 rounded-lg border-2 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-1 placeholder-gray-400"

    if (hasError) {
      return `${baseStyles} border-red-300 focus:border-red-500 focus:ring-red-200 bg-red-50`
    }
    return `${baseStyles} border-gray-300 focus:border-blue-500 focus:ring-blue-200 hover:border-gray-400 bg-white`
  }
  const filledFields = fields.filter((field) => {
    const value = formData[field.name]
    if (typeof value === "string") return value.trim() !== ""
    if (typeof value === "number") return !isNaN(value)
    return value != null
  }).length
  const totalFields = fields.length
  const completionPercentage =
    totalFields > 0 ? (filledFields / totalFields) * 100 : 0
  return (
    <div className="w-full h-auto bg-gradient-to-br from-slate-50 to-blue-5 p-5 ">
      <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
        {/* Success Message */}
        {submitSuccess && (
          <div className="mx-8 mt-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
            <CheckCircle2 className="text-green-600 w-5 h-5" />
            <span className="text-green-800 font-medium">
              Form submitted successfully!
            </span>
          </div>
        )}

        <div className="p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {fields.map((field) => (
              <div key={String(field.name)} className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  {field.label}
                  {field.required !== false && (
                    <span className="text-red-500 ml-1">*</span>
                  )}
                </label>

                <div className="relative">
                  {field.type === "select" && field.options ? (
                    <select
                      value={formData[field.name] ?? ""}
                      onChange={(e) => handleInputChange(field, e.target.value)}
                      className={getInputStyles(!!errors[field.name])}
                      disabled={isSubmitting}
                    >
                      <option value="">Select {field.label}</option>
                      {field.options.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  ) : field.type === "multiselect" && field.options ? (
                    <select
                      multiple
                      value={formData[field.name] ?? []}
                      onChange={(e) =>
                        handleInputChange(
                          field,
                          Array.from(e.target.selectedOptions, (o) => o.value)
                        )
                      }
                      className={getInputStyles(!!errors[field.name])}
                      disabled={isSubmitting}
                    >
                      {field.options.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type={field.type}
                      value={String(formData[field.name] ?? "")}
                      onChange={(e) => handleInputChange(field, e.target.value)}
                      placeholder={
                        field.placeholder ||
                        `Enter ${field.label.toLowerCase()}`
                      }
                      className={getInputStyles(!!errors[field.name])}
                      disabled={isSubmitting}
                    />
                  )}

                  {errors[field.name] && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <AlertCircle className="text-red-500 w-5 h-5" />
                    </div>
                  )}
                </div>

                {errors[field.name] && (
                  <p className="text-red-600 text-sm mt-1 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors[field.name]}
                  </p>
                )}
              </div>
            ))}
          </div>

          {/* Progress Indicator */}
          <div className="mb-6">
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>Form Completion</span>
              <span>{Math.round(completionPercentage)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-gradient-to-r from-blue-500 to-indigo-500 h-2 rounded-full transition-all duration-500"
                style={{ width: `${completionPercentage}%` }}
              />
            </div>
          </div>

          {/* Buttons */}
          <div className="flex flex-wrap gap-4 justify-center">
            <button
              onClick={handleFormSubmit}
              disabled={isSubmitting || filledFields === 0}
              className={getButtonStyles("primary")}
            >
              {isSubmitting ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Submitting...
                </div>
              ) : (
                "Submit Form"
              )}
            </button>

            <button
              onClick={resetForm}
              className={getButtonStyles("secondary")}
              disabled={isSubmitting}
            >
              Reset Form
            </button>

            {buttons?.map((btn, index) => (
              <button
                key={index}
                onClick={btn.action}
                className={getButtonStyles(btn.variant)}
                disabled={isSubmitting}
              >
                {btn.label}
              </button>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-8 py-4 text-center text-sm text-gray-600">
          All fields marked with <span className="text-red-500">*</span> are
          required
        </div>
      </div>
    </div>
  )
}

export default DynamicForm
