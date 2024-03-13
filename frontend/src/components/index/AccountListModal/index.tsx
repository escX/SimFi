import { useEffect, useState } from "react"
import { List, Modal, Typography } from "antd"
import { AccountData } from "@/lib/const"

interface Props {
  accounts: AccountData[]
  currAccount: string | undefined
  visible: boolean
  onCancel: () => void
  onConfirm: (names: Record<string, string>) => void
}

export default function Index({ accounts, currAccount, visible, onCancel, onConfirm }: Props) {
  const [names, setNames] = useState<Record<string, string>>({})

  useEffect(() => {
    const names: Record<string, string> = {}
    accounts.forEach((account) => {
      names[account.address] = account.name
    })

    setNames(names)
  }, [accounts])

  return <Modal
    title="账户列表"
    width={480}
    destroyOnClose
    open={visible}
    onCancel={onCancel}
    onOk={() => onConfirm(names)}
    styles={{body: {height: '60vh', overflow: 'auto'}}}
  >
    <List
      dataSource={accounts}
      renderItem={(item) => (
        <List.Item>
          <List.Item.Meta
            title={
              <Typography.Text style={{marginLeft: 20}} editable={{
                text: names[item.address],
                onChange: (text) => {
                  setNames({
                    ...names,
                    [item.address]: text,
                  })
                },
              }}>
                {currAccount === item.address ?
                  <Typography.Text type="secondary">[当前账户]&nbsp;</Typography.Text> :
                  null
                }
                {names[item.address]}
              </Typography.Text>
            }
            description={
              <Typography.Text style={{marginLeft: 20}} type="secondary" copyable>
                {item.address}
              </Typography.Text>
            }
          />
        </List.Item>
      )}
    />
  </Modal>
}
