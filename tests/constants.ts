import { PublicKey } from "@solana/web3.js";

export const [
  mintAddress,
  collectionAddress,
  masterEditionAddress,
  metadataAddress,
  mintAtaAddress,
] = [
  "7y1aPbyek7qALhGuAGMwwe1FLF7swykuadJZqHg5uP3Y",
  "5sDBuHZ7zDzZ2Px1YQS3ELxoFja5J66vpKKcW84ndRk7",
  "Cg5XY9vT8jpdg9tKreAedqiUuoMgVxh1mZY1khidR3mM",
  "8QRPrn6YAGnHXzyyWescAr9CymDghiauRqsL7tCuGbA2",
  "2D15m1PtBVSRoaSbnEBVoMQSvTks2QHk88e8RFVXCUVk",
].map((address) => new PublicKey(address));
