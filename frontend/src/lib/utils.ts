import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export const HARDHAT_CHAINID = 31337
export const HARDHAT_NODE_URL = "http://localhost:8545"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
