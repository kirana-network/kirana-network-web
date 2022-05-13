import type { NextPage } from 'next'
import Head from 'next/head'
import Layout from '../components/layout/layout'

const APP_NAME = process.env.APP_NAME;

const Home: NextPage = () => {
  return (
    <Layout>
      <Head>
        <title>{APP_NAME}</title>
        <meta name="description" content="Generated by create next app" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div className='text-center'>
        <div className="font-medium leading-tight text-5xl">
          Web3 e-commerce made simple.
        </div>
        <div className="font-medium leading-tight text-3xl">
          Get started for free.
        </div>
        <div className="font-medium leading-tight text-3xl">
          <input
            type="text"
            className={`
              form-control px-3 py-1.5 mx-2 text-base font-normal text-gray-700 bg-white bg-clip-padding border border-solid border-gray-300
              rounded transition ease-in-out focus:text-gray-700 focus:bg-white focus:border-blue-600 focus:outline-none
            `}
          />
          Sign me up!
        </div>
      </div>
    </Layout>
  )
}

export default Home
