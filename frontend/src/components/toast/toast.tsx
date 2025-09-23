import { toast } from "sonner"

// Success toast
export const showSuccessToast = (message: string, description?: string) => {
  toast.success(message, {
    description,
    icon: (
      <div className="bg-white rounded-full p-1">
        <svg
          className="w-5 h-5 text-green-600"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      </div>
    ),
    style: {
      background: "#16a34a", // tailwind green-600
      color: "#fff",
      padding: "16px 24px",
      borderRadius: "14px",
      boxShadow: "0 6px 20px rgba(0,0,0,0.2)"
    }
  })
}

// Error toast
export const showErrorToast = (message: string, description?: string) => {
  toast.error(message, {
    description,
    icon: (
      <div className="bg-white rounded-full p-1">
        <svg
          className="w-5 h-5 text-red-600"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </div>
    ),
    style: {
      background: "#dc2626", // tailwind red-600
      color: "#fff",
      padding: "16px 24px",
      borderRadius: "14px",
      boxShadow: "0 6px 20px rgba(0,0,0,0.2)"
    }
  })
}
