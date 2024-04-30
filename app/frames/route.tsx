import { types } from "frames.js/core";
import { getTokenUrl } from "frames.js";
import { zora } from "viem/chains";
import { Button } from "frames.js/next";
import { frames } from "./frames";
import { NeynarAPIClient } from "@neynar/nodejs-sdk";
import { ZDK, ZDKNetwork, ZDKChain } from "@zoralabs/zdk";

const client = new NeynarAPIClient(process.env.NEYNAR_API_KEY || "");
const API_ENDPOINT = "https://api.zora.co/graphql";
const networkInfo = {
  network: ZDKNetwork.Zora,
  chain: ZDKChain.ZoraMainnet,
};
const zdk = new ZDK({ endpoint: API_ENDPOINT, networks: [networkInfo] }); // Defaults to Ethereum Mainnet

const getAddrByALCHEMY = async (nftAddr: string): Promise<string[]> => {
  const apiKey = process.env.ALCHEMY_API_KEY;
  const baseUrl = `${process.env.ALCHEMY_URL}/nft/v2/${apiKey}/getNFTsForCollection?`;
  const url = `${baseUrl}contractAddress=${nftAddr}&withTokenBalances=false`;
  const result = await fetch(url, {
    headers: { accept: "application/json" },
  });
  const data = await result.json();
  return data.owners;
};

const fidLookup = async (addrs: string[]) => {
  const fids = await Promise.all(
    addrs.map(async (addr) => {
      try {
        const response = await client.lookupUserByVerification(addr);
        return response ? response.result.user.fid : undefined;
      } catch (error) {
        return undefined;
      }
    })
  );
  return fids.filter((fid) => fid !== undefined);
};

const nfts: {
  src: any;
  tokenUrl: string;
}[] = [
    {
      src: <div tw="w-full h-full bg-slate-700 text-white justify-center items-center flex"> Blunt </div>,
      tokenUrl: `https://zora.co/collect/zora:0x6f64c4bc37afeec49815814139e27df1186ca43e/premint-1`
    },
    {
      src: <div tw="w-full h-full bg-slate-700 text-white justify-center items-center flex"> Joint </div>,
      tokenUrl: `https://zora.co/collect/zora:0x6f64c4bc37afeec49815814139e27df1186ca43e/premint-2`
    },
    {
      src:<div tw="w-full h-full bg-slate-700 text-white justify-center items-center flex"> Spliff </div>,
      tokenUrl: `https://zora.co/collect/zora:0x6f64c4bc37afeec49815814139e27df1186ca43e/premint-3`
    },
  ];
const handleRequest = frames(async (ctx) => {

  const initialFrame = {
    image: (
      <div tw="w-full h-full bg-slate-700 text-white justify-center items-center">
        Join BluntDao Community on Farcaster
      </div>
    ),
    buttons: [
      <Button action="post" key="1">
        Check Validator 👌
      </Button>
    ],
  } satisfies types.FrameDefinition<any>;



  if (!ctx.message) {
    return initialFrame;
  }

  const { requesterFid } = ctx.message;

  const nftAddr: string = "0x6f64c4bc37afeec49815814139e27df1186ca43e";
  const args = {
    where: {
      tokens: [
        {
          address: nftAddr,
          tokenId: '1',
        },
        {
          address: nftAddr,
          tokenId: '2',
        },
        {
          address: nftAddr,
          tokenId: '3',
        },

      ],
      
    },
    includeFullDetails: true, // Optional, provides more data on the NFT such as all historical events
  }

  const { mints } = await zdk.mints(args)
  //const addrs: any = await getAddr(nftAddr);
  const addrs = mints.nodes.map((mint: any) => mint.mint.originatorAddress);
  const userData = await client.lookupUserByFid(requesterFid);
  //const fids: any = await fidLookup(addrs);
  let isValidator = false;
  isValidator = addrs.includes(userData.result.user.custodyAddress);
  console.log("addrs", addrs);
  console.log("userData", userData);
  if (addrs.length > 0 && isValidator == false) {
    const page = Number(ctx.searchParams?.pageIndex ?? 0);
    return {
      image: <div tw="w-full h-full bg-slate-700 text-white justify-center items-center flex"> Blunt </div>,
      imageOptions: {
        aspectRatio: "1:1",
      },
      buttons: [
        <Button
          action="post"
          target={{
            query: {
              pageIndex: String((page - 1) % nfts.length),
            },
          }}
        >
          ←
        </Button>,
        <Button
          action="post"
          target={{
            query: {
              pageIndex: String((page + 1) % nfts.length),
            },
          }}
        >
          →
        </Button>,
        <Button action="mint" target={nfts[page]!.tokenUrl}>
          {`Mint ${page == 0 ? "Blunt" : page == 1 ? "Joint" : page == 2 ? "Spliff" : ""}`}
        </Button>,
      ],
    } satisfies types.FrameDefinition<any>;
  }
  if (addrs.length == 0) {
    return {
      image: (
        <div tw="w-full h-full bg-slate-700 text-white justify-center items-center flex">
          You haven't followed anyone to become a validator.
        </div>
      ),
    } satisfies types.FrameDefinition<any>;
  }
  if (addrs.length > 0 && isValidator) {
    return {
      image: (
        <div tw="w-full h-full bg-slate-700 text-white justify-center items-center flex">
          You are Validator
        </div>
      ),

      buttons: [
        <Button action="link" target={`https://warpcast.com/~/compose?text=Mint blunt NFT now.&embeds[]=${process.env.NEXT_PUBLIC_HOST}`}>Cast Now</Button>
      ],
    } satisfies types.FrameDefinition<any>;
  }


  return initialFrame;
});

export const GET = handleRequest;
export const POST = handleRequest;
