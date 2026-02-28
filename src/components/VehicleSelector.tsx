import { Vehicle } from '@/lib/types'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Plus } from '@phosphor-icons/react'

interface VehicleSelectorProps {
  vehicles: Vehicle[]
  selectedId: string
  onSelect: (id: string) => void
  onAddNew: () => void
}

const ADD_NEW_VALUE = '__add_new__'

export const VehicleSelector = ({ vehicles, selectedId, onSelect, onAddNew }: VehicleSelectorProps) => {
  const handleValueChange = (value: string) => {
    if (value === ADD_NEW_VALUE) {
      onAddNew()
      return
    }
    onSelect(value)
  }

  return (
    <Select value={selectedId} onValueChange={handleValueChange}>
      <SelectTrigger className="w-52">
        <SelectValue placeholder="Select vehicle" />
      </SelectTrigger>
      <SelectContent>
        {vehicles.map((vehicle) => (
          <SelectItem key={vehicle.id} value={vehicle.id}>
            {vehicle.year} {vehicle.make} {vehicle.model}
          </SelectItem>
        ))}
        <SelectSeparator />
        <SelectItem value={ADD_NEW_VALUE}>
          <span className="flex items-center gap-2">
            <Plus size={14} />
            Add Vehicle
          </span>
        </SelectItem>
      </SelectContent>
    </Select>
  )
}
