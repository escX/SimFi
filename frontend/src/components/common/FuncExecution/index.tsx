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
  onExecFunction: (funcName: string, args: InputValueData[], events: string[]) => Promise<ExecResult>
  onHistoryRecord: (data: HistoryRecordProvided) => void
}

export default function Index({ name, inputs, events = [], stateMutability, getDescription, accounts, onExecFunction, onHistoryRecord }: Props) {
  const [inputValues, setInputValues] = useState<InputValueData[]>([])
  const [outputValues, setOutputValues] = useState<any[]>([])
  const [confirmLoading, setConfirmLoading] = useState<boolean>(false)

  const handleValueChange = (index: number, value: InputValueData) => {
    const data: InputValueData[] = [...inputValues]
    data[index] = value

    setInputValues(data)
  }

  const handleExec = () => {
    setConfirmLoading(true)

    onExecFunction(name, inputValues, events).then(({ response, receipt, logs }) => {
      let txResponse: ContractTransactionResponse | null = null
      let txReceipt: ContractTransactionReceipt | null = null
      let outputs: any[] = []

      if (response instanceof ContractTransactionResponse) {
        txResponse = response
      } else {
        if (Object.prototype.toString.call(response) === '[object Proxy]') {
          outputs = response.toArray()
        } else {
          outputs = [response.toString()] ?? []
        }
      }

      if (receipt instanceof ContractTransactionReceipt) {
        txReceipt = receipt
      }

      setOutputValues(outputs)

      onHistoryRecord({
        execTimestamp: new Date().getTime(),
        functionName: name,
        inputs: inputValues,
        outputs,
        logs: logs.map(log => {
          const lastIndex = (log.result?.length ?? 1) - 1
          const eventPayload = log.result?.[lastIndex]
          const fragment = eventPayload?.fragment?.inputs

          return {
            name: log.name,
            result: (fragment ?? []).map((item: any, index: number) => ({
              ...item,
              value: eventPayload?.args?.[index]
            }))
          }
        }),
        getDescription,
        transactionResponse: txResponse,
        transactionReceipt: txReceipt
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

      <div style={{ marginTop: 6 }}>
        {getDescription(inputValues, outputValues, accounts)}
      </div>
    </>
  )
}
