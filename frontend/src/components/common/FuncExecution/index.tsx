import { ArgStyle, ArgType, ContractFunctionConfig, StateMutability } from "@/lib/const"
import { Button, Space } from "antd"
import { useState } from "react"
import { InputValueData } from "./const"
import { AccountData } from "@/components/index/InfoPanel/const"
import AccountSelect from "./AccountSelect"
import BigintInput from "./BigintInput"

interface Props extends ContractFunctionConfig {
  accounts: AccountData[]
  onExecFunction: (funcName: string, args: InputValueData[]) => Promise<any>
}

export default function Index({ name, inputs, stateMutability, getDescription, accounts, onExecFunction }: Props) {
  const [inputValues, setInputValues] = useState<InputValueData[]>([])
  const [outputValues, setOutputValues] = useState<any[]>([])
  const [confirmLoading, setConfirmLoading] = useState<boolean>(false)

  const handleValueChange = (index: number, value: InputValueData) => {
    const data: InputValueData[] = [...inputValues]
    data[index] = value

    setInputValues(data)
  }

  const handleClick = () => {
    setConfirmLoading(true)

    onExecFunction(name, inputValues).then(data => {
      console.log(data)
    }).catch(error => {
      console.log(error)
    }).finally(() => {
      setConfirmLoading(false)
    })
  }

  const getButtonNode = () => {
    if (stateMutability === StateMutability.Nonpayable) {
      return <Button type="primary" onClick={handleClick} loading={confirmLoading}>{name}</Button>
    }

    if (stateMutability === StateMutability.View) {
      return <Button onClick={handleClick} loading={confirmLoading}>{name}</Button>
    }

    return null
  }

  const getParamNode = (type: ArgType, style: ArgStyle, index: number) => {
    if (style === ArgStyle.AccountSelect) {
      return <AccountSelect
        key={index}
        placeholder={type}
        accounts={accounts}
        value={inputValues[index] as string}
        onChange={value => handleValueChange(index, value)}
      />
    }

    if (style === ArgStyle.BigintInput) {
      return <BigintInput
        key={index}
        placeholder={type}
        value={(inputValues[index] ?? null) as number}
        onChange={value => handleValueChange(index, value)}
      />
    }

    return null
  }

  return (
    <>
      <Space.Compact>
        {getButtonNode()}
        {inputs.map(({ type, style }, index) => getParamNode(type, style, index))}
      </Space.Compact>

      <div>
        {getDescription(inputValues, outputValues, accounts)}
      </div>
    </>
  )
}
