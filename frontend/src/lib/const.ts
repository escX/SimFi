import { AccountData } from "@/components/index/InfoPanel/const"
import { BaseContract } from "ethers"

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
  deployAccountName: string
  deployAccountAddress: string
  ref: BaseContract & Omit<any, keyof BaseContract>
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
