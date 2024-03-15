import { ArgStyle, ArgType, ContractFunctionConfig, StateMutability } from "@/lib/const"
import { getAccountNameByAddress, getDescData } from "@/lib/utils"
import { Typography } from "antd"

export const SFTFunctions: ContractFunctionConfig[] = [
  {
    name: 'totalSupply',
    inputs: [],
    stateMutability: StateMutability.View,
    getDescription: (inputs, outputs, accounts) => {
      return <Typography.Text>
        查询货币总供应量为{getDescData(outputs[0])}
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
        查询账户{getDescData(getAccountNameByAddress(accounts, inputs[0]))}的余额为{getDescData(outputs[0])}
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
        查询账户{getDescData(getAccountNameByAddress(accounts, inputs[0]))}授权账户{getDescData(getAccountNameByAddress(accounts, inputs[1]))}的转账额度为{getDescData(outputs[0])}
      </Typography.Text>
    }
  },
  {
    name: 'mint',
    inputs: [
      { type: ArgType.Uint256, style: ArgStyle.BigintInput }
    ],
    stateMutability: StateMutability.Nonpayable,
    getDescription: (inputs, outputs, accounts) => {
      return <Typography.Text>
        铸造货币量为{getDescData(inputs[0])}
      </Typography.Text>
    }
  },
  {
    name: 'burn',
    inputs: [
      { type: ArgType.Uint256, style: ArgStyle.BigintInput }
    ],
    stateMutability: StateMutability.Nonpayable,
    getDescription: (inputs, outputs, accounts) => {
      return <Typography.Text>
        销毁货币量为{getDescData(inputs[0])}
      </Typography.Text>
    }
  },
  {
    name: 'transfer',
    inputs: [
      { type: ArgType.Address, style: ArgStyle.AccountSelect },
      { type: ArgType.Uint256, style: ArgStyle.BigintInput }
    ],
    stateMutability: StateMutability.Nonpayable,
    getDescription: (inputs, outputs, accounts) => {
      return <Typography.Text>
        当前账户向账户{getDescData(getAccountNameByAddress(accounts, inputs[0]))}转账{getDescData(inputs[1])}
      </Typography.Text>
    }
  },
  {
    name: 'approve',
    inputs: [
      { type: ArgType.Address, style: ArgStyle.AccountSelect },
      { type: ArgType.Uint256, style: ArgStyle.BigintInput }
    ],
    stateMutability: StateMutability.Nonpayable,
    getDescription: (inputs, outputs, accounts) => {
      return <Typography.Text>
        当前账户授权账户{getDescData(getAccountNameByAddress(accounts, inputs[0]))}的转账额度为{getDescData(inputs[1])}
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
    stateMutability: StateMutability.Nonpayable,
    getDescription: (inputs, outputs, accounts) => {
      return <Typography.Text>
        当前账户从账户{getDescData(getAccountNameByAddress(accounts, inputs[0]))}向账户{getDescData(getAccountNameByAddress(accounts, inputs[1]))}转账{getDescData(inputs[2])}
      </Typography.Text>
    }
  },
]
