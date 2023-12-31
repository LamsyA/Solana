
// import functionalities
import React from 'react';
import './App.css';
import {
  PublicKey,
  Transaction,
  sendAndConfirmTransaction,
  SystemProgram,
  Keypair,
  Connection,
  clusterApiUrl,
  LAMPORTS_PER_SOL
} from "@solana/web3.js";
import {useEffect , useState } from "react";
import './App.css'
import * as buffer from "buffer";
window.Buffer = buffer.Buffer;

// create types
type DisplayEncoding = "utf8" | "hex";

type PhantomEvent = "disconnect" | "connect" | "accountChanged";
type PhantomRequestMethod =
  | "connect"
  | "disconnect"
  | "signTransaction"
  | "signAllTransactions"
  | "signMessage";

interface ConnectOpts {
  onlyIfTrusted: boolean;
}

// create a provider interface (hint: think of this as an object) to store the Phantom Provider
interface PhantomProvider {
  publicKey: PublicKey | null;
  isConnected: boolean | null;
  signTransaction: (transaction: Transaction) => Promise<Transaction>;
  signAllTransactions: (transactions: Transaction[]) => Promise<Transaction[]>;
  signMessage: (
    message: Uint8Array | string,
    display?: DisplayEncoding
  ) => Promise<any>;
  connect: (opts?: Partial<ConnectOpts>) => Promise<{ publicKey: PublicKey }>;
  disconnect: () => Promise<void>;
  on: (event: PhantomEvent, handler: (args: any) => void) => void;
  request: (method: PhantomRequestMethod, params: any) => Promise<unknown>;
}

 /**
 * @description gets Phantom provider, if it exists
 */
 const getProvider = (): PhantomProvider | undefined => {
  if ("solana" in window) {
    // @ts-ignore
    const provider = window.solana as any;
    if (provider.isPhantom) return provider as PhantomProvider;
  }
};

