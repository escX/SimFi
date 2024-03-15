import { Card, Divider } from "antd"
import { SFTFunctions } from "./const"
import FuncExecution from "@/components/common/FuncExecution"
import { AccountData } from "../InfoPanel/const"
import { InputValueData } from "@/components/common/FuncExecution/const"
import { ExecResult } from "@/lib/const"

interface Props {
  accounts: AccountData[]
  onExecFunction: (funcName: string, args: InputValueData[]) => Promise<ExecResult>
}

export default function Index({ accounts, onExecFunction }: Props) {
  return <Card>
    {SFTFunctions.map(config => (
      <div key={config.name}>
        <FuncExecution {...config} accounts={accounts} onExecFunction={onExecFunction} />
        <Divider />
      </div>
    ))}
  </Card>
}
