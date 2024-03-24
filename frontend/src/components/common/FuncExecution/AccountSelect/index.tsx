import { AccountData } from "@/components/index/InfoPanel/const"
import { Select } from "antd"

interface Props {
  placeholder: string
  accounts: AccountData[]
  width: string | number
  value: string | undefined
  onChange: (value: string | undefined) => void
}

export default function Index({ placeholder, accounts, width = 120, value, onChange }: Props) {
  return <Select
    placeholder={placeholder}
    options={accounts}
    fieldNames={{ label: 'name', value: 'address' }}
    value={value}
    onChange={onChange}
    style={{ width }}
  />
}
