import { Button, Card, Form, Select, Space, Typography, message } from "antd"
import { useState } from "react"
import { Artifact } from "@/lib/const"
import { AccountData } from "./const"
import AccountListModal from "../AccountListModal"

interface Props {
  accounts: AccountData[]
  artifacts: Artifact[]
  currAccount: string | undefined
  onAccountChange: (address: string | undefined) => void
  onDeploy: (artifact: Artifact) => Promise<void>
  onAccountNameChange: (names: Record<string, string>) => void
}

export default function Index({ accounts, artifacts, currAccount, onAccountChange, onDeploy, onAccountNameChange }: Props) {
  const [currArtifact, setCurrArtifact] = useState<string>()
  const [accountListVisible, setAccountListVisible] = useState<boolean>(false)
  const [deployLoading, setDeployLoading] = useState<boolean>(false)
  const [messageApi, contextHolder] = message.useMessage()

  const handleDeploy = () => {
    if (!!currArtifact) {
      const artifact = artifacts.find(item => item.sourceName === currArtifact)
      if (artifact) {
        setDeployLoading(true)
        onDeploy(artifact).then(() => {
          setCurrArtifact(undefined)
        }).finally(() => {
          setDeployLoading(false)
        })
      }
    } else {
      messageApi.open({
        type: 'error',
        content: '请选择要部署的合约',
      })
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
          <Typography.Link onClick={() => setAccountListVisible(true)}>账户列表，修改账户名称</Typography.Link>
        }>
          <Select
            options={accounts}
            fieldNames={{ label: 'name', value: 'address' }}
            value={currAccount}
            onChange={onAccountChange}
          />
        </Form.Item>

        <Form.Item style={{ marginBottom: 0 }}>
          <Space.Compact style={{ width: '100%' }}>
            <Select
              options={artifacts.map(artifact => ({
                ...artifact,
                contractName: `${artifact.contractName}.sol`,
              }))}
              fieldNames={{ label: 'contractName', value: 'sourceName' }}
              value={currArtifact}
              onChange={setCurrArtifact}
            />
            <Button type="primary" onClick={handleDeploy} loading={deployLoading}>部署合约</Button>
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

      {contextHolder}
    </>
  )
}
