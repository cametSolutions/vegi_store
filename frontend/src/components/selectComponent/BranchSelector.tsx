import { useAppSelector } from "../../hooks/hooks"
import {
  FormControl,
  Select,
  MenuItem,
  Checkbox,
  ListItemText
} from "@mui/material"
import { useState, useEffect } from "react"
interface BranchSelectorProps {
  onChange?: (selected: string[]) => void
}

const BranchSelector = ({ onChange }: BranchSelectorProps) => {
  const branches = useAppSelector((state) => state.companyBranch.branches)
console.log("brances",branches)
  const [selectedBranchIds, setSelectedBranchIds] = useState<string[]>([])

  // Default select all branches
  useEffect(() => {
    if (branches.length > 0) {
      const allIds = branches.map((b) => b._id)
      setSelectedBranchIds(allIds)
      onChange?.(allIds)
    }
  }, [branches])

  const handleChange = (event: any) => {
    const value = event.target.value
console.log("value",value)
console.log("typeof value",typeof value)
    const updated = typeof value === "string" ? value.split(",") : value
console.log("updated",updated)
    setSelectedBranchIds(updated)
    onChange?.(updated) //notify parent
    // setSelectedBranchIds(typeof value === "string" ? value.split(",") : value)
  }

  return (
    <FormControl size="small" className="w-60">
      {/* <InputLabel id="branch-multi-label">Branches</InputLabel> */}
      <Select
        labelId="branch-multi-label"
        multiple
        value={selectedBranchIds}
        onChange={handleChange}
        // input={<OutlinedInput label="Branches" />}
        renderValue={(selected) => {
          if (selected.length === branches.length) return "All Branches"
          if (selected.length === 0) return "None"
          return `${selected.length} Selected`
        }}
        MenuProps={{
          PaperProps: { style: { maxHeight: 300 } } // scroll if many branches
        }}
      >
        {branches.map((branch) => (
          <MenuItem key={branch._id} value={branch._id}>
            <Checkbox checked={selectedBranchIds.includes(branch._id)} />
            <ListItemText primary={branch.branchName} />
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  )
}

export default BranchSelector
