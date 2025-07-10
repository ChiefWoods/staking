import { PublicKey } from "@solana/web3.js";

export const [
  mintAddress,
  collectionAddress,
  masterEditionAddress,
  metadataAddress,
  mintAtaAddress,
] = [
  "GCiw9577tHWKRjqF2yFaGjzBKFgc21obHrphmXcVBs4j",
  "8AXt4g6ck7itAy1AzxDsYGx9osfmqFxqyCJ7xjtvsQYi",
  "HntLsvyDzWdEdFqCoNW1j7FdX5P3x2dwo4ffnACQyNiS",
  "4Qcdvbawu2o312DvCkE5NNRzE2coeQbEVYDm4VnGKaPG",
  "4b2iEFTVyMRFWJ3c2JTwEK3q6bmoPWwXxnHG1zXkw6qZ",
].map((address) => new PublicKey(address));
