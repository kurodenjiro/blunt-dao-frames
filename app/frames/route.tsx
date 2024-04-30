import { types } from "frames.js/core";
import { getTokenUrl } from "frames.js";
import { zora } from "viem/chains";
import { Button } from "frames.js/next";
import { frames } from "./frames";
import { NeynarAPIClient } from "@neynar/nodejs-sdk";

const client = new NeynarAPIClient(process.env.NEYNAR_API_KEY || "");

const getAddr = async (nftAddr: string): Promise<string[]> => {
  const apiKey = process.env.ALCHEMY_API_KEY;
  const baseUrl = `https://eth-sepolia.g.alchemy.com/nft/v3/${apiKey}/getOwnersForContract?`;
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
  src: string;
  tokenUrl: string;
}[] = [
    {
      src: "https://remote-image.decentralized-content.com/image?url=https%3A%2F%2Fmagic.decentralized-content.com%2Fipfs%2Fbafybeibltcfgy4crxrij4yy63sefu2a6ega7jvf6sprbwh5wkxzzrarjb4&w=1920&q=75",
      tokenUrl: getTokenUrl({
        address: "0x6f64c4bc37afeec49815814139e27df1186ca43e",
        chain: zora,
        tokenId: "1",
      }),
    },
    {
      src: "https://remote-image.decentralized-content.com/image?url=https%3A%2F%2Fmagic.decentralized-content.com%2Fipfs%2Fbafybeiaqdkw6fzyi3yuec3sdkk6a5tsfyqsznytqwyssdrvqfzq5bpx4iu&w=1920&q=75",
      tokenUrl: getTokenUrl({
        address: "0x6f64c4bc37afeec49815814139e27df1186ca43e",
        chain: zora,
        tokenId: "2",
      }),
    },
    {
      src: "https://remote-image.decentralized-content.com/image?url=https%3A%2F%2Fmagic.decentralized-content.com%2Fipfs%2Fbafybeiblargpzhwxgmbzzci6n6oubfhcw33cdqb4uqx62sxrvf5biwcszi&w=1920&q=75",
      tokenUrl: getTokenUrl({
        address: "0x6f64c4bc37afeec49815814139e27df1186ca43e",
        chain: zora,
        tokenId: "3",
      }),
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
  console.log("ctx.message", ctx.message);
  const { requesterFid } = ctx.message;

  const nftAddr: string = "0xBAE9dD42C2B69Cfa4D457384297Fcf6bec72C0c4";
  const addrs: any = await getAddr(nftAddr);
  const userData = await client.lookupUserByFid(requesterFid);
  const fids: any = await fidLookup(addrs);
  let isValidator = false;
  isValidator = addrs.includes(userData.result.user.custodyAddress);
  console.log("addrs", addrs);
  console.log("fids", fids);

  if (addrs.length > 0 && isValidator == false) {
    const page = Number(ctx.searchParams?.pageIndex) < 0 ? 0 : Number(ctx.searchParams?.pageIndex ?? 0);

    return {
      image: nfts[page]!.src,
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
