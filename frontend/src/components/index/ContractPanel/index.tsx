import { Divider } from "antd"
import FuncExecution from "@/components/common/FuncExecution"
import { InputValueData } from "@/components/common/FuncExecution/const"
import { ContractFunctionConfig, ExecResult, HistoryRecordProvided } from "@/lib/const"
import { AccountData } from "../InfoPanel/const"

interface Props {
  accounts: AccountData[]
  config: ContractFunctionConfig[]
  onExecFunction: (funcName: string, args: InputValueData[], events: string[]) => Promise<ExecResult>
  onHistoryRecord: (data: HistoryRecordProvided) => void
}

export default function Index({ accounts, config, onExecFunction, onHistoryRecord }: Props) {
  return <>
    {config.map(item => (
      <div key={item.name}>
        <FuncExecution
          {...item}
          accounts={accounts}
          onExecFunction={onExecFunction}
          onHistoryRecord={onHistoryRecord}
        />
        <Divider />
      </div>
    ))}
  </>
}
