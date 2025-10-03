import  { useEffect, useState } from "react"
import { MasterTable } from "../../components/table/MasterTable"
import { toast } from "sonner"
import { Button, Card, CardContent, Typography } from "@mui/material"
import MalayalamKeyboardInput from "../../components/keyboard/MalayalamKeyboard" // your keyboard component
import { units } from "../../utils/units"
import { ItemSchema} from "../../validation/itemmasterSchema"
import { useSelector } from "react-redux"
import BranchSelector from "../../components/selectComponent/BranchSelector"
import { itemMasterApi } from "../../api/services/items.service"
import { showSuccessToast, showErrorToast } from "../../components/toast/toast"

const ItemMaster= () => {
  const [itemName, setItemName] = useState("")
  const [showTable, setShowTable] = useState(false)
  const [viewallitems, setviewallitems] = useState([])
  const [selectedBranches, setSelectedBranches] = useState([])
  const [itemCode, setItemCode] = useState("")
  const [unit, setUnit] = useState("")
  const [showKeyboard, setShowKeyboard] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})
  const company = useSelector(
    (state) => state.companyBranch.selectedCompany
  ) 
  const headers = ["ItemName", "ItemCode", "Unit"]
  const allbranches = useSelector(
    (state) => state.companyBranch.branches
  )
  console.log("selectedbranchids", selectedBranches)
  useEffect(() => {
    if (company) {
      const allitems = async () => {
        const result = await itemMasterApi.getAll(company._id)
        setviewallitems(
          result.data.map((item) => ({
             // numbering
            itemName: item.itemName,
            itemCode: item.itemCode,
            unit: item.unit
          }))
        )
       
      }
      allitems()
    }
  }, [])
  const handleSave = async () => {
    if (!company) {
      console.error("No company selected")
      setErrors({ companyId: "Company is required " })
      toast.error("company id is missing ") //this shows whether company id in redux
      return
    }
    console.log("selectedbranches", selectedBranches)
    const result = ItemSchema.safeParse({
      itemName,
      itemCode,
      companyId: company._id,
      branchIds: selectedBranches,
      unit
    })
    if (!result.success) {
      const fieldErrors= {}
      result.error.issues.forEach((err) => {
        const fieldName = err.path[0] 
        fieldErrors[fieldName] = err.message
      })
      setErrors(fieldErrors)
      console.log("errors", fieldErrors)
      showErrorToast("Please fix the form errors")
      //   toast.error("Please fix the form errors") // ✅ toast for validation error
      return
    }

    try {
      setLoading(true)
      const response = await itemMasterApi.create({
        itemName,
        itemCode,
        companyId: company._id,
        branchIds: selectedBranches,
        unit
      })
      console.log("response", response.data)
      showSuccessToast("Item saved successfully!")
   

      // Reset form
      setItemName("")
      setItemCode("")
      setUnit("")
      setShowKeyboard(false)
    } catch (error) {
      console.error("Save error:", error.message)
      showErrorToast("Failed to save ")
     
    } finally {
      setLoading(false)
    }
  }
  const handleEdit = (item) => {
    alert(`Edit: ${item.companyName}`)
  }
  const handleDelete = () => console.log("Deleted:", { itemName })

  const handleCancel = () => {
    setItemName("")
    setItemCode("")
    setUnit("")
  }

  return (
    <div
      style={{
        position: "fixed",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        // width: "700px",
        borderRadius: 12,
        boxShadow: "0px 4px 12px rgba(0,0,0,0.1)",
        background: "#fff",
        zIndex: 10
      
      }}
    >
      <Card
        style={{
          width: "400px",

          borderRadius: 12,
          boxShadow: "0px 4px 12px rgba(0,0,0,0.1)"
        }}
      >
        <CardContent>
          <Typography variant="h5" gutterBottom align="center">
            Item Master
          </Typography>
          <div className="flex justify-end">
            <BranchSelector onChange={setSelectedBranches} />
          </div>

          {/* Item Name */}
          <div style={{ marginBottom: 20, position: "relative" }}>
            <label
              style={{ display: "block", marginBottom: 5, fontWeight: 600 }}
            >
              Item Name (Malayalam)
            </label>
            <input
              type="text"
              value={itemName}
              readOnly
              placeholder="Type using Malayalam Keyboard"
              onFocus={() => setShowKeyboard(true)}
              style={{
                width: "100%",
                padding: 12,
                fontSize: 16,
                border: "1px solid #ccc",
                borderRadius: 6
              }}
              onChange={(e) => setItemName(e.target.value)}
            />

            {showKeyboard && (
              <div
                style={{
                  position: "fixed",
                  bottom: 0,
                  left: 0,
                  right: 0,
                  zIndex: 2000,
                  background: "#fff",
                  borderTop: "2px solid #ddd",
                  boxShadow: "0px -2px 10px rgba(0,0,0,0.2)",
                  padding: 12,
                  borderRadius: "12px 12px 0 0",
                  animation: "slideUp 0.3s ease-out"
                }}
              >
                <div style={{ maxHeight: "250px", overflowY: "auto" }}>
                  <MalayalamKeyboardInput
                    value={itemName}
                    onChange={setItemName}
                  />
                </div>
                <div style={{ textAlign: "right", marginTop: 10 }}>
                  <Button
                    variant="contained"
                    color="error"
                    size="small"
                    onClick={() => setShowKeyboard(false)}
                  >
                    Close Keyboard
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Item Code */}
          <div style={{ marginBottom: 20 }}>
            <label
              style={{ display: "block", marginBottom: 5, fontWeight: 600 }}
            >
              Item Code
            </label>
            <input
              type="text"
              value={itemCode}
              onChange={(e) => setItemCode(e.target.value)}
              style={{
                width: "100%",
                padding: 12,
                fontSize: 16,
                border: "1px solid #ccc",
                borderRadius: 6
              }}
            />
          </div>

          {/* Units */}
          <div style={{ marginBottom: 20 }}>
            <label
              style={{ display: "block", marginBottom: 5, fontWeight: 600 }}
            >
              Units
            </label>
            <select
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              style={{
                width: "100%",
                padding: 12,
                fontSize: 16,
                border: "1px solid #ccc",
                borderRadius: 6
              }}
            >
              {units.map((unit) => (
                <option key={unit.shortForm} value={unit.shortForm}>
                  {unit.fullForm}
                </option>
              ))}
            </select>
          </div>

          {/* Buttons */}
          <div
            style={{
              //   marginTop: 25,
              //   display: "flex",
              //   justifyContent: "space-between"
              display: "flex",
              justifyContent: "space-between",
              marginTop: 20
            }}
          >
            <Button variant="contained" color="primary" onClick={handleSave}>
              Save
            </Button>
            <Button variant="outlined" onClick={() => setShowTable(!showTable)}>
              View
            </Button>
            <Button variant="outlined" color="error" onClick={handleDelete}>
              Delete
            </Button>

            <Button variant="text" onClick={handleCancel}>
              Cancel
            </Button>
          </div>
        </CardContent>
      </Card>
      {showTable && (
        <div
          style={{
            position: "fixed",
            top: "50%",
            left: "calc(50% + 210px)", // half card width + gap
            transform: "translateY(-50%)",
            minWidth: "500px",
            zIndex: 5
            //  flex: 1, minWidth: "600px"
          }}
        >
          <MasterTable
            data={viewallitems}
            onEdit={handleEdit}
            onDelete={handleDelete}
            headers={headers}
            action={false}
          />
        </div>
      )}
    </div>
  )
}

export default ItemMaster
