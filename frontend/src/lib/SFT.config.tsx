import { ArgStyle, ArgType, ContractFunctionConfig, StateMutability } from "@/lib/const"
import { getAccountName, getDescNode } from "@/lib/utils"
import { Typography } from "antd"

const config: ContractFunctionConfig[] = [
  {
    name: 'totalSupply',
    inputs: [],
    stateMutability: StateMutability.View,
    getDescription: (inputs, outputs, accounts) => {
      return <Typography.Text>
        查询货币总供应量为{getDescNode(outputs[0])}
      </Typography.Text>
    }
  },
  {
    name: 'balanceOf',
    inputs: [
      { type: ArgType.Address, style: ArgStyle.AccountSelect }
    ],
    stateMutability: StateMutability.View,
    getDescription: (inputs, outputs, accounts) => {
      return <Typography.Text>
        查询{getDescNode(getAccountName(accounts, inputs[0]))}的余额为{getDescNode(outputs[0])}
      </Typography.Text>
    }
  },
  {
    name: 'allowance',
    inputs: [
      { type: ArgType.Address, style: ArgStyle.AccountSelect },
      { type: ArgType.Address, style: ArgStyle.AccountSelect }
    ],
    stateMutability: StateMutability.View,
    getDescription: (inputs, outputs, accounts) => {
      return <Typography.Text>
        查询{getDescNode(getAccountName(accounts, inputs[0]))}授权{getDescNode(getAccountName(accounts, inputs[1]))}的转账额度为{getDescNode(outputs[0])}
      </Typography.Text>
    }
  },
  {
    name: 'mint',
    inputs: [
      { type: ArgType.Uint256, style: ArgStyle.BigintInput }
    ],
    events: ['Transfer'],
    stateMutability: StateMutability.Nonpayable,
    getDescription: (inputs, outputs, accounts) => {
      return <Typography.Text>
        铸造货币量为{getDescNode(inputs[0])}
      </Typography.Text>
    }
  },
  {
    name: 'burn',
    inputs: [
      { type: ArgType.Uint256, style: ArgStyle.BigintInput }
    ],
    events: ['Transfer'],
    stateMutability: StateMutability.Nonpayable,
    getDescription: (inputs, outputs, accounts) => {
      return <Typography.Text>
        销毁货币量为{getDescNode(inputs[0])}
      </Typography.Text>
    }
  },
  {
    name: 'transfer',
    inputs: [
      { type: ArgType.Address, style: ArgStyle.AccountSelect },
      { type: ArgType.Uint256, style: ArgStyle.BigintInput }
    ],
    events: ['Transfer'],
    stateMutability: StateMutability.Nonpayable,
    getDescription: (inputs, outputs, accounts) => {
      return <Typography.Text>
        向{getDescNode(getAccountName(accounts, inputs[0]))}转账{getDescNode(inputs[1])}
      </Typography.Text>
    }
  },
  {
    name: 'approve',
    inputs: [
      { type: ArgType.Address, style: ArgStyle.AccountSelect },
      { type: ArgType.Uint256, style: ArgStyle.BigintInput }
    ],
    events: ['Approval'],
    stateMutability: StateMutability.Nonpayable,
    getDescription: (inputs, outputs, accounts) => {
      return <Typography.Text>
        授权{getDescNode(getAccountName(accounts, inputs[0]))}的转账额度为{getDescNode(inputs[1])}
      </Typography.Text>
    }
  },
  {
    name: 'transferFrom',
    inputs: [
      { type: ArgType.Address, style: ArgStyle.AccountSelect },
      { type: ArgType.Address, style: ArgStyle.AccountSelect },
      { type: ArgType.Uint256, style: ArgStyle.BigintInput }
    ],
    events: ['Transfer'],
    stateMutability: StateMutability.Nonpayable,
    getDescription: (inputs, outputs, accounts) => {
      return <Typography.Text>
        从{getDescNode(getAccountName(accounts, inputs[0]))}向{getDescNode(getAccountName(accounts, inputs[1]))}转账{getDescNode(inputs[2])}
      </Typography.Text>
    }
  },
]

export default config
