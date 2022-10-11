
  
import React, { useEffect, useState } from "react";
import { ethers } from "ethers";
import "./App.css";
import abi from "./utils/WavePortal.json";

const App = () => {
  const [currentAccount, setCurrentAccount] = useState("");
  const [messageValue, setMessageValue] = useState("");
  const [allWaves, setAllWaves] = useState([]);
  const [contractBalanceValue, setContractBalanceValue] = useState(0)
  const [failWaveInfoData, setFailWaveInfoData] = useState({ fail: false, timestanp: "" })

  const contractAddress = "0x422DA4897BEC62EE55c0E57ecc248cE0495d94C4"
  const contractABI = abi.abi;
  const provider = new ethers.providers.Web3Provider(window.ethereum);
  const signer = provider.getSigner();

  const wavePortalContract = new ethers.Contract(
    contractAddress,
    contractABI,
    signer
  );

  const getAllWaves = async () => {
    if (!window.ethereum) return

    const waves = await wavePortalContract.getAllWaves();
    const wavesCleaned = waves.map((wave) => {
      return {
        address: wave.waver,
        timestamp: new Date(wave.timestamp * 1000),
        message: wave.message,
      };
    });
    setAllWaves(wavesCleaned);
  };

  /**
   * `emit`されたイベントをフロントエンドに反映させる
   */
  useEffect(() => {

    const onNewWave = (from, timestamp, message) => {
      console.log("NewWave", from, timestamp, message);
      setAllWaves((prevState) => [
        ...prevState,
        {
          address: from,
          timestamp: new Date(timestamp * 1000),
          message: message,
        },
      ]);
    };

    const onCheckLastWavedAt = (timestamp) => {
      console.log("CheckLastWavedAtEvent", timestamp)
      setFailWaveInfoData({ fail: true, timestanp: timestamp })
    }

    if (window.ethereum) {
      wavePortalContract.on("NewWave", onNewWave);
      wavePortalContract.on("CheckLastWavedAtEvent", onCheckLastWavedAt);
    }

    return () => {
      if (wavePortalContract) {
        wavePortalContract.off("NewWave", onNewWave);
        wavePortalContract.off("CheckLastWavedAtEvent", onCheckLastWavedAt);
      }
    };
  }, []);

  /* window.ethereumにアクセスできることを確認する関数を実装 */
  const checkIfWalletIsConnected = async () => {
    if (!window.ethereum) {
      console.log("Make sure you have MetaMask!");
      return;
    } else {
      console.log("We have the ethereum object", window.ethereum);
    }
    /* ユーザーのウォレットへのアクセスが許可されているかどうかを確認 */
    const accounts = await window.ethereum.request({ method: "eth_accounts" });
    if (accounts.length !== 0) {
      const account = accounts[0];
      console.log("Found an authorized account:", account);
      setCurrentAccount(account);
      getAllWaves();
    } else {
      console.log("No authorized account found");
    }
  };

  /* connectWalletメソッドを実装 */
  const connectWallet = async () => {
    if (!window.ethereum) {
      alert("Get MetaMask!");
      return;
    }
    const accounts = await window.ethereum.request({
      method: "eth_requestAccounts",
    });
    console.log("Connected: ", accounts[0]);
    setCurrentAccount(accounts[0]);
  };

  /* waveの回数をカウントする関数を実装 */
  const wave = async () => {
    try {
      if (window.ethereum) {
        let count = await wavePortalContract.getTotalWaves();
        console.log("Retrieved total wave count...", count.toNumber());
        /* コントラクトに👋（wave）を書き込む */
        const waveTxn = await wavePortalContract.wave(messageValue, {
          gasLimit: 300000,
        });
        console.log("Mining...", waveTxn.hash);
        await waveTxn.wait();
        console.log("Mined -- ", waveTxn.hash);
        count = await wavePortalContract.getTotalWaves();
        console.log("Retrieved total wave count...", count.toNumber());
      } else {
        console.log("Ethereum object doesn't exist!");
      }
    } catch (error) {
      console.log(error)
    }
  };

  const onSetContractBalance = async () => {
    const contractBalance = await provider.getBalance(wavePortalContract.address)
    const formatContractBalance = ethers.utils.formatEther(contractBalance)
    console.log("formatContractBalance: ", formatContractBalance)
    setContractBalanceValue(formatContractBalance)
  }

  /* WEBページがロードされたときにcheckIfWalletIsConnected()を実行 */
  useEffect(() => {
    checkIfWalletIsConnected();
  }, []);

  useEffect(() => {
    console.log("allWaves", allWaves)
    onSetContractBalance()
  }, [allWaves])

  return (
    <div className="mainContainer">
      <div className="dataContainer">
        <div className="header">
          <span role="img" aria-label="hand-wave">
            👋
          </span>{" "}
          WELCOME!
        </div>
        <div className="bio">
          イーサリアムウォレットを接続して、メッセージを作成したら、
          <span role="img" aria-label="hand-wave">
            👋
          </span>
          を送ってください
          <span role="img" aria-label="shine">
            ✨
          </span>
        </div>
        <br />
        {/* コントラクトの資金を表示  */}
        {currentAccount && (
          <p>
            Contract Balance : {contractBalanceValue} ETH
          </p>
        )}
        {/* ウォレットコネクトのボタンを実装 */}
        {!currentAccount && (
          <button className="waveButton" onClick={connectWallet}>
            Connect Wallet
          </button>
        )}
        {currentAccount && (
          <button className="waveButton">Wallet Connected</button>
        )}
        {/* waveボタンにwave関数を連動 */}
        {currentAccount && (
          <button className="waveButton" onClick={wave}>
            Wave at Me
          </button>
        )}
        {/* メッセージボックスを実装*/}
        {currentAccount && (
          <textarea
            name="messageArea"
            placeholder="メッセージはこちら"
            type="text"
            id="message"
            value={messageValue}
            onChange={(e) => setMessageValue(e.target.value)}
          />
        )}
        {/* 履歴を表示する */}
        {currentAccount &&
          allWaves
            .slice(0)
            .reverse()
            .map((wave) => {
              return (
                <div
                  key={wave.timestamp}
                  style={{
                    backgroundColor: "#F8F8FF",
                    marginTop: "16px",
                    padding: "8px",
                  }}
                >
                  <div>Address: {wave.address}</div>
                  <div>Time: {wave.timestamp.toString()}</div>
                  <div>Message: {wave.message}</div>
                </div>
              );
            })}
      </div>
    </div>
  );
};
export default App;