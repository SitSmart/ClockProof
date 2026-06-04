import { useState } from "react";
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useReadContract } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { arcTestnet } from "./wagmi";

const ADDR = (import.meta.env.VITE_CONTRACT_ADDRESS as `0x${string}`) || "0x0000000000000000000000000000000000000000";
const ABI = [
  { name: "stamp", type: "function", stateMutability: "nonpayable", inputs: [{ name: "content", type: "string" }, { name: "description", type: "string" }], outputs: [{ type: "bytes32" }] },
  { name: "verifyContent", type: "function", stateMutability: "view", inputs: [{ name: "content", type: "string" }], outputs: [{ name: "exists", type: "bool" }, { name: "owner", type: "address" }, { name: "description", type: "string" }, { name: "timestamp", type: "uint256" }, { name: "blockNumber", type: "uint256" }] },
  { name: "total", type: "function", stateMutability: "view", inputs: [], outputs: [{ type: "uint256" }] },
] as const;

const AC = "#94a3b8";

export default function App() {
  const { isConnected } = useAccount();
  const [content, setContent] = useState("");
  const [description, setDescription] = useState("");
  const [verifyContent, setVerifyContent] = useState("");
  const [done, setDone] = useState(false);
  const [stampedHash, setStampedHash] = useState("");

  const { data: total } = useReadContract({ address: ADDR, abi: ABI, functionName: "total" });
  const { data: verifyResult } = useReadContract({ address: ADDR, abi: ABI, functionName: "verifyContent", args: [verifyContent], query: { enabled: verifyContent.length > 0 } });

  const { data: hash, isPending, writeContract, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });
  if (isSuccess && !done) { setDone(true); setStampedHash(hash || ""); setTimeout(() => { setDone(false); setContent(""); setDescription(""); }, 5000); }
  const isLoading = isPending || isConfirming;

  const vr = verifyResult as any;

  return (
    <div className="min-h-screen bg-[#080b14]">
      <header className="flex items-center justify-between px-6 py-4 border-b border-white/10 sticky top-0 z-50 bg-[#080b14]/80 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🕐</span>
          <span className="font-bold text-white text-lg">Clock<span style={{ color: AC }}>Proof</span></span>
          <span className="hidden sm:block text-xs text-slate-500 bg-slate-800/60 px-2 py-0.5 rounded-full border border-slate-700">Robinhood Testnet</span>
        </div>
        <ConnectButton showBalance={false} chainStatus="icon" accountStatus="avatar" />
      </header>
      <main className="relative z-10 max-w-xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">🕐</div>
          <h1 className="text-4xl font-black text-white mb-3">Timestamp <span style={{ color: AC }}>Anything</span></h1>
          <p className="text-slate-400 text-sm">Prove you had an idea first. Stamp any text, hash, or document to the Robinhood Chain permanently.</p>
          <div className="mt-3 inline-flex items-center gap-2 bg-slate-800/60 px-4 py-2 rounded-full border border-slate-700 text-slate-400 text-sm">{total?.toString() ?? "0"} proofs on-chain</div>
        </div>

        {!isConnected ? <div className="text-center py-8 text-slate-500">Connect wallet to stamp content</div> : (
          <div className="bg-slate-900/60 border border-white/10 rounded-2xl p-5 mb-5">
            <h2 className="font-bold text-white mb-2">🔏 Stamp Content</h2>
            <p className="text-slate-500 text-xs mb-4">The exact text/content you enter will be hashed (keccak256) and timestamped on Arc.</p>
            <textarea value={content} onChange={e => setContent(e.target.value)} placeholder="Enter your idea, invention, text, or any content to timestamp..." rows={4}
              className="w-full bg-slate-800/60 border border-slate-700 rounded-xl px-4 py-3 text-white text-sm outline-none resize-none mb-2" />
            <input value={description} onChange={e => setDescription(e.target.value)} placeholder="Short description (optional, public)" className="w-full bg-slate-800/60 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm outline-none mb-3" />
            {done ? (
              <div className="py-3 text-center rounded-xl font-bold text-sm bg-slate-700/40 text-slate-300">
                ✅ Stamped! TX: <a href={`https://explorer.testnet.chain.robinhood.com/tx/${stampedHash}`} target="_blank" rel="noreferrer" className="underline">{stampedHash.slice(0,10)}...</a>
              </div>
            ) : (
              <button onClick={() => writeContract({ address: ADDR, abi: ABI, functionName: "stamp", args: [content, description] })} disabled={isLoading || !content}
                className="w-full py-3 rounded-xl font-bold text-sm disabled:opacity-50 transition-all" style={{ background: AC, color: "#080b14" }}>
                {isLoading ? (isPending ? "Confirm..." : "Stamping...") : "🕐 Stamp It"}
              </button>
            )}
            {error && <p className="mt-2 text-red-400 text-xs text-center">{error.message?.includes("User rejected") ? "Cancelled" : error.message?.slice(0, 80)}</p>}
          </div>
        )}

        <div className="bg-slate-900/60 border border-white/10 rounded-2xl p-5">
          <h2 className="font-bold text-white mb-2">🔍 Verify Content</h2>
          <p className="text-slate-500 text-xs mb-3">Paste the exact original content to verify who stamped it and when.</p>
          <textarea value={verifyContent} onChange={e => setVerifyContent(e.target.value)} placeholder="Paste original content to verify..." rows={3}
            className="w-full bg-slate-800/60 border border-slate-700 rounded-xl px-4 py-3 text-white text-sm outline-none resize-none mb-3" />
          {vr && verifyContent.length > 0 && (
            vr[0] ? (
              <div className="rounded-xl p-4 border" style={{ background: "#22c55e10", borderColor: "#22c55e40" }}>
                <p className="text-green-400 font-bold mb-2">✅ Verified on-chain</p>
                <div className="space-y-1 text-sm">
                  <p className="text-slate-300"><span className="text-slate-500">Owner:</span> <span className="font-mono">{vr[1]?.slice(0,6)}...{vr[1]?.slice(-4)}</span></p>
                  {vr[2] && <p className="text-slate-300"><span className="text-slate-500">Description:</span> {vr[2]}</p>}
                  <p className="text-slate-300"><span className="text-slate-500">Stamped:</span> {new Date(Number(vr[3]) * 1000).toLocaleString()}</p>
                  <p className="text-slate-300"><span className="text-slate-500">Block:</span> #{vr[4]?.toString()}</p>
                </div>
              </div>
            ) : (
              <div className="rounded-xl p-4 bg-red-500/10 border border-red-500/30">
                <p className="text-red-400">❌ Not found on-chain — content hasn't been stamped</p>
              </div>
            )
          )}
        </div>

        <footer className="mt-10 text-center text-xs text-slate-600"><p>ClockProof · <a href={`https://explorer.testnet.chain.robinhood.com/address/${ADDR}`} target="_blank" rel="noreferrer" className="hover:text-slate-400">{ADDR.slice(0,6)}...{ADDR.slice(-4)}</a> · Chain {arcTestnet.id}</p></footer>
      </main>
    </div>
  );
}