export default function App() {
  // create state variable for the provider
  const [provider, setProvider] = useState<PhantomProvider | undefined>(
    undefined
  );

	// create state variable for the wallet key
  const [walletKey, setWalletKey] = useState<PhantomProvider | undefined>(
  undefined
  );

  // this is the function that runs whenever the component updates (e.g. render, refresh)
  useEffect(() => {
	  const provider = getProvider();

		// if the phantom provider exists, set this as the provider
	  if (provider) setProvider(provider);
	  else setProvider(undefined);
  }, []);

  //  state variable that keep track of the balance of wallet
  const [walletBal, setWalletBal] = useState<any | undefined>(
    undefined
  );

  // state variable that store the created wallet
  const [userWallet, setUserWallet] = useState<any | undefined>(undefined);

   // state variable that track the status of airdrop
   const [transferStatus, setTranferStatus] = useState<boolean>(
    false
  );


    // create a state variable to store balance of created wallet
    const [userWalletBal, setUserWalletBal] = useState<any | undefined>(undefined);

    // cstate variable to track the status of airdrop
    const [airDrop, setAirDrop] = useState<boolean>(
      false
    );

  /**
   * @description prompts user to connect wallet if it exists.
	 * This function is called when the connect wallet button is clicked
   */
  const connectWallet = async () => {
    // @ts-ignore
    const { solana } = window;

		// checks if phantom wallet exists
    if (solana) {
      try {
				// connects wallet and returns response which includes the wallet public key
        const response = await solana.connect();
        console.log('wallet account ', response.publicKey.toString());
				// update walletKey to be the public key
        setWalletKey(response.publicKey.toString());

        const newConnection = new Connection(clusterApiUrl("devnet"), "confirmed");
         // get wallet balance
         const getWalletBalance = await newConnection.getBalance(
          new PublicKey(response.publicKey.toString())
        );

        // set wallet balance
        setWalletBal(getWalletBalance);
      } catch (err) {
        throw new Error("User rejected the request");
      }
    }
  };

  const disconnectWallet = async () => {
    // @ts-ignore
    const { solana } = window;
    if (solana) {
      try {
        await solana.disconnect();
        setWalletKey(undefined);
      } catch (err) {
        console.log(err)
      }
    }
  };


        // create a state variable to store the private key
        const [userPrivateKey, setUserPrivateKey] = useState<any | undefined>(undefined);
 

  const transferSol = async () => {
    if (walletKey) {
      // Connect to the Devnet and make a wallet from privateKey
      const newConnection = new Connection(clusterApiUrl("devnet"), "confirmed");
      const from = Keypair.fromSecretKey(userPrivateKey);
      const to = new PublicKey((walletKey));
      const Send = 1 * LAMPORTS_PER_SOL;

      // Send sol from created wallet and into the Phantom wallet
      var transaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: from.publicKey,
          toPubkey: to,
          lamports: Send,

        })
      );

      // Sign transaction
      var signature = await sendAndConfirmTransaction(newConnection, transaction, [
        from,
      ]);
      const senderBalanceAfter = await newConnection.getBalance(from.publicKey);
      setUserWalletBal(senderBalanceAfter);
      const receiverBalanceAfter = await newConnection.getBalance(to);
      setWalletBal(receiverBalanceAfter);
      setTranferStatus(true);
    }
  };
  const userBal = async () => {
    //@ts-ignore
    const { solana } = window;
    if (solana) {

      const newConnection = new Connection(clusterApiUrl("devnet"), "confirmed");

      // get wallet balance
      const walletBalance = await newConnection.getBalance(
        new PublicKey(userWallet)
      );
      setUserWalletBal(walletBalance)
    }
  };
  
    
   const createWallet = () => {
      // @ts-ignore
      const { solana } = window;
      if (solana) {
        try {
          // Create connection to the Devnet
          const connection = new Connection(clusterApiUrl("devnet"), "confirmed");
          const newPair = new Keypair();
          const publicKey = new PublicKey(newPair.publicKey).toString();
          const privateKey = newPair.secretKey;
  
          setUserWallet(publicKey);
          setUserPrivateKey(privateKey);
        } catch (err) {
  
        }
      }
    };

    const requestAirdrop = async () => {
      // @ts-ignore
      const { solana } = window;
      if (solana) {
        try {
          // Connect to the Devnet and make a wallet from privateKey
          const connection = new Connection(clusterApiUrl("devnet"), "confirmed");
          const wallet = await Keypair.fromSecretKey(userPrivateKey);
  
          // Request airdrop of 2 SOL to the wallet
          console.log("Airdropping some SOL to my wallet!");
          const fromAirDropSignature = await connection.requestAirdrop(
            new PublicKey(userWallet), 2 * LAMPORTS_PER_SOL
          );
          await connection.confirmTransaction(fromAirDropSignature);
          setAirDrop(true);
          userBal();
        } catch (err) {
          console.log(err)
        }
      }
    };



	// HTML code for the app
  return (
    <div className="App">
    <header className="App-header">
      <h2>Connect to Phantom Wallet</h2>
      {provider && !walletKey && (
        <button className="button" onClick={connectWallet}>
          Connect Wallet
        </button>
      )}
      {provider && walletKey && (
        <div>
          <p className="connected-account">Connected account: {userWallet}</p>
          <button onClick={disconnectWallet} className="button">
            Disconnect Wallet
          </button>
        </div>
      )}
      {!provider && (
        <p>
          No provider found. Install{' '}
          <a href="https://phantom.app/">Phantom Browser extension</a>
        </p>
      )}

      {walletKey && (
        <div>
          <h3>Wallet Actions:</h3>
          <button onClick={userBal} className="button">
         { walletBal && `${parseInt(walletBal) / LAMPORTS_PER_SOL} SOL ` } {" "}
         Balance
          </button>
          <button onClick={transferSol} className="button">
            Transfer SOL
          </button>
        </div>
      )}

      {!userWallet && (
        <div>
          <h3>Create Wallet:</h3>
          <button onClick={createWallet} className="button">
            Create New Wallet
          </button>
        </div>
      )}

      {!airDrop && (
        <div>
          <h3>Airdrop:</h3>
          <button onClick={requestAirdrop} className="button">
            Request Airdrop
          </button>
        </div>
      )}
    </header>
  </div>
);
};