import { Input } from "antd"

interface Props {
  placeholder: string
  value: string
  onChange: (value: string) => void
}

export default function Index({ placeholder, value, onChange }: Props) {
  return <Input
    placeholder={placeholder}
    value={value}
    onChange={e => onChange(e.target.value)}
    style={{ width: 90 }}
  />
}
