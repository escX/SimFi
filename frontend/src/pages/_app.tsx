import type { AppProps } from "next/app"
import Head from "next/head"

export default function App({ Component, pageProps }: AppProps) {
  return <>
    <Head>
      <title>SimFi</title>
      <meta name="description" content="Web for SimFi" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
    </Head>

    <Component {...pageProps} />
  </>
}
