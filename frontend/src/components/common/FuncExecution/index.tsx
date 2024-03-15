import { ArgStyle, ArgType, ContractFunctionConfig, ExecResult, HistoryRecordProvided, StateMutability } from "@/lib/const"
import { Button, Space } from "antd"
import { useState } from "react"
import { InputValueData } from "./const"
import { AccountData } from "@/components/index/InfoPanel/const"
import { ContractTransactionResponse, ContractTransactionReceipt } from "ethers"
import AccountSelect from "./AccountSelect"
import BigintInput from "./BigintInput"

interface Props extends ContractFunctionConfig {
  accounts: AccountData[]
  onExecFunction: (funcName: string, args: InputValueData[]) => Promise<ExecResult>
  onHistoryRecord: (data: HistoryRecordProvided) => void
}

export default function Index({ name, inputs, stateMutability, getDescription, accounts, onExecFunction, onHistoryRecord }: Props) {
  const [inputValues, setInputValues] = useState<InputValueData[]>([])
  const [outputValues, setOutputValues] = useState<any[]>([])
  const [transactionResponse, setTransactionResponse] = useState<ContractTransactionResponse | null>(null)
  const [transactionReceipt, setTransactionReceipt] = useState<ContractTransactionReceipt | null>(null)
  const [confirmLoading, setConfirmLoading] = useState<boolean>(false)

  const handleValueChange = (index: number, value: InputValueData) => {
    const data: InputValueData[] = [...inputValues]
    data[index] = value

    setInputValues(data)
  }

  const handleExec = () => {
    setConfirmLoading(true)

    onExecFunction(name, inputValues).then(({ response, receipt }) => {
      const transactionData: {
        transactionResponse: ContractTransactionResponse | null
        transactionReceipt: ContractTransactionReceipt | null
      } = {
        transactionResponse: null,
        transactionReceipt: null
      }

      if (response instanceof ContractTransactionResponse) {
        setTransactionResponse(response)
        transactionData.transactionResponse = response
      } else {
        if (Object.prototype.toString.call(response) === '[object Proxy]') {
          setOutputValues(response.toArray())
        } else {
          setOutputValues([response.toString()] ?? [])
        }
      }

      if (receipt instanceof ContractTransactionReceipt) {
        setTransactionReceipt(receipt)
        transactionData.transactionReceipt = receipt
      }

      onHistoryRecord({
        timestamp: new Date().getTime(),
        functionName: name,
        description: {
          inputs: inputValues,
          outputs: outputValues,
          getDescription: getDescription
        },
        ...transactionData
      })
    }).finally(() => {
      setConfirmLoading(false)
    })
  }

  const getButtonNode = () => {
    if (stateMutability === StateMutability.Nonpayable) {
      return <Button type="primary" onClick={handleExec} loading={confirmLoading}>{name}</Button>
    }

    if (stateMutability === StateMutability.View) {
      return <Button onClick={handleExec} loading={confirmLoading}>{name}</Button>
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
