import { Button, Card, Form, Select, Space, Typography, message } from "antd"
import { useEffect, useMemo, useState } from "react"
import { Artifact } from "@/lib/const"
import { AccountData, constructorParam } from "./const"
import AccountListModal from "./AccountListModal"
import StringInput from "@/components/common/FuncExecution/StringInput"

interface Props {
  className: string
  accounts: AccountData[]
  artifacts: Artifact[]
  currAccountAddress: string | undefined
  onAccountChange: (address: string | undefined) => void
  onDeploy: (artifact: Artifact, params: any[]) => Promise<void>
  onAccountNameChange: (names: Record<string, string>) => void
}

export default function Index({ className, accounts, artifacts, currAccountAddress, onAccountChange, onDeploy, onAccountNameChange }: Props) {
  const [currArtifact, setCurrArtifact] = useState<string>()
  const [constructorParams, setConstructorParams] = useState<constructorParam[]>([])
  const [accountListVisible, setAccountListVisible] = useState<boolean>(false)
  const [deployLoading, setDeployLoading] = useState<boolean>(false)
  const [messageApi, contextHolder] = message.useMessage()

  const currContract = useMemo(() => {
    return artifacts.find(item => item.sourceName === currArtifact)
  }, [currArtifact, artifacts])

  useEffect(() => {
    if (currContract && currContract.abi[0]?.type === 'constructor') {
      setConstructorParams((currContract.abi[0]?.inputs ?? []).map((item: any) => ({
        ...item,
        value: undefined
      })))
    } else {
      setConstructorParams([])
    }
  }, [currContract])

  const handleChangeParamValue = (value: any, index: number) => {
    setConstructorParams(params => {
      params[index].value = value
      return params
    })
  }

  const getParamNode = (type: string, name: string, value: any, index: number) => {
    if (type === 'address') {
      return <StringInput
        key={index}
        placeholder={name}
        width="100%"
        value={value}
        onChange={value => handleChangeParamValue(value, index)}
      />
    }

    return null
  }

  const handleDeploy = () => {
    if (!!currArtifact) {
      if (currContract) {
        setDeployLoading(true)
        onDeploy(currContract, constructorParams.map(param => param.value)).then(() => {
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
      <Card title="账户和部署" className={className}>
        <Form.Item label="当前账户" extra={
          <Typography.Link onClick={() => setAccountListVisible(true)}>账户列表，修改账户名称</Typography.Link>
        }>
          <Select
            options={accounts}
            fieldNames={{ label: 'name', value: 'address' }}
            value={currAccountAddress}
            onChange={onAccountChange}
          />
        </Form.Item>

        <Form.Item style={{ marginBottom: constructorParams.length === 0 ? 0 : 24 }}>
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
            {constructorParams.length === 0 && <Button type="primary" onClick={handleDeploy} loading={deployLoading}>部署合约</Button>}
          </Space.Compact>
        </Form.Item>

        {constructorParams.length > 0 && (
          <Form.Item style={{ marginBottom: 0 }}>
            <Space.Compact style={{ width: '100%' }}>
              {constructorParams.map((param, index) => getParamNode(param.type, param.name, param.value, index))}
              <Button type="primary" onClick={handleDeploy} loading={deployLoading}>部署合约</Button>
            </Space.Compact>
          </Form.Item>
        )}
      </Card>

      <AccountListModal
        accounts={accounts}
        currAccountAddress={currAccountAddress}
        visible={accountListVisible}
        onCancel={() => setAccountListVisible(false)}
        onConfirm={handleChangeAccountName}
      />

      {contextHolder}
    </>
  )
}
