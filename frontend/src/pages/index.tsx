import { useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { HARDHAT_NODE_URL } from "@/lib/utils"
import { JsonRpcApiProvider, JsonRpcSigner, ethers } from "ethers"
import { z } from "zod"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"

const FormSchema = z.object({
  url: z.string().url({ message: "无效地址" }),
})

export default function Index() {
  // const [provider, setProvider] = useState<JsonRpcApiProvider | null>(null)
  const [accounts, setAccounts] = useState<JsonRpcSigner[]>([])
  const [balanceOf, setBalanceOf] = useState<Record<string, bigint>>({})

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      url: HARDHAT_NODE_URL,
    },
  })

  const onSubmit = (data: z.infer<typeof FormSchema>) => {
    connect(data.url)
  }

  const connect = async (url: string) => {
    const provider = new ethers.JsonRpcProvider(url)
    const accounts = await provider.listAccounts()
    const balanceMap = await getBalanceMapAsync(provider, accounts.map((account) => account.address))

    setAccounts(accounts)
    setBalanceOf(balanceMap)
  }

  const getBalanceMapAsync = async (provider: JsonRpcApiProvider, addresses: string[]) => {
    const balanceOf: Record<string, bigint> = {}
    if (provider !== null) {
      for (let i = 0; i < addresses.length; i++) {
        const address = addresses[i]
        const balance = await provider.getBalance(address)
        balanceOf[address] = balance
      }
    }

    return balanceOf
  }

  const changeBalance = async (address: string, value: bigint) => {
    setBalanceOf(balanceOf => ({
      ...balanceOf,
      [address]: value,
    }))
  }

  return (
    <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="w-2/3 space-y-6">
          <FormField
            control={form.control}
            name="url"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Hardhat本地节点地址</FormLabel>
                <FormControl>
                  <Input placeholder={HARDHAT_NODE_URL} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit">连接</Button>
        </form>
      </Form>

      {accounts.map((account) => (
        <div key={account.address}>
          <p>{account.address}</p>
          <p>{balanceOf[account.address].toString() ?? ''}</p>
        </div>
      ))}
    </>
  )
}
