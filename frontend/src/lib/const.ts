import { InputValueData } from "@/components/common/FuncExecution/const"
import { AccountData } from "@/components/index/InfoPanel/const"
import { BaseContract, ContractTransactionReceipt, ContractTransactionResponse } from "ethers"

export interface Artifact {
  contractName: string
  sourceName: string
  abi: any[]
  bytecode: string
  deployedBytecode: string
  linkReferences: Record<string, any>
  deployedLinkReferences: Record<string, any>
}

export interface ContractData {
  address: string
  name: string
  deployTimestamp: number
  deployAccountAddress: string
  ref: BaseContract
}

export enum StateMutability {
  Pure,
  View,
  Nonpayable,
  Payable
}

export enum ArgType {
  Uint256 = 'uint256',
  Address = 'address',
}

export enum ArgStyle {
  AccountSelect,
  BigintInput,
}

export interface InputConfig {
  type: ArgType,
  style: ArgStyle
}

export interface ContractFunctionConfig {
  name: string
  inputs: InputConfig[]
  stateMutability: StateMutability
  getDescription: (inputs: any[], outputs: any[], accounts: AccountData[]) => React.ReactNode
}

export interface ExecResult {
  response: any
  receipt: ContractTransactionReceipt | null
}

export interface HistoryRecord {
  accountAddress: string
  contractAddress: string
  contractName: string
  contractTimestamp: number
  execTimestamp: number
  functionName: string
  inputs: InputValueData[]
  outputs: any[]
  getDescription: (inputs: any[], outputs: any[], accounts: AccountData[]) => React.ReactNode
  transactionResponse: ContractTransactionResponse | null
  transactionReceipt: ContractTransactionReceipt | null
}

export type HistoryRecordProvided = Omit<HistoryRecord, 'accountAddress' | 'contractAddress' | 'contractName' | 'contractTimestamp'>

export interface LogRecord {
  eventName: string
  topics: readonly string[]
  result: {
    value: any
    name: string
    indexed: boolean | null
    type: string
  }[]
}
