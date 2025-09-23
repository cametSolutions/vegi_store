import React, { useState } from "react"
import axios from "axios"

const PriceLevel: React.FC = () => {
  const [priceLevelName, setPriceLevelName] = useState("")
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState("")
  const [showallpricelevel, setshowallpricelevel] = useState(false)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!priceLevelName.trim()) {
      setMessage("Price level name is required")
      return
    }

    setLoading(true)
    setMessage("")

    try {
      // Replace with your API Gateway endpoint
      const response = await axios.post(
        "http://localhost:5000/api/pricelevel/createpricelevel",
        { priceLevelName }
      )
      if (response.status === 201) {
        console.log("response", response.data.data)
      }

      setMessage("Price Level added successfully!")
      setPriceLevelName("") // clear input
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        setMessage(error.response?.data?.message || "Something went wrong")
      } else if (error instanceof Error) {
        setMessage(error.message)
      } else {
        setMessage("Something went wrong")
      }
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full h-auto flex justify-center items-center">
      <div className="bg-white shadow-2xl rounded-xl p-8 w-98">
        <h1 className="text-2xl font-bold text-center mb-6 text-blue-700">
          Add Price Level
        </h1>

        <div className="flex justify-end">
          <span
            onClick={() => setshowallpricelevel(!showallpricelevel)}
            className="bg-blue-800 text-white shadow-xl px-2 py-0.5 rounded-md cursor-pointer"
          >
            show all
          </span>
        </div>

        {message && (
          <div
            className={`mb-4 text-center ${
              message.includes("success") ? "text-green-600" : "text-red-600"
            }`}
          >
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label
              htmlFor="priceLevelName"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Price Level Name
            </label>
            <input
              id="priceLevelName"
              type="text"
              value={priceLevelName}
              onChange={(e) => setPriceLevelName(e.target.value)}
              placeholder="Enter price level name"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none "
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-all font-semibold disabled:opacity-100 focus:outline-none"
          >
            {loading ? "Submitting..." : "Submit"}
          </button>
        </form>
      </div>
    </div>
  )
}

export default PriceLevel
