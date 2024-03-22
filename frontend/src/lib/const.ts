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
  events?: string[]
  stateMutability: StateMutability
  getDescription: (inputs: any[], outputs: any[], accounts: AccountData[]) => React.ReactNode
}

export interface ContractLogResult {
  name: string
  result: any[]
}

export interface ExecResult {
  response: any
  receipt: ContractTransactionReceipt | null
  logs: ContractLogResult[]
}

export interface LogRecord {
  name: string
  result: {
    value: any
    name: string
    indexed: boolean
    type: string
  }[]
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
  logs: LogRecord[]
  getDescription: (inputs: any[], outputs: any[], accounts: AccountData[]) => React.ReactNode
  transactionResponse: ContractTransactionResponse | null
  transactionReceipt: ContractTransactionReceipt | null
}

export type HistoryRecordProvided = Omit<HistoryRecord, 'accountAddress' | 'contractAddress' | 'contractName' | 'contractTimestamp'>
