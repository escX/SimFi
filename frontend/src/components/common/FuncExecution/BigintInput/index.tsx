import { InputNumber } from "antd"

interface Props {
  placeholder: string
  width: string | number
  value: number | null
  onChange: (value: number | null) => void
}

export default function Index({ placeholder, width = 90, value, onChange }: Props) {
  return <InputNumber
    placeholder={placeholder}
    min={0}
    value={value}
    onChange={onChange}
    style={{ width }}
  />
}
