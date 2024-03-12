import { ConfigProvider } from "antd"
import zhCN from 'antd/locale/zh_CN'
import type { AppProps } from "next/app"
import dynamic from "next/dynamic"
import Head from "next/head"

export default function App({ Component, pageProps }: AppProps) {
  const Layout = dynamic(() => import('@/components/Layout'), {
    ssr: false
  })

  return <>
    <Head>
      <title>SimFi</title>
      <meta name="description" content="Web for SimFi" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
    </Head>

    <ConfigProvider locale={zhCN}>
      <Layout>
        <Component {...pageProps} />
      </Layout>
    </ConfigProvider>
  </>
}
