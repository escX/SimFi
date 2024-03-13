import { Button, Card, Form, Select, Space, Typography } from "antd"
import { useState } from "react"
import AccountListModal from "../AccountListModal"
import { AccountData, Artifact } from "@/lib/const"

interface Props {
  accounts: AccountData[]
  artifacts: Artifact[]
  currAccount: string | undefined
  onAccountChange: (address: string | undefined) => void
  onDeploy: (artifact: Artifact) => Promise<void>
  onAccountNameChange: (names: Record<string, string>) => void
}

export default function Index({accounts, artifacts, currAccount, onAccountChange, onDeploy, onAccountNameChange}: Props) {
  const [currArtifact, setCurrArtifact] = useState<string>()
  const [accountListVisible, setAccountListVisible] = useState(false)

  const handleDeploy = () => {
    const artifact = artifacts.find(item => item.sourceName === currArtifact)
    if (artifact) {
      onDeploy(artifact).then(() => {
        setCurrArtifact(undefined)
      }).catch(() => {})
    }
  }

  const handleChangeAccountName = (names: Record<string, string>) => {
    onAccountNameChange(names)
    setAccountListVisible(false)
  }

  return (
    <>
      <Card>
        <Form.Item label="当前账户" extra={
          <Typography.Link onClick={() => setAccountListVisible(true)}>账户列表</Typography.Link>
        }>
          <Select
            options={accounts}
            fieldNames={{label: 'name', value: 'address'}}
            value={currAccount}
            onChange={onAccountChange}
          />
        </Form.Item>

        <Form.Item style={{marginBottom: 0}}>
          <Space.Compact style={{ width: '100%' }}>
            <Select
              options={artifacts.map(artifact => ({
                ...artifact,
                contractName: `${artifact.contractName}.sol`,
              }))}
              fieldNames={{label: 'contractName', value: 'sourceName'}}
              value={currArtifact}
              onChange={setCurrArtifact}
            />
            <Button type="primary" onClick={handleDeploy}>部署合约</Button>
          </Space.Compact>
        </Form.Item>
      </Card>

      <AccountListModal
        accounts={accounts}
        currAccount={currAccount}
        visible={accountListVisible}
        onCancel={() => setAccountListVisible(false)}
        onConfirm={handleChangeAccountName}
      />
    </>
  )
}
