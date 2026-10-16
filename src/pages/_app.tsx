import type { AppProps } from 'next/app';
import Head from 'next/head';
import '@/globals.css';

export default function App({ Component, pageProps }: AppProps) {
  return (
    <>
      <Head>
        <title>Matkim - 직장인 맞춤형 부동산·금융 자산관리 플랫폼</title>
      </Head>
      <Component {...pageProps} />
    </>
  );
}
