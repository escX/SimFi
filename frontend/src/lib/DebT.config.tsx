import { ArgStyle, ArgType, ContractFunctionConfig, StateMutability } from "@/lib/const"
import { getAccountName, getDescNode } from "@/lib/utils"
import { Typography } from "antd"

const config: ContractFunctionConfig[] = [
  {
    name: 'debtProduced',
    inputs: [],
    stateMutability: StateMutability.View,
    getDescription: (inputs, outputs, accounts) => {
      return <Typography.Text>
        查询货币总供应量为{getDescNode(outputs[0])}
      </Typography.Text>
    }
  },
  {
    name: 'debtConsumed',
    inputs: [],
    stateMutability: StateMutability.View,
    getDescription(inputs, outputs, accounts) {
      return <Typography.Text>

      </Typography.Text>
    },
  },
  {
    name: 'debtorHash',
    inputs: [],
    stateMutability: StateMutability.View,
    getDescription(inputs, outputs, accounts) {
      return <Typography.Text>

      </Typography.Text>
    },
  },
  {
    name: 'creditorHash',
    inputs: [],
    stateMutability: StateMutability.View,
    getDescription(inputs, outputs, accounts) {
      return <Typography.Text>

      </Typography.Text>
    },
  },
  {
    name: 'debtorAllowance',
    inputs: [],
    stateMutability: StateMutability.View,
    getDescription(inputs, outputs, accounts) {
      return <Typography.Text>

      </Typography.Text>
    },
  },
  {
    name: 'creditorAllowance',
    inputs: [],
    stateMutability: StateMutability.View,
    getDescription(inputs, outputs, accounts) {
      return <Typography.Text>

      </Typography.Text>
    },
  },
  {
    name: 'allowedExchanges',
    inputs: [],
    stateMutability: StateMutability.View,
    getDescription(inputs, outputs, accounts) {
      return <Typography.Text>

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
        创建债务，债务份额为{getDescNode(inputs[0])}，分期期数为{getDescNode(inputs[1])}，每期每份债务偿付{getDescNode(inputs[2])}，每期每份债务违约金{getDescNode(inputs[3])}
      </Typography.Text>
    },
  },
  {
    name: 'revokeDebt',
    inputs: [],
    stateMutability: StateMutability.Nonpayable,
    getDescription(inputs, outputs, accounts) {
      return <Typography.Text>

      </Typography.Text>
    },
  },
  {
    name: 'debtorApprove',
    inputs: [],
    stateMutability: StateMutability.Nonpayable,
    getDescription(inputs, outputs, accounts) {
      return <Typography.Text>

      </Typography.Text>
    },
  },
  {
    name: 'creditorApprove',
    inputs: [],
    stateMutability: StateMutability.Nonpayable,
    getDescription(inputs, outputs, accounts) {
      return <Typography.Text>

      </Typography.Text>
    },
  },
  {
    name: 'confirmCreditor',
    inputs: [],
    stateMutability: StateMutability.Nonpayable,
    getDescription(inputs, outputs, accounts) {
      return <Typography.Text>

      </Typography.Text>
    },
  },
  {
    name: 'transferCreditor',
    inputs: [],
    stateMutability: StateMutability.Nonpayable,
    getDescription(inputs, outputs, accounts) {
      return <Typography.Text>

      </Typography.Text>
    },
  },
  {
    name: 'authorizeExchange',
    inputs: [],
    stateMutability: StateMutability.Nonpayable,
    getDescription(inputs, outputs, accounts) {
      return <Typography.Text>

      </Typography.Text>
    },
  },
  {
    name: 'unauthorizeExchange',
    inputs: [],
    stateMutability: StateMutability.Nonpayable,
    getDescription(inputs, outputs, accounts) {
      return <Typography.Text>

      </Typography.Text>
    },
  }
]

export default config
