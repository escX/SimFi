import { Checkbox, Form, Modal, Select } from "antd"
import { HistoryFilterData } from "../const"
import { AccountData } from "../../InfoPanel/const"
import { ContractData } from "@/lib/const"
import { useEffect } from "react"

interface Props {
  accounts: AccountData[]
  contracts: ContractData[]
  data: HistoryFilterData
  visible: boolean
  onCancel: () => void
  onConfirm: (data: HistoryFilterData) => void
}

export default function Index({ accounts, contracts, data, visible, onCancel, onConfirm }: Props) {
  const [formRef] = Form.useForm()

  useEffect(() => {
    formRef.setFieldsValue(data)
  }, [data])

  return (
    <Modal
      title="筛选条件"
      open={visible}
      onCancel={onCancel}
      onOk={() => onConfirm(formRef.getFieldsValue())}
    >
      <Form form={formRef}>
        <Form.Item label="账户" name="accounts">
          <Select
            mode="multiple"
            maxTagCount="responsive"
            allowClear
            options={accounts}
            fieldNames={{ label: 'name', value: 'address' }}
          />
        </Form.Item>
        <Form.Item label="合约" name="contracts">
          <Select
            mode="multiple"
            maxTagCount="responsive"
            allowClear
            options={contracts.map(contract => ({ ...contract, name: `${contract.name}: ${new Date(contract.deployTimestamp).toLocaleString()}` }))}
            fieldNames={{ label: 'name', value: 'address' }}
          />
        </Form.Item>
        <Form.Item name="displayDeletedContract" valuePropName="checked" noStyle>
          <Checkbox>显示已删除合约的操作历史</Checkbox>
        </Form.Item>
      </Form>
    </Modal>
  )
}
