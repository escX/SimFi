import { ArgStyle, ArgType, ContractFunctionConfig, StateMutability } from "@/lib/const"
import { getAccountName, getDescNode } from "@/lib/utils"
import { Typography } from "antd"

const config: ContractFunctionConfig[] = [
  {
    name: 'product',
    inputs: [
      { type: ArgType.Bytes32, style: ArgStyle.StringInput },
    ],
    stateMutability: StateMutability.View,
    getDescription(inputs, outputs, accounts) {
      return <Typography.Text>
        查询产品{getDescNode(inputs[0])}，债务哈希：{getDescNode(outputs[0])}，卖家：{getDescNode(getAccountName(accounts, outputs[1]))}，类型：{getDescNode(outputs[3])}，状态：{getDescNode(outputs[4])}，出售份额：{getDescNode(outputs[5])}，每份价格：{getDescNode(outputs[6])}，上架时间：{getDescNode(outputs[7])}
      </Typography.Text>
    },
  },
  {
    name: 'publishUnconfirmed',
    inputs: [
      { type: ArgType.Bytes32, style: ArgStyle.StringInput },
      { type: ArgType.Uint256, style: ArgStyle.BigintInput },
      { type: ArgType.Uint256, style: ArgStyle.BigintInput },
    ],
    stateMutability: StateMutability.Nonpayable,
    getDescription(inputs, outputs, accounts) {
      return <Typography.Text>
        发布未确权债务{getDescNode(inputs[0])}，份额{getDescNode(inputs[1])}，每份价格：{getDescNode(inputs[2])}
      </Typography.Text>
    },
  },
  {
    name: 'publishConfirmed',
    inputs: [
      { type: ArgType.Bytes32, style: ArgStyle.StringInput },
      { type: ArgType.Uint256, style: ArgStyle.BigintInput },
      { type: ArgType.Uint256, style: ArgStyle.BigintInput },
    ],
    stateMutability: StateMutability.Nonpayable,
    getDescription(inputs, outputs, accounts) {
      return <Typography.Text>
        发布已确权债务{getDescNode(inputs[0])}，份额{getDescNode(inputs[1])}，每份价格：{getDescNode(inputs[2])}
      </Typography.Text>
    },
  },
  {
    name: 'revokeProduct',
    inputs: [
      { type: ArgType.Bytes32, style: ArgStyle.StringInput },
    ],
    stateMutability: StateMutability.Nonpayable,
    getDescription(inputs, outputs, accounts) {
      return <Typography.Text>
        撤销已发布的产品{getDescNode(inputs[0])}
      </Typography.Text>
    },
  },
  {
    name: 'updateProductUnitPrice',
    inputs: [
      { type: ArgType.Bytes32, style: ArgStyle.StringInput },
      { type: ArgType.Uint256, style: ArgStyle.BigintInput },
    ],
    stateMutability: StateMutability.Nonpayable,
    getDescription(inputs, outputs, accounts) {
      return <Typography.Text>
        修改产品{getDescNode(inputs[0])}每份价格为{getDescNode(inputs[1])}
      </Typography.Text>
    },
  },
  {
    name: 'buy',
    inputs: [
      { type: ArgType.Bytes32, style: ArgStyle.StringInput },
    ],
    stateMutability: StateMutability.Nonpayable,
    getDescription(inputs, outputs, accounts) {
      return <Typography.Text>
        购买产品{getDescNode(inputs[0])}
      </Typography.Text>
    },
  }
]

export default config
