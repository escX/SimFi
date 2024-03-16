import { ContractData } from "@/lib/const"
import { Card, List, Popconfirm, Tooltip, Typography } from "antd"

interface Props {
  className: string
  contracts: ContractData[]
  currContractAddress: string | undefined
  accountNameMap: Record<string, string>
  onChangeCurrContract: (address: string) => void
  onDelete: (address: string) => void
}

export default function Index({ className, contracts, currContractAddress, accountNameMap, onChangeCurrContract, onDelete }: Props) {
  return (
    <Card title="已部署合约" className={className}>
      <List
        dataSource={contracts}
        itemLayout="vertical"
        renderItem={(item) => (
          <List.Item actions={[
            <Popconfirm
              key="delete"
              title="删除合约"
              description="确定要删除该合约？"
              onConfirm={() => onDelete(item.address)}
              okText="确定"
              cancelText="取消"
            >
              <Typography.Link>删除</Typography.Link>
            </Popconfirm>,
            item.address === currContractAddress ?
              <Typography.Text key="check" type="secondary">当前合约</Typography.Text> :
              <Typography.Link key="check" onClick={() => onChangeCurrContract(item.address)}>切换合约</Typography.Link>,
          ]}>
            <List.Item.Meta
              title={item.name}
              description={
                <>
                  <div style={{ whiteSpace: 'nowrap' }}>
                    部署地址：
                    <Typography.Text type="secondary" copyable>
                      {item.address}
                    </Typography.Text>
                  </div>
                  <div>
                    部署时间：
                    <Typography.Text type="secondary">
                      {new Date(item.deployTimestamp).toLocaleString()}
                    </Typography.Text>
                  </div>
                  <div>
                    部署账户：
                    <Tooltip color="#fff" overlayStyle={{ width: 'max-content', maxWidth: 'unset' }} title={
                      <Typography.Text type="secondary" copyable>
                        {item.deployAccountAddress}
                      </Typography.Text>
                    }>
                      <Typography.Text type="secondary" underline>
                        {accountNameMap[item.deployAccountAddress]}
                      </Typography.Text>
                    </Tooltip>
                  </div>
                </>
              }
            />
          </List.Item>
        )}
      />
    </Card>
  )
}
