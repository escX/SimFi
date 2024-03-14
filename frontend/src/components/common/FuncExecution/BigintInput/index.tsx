import { InputNumber } from "antd"

interface Props {
  placeholder: string
  value: number | null
  onChange: (value: number | null) => void
}

export default function Index({ placeholder, value, onChange }: Props) {
  return <InputNumber
    placeholder={placeholder}
    min={0}
    value={value}
    onChange={onChange}
  />
}
