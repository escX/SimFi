import { ArgStyle, ArgType, ContractFunctionConfig, StateMutability } from "@/lib/const"
import { getAccountName, getDescNode } from "@/lib/utils"
import { Typography } from "antd"

const config: ContractFunctionConfig[] = [
  {
    name: 'debtProduced',
    inputs: [
      { type: ArgType.Bytes32, style: ArgStyle.StringInput },
    ],
    stateMutability: StateMutability.View,
    getDescription: (inputs, outputs, accounts) => {
      return <Typography.Text>
        查询{getDescNode(inputs[0])}债务信息，债务人：{getDescNode(getAccountName(accounts, outputs[0]))}，债务份额：{getDescNode(outputs[1])}，未确权份额：{getDescNode(outputs[2])}，分期期数：{getDescNode(outputs[3])}，每期每份债务应偿还代币数量：{getDescNode(outputs[4])}，每期每份债务的违约金：{getDescNode(outputs[5])}
      </Typography.Text>
    }
  },
  {
    name: 'debtConsumed',
    inputs: [
      { type: ArgType.Bytes32, style: ArgStyle.StringInput },
    ],
    stateMutability: StateMutability.View,
    getDescription(inputs, outputs, accounts) {
      return <Typography.Text>
        查询债权{getDescNode(inputs[0])}信息，债权人：{getDescNode(getAccountName(accounts, outputs[0]))}，持有份额：{getDescNode(outputs[1])}，债务哈希：{getDescNode(outputs[2])}，确认债权时间：{getDescNode(outputs[3])}，当前期数：{getDescNode(outputs[4])}，违约次数：{getDescNode(outputs[5])}，上期未还清的代币数量：{getDescNode(outputs[6])}
      </Typography.Text>
    },
  },
  {
    name: 'debtorHash',
    inputs: [
      { type: ArgType.Address, style: ArgStyle.AccountSelect }
    ],
    stateMutability: StateMutability.View,
    getDescription(inputs, outputs, accounts) {
      return <Typography.Text>
        查询{getDescNode(getAccountName(accounts, inputs[0]))}创建的债务哈希：{outputs.map((output, index) => <span key={index}>{getDescNode(output)}</span>)}
      </Typography.Text>
    },
  },
  {
    name: 'creditorHash',
    inputs: [
      { type: ArgType.Address, style: ArgStyle.AccountSelect }
    ],
    stateMutability: StateMutability.View,
    getDescription(inputs, outputs, accounts) {
      return <Typography.Text>
        查询{getDescNode(getAccountName(accounts, inputs[0]))}持有的债务哈希有：{outputs.map((output, index) => <span key={index}>{getDescNode(output)}</span>)}
      </Typography.Text>
    },
  },
  {
    name: 'debtorAllowance',
    inputs: [
      { type: ArgType.Address, style: ArgStyle.AccountSelect },
      { type: ArgType.Address, style: ArgStyle.AccountSelect },
      { type: ArgType.Bytes32, style: ArgStyle.StringInput },
    ],
    stateMutability: StateMutability.View,
    getDescription(inputs, outputs, accounts) {
      return <Typography.Text>
        {getDescNode(getAccountName(accounts, inputs[0]))}授权交易所{getDescNode(getAccountName(accounts, inputs[1]))}，对于债务{getDescNode(inputs[2])}的债权确认额度为{getDescNode(outputs[0])}
      </Typography.Text>
    },
  },
  {
    name: 'creditorAllowance',
    inputs: [
      { type: ArgType.Address, style: ArgStyle.AccountSelect },
      { type: ArgType.Address, style: ArgStyle.AccountSelect },
      { type: ArgType.Bytes32, style: ArgStyle.StringInput },
    ],
    stateMutability: StateMutability.View,
    getDescription(inputs, outputs, accounts) {
      return <Typography.Text>
        {getDescNode(getAccountName(accounts, inputs[0]))}授权交易所{getDescNode(getAccountName(accounts, inputs[1]))}，对于债务{getDescNode(inputs[2])}的债权转移额度为{getDescNode(outputs[0])}
      </Typography.Text>
    },
  },
  {
    name: 'allowedExchanges',
    inputs: [
      { type: ArgType.Address, style: ArgStyle.AccountSelect }
    ],
    stateMutability: StateMutability.View,
    getDescription(inputs, outputs, accounts) {
      return <Typography.Text>
        查询{getDescNode(getAccountName(accounts, inputs[0]))}{getDescNode(outputs[0] === 'true' ? '是' : '不是')}已认证交易所
      </Typography.Text>
    },
  },
  {
    name: 'createDebt',
    inputs: [
      { type: ArgType.Uint256, style: ArgStyle.BigintInput },
      { type: ArgType.Uint256, style: ArgStyle.BigintInput },
      { type: ArgType.Uint256, style: ArgStyle.BigintInput },
      { type: ArgType.Uint256, style: ArgStyle.BigintInput },
    ],
    stateMutability: StateMutability.Nonpayable,
    getDescription(inputs, outputs, accounts) {
      return <Typography.Text>
        创建债务，份额为{getDescNode(inputs[0])}，分期期数为{getDescNode(inputs[1])}，每期每份债务应偿还代币数量为{getDescNode(inputs[2])}，每期每份债务的违约金为{getDescNode(inputs[3])}
      </Typography.Text>
    },
  },
  {
    name: 'revokeDebt',
    inputs: [
      { type: ArgType.Bytes32, style: ArgStyle.StringInput },
      { type: ArgType.Uint256, style: ArgStyle.BigintInput },
    ],
    stateMutability: StateMutability.Nonpayable,
    getDescription(inputs, outputs, accounts) {
      return <Typography.Text>
        撤销债务{getDescNode(inputs[0])}，{getDescNode(inputs[1])}份额的未确权债务
      </Typography.Text>
    },
  },
  {
    name: 'debtorApprove',
    inputs: [
      { type: ArgType.Address, style: ArgStyle.AccountSelect },
      { type: ArgType.Bytes32, style: ArgStyle.StringInput },
      { type: ArgType.Uint256, style: ArgStyle.BigintInput },
    ],
    stateMutability: StateMutability.Nonpayable,
    getDescription(inputs, outputs, accounts) {
      return <Typography.Text>
        授权{getDescNode(getAccountName(accounts, inputs[0]))}，对于{getDescNode(inputs[1])}债务的债权确认额度为{getDescNode(inputs[2])}
      </Typography.Text>
    },
  },
  {
    name: 'creditorApprove',
    inputs: [
      { type: ArgType.Address, style: ArgStyle.AccountSelect },
      { type: ArgType.Bytes32, style: ArgStyle.StringInput },
      { type: ArgType.Uint256, style: ArgStyle.BigintInput },
    ],
    stateMutability: StateMutability.Nonpayable,
    getDescription(inputs, outputs, accounts) {
      return <Typography.Text>
        授权{getDescNode(getAccountName(accounts, inputs[0]))}，对于{getDescNode(inputs[1])}债务的债权转移额度为{getDescNode(inputs[2])}
      </Typography.Text>
    },
  },
  {
    name: 'confirmCreditor',
    inputs: [
      { type: ArgType.Address, style: ArgStyle.AccountSelect },
      { type: ArgType.Bytes32, style: ArgStyle.StringInput },
      { type: ArgType.Uint256, style: ArgStyle.BigintInput },
    ],
    stateMutability: StateMutability.Nonpayable,
    getDescription(inputs, outputs, accounts) {
      return <Typography.Text>
        {getDescNode(getAccountName(accounts, inputs[0]))}对债务{getDescNode(inputs[1])}确认债权，份额为{getDescNode(inputs[2])}
      </Typography.Text>
    },
  },
  {
    name: 'transferCreditor',
    inputs: [
      { type: ArgType.Address, style: ArgStyle.AccountSelect },
      { type: ArgType.Bytes32, style: ArgStyle.StringInput },
      { type: ArgType.Uint256, style: ArgStyle.BigintInput },
    ],
    stateMutability: StateMutability.Nonpayable,
    getDescription(inputs, outputs, accounts) {
      return <Typography.Text>
        {getDescNode(getAccountName(accounts, inputs[0]))}对债务{getDescNode(inputs[1])}获得债权，份额为{getDescNode(inputs[2])}
      </Typography.Text>
    },
  },
  {
    name: 'authorizeExchange',
    inputs: [
      { type: ArgType.Address, style: ArgStyle.AccountSelect }
    ],
    stateMutability: StateMutability.Nonpayable,
    getDescription(inputs, outputs, accounts) {
      return <Typography.Text>
        交易所{getDescNode(getAccountName(accounts, inputs[0]))}获得认证
      </Typography.Text>
    },
  },
  {
    name: 'unauthorizeExchange',
    inputs: [
      { type: ArgType.Address, style: ArgStyle.AccountSelect }
    ],
    stateMutability: StateMutability.Nonpayable,
    getDescription(inputs, outputs, accounts) {
      return <Typography.Text>
        交易所{getDescNode(getAccountName(accounts, inputs[0]))}失去认证
      </Typography.Text>
    },
  }
]

export default config
