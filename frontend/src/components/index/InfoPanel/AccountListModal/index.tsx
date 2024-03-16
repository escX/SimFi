import { useEffect, useState } from "react"
import { List, Modal, Typography } from "antd"
import { AccountData } from "../const"

interface Props {
  accounts: AccountData[]
  currAccountAddress: string | undefined
  visible: boolean
  onCancel: () => void
  onConfirm: (names: Record<string, string>) => void
}

export default function Index({ accounts, currAccountAddress, visible, onCancel, onConfirm }: Props) {
  const [names, setNames] = useState<Record<string, string>>({})
  const [isScrolled, setIsScrolled] = useState<boolean>(false) // 进入页面后，列表显示在底部，需要先滚动到顶部再显示

  useEffect(() => {
    const names: Record<string, string> = {}
    accounts.forEach((account) => {
      names[account.address] = account.name
    })

    setNames(names)
  }, [accounts])

  return <Modal
    title="账户列表"
    className="accounts-modal"
    width={480}
    destroyOnClose
    open={visible}
    onCancel={onCancel}
    onOk={() => onConfirm(names)}
    styles={{ body: { height: '60vh', overflow: 'auto' } }}
    afterOpenChange={open => {
      if (open) {
        document.querySelector('.accounts-modal .ant-modal-body')?.scrollTo({ top: 0 })
        setIsScrolled(true)
      }
    }}
    afterClose={() => setIsScrolled(false)}
  >
    <List
      dataSource={accounts}
      loading={!isScrolled}
      renderItem={(item) => (
        <List.Item style={{ visibility: isScrolled ? 'visible' : 'hidden' }}>
          <List.Item.Meta
            title={
              <Typography.Text style={{ marginLeft: 20 }} editable={{
                text: names[item.address],
                onChange: (text) => {
                  if (!!text) {
                    setNames({
                      ...names,
                      [item.address]: text,
                    })
                  }
                },
              }}>
                {currAccountAddress === item.address ?
                  <Typography.Text type="secondary" style={{ fontWeight: 'normal' }}>[当前账户]&nbsp;</Typography.Text> :
                  null
                }
                {names[item.address]}
              </Typography.Text>
            }
            description={
              <Typography.Text style={{ marginLeft: 20 }} type="secondary" copyable>
                {item.address}
              </Typography.Text>
            }
          />
        </List.Item>
      )}
    />
  </Modal>
}
