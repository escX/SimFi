import { Input } from "antd"

interface Props {
  placeholder: string
  width: string | number
  value: string
  onChange: (value: string) => void
}

export default function Index({ placeholder, width = 90, value, onChange }: Props) {
  return <Input
    placeholder={placeholder}
    value={value}
    onChange={e => onChange(e.target.value)}
    style={{ width }}
  />
}
